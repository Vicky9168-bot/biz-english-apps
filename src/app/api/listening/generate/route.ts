import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { getOpenAI, MODELS } from '@/lib/openai'

export const runtime = 'nodejs'
export const maxDuration = 30

type Scenario = 'meeting' | 'client_call' | 'presentation_qa' | 'small_talk' | 'negotiation'

const SCENARIOS: Scenario[] = [
  'meeting',
  'client_call',
  'presentation_qa',
  'small_talk',
  'negotiation',
]

const SCENARIO_LABELS: Record<Scenario, string> = {
  meeting: 'internal team meeting',
  client_call: 'client phone/video call',
  presentation_qa: 'Q&A after a business presentation',
  small_talk: 'professional small talk (coffee break / networking)',
  negotiation: 'business negotiation',
}

interface GenerateRequest {
  scenario?: Scenario
  difficulty?: number
}

interface GeneratedPayload {
  title: string
  scenario_tags: string[]
  script: Array<{ speaker: string; text: string }>
  questions: Array<{
    q: string
    options: string[]
    answer_idx: number
    explanation_zh: string
  }>
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = (await request.json().catch(() => ({}))) as GenerateRequest
  const scenario: Scenario =
    body.scenario && SCENARIOS.includes(body.scenario)
      ? body.scenario
      : SCENARIOS[Math.floor(Math.random() * SCENARIOS.length)]
  const difficulty = body.difficulty ?? 3

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('job_title, industry, proficiency_level')
    .eq('user_id', user.id)
    .single()

  const openai = getOpenAI()

  const system = `You write short business English listening exercises for Taiwanese professionals.

Constraints:
- Dialogue: 2 speakers, 6-10 turns total, sounds like real spoken business English (contractions, hedges, fillers OK but sparingly)
- Total length: 120-180 words (about 60-90 seconds spoken)
- Difficulty ${difficulty}/5: adjust vocab & sentence length accordingly
- Use realistic first names as speakers (mix of Western + Asian names)
- The dialogue must contain enough concrete facts/decisions/numbers so 3 comprehension questions are answerable
- 3 multiple-choice questions:
  * Q1: main point / purpose
  * Q2: a specific detail (number, name, deadline)
  * Q3: inference (why did X say Y? / what will happen next?)
- Each question: 4 options, ONE correct
- explanation_zh: 1-2 sentences in Traditional Chinese explaining the correct answer and briefly why others are wrong

Return strict JSON:
{
  "title": "short English title (max 8 words)",
  "scenario_tags": ["1-3 tags like 'budget', 'timeline', 'deal-close'"],
  "script": [{"speaker":"Alice","text":"..."}, ...],
  "questions": [
    {"q":"...","options":["A","B","C","D"],"answer_idx":0,"explanation_zh":"..."},
    ...
  ]
}`

  const userMsg = `Scenario: ${SCENARIO_LABELS[scenario]}
Learner profile: ${profile?.job_title ?? 'business professional'} in ${profile?.industry ?? 'general business'}
Generate the dialogue + 3 questions now.`

  try {
    const completion = await openai.chat.completions.create({
      model: MODELS.quality,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: userMsg },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.8,
    })

    const raw = completion.choices[0].message.content
    if (!raw) throw new Error('no response')

    const parsed = JSON.parse(raw) as GeneratedPayload

    if (
      !Array.isArray(parsed.script) ||
      parsed.script.length < 4 ||
      !Array.isArray(parsed.questions) ||
      parsed.questions.length !== 3
    ) {
      return NextResponse.json({ error: 'invalid generation shape' }, { status: 502 })
    }

    for (const q of parsed.questions) {
      if (
        !Array.isArray(q.options) ||
        q.options.length !== 4 ||
        typeof q.answer_idx !== 'number' ||
        q.answer_idx < 0 ||
        q.answer_idx > 3
      ) {
        return NextResponse.json({ error: 'invalid question shape' }, { status: 502 })
      }
    }

    const admin = getSupabaseAdmin()
    const row = {
      title: parsed.title,
      scenario,
      difficulty,
      script: parsed.script,
      questions: parsed.questions,
      scenario_tags: parsed.scenario_tags ?? [],
    }
    const { data: inserted, error } = await admin
      .from('listening_dialogues')
      .insert(row as never)
      .select('id')
      .single()

    if (error || !inserted) {
      console.error('listening insert error:', {
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
        code: error?.code,
      })
      return NextResponse.json(
        { error: 'save failed', debug: error?.message ?? 'no error message' },
        { status: 500 }
      )
    }

    return NextResponse.json({ id: (inserted as { id: string }).id })
  } catch (err) {
    console.error('generate error:', err)
    return NextResponse.json({ error: 'generate failed' }, { status: 500 })
  }
}
