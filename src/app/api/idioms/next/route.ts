import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { IDIOM_DAILY_LIMIT as DAILY_LIMIT, isIdiomCategory } from '@/lib/idioms'

export const runtime = 'nodejs'

type Idiom = {
  id: string
  idiom: string
  meaning_zh: string
  meaning_en: string
  formal_alt: string | null
  example_en: string
  example_zh: string
  category: string
  difficulty: number
}

// GET /api/idioms/next?mode=learn|review[&category=meeting|...]
// learn: 抽今日新題（日限 10，跨類別合計）
// review: 從已練習過的複習（優先答錯過的，不計入日限）
// category: 只從這個類別出題；沒給或不認得就是全部類別
export async function GET(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(request.url)
  const mode = url.searchParams.get('mode') === 'review' ? 'review' : 'learn'
  const categoryParam = url.searchParams.get('category')
  const category = isIdiomCategory(categoryParam) ? categoryParam : null

  const { data: attempts } = await supabase
    .from('idiom_attempts')
    .select('idiom_id, is_correct, attempted_at')
    .eq('user_id', user.id)

  const attemptedIds = new Set((attempts ?? []).map((r) => r.idiom_id))

  // 今日已學過的 unique idiom 數（依 UTC 日期，跟 dashboard streak 邏輯一致）
  const today = new Date().toISOString().slice(0, 10)
  const todayIds = new Set(
    (attempts ?? [])
      .filter((a) => (a.attempted_at ?? '').slice(0, 10) === today)
      .map((a) => a.idiom_id)
  )
  const todayCount = todayIds.size

  const { data: allIdioms, error } = await supabase
    .from('business_idioms')
    .select(
      'id, idiom, meaning_zh, meaning_en, formal_alt, example_en, example_zh, category, difficulty'
    )

  if (error || !allIdioms || allIdioms.length === 0) {
    return NextResponse.json(
      { error: '題庫載入失敗，請重試' },
      { status: 500 }
    )
  }

  // 出題範圍：指定類別時只看該類別（干擾選項仍照舊，優先取同類別的其他俚語）
  const inScope = (i: Idiom) => !category || i.category === category

  // review mode
  if (mode === 'review') {
    const learnedPool = allIdioms.filter((i) => inScope(i) && attemptedIds.has(i.id))
    if (learnedPool.length === 0) {
      return NextResponse.json({
        empty_review: true,
        today_done: todayCount,
        daily_limit: DAILY_LIMIT,
      })
    }
    // 優先答錯過的
    const wrongIds = new Set(
      (attempts ?? [])
        .filter((a) => a.is_correct === false)
        .map((a) => a.idiom_id)
    )
    const wrongPool = learnedPool.filter((i) => wrongIds.has(i.id))
    const pool = wrongPool.length > 0 ? wrongPool : learnedPool
    return buildQuestion(pool, allIdioms, {
      today_done: todayCount,
      daily_limit: DAILY_LIMIT,
      mode: 'review',
      learned_total: learnedPool.length,
      wrong_total: wrongPool.length,
    })
  }

  // learn mode
  if (todayCount >= DAILY_LIMIT) {
    return NextResponse.json({
      done_for_today: true,
      today_done: todayCount,
      daily_limit: DAILY_LIMIT,
    })
  }

  const unattempted = allIdioms.filter((i) => inScope(i) && !attemptedIds.has(i.id))
  if (unattempted.length === 0) {
    return NextResponse.json({
      all_learned: true,
      today_done: todayCount,
      daily_limit: DAILY_LIMIT,
    })
  }

  return buildQuestion(unattempted, allIdioms, {
    today_done: todayCount,
    daily_limit: DAILY_LIMIT,
    mode: 'learn',
    remaining_new: unattempted.length,
  })
}

function buildQuestion(
  pool: Idiom[],
  allIdioms: Idiom[],
  extras: Record<string, unknown>
) {
  const question = pool[Math.floor(Math.random() * pool.length)]

  const sameCategoryOthers = allIdioms.filter(
    (i) => i.category === question.category && i.id !== question.id
  )
  const distractorPool =
    sameCategoryOthers.length >= 3
      ? sameCategoryOthers
      : allIdioms.filter((i) => i.id !== question.id)

  const distractors = shuffle(distractorPool)
    .slice(0, 3)
    .map((i) => i.meaning_zh)
  const options = shuffle([question.meaning_zh, ...distractors])
  const correctIndex = options.indexOf(question.meaning_zh)

  return NextResponse.json({
    id: question.id,
    idiom: question.idiom,
    example_en: question.example_en,
    example_zh: question.example_zh,
    meaning_zh: question.meaning_zh,
    meaning_en: question.meaning_en,
    formal_alt: question.formal_alt,
    category: question.category,
    difficulty: question.difficulty,
    options,
    correct_index: correctIndex,
    total: allIdioms.length,
    ...extras,
  })
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
