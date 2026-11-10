import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

interface SaveRequest {
  dialogueId: string
  answers: Array<{
    q_idx: number
    chosen_idx: number
    correct: boolean
    q_id?: string
  }>
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { dialogueId, answers } = (await request.json()) as SaveRequest

  if (!dialogueId || !Array.isArray(answers) || answers.length === 0) {
    return NextResponse.json({ error: 'invalid payload' }, { status: 400 })
  }

  const score = answers.filter((a) => a.correct).length
  const total = answers.length

  const { error } = await supabase.from('listening_sessions').insert({
    user_id: user.id,
    dialogue_id: dialogueId,
    answers,
    score,
    total,
  })

  if (error) {
    console.error('listening save error:', error)
    return NextResponse.json({ error: 'save failed' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, score, total })
}
