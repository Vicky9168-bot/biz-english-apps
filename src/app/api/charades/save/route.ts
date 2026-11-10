import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

interface SaveRequest {
  results: Array<{
    wordId: string
    mode: 'user_describes' | 'ai_describes'
    attempts: number
    guessedCorrectly: boolean
    transcript: Array<{ role: string; content: string }>
  }>
  grammarFeedback?: unknown
}

// 依 attempts 計算 stars
function calculateStars(attempts: number, correct: boolean): number {
  if (!correct) return 0
  if (attempts === 1) return 3
  if (attempts === 2) return 2
  return 1
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = (await request.json()) as SaveRequest
  const { results, grammarFeedback } = body

  if (!results || results.length === 0) {
    return NextResponse.json({ error: 'no results' }, { status: 400 })
  }

  const today = new Date().toISOString().slice(0, 10)

  const rows = results.map((r) => ({
    user_id: user.id,
    session_date: today,
    mode: r.mode,
    word_id: r.wordId,
    attempts: r.attempts,
    guessed_correctly: r.guessedCorrectly,
    transcript: r.transcript,
    stars: calculateStars(r.attempts, r.guessedCorrectly),
    grammar_feedback: grammarFeedback,
  }))

  const { data, error } = await supabase
    .from('charades_sessions')
    .insert(rows)
    .select()

  if (error) {
    console.error('save error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const totalStars = rows.reduce((sum, r) => sum + r.stars, 0)

  return NextResponse.json({
    saved: data?.length ?? 0,
    total_stars: totalStars,
  })
}
