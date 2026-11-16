import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SessionClient } from './session-client'
import type { Vocabulary } from '@/lib/supabase/types'

export default async function CharadesSessionPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; source?: string }>
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('job_title, industry, proficiency_level, english_challenges')
    .eq('user_id', user.id)
    .single()

  if (!profile) redirect('/onboarding')

  const params = await searchParams
  const mode = (params.mode === 'ai_describes' ? 'ai_describes' : 'user_describes') as
    | 'user_describes'
    | 'ai_describes'

  // 用我的生字玩：從單字本抽字，不走固定詞庫的選字邏輯
  if (params.source === 'mine') {
    const words = await pickFromWordBank(supabase, user.id)
    if (words.length === 0) {
      return (
        <main className="flex-1 flex items-center justify-center bg-paper px-6 py-12">
          <div className="max-w-md border-l-4 border-mark pl-5">
            <h2 className="text-2xl font-bold text-ink mb-2">單字本還是空的</h2>
            <p className="text-ink/70 mb-6">
              先去讀一篇文章，點不熟的單字存起來，就能用它們玩比手畫腳。
            </p>
            <Link
              href="/reading"
              className="inline-block rounded-md bg-ink px-4 py-2 text-sm font-semibold text-paper hover:bg-ink/85"
            >
              去讀文章
            </Link>
          </div>
        </main>
      )
    }
    return (
      <SessionClient
        words={words}
        mode={mode}
        wordSource="mine"
        savedWords={[]}
        profile={{
          job_title: profile.job_title,
          industry: profile.industry,
        }}
      />
    )
  }

  // 已經在單字本的字：結算時不再提示「加入單字本」
  const { data: bankRows } = await supabase
    .from('user_words')
    .select('word')
    .eq('user_id', user.id)
  const savedWords = (bankRows ?? []).map((r) => (r.word as string).toLowerCase())

  // Fetch words directly (avoid HTTP round-trip for SSR)
  const level = profile.proficiency_level ?? 3
  const minDiff = Math.max(1, level - 1)
  const maxDiff = Math.min(5, level + 1)

  // Server Component runs per request; time-based ISO cutoffs are intentional
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now()
  const dayISO = (offsetDays: number) =>
    new Date(now - offsetDays * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10)

  const sevenDaysAgo = dayISO(7)
  const fourteenDaysAgo = dayISO(14)
  const threeDaysAgo = dayISO(3)

  // 1. 過去 14 天所有紀錄,用來算「錯題複習池」
  const { data: history } = await supabase
    .from('charades_sessions')
    .select('word_id, guessed_correctly, session_date')
    .eq('user_id', user.id)
    .gte('session_date', fourteenDaysAgo)

  // 取每個字最新一筆結果,決定「已掌握」還是「還沒過」
  const latest = new Map<string, { correct: boolean; date: string }>()
  ;(history ?? []).forEach((r) => {
    if (!r.word_id) return
    const prev = latest.get(r.word_id)
    if (!prev || r.session_date > prev.date) {
      latest.set(r.word_id, {
        correct: r.guessed_correctly,
        date: r.session_date,
      })
    }
  })

  const recentCorrectIds = new Set<string>()
  const wrongOnceIds = new Set<string>()
  latest.forEach((v, id) => {
    if (v.correct && v.date >= sevenDaysAgo) recentCorrectIds.add(id)
    // 最新一筆是錯,且已經 3+ 天讓大腦忘一下,才拉回來複習
    if (!v.correct && v.date <= threeDaysAgo) wrongOnceIds.add(id)
  })

  // 2. 抓錯題複習(最多 2 題)
  const REVIEW_TARGET = 2
  const reviewIds = [...wrongOnceIds].slice(0, REVIEW_TARGET)
  let reviewWords: Vocabulary[] = []
  if (reviewIds.length > 0) {
    const { data: reviewRows } = await supabase
      .from('vocabulary')
      .select('*')
      .in('id', reviewIds)
    reviewWords = ((reviewRows ?? []) as Vocabulary[]).slice(0, REVIEW_TARGET)
  }

  // 3. 抓新題(過濾:最近答對 + 已選為複習)
  const freshNeeded = 5 - reviewWords.length
  const excludeIds = [
    ...recentCorrectIds,
    ...reviewWords.map((w) => w.id),
  ]

  let query = supabase
    .from('vocabulary')
    .select('*')
    .gte('difficulty', minDiff)
    .lte('difficulty', maxDiff)

  if (excludeIds.length > 0) {
    query = query.not('id', 'in', `(${excludeIds.join(',')})`)
  }

  // 拉全池(目前 vocabulary 約 286 筆,500 已涵蓋所有難度區段)
  // 沒 ORDER BY 時 Postgres 回實體順序,舊 seed 永遠先出 → 新字進不來
  const { data: candidates } = await query.limit(500)

  const scenarios = profile.english_challenges ?? []
  const scored = (candidates ?? []).map((w) => {
    const overlap = (w.scenario_tags ?? []).filter((t: string) =>
      scenarios.includes(t)
    ).length
    return { word: w as Vocabulary, score: overlap }
  })

  // Fisher-Yates 先洗牌,再穩定排序(score DESC),同分保留洗牌結果的隨機順序
  // Server Component 每次 request 執行,可安全用 Math.random
  for (let i = scored.length - 1; i > 0; i--) {
    // eslint-disable-next-line react-hooks/purity
    const j = Math.floor(Math.random() * (i + 1))
    ;[scored[i], scored[j]] = [scored[j], scored[i]]
  }
  const sortedFresh = scored.sort((a, b) => b.score - a.score)
  const freshWords = sortedFresh.slice(0, freshNeeded).map((s) => s.word)

  // 4. 複習題插在中間位置(第 2、4 題),不會第一題就打擊士氣
  const words: Vocabulary[] = [...freshWords]
  reviewWords.forEach((rw, i) => {
    const insertAt = Math.min(1 + i * 2, words.length)
    words.splice(insertAt, 0, rw)
  })

  if (words.length === 0) {
    return (
      <main className="flex-1 flex items-center justify-center bg-paper px-6 py-12">
        <div className="max-w-md border-l-4 border-mark pl-5">
          <h2 className="text-2xl font-bold text-ink mb-2">
            找不到適合的單字
          </h2>
          <p className="text-ink/70 mb-6">
            可能是題庫還沒 seed，或你已經練完了所有字。
          </p>
          <Link
            href="/"
            className="inline-block rounded-md bg-ink px-4 py-2 text-sm font-semibold text-paper hover:bg-ink/85"
          >
            回首頁
          </Link>
        </div>
      </main>
    )
  }

  return (
    <SessionClient
      words={words}
      mode={mode}
      wordSource="bank"
      savedWords={savedWords}
      profile={{
        job_title: profile.job_title,
        industry: profile.industry,
      }}
    />
  )
}

