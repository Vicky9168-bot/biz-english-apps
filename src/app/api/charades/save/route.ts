import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

interface SaveRequest {
  results: Array<{
    // 固定詞庫的字（vocabulary.id）或我的單字本的字（user_words.id），二選一
    wordId?: string
    userWordId?: string
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
  if (results.some((r) => !!r.wordId === !!r.userWordId)) {
    return NextResponse.json({ error: 'each result needs exactly one of wordId / userWordId' }, { status: 400 })
  }

  // 單字本的字必須是自己的（RLS 只會回傳自己的列），避免把紀錄掛到別人的字上
  const userWordIds = [...new Set(results.map((r) => r.userWordId).filter((id): id is string => !!id))]
  const ownedWords = new Map<string, { correct_count: number; wrong_count: number }>()
  if (userWordIds.length > 0) {
    const { data: owned } = await supabase
      .from('user_words')
      .select('id, correct_count, wrong_count')
      .eq('user_id', user.id)
      .in('id', userWordIds)
    ;(owned ?? []).forEach((w) => ownedWords.set(w.id, w))
    if (ownedWords.size !== userWordIds.length) {
      return NextResponse.json({ error: 'unknown userWordId' }, { status: 400 })
    }
  }

  const today = new Date().toISOString().slice(0, 10)

  const rows = results.map((r) => ({
    user_id: user.id,
    session_date: today,
    mode: r.mode,
    word_id: r.wordId ?? null,
    user_word_id: r.userWordId ?? null,
    // 用自己的字練習不計入排行榜（見 20261116030000_charades_user_words.sql）
    from_user_words: !!r.userWordId,
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

  // 單字本的字也累計答對／答錯，讓單字本的練習優先順序反映這裡的表現
  for (const r of results) {
    if (!r.userWordId) continue
    const current = ownedWords.get(r.userWordId)
    if (!current) continue
    const next = {
      correct_count: current.correct_count + (r.guessedCorrectly ? 1 : 0),
      wrong_count: current.wrong_count + (r.guessedCorrectly ? 0 : 1),
    }
    ownedWords.set(r.userWordId, next)
    const { error: updateError } = await supabase
      .from('user_words')
      .update({ ...next, last_practiced_at: new Date().toISOString() })
      .eq('id', r.userWordId)
      .eq('user_id', user.id)
    if (updateError) console.error('user_words update error:', updateError)
  }

  const totalStars = rows.reduce((sum, r) => sum + r.stars, 0)

  return NextResponse.json({
    saved: data?.length ?? 0,
    total_stars: totalStars,
  })
}
