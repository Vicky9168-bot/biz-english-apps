import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getOpenAI, MODELS } from '@/lib/openai'

export const runtime = 'nodejs'
export const maxDuration = 20

interface ExplainRequest {
  targetWord: string
  definitionZh?: string | null
  exampleSentence?: string | null
  descriptions: string[]
  guessedCorrectly: boolean
  mode?: 'user_describes' | 'ai_describes'
  jobTitle?: string | null
  industry?: string | null
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = (await request.json()) as ExplainRequest
  const {
    targetWord,
    definitionZh,
    exampleSentence,
    descriptions,
    guessedCorrectly,
    mode = 'user_describes',
    jobTitle,
    industry,
  } = body

  if (!targetWord || !descriptions || descriptions.length === 0) {
    return NextResponse.json({ error: 'missing fields' }, { status: 400 })
  }

  const openai = getOpenAI()

  const roleLabel = jobTitle ?? '商務人士'
  const industryLabel = industry ?? '一般商務'
  const isGuessMode = mode === 'ai_describes'

  const guessModeGuidance = `情境：學員聽了 AI 的英文描述，然後說出他猜的字（transcript 通常是「Is that X?」或單字）。
- **不要**檢討學員的猜句 — 那只是答案，不是自主表達
- better_phrase 必須回 null（沒有句子可改）
- describe_next_time 必須回 null（這模式學員不是描述者）
- one_tip_zh 聚焦「這個字的關鍵語感 / 常見混淆點」（例：「pivot 不等於 change，強調策略性大轉向」）`

  const describeModeGuidance = `情境：學員用自己的英文描述目標字讓 AI 猜（transcript 是他自己造的多句描述）。
- 挑最重要的一個文法或表達問題給建議
- better_phrase：若學員某句可換成更專業/道地的說法，挑一句；若已很好，回 null
- describe_next_time **必填**：下次遇到這個字要怎麼「描述」讓對方猜到（這是比手畫腳遊戲，不是造句練習）
  - angle_zh：中文告訴學員該從哪個情境角度切入 + 該提哪些關聯詞/後果/使用時機（1-2 句）
  - sample_en：一句英文情境描述示範（≤ 25 字），透過情境暗示讓對方猜出這個字
  - **絕對禁止**：sample_en 出現目標字本身、目標字的詞根、明顯的同義字（例：目標字是 "decision"，範例句就不能出現 decision / decide / decisive / choose）
  - 好範例：目標字 "deadline" → sample_en: "The final date when a project must be completed."
  - 壞範例：目標字 "decision" → sample_en: "We need to make a decision on strategy."（直接出現目標字，錯）`

  const system = `You are a senior business English coach speaking directly to a ${roleLabel} in ${industryLabel}. The student is playing a CHARADES-style game — they describe the word so someone else can guess it.

${isGuessMode ? guessModeGuidance : describeModeGuidance}

Return JSON:
{
  "one_tip_zh": "一句話最有價值的建議（40 字內，具體到學員角色會遇到的情境）",
  "better_phrase": { "you_said": "從描述中挑一句", "better": "更專業/道地的說法" } | null,
  "describe_next_time": {
    "angle_zh": "切入角度 + 關鍵關聯詞（1-2 句繁中）",
    "sample_en": "情境描述示範句（禁止出現目標字）"
  } | null,
  "usage_context_zh": "這個字在『${roleLabel} @ ${industryLabel}』日常真的會用到的一個場景（30 字內，具體到會議/文件類型，不要泛泛而論）"
}

共同 Rules:
- 每個欄位都必須明確反映學員的角色與產業（不要通用建議）
- describe_next_time.sample_en 是英文，其他中文欄位是繁體中文
- 若學員角色 = "商務人士" 或 "professional"，就用最常見的白領情境（會議、email、簡報）`

  const transcriptLabel = isGuessMode ? 'Student guesses' : 'Student descriptions'
  const userMsg = `Target word: "${targetWord}"
Definition: ${definitionZh ?? 'n/a'}
Example: ${exampleSentence ?? 'n/a'}
Result: ${guessedCorrectly ? 'correct' : 'not correct'}
Student profile: ${jobTitle ?? 'professional'} in ${industry ?? 'general business'}

${transcriptLabel} (in order):
${descriptions.map((d, i) => `[${i + 1}] "${d}"`).join('\n')}`

  try {
    const completion = await openai.chat.completions.create({
      model: MODELS.cheap,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: userMsg },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.4,
    })

    const raw = completion.choices[0].message.content
    if (!raw) throw new Error('no response')
    const parsed = JSON.parse(raw)

    // Guard: sample_en must not leak the target word or its stem
    if (parsed?.describe_next_time?.sample_en) {
      const sample = String(parsed.describe_next_time.sample_en).toLowerCase()
      const target = targetWord.toLowerCase().trim()
      const stem = target.replace(/(ing|ed|es|s)$/, '')
      const leaks =
        sample.includes(target) ||
        (stem.length >= 4 && sample.includes(stem))
      if (leaks) {
        parsed.describe_next_time.sample_en = null
      }
    }

    return NextResponse.json(parsed)
  } catch (err) {
    console.error('explain error:', err)
    return NextResponse.json({ error: 'explain failed' }, { status: 500 })
  }
}