const SESSION_SIZE = 5
const VOCAB_POS = ['noun', 'verb', 'adjective', 'adverb', 'phrase'] as const

// 從「我的單字本」抽 5 個字：答錯比答對多的先出，同分隨機。
// 轉成練習元件使用的 Vocabulary 形狀，id 是 user_words 的 id（儲存時會另外標記來源）。
async function pickFromWordBank(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<Vocabulary[]> {
  const { data } = await supabase
    .from('user_words')
    .select(
      'id, word, pos, meaning_zh, meaning_en, example_en, correct_count, wrong_count, user_word_contexts(sentence)'
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(300)

  const rows = [...(data ?? [])]
  for (let i = rows.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[rows[i], rows[j]] = [rows[j], rows[i]]
  }
  rows.sort(
    (a, b) => b.wrong_count - b.correct_count - (a.wrong_count - a.correct_count)
  )

  return rows.slice(0, SESSION_SIZE).map((w) => {
    const contexts = (w.user_word_contexts ?? []) as Array<{ sentence: string }>
    const pos = VOCAB_POS.find((p) => p === w.pos) ?? null
    return {
      id: w.id as string,
      word: w.word as string,
      part_of_speech: pos,
      difficulty: 3,
      scenario_tags: [],
      definition_en: (w.meaning_en as string | null) ?? null,
      definition_zh: w.meaning_zh as string,
      example_sentence: (w.example_en as string | null) ?? contexts[0]?.sentence ?? null,
      audio_url: null,
    }
  })
}
