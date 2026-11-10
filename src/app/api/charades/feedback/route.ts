import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getOpenAI, MODELS } from '@/lib/openai'

export const runtime = 'nodejs'
export const maxDuration = 60

interface FeedbackRequest {
  sessions: Array<{
    targetWord: string
    descriptions: string[]
    guessedCorrectly: boolean
  }>
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

  const body = (await request.json()) as FeedbackRequest
  const { sessions, jobTitle, industry, mode = 'user_describes' } = body

  if (!sessions || sessions.length === 0) {
    return NextResponse.json({ error: 'no sessions' }, { status: 400 })
  }

  const openai = getOpenAI()

  const isGuessMode = mode === 'ai_describes'

  const systemPrompt = isGuessMode
    ? `You are a friendly business English coach. The student practiced LISTENING: they heard AI descriptions of business words and spoke their guess (usually just "Is that X?" or a single word).

DO NOT critique the guess sentences ("Is that X?") — they are answers, not compositions. Skip grammar_errors and better_expressions entirely (return empty arrays).

Instead focus on:
1. Pick ONE of the target words they encountered and give a practical business tip on how ${jobTitle ?? 'a professional'} in ${industry ?? 'general business'} would actually use it (a specific meeting / email scenario, not generic advice)
2. One line of encouragement based on how many they got right

Return JSON:
{
  "grammar_errors": [],
  "better_expressions": [],
  "business_tip": {
    "word": "one target word from the session",
    "tip_zh": "一句實戰建議：${jobTitle ?? '你'}在什麼場景可以怎麼用（具體到 meeting/email 類型）"
  },
  "overall_encouragement_zh": "一句正面鼓勵（依表現，繁體中文）"
}`
    : `You are a friendly business English coach reviewing a student's SPEAKING practice. They described business words in English (they chose the wording).

Analyze their spoken descriptions and give constructive feedback.

Focus on:
1. Grammar mistakes (subject-verb agreement, tense, articles, etc.) — real issues only
2. Better/more natural expressions for business contexts — only if their phrasing is awkward or unnatural
3. Per-word description strategy: for EACH target word, briefly recap what the student did in their description, then give concrete advice on how to describe THIS type of word better next time (angle to take, must-mention keywords, useful sentence patterns). This is the most important field — always provide one entry per target word.
4. One practical business tip on how ${jobTitle ?? 'a professional'} would use one of the target words

Return JSON:
{
  "grammar_errors": [
    { "original": "text they said", "corrected": "corrected version", "explanation_zh": "中文說明為什麼" }
  ],
  "better_expressions": [
    { "you_said": "...", "better": "...", "why_zh": "..." }
  ],
  "description_tips": [
    {
      "word": "target word",
      "your_description_summary_zh": "一句話回顧學生怎麼描述這個字（繁中）",
      "better_approach_zh": "下次遇到這類字可以怎麼描述：切入角度、關鍵詞、可用句型（繁中，2-3 句具體建議）",
      "sample_sentence": "一句英文示範描述（不要直接說出目標字）"
    }
  ],
  "business_tip": {
    "word": "one target word",
    "tip_zh": "一句實戰建議：什麼場景可以怎麼說"
  },
  "overall_encouragement_zh": "一句正面鼓勵（繁體中文）"
}

Rules:
- description_tips MUST have one entry per target word in the session (in order)
- sample_sentence must NOT contain the target word itself (it's a description, not a definition)
- Keep max 3 grammar_errors and max 3 better_expressions; skip trivial issues
- If a session has clean grammar, return an empty grammar_errors array`

  const attemptsLabel = isGuessMode ? 'Student guesses (spoken answers)' : 'Descriptions'
  const userContext = `Student profile: ${jobTitle ?? 'unknown role'} in ${industry ?? 'unknown industry'}
Mode: ${isGuessMode ? 'AI described / student guessed' : 'Student described / AI guessed'}

Practice sessions:
${sessions
  .map(
    (s, i) => `
Word ${i + 1}: "${s.targetWord}" (${s.guessedCorrectly ? 'correct' : 'not guessed'})
${attemptsLabel}:
${s.descriptions.map((d, j) => `  [${j + 1}] "${d}"`).join('\n')}
`
  )
  .join('\n')}`

  try {
    const completion = await openai.chat.completions.create({
      model: MODELS.quality,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContext },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.5,
    })

    const raw = completion.choices[0].message.content
    if (!raw) throw new Error('no response')

    const parsed = JSON.parse(raw)
    return NextResponse.json(parsed)
  } catch (error) {
    console.error('feedback error:', error)
    return NextResponse.json({ error: 'feedback failed' }, { status: 500 })
  }
}
