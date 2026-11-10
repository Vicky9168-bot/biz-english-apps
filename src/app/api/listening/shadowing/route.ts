import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getOpenAI, MODELS } from '@/lib/openai'
import { toFile } from 'openai/uploads'
import { checkContentWords } from '@/lib/content-words'

export const runtime = 'nodejs'
export const maxDuration = 60

// 使用者交出音檔 → Whisper 轉文字 → GPT 給發音/流暢度/準確度回饋
export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const form = await request.formData()
  const dialogueId = form.get('dialogueId')
  const audio = form.get('audio')

  if (typeof dialogueId !== 'string' || !dialogueId) {
    return NextResponse.json({ error: 'missing dialogueId' }, { status: 400 })
  }
  if (!(audio instanceof Blob) || audio.size === 0) {
    return NextResponse.json({ error: 'missing audio' }, { status: 400 })
  }
  if (audio.size > 8 * 1024 * 1024) {
    return NextResponse.json({ error: 'audio too large' }, { status: 400 })
  }

  const { data: dialogue, error } = await supabase
    .from('listening_dialogues')
    .select('shadowing_text')
    .eq('id', dialogueId)
    .single()
  if (error || !dialogue) {
    return NextResponse.json({ error: 'dialogue not found' }, { status: 404 })
  }
  const reference = (dialogue as { shadowing_text: string | null }).shadowing_text
  if (!reference) {
    return NextResponse.json({ error: 'no shadowing text' }, { status: 400 })
  }

  try {
    const openai = getOpenAI()
    const t0 = Date.now()

    // Whisper 轉文字
    const audioBuffer = Buffer.from(await audio.arrayBuffer())
    const file = await toFile(audioBuffer, 'user.webm', { type: audio.type || 'audio/webm' })
    const transcription = await openai.audio.transcriptions.create({
      model: MODELS.transcribe,
      file,
      language: 'en',
    })
    const userText = transcription.text.trim()
    const contentWords = checkContentWords(reference, userText)
    const hitCount = contentWords.filter((w) => w.hit).length
    console.log('[shadowing] whisper', {
      ms: Date.now() - t0,
      chars: userText.length,
      contentWords: `${hitCount}/${contentWords.length}`,
    })

    // GPT 給回饋
    const t1 = Date.now()
    const prompt = `你是英語口說教練,幫台灣商務人士做 shadowing 練習回饋。

原文 (學生要跟讀):
"${reference}"

學生實際說出來的內容 (Whisper 轉文字):
"${userText}"

回傳嚴格 JSON:
{
  "accuracy_score": 0-100 的整數,學生說的內容與原文相符程度,
  "fluency_score": 0-100 的整數,基於 Whisper 是否清楚辨識到完整內容 (斷句、字數比例) 估計流暢度,
  "pronunciation_notes": "1-3 句中文,指出可能的發音問題 (如果學生說的字被 Whisper 誤聽成別的字,通常代表發音不準)",
  "missed_or_wrong": ["列出 3 個以內原文有但學生漏掉/說錯的關鍵字 (英文原字)"],
  "praise": "1 句中文鼓勵,指出做得好的地方",
  "next_focus": "1 句中文,建議下一次練習重點"
}

嚴格根據學生實際說出來的內容評分,不要因為鼓勵而虛報高分。`

    const completion = await openai.chat.completions.create({
      model: MODELS.cheap,
      messages: [
        { role: 'system', content: 'You are a strict but supportive English speaking coach.' },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    })
    const feedback = JSON.parse(completion.choices[0].message.content ?? '{}')
    console.log('[shadowing] gpt', { ms: Date.now() - t1 })

    return NextResponse.json({
      userText,
      referenceText: reference,
      contentWords,
      ...feedback,
    })
  } catch (err) {
    console.error('[shadowing] error:', err)
    return NextResponse.json(
      { error: 'shadowing failed', debug: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    )
  }
}
