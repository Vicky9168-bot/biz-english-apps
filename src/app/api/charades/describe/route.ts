import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getOpenAI, MODELS } from '@/lib/openai'

export const runtime = 'nodejs'
export const maxDuration = 20

interface DescribeRequest {
  targetWord: string
  definitionZh?: string | null
  exampleSentence?: string | null
  scenarioTags?: string[]
  jobTitle?: string | null
  industry?: string | null
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = (await request.json()) as DescribeRequest
  const {
    targetWord,
    definitionZh,
    exampleSentence,
    scenarioTags,
    jobTitle,
    industry,
  } = body

  if (!targetWord) {
    return NextResponse.json({ error: 'missing targetWord' }, { status: 400 })
  }

  const openai = getOpenAI()

  const system = `You are describing an English business word for a learner to guess. Give 3-4 short English sentences that hint at the word WITHOUT ever saying it or its stem.

Rules:
- Never write the target word, plurals, tenses, or obvious sub-strings
- Sentences must be simple B1-B2 level, natural business context
- Use the learner's professional background if provided
- End with one situational example, e.g. "You often see this in a project kickoff meeting."

Return JSON: { "description": "sentence1. sentence2. sentence3." }`

  const userMsg = `Target word: "${targetWord}"
Chinese meaning: ${definitionZh ?? 'n/a'}
Example: ${exampleSentence ?? 'n/a'}
Business scenarios: ${scenarioTags?.join(', ') ?? 'general'}
Learner profile: ${jobTitle ?? 'professional'} in ${industry ?? 'general business'}`

  try {
    const completion = await openai.chat.completions.create({
      model: MODELS.cheap,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: userMsg },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.6,
    })

    const raw = completion.choices[0].message.content
    if (!raw) throw new Error('no response')

    const parsed = JSON.parse(raw) as { description: string }

    // 安全過濾:若 AI 不小心說出目標字,擋下重試(這裡先直接遮蔽)
    const stem = targetWord.toLowerCase().replace(/[^a-z]/g, '')
    const leaked = parsed.description.toLowerCase().includes(stem)
    const description = leaked
      ? parsed.description.replace(new RegExp(targetWord, 'gi'), '_____')
      : parsed.description

    return NextResponse.json({ description })
  } catch (err) {
    console.error('describe error:', err)
    return NextResponse.json({ error: 'describe failed' }, { status: 500 })
  }
}
