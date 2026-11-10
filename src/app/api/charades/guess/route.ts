import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getOpenAI, MODELS } from '@/lib/openai'

export const runtime = 'nodejs'
export const maxDuration = 30

interface GuessRequest {
  targetWord: string
  descriptions: string[] // 學員這輪累積的多次描述
  previousGuesses?: string[]
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = (await request.json()) as GuessRequest
  const { targetWord, descriptions, previousGuesses = [] } = body

  if (!targetWord || !descriptions || descriptions.length === 0) {
    return NextResponse.json({ error: 'missing fields' }, { status: 400 })
  }

  const openai = getOpenAI()

  const systemPrompt = `You are playing a business English charades game.
The user is describing a target word in English. You must guess what business English word they are describing.

RULES:
- Give EXACTLY ONE word or short phrase as your guess (the actual business term).
- If the description is too vague, guess "unclear".
- Prefer common business English terms.
- Do NOT explain your reasoning in the guess field.
- You are told the actual target word for evaluation purposes only. Your guess should be based purely on what the user described — do not just repeat the target word.

Return JSON in this shape:
{
  "guess": "single word or short phrase",
  "confidence": 0.0 to 1.0,
  "is_correct": boolean (does your guess match the target word semantically?),
  "reasoning_zh": "一句話說明你為什麼這樣猜（中文）"
}`

  const userPrompt = `Target word (only for is_correct evaluation): "${targetWord}"

Descriptions the user gave (in order):
${descriptions.map((d, i) => `${i + 1}. "${d}"`).join('\n')}

${
  previousGuesses.length > 0
    ? `Your previous wrong guesses (DO NOT repeat these): ${previousGuesses.join(', ')}`
    : ''
}

Now guess.`

  try {
    const completion = await openai.chat.completions.create({
      model: MODELS.cheap,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.4,
    })

    const raw = completion.choices[0].message.content
    if (!raw) throw new Error('no response')

    const parsed = JSON.parse(raw) as {
      guess: string
      confidence: number
      is_correct: boolean
      reasoning_zh: string
    }

    // 二次驗證：直接比對是否相同（避免 LLM 誤判）
    const normalizedGuess = parsed.guess.toLowerCase().trim()
    const normalizedTarget = targetWord.toLowerCase().trim()
    const isExactMatch =
      normalizedGuess === normalizedTarget ||
      normalizedGuess.includes(normalizedTarget) ||
      normalizedTarget.includes(normalizedGuess)

    return NextResponse.json({
      ...parsed,
      is_correct: parsed.is_correct || isExactMatch,
    })
  } catch (error) {
    console.error('guess error:', error)
    return NextResponse.json({ error: 'guess failed' }, { status: 500 })
  }
}
