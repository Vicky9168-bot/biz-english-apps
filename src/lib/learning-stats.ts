import type { createClient } from '@/lib/supabase/server'

type SupabaseClient = Awaited<ReturnType<typeof createClient>>

// 各活動平均耗時（分鐘/次），拿來估算本月學習時間
const MIN_PER_CHARADES = 2
const MIN_PER_LISTENING = 5
const MIN_PER_SPEAKING = 3
const MIN_PER_IDIOM = 0.5

const DAY_MS = 24 * 60 * 60 * 1000

function toDates(rows: unknown[] | null, field: string, sliceTo?: number) {
  return (rows ?? [])
    .map((r) => {
      const v = (r as Record<string, string | null>)[field]
      return sliceTo ? (v?.slice(0, sliceTo) ?? null) : v
    })
    .filter((d): d is string => !!d)
}

export type ActivityDates = {
  charades: string[]
  listening: string[]
  speaking: string[]
  idiom: string[]
}

// 撈所有活動的日期（YYYY-MM-DD）；sinceMs 省略則撈全部
// 首頁與成就頁共用這一份，打卡天數才會一致
export async function getActivityDates(
  supabase: SupabaseClient,
  userId: string,
  sinceMs?: number
): Promise<ActivityDates> {
  const sinceISO = sinceMs ? new Date(sinceMs).toISOString() : null
  const sinceDate = sinceISO?.slice(0, 10) ?? null

  const byDate = (table: string) => {
    const q = supabase.from(table).select('session_date').eq('user_id', userId)
    return sinceDate ? q.gte('session_date', sinceDate) : q
  }
  const idiomQuery = supabase
    .from('idiom_attempts')
    .select('attempted_at')
    .eq('user_id', userId)

  const [charadesRes, listeningRes, speakingRes, idiomRes] = await Promise.all([
    byDate('charades_sessions'),
    byDate('listening_sessions'),
    byDate('speaking_sessions'),
    sinceISO ? idiomQuery.gte('attempted_at', sinceISO) : idiomQuery,
  ])

  return {
    charades: toDates(charadesRes.data, 'session_date'),
    listening: toDates(listeningRes.data, 'session_date'),
    speaking: toDates(speakingRes.data, 'session_date'),
    idiom: toDates(idiomRes.data, 'attempted_at', 10),
  }
}

export function allDates(a: ActivityDates): string[] {
  return [...a.charades, ...a.listening, ...a.speaking, ...a.idiom]
}

// 近 35 天所有活動 → 一次算 streak + 本月分鐘
export async function getLearningStats(
  supabase: SupabaseClient,
  userId: string
) {
  const now = new Date()
  const startOfMonth = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)
  )
    .toISOString()
    .slice(0, 10)

  const dates = await getActivityDates(supabase, userId, Date.now() - 35 * DAY_MS)

  const inMonth = (d: string) => d >= startOfMonth
  const monthMinutes = Math.round(
    dates.charades.filter(inMonth).length * MIN_PER_CHARADES +
      dates.listening.filter(inMonth).length * MIN_PER_LISTENING +
      dates.speaking.filter(inMonth).length * MIN_PER_SPEAKING +
      dates.idiom.filter(inMonth).length * MIN_PER_IDIOM
  )

  const { current: streak } = computeStreaks(allDates(dates))

  return { streak, monthMinutes }
}

export function shiftDate(date: string, days: number): string {
  return new Date(Date.parse(date) + days * DAY_MS).toISOString().slice(0, 10)
}

// current：從今天（今天還沒練就從昨天）往回算；best：歷史最長連續段
export function computeStreaks(dates: string[]): {
  current: number
  best: number
} {
  const set = new Set(dates)
  if (set.size === 0) return { current: 0, best: 0 }

  let best = 0
  for (const d of set) {
    if (set.has(shiftDate(d, -1))) continue // 不是連續段起點
    let run = 1
    let cursor = d
    while (set.has(shiftDate(cursor, 1))) {
      run++
      cursor = shiftDate(cursor, 1)
    }
    if (run > best) best = run
  }

  const today = new Date().toISOString().slice(0, 10)
  let cursor = set.has(today) ? today : shiftDate(today, -1)
  let current = 0
  while (set.has(cursor)) {
    current++
    cursor = shiftDate(cursor, -1)
  }

  return { current, best }
}
