import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getOpenAI, MODELS } from '@/lib/openai'
import { toFile } from 'openai/uploads'

export const runtime = 'nodejs'
export const maxDuration = 90

// User records answer → Whisper → GPT detailed feedback with 4 scores + rewrite suggestions + model answer
export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const form = await request.formData()
  const scenarioId = form.get('scenarioId')
  const audio = form.get('audio')

  if (!(audio instanceof Blob) || audio.size === 0) {
    return NextResponse.json({ error: 'missing audio' }, { status: 400 })
  }
  if (audio.size > 15 * 1024 * 1024) {
    return NextResponse.json({ error: 'audio too large' }, { status: 400 })
  }

  let s: {
    title_zh: string
    prompt_en: string
    framework: string
    framework_hint_zh: string
  }

  if (typeof scenarioId === 'string' && scenarioId) {
    // 題庫題:從 DB 撈
    const { data: scenario, error } = await supabase
      .from('speaking_scenarios')
      .select('title_zh, prompt_en, framework, framework_hint_zh')
      .eq('id', scenarioId)
      .single()
    if (error || !scenario) {
      return NextResponse.json({ error: 'scenario not found' }, { status: 404 })
    }
    s = scenario as typeof s
  } else {
    // 自訂情境:直接用 formData 傳來的欄位
    const promptEn = form.get('promptEn')
    const framework = form.get('framework')
    const frameworkHintZh = form.get('frameworkHintZh')
    const titleZh = form.get('titleZh')
    if (
      typeof promptEn !== 'string' ||
      !promptEn ||
      typeof framework !== 'string' ||
      !['STAR', 'PREP', 'SCQA', 'PYRAMID'].includes(framework) ||
      typeof frameworkHintZh !== 'string' ||
      !frameworkHintZh
    ) {
      return NextResponse.json(
        { error: 'missing scenario data' },
        { status: 400 }
      )
    }
    s = {
      title_zh: typeof titleZh === 'string' && titleZh ? titleZh : '自訂情境',
      prompt_en: promptEn,
      framework,
      framework_hint_zh: frameworkHintZh,
    }
  }

  try {
    const openai = getOpenAI()
    const t0 = Date.now()

    const audioBuffer = Buffer.from(await audio.arrayBuffer())
    const file = await toFile(audioBuffer, 'answer.webm', {
      type: audio.type || 'audio/webm',
    })
    const transcription = await openai.audio.transcriptions.create({
      model: MODELS.transcribe,
      file,
      language: 'en',
    })
    const userText = transcription.text.trim()
    console.log('[speaking] whisper', {
      ms: Date.now() - t0,
      chars: userText.length,
    })

    if (userText.length < 20) {
      return NextResponse.json({
        userText,
        tooShort: true,
        error: '沒錄到足夠內容 — 請開口說完整回答再送出',
      })
    }

    const t1 = Date.now()
    const prompt = `你是資深商務英語教練，幫台灣商務人士改口說回答。

情境 (面試官/主管的提問):
"${s.prompt_en}"

指定框架: ${s.framework}
框架應用提示:
${s.framework_hint_zh}

學生的回答 (Whisper 轉文字，可能有辨識誤差):
"${userText}"

回傳嚴格 JSON:
{
  "framework_score": 0-100 的整數，學生是否有涵蓋 ${s.framework} 的每個要素，
  "framework_note": "1-2 句中文，指出缺哪個要素或哪個部分薄弱",
  "vocab_score": 0-100 的整數，商務英文用詞是否精準 (例如用 stakeholder / align / bandwidth 而不是 people / same idea / time),
  "vocab_note": "1-2 句中文，舉 1-2 個具體升級建議 (原字 → 商務替代字)",
  "grammar_score": 0-100 的整數，句構完整度、時態一致，
  "grammar_note": "1-2 句中文，指出最明顯的一個文法問題",
  "fluency_score": 0-100 的整數，基於長度、完整度、自然度估計，
  "fluency_note": "1-2 句中文，關於節奏與流暢度",
  "rewrites": [
    {"original": "學生原句 (英)", "improved": "改寫後 (英)", "why_zh": "1 句中文解釋改哪裡"},
    {"original": "學生原句 (英)", "improved": "改寫後 (英)", "why_zh": "1 句中文解釋"}
  ],
  "model_answer_en": "用 ${s.framework} 寫的 80-120 word 模範答案，商務語氣，自然口語",
  "next_focus_zh": "1-2 句中文，下次練習優先要練什麼"
}

Guidelines:
- 嚴格根據學生實際說的內容評分，不要虛報高分鼓勵
- rewrites 至少 2 個、最多 4 個，選最有改善空間的句子
- model_answer 要具體、用商務詞彙、示範框架每個要素
- 全部用「你」而非「該學生」的口吻`

    const completion = await openai.chat.completions.create({
      model: MODELS.quality,
      messages: [
        {
          role: 'system',
          content:
            'You are a senior business English coach. Give strict, actionable feedback.',
        },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.4,
    })
    const feedback = JSON.parse(completion.choices[0].message.content ?? '{}')
    console.log('[speaking] gpt', { ms: Date.now() - t1 })

    return NextResponse.json({
      userText,
      ...feedback,
    })
  } catch (err) {
    console.error('[speaking] error:', err)
    return NextResponse.json(
      {
        error: 'analysis failed',
        debug: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    )
  }
}
