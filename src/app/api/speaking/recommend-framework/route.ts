import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getOpenAI, MODELS } from '@/lib/openai'

export const runtime = 'nodejs'
export const maxDuration = 30

const FRAMEWORKS = ['STAR', 'PREP', 'SCQA', 'PYRAMID'] as const
type FW = (typeof FRAMEWORKS)[number]

// 用戶自訂情境 → AI 挑框架 + 生英文 prompt + 客製化提示
export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const context =
    typeof body?.context === 'string' ? body.context.trim() : ''
  const promptEnInput =
    typeof body?.promptEn === 'string' ? body.promptEn.trim() : ''

  if (context.length < 10) {
    return NextResponse.json(
      { error: '情境描述太短，請至少寫 10 字' },
      { status: 400 }
    )
  }
  if (context.length > 800) {
    return NextResponse.json(
      { error: '情境描述太長，請壓在 800 字內' },
      { status: 400 }
    )
  }

  const prompt = `你是資深商務英語教練。學生描述了一個真實情境，幫他選最適合的回答框架。

四個框架:
- STAR (Situation-Task-Action-Result): 過去經驗、行為題 (Tell me about a time...)
- PREP (Point-Reason-Example-Point): 表達意見、表態立場 (What do you think?)
- SCQA (Situation-Complication-Question-Answer): 說服型提案，需要鋪陳共識再給答案
- PYRAMID (Answer → 3 支撐 → 佐證): Exec 溝通、答案先行、對方時間少

學生的情境 (中文):
"${context}"

${
  promptEnInput
    ? `學生已提供對方的英文提問:\n"${promptEnInput}"`
    : '(學生沒提供英文提問，幫他寫一個自然商務口吻的英文問句)'
}

回傳嚴格 JSON:
{
  "recommended_framework": "STAR" 或 "PREP" 或 "SCQA" 或 "PYRAMID",
  "recommended_reason_zh": "1-2 句中文，為什麼這個框架最適合這個情境",
  "framework_hint_zh": "針對這個情境客製化的字母應用提示 (例如 STAR 就寫 S: ... · T: ... · A: ... · R: ...)，要具體不能是通則",
  "alternative_framework": "第二選擇 (不能跟 recommended 相同)",
  "alternative_when_zh": "1 句中文:如果...情況變化，就改用這個",
  "prompt_en": "${promptEnInput ? '原封不動回填學生提供的英文提問' : '幫學生寫一個對方會怎麼問你的英文問句，自然商務口吻，10-30 字'}",
  "title_zh": "幫這個情境取一個 8-15 字的中文標題，像題庫題目那樣簡潔"
}`

  try {
    const openai = getOpenAI()
    const t0 = Date.now()
    const completion = await openai.chat.completions.create({
      model: MODELS.cheap,
      messages: [
        {
          role: 'system',
          content:
            'You are a business English coach. Pick the best speaking framework for the given scenario and reply in strict JSON.',
        },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    })
    console.log('[speaking/recommend] ms', Date.now() - t0)

    const raw = JSON.parse(completion.choices[0].message.content ?? '{}')
    const rec = String(raw.recommended_framework ?? '').toUpperCase() as FW
    const alt = String(raw.alternative_framework ?? '').toUpperCase() as FW

    if (!FRAMEWORKS.includes(rec)) {
      return NextResponse.json(
        { error: 'AI 挑出的框架無效，請重試' },
        { status: 502 }
      )
    }

    return NextResponse.json({
      recommended_framework: rec,
      recommended_reason_zh: String(raw.recommended_reason_zh ?? ''),
      framework_hint_zh: String(raw.framework_hint_zh ?? ''),
      alternative_framework: FRAMEWORKS.includes(alt) ? alt : null,
      alternative_when_zh: String(raw.alternative_when_zh ?? ''),
      prompt_en: promptEnInput || String(raw.prompt_en ?? ''),
      title_zh: String(raw.title_zh ?? '自訂情境'),
    })
  } catch (err) {
    console.error('[speaking/recommend] error:', err)
    return NextResponse.json(
      {
        error: 'recommend failed',
        debug: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    )
  }
}
