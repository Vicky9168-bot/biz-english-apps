import type { createClient } from '@/lib/supabase/server'

type SupabaseClient = Awaited<ReturnType<typeof createClient>>

// 各活動平均耗時（分鐘/次），拿來估算本月學習時間
const MIN_PER_CHARADES = 2
const MIN_PER_LISTENING = 5
const MIN_PER_IDIOM = 0.5
const MIN_PER_SPEAKING = 3

const DAY_MS = 24 * 60 * 60 * 1000

function toDates(rows: unknown[] | null, field: string, sliceTo?: number) {
  return (rows ?? [])
    .map((r) => {
      const v = (r as Record<string, string | null>)[field]
      return sliceTo ? (v?.slice(0, sliceTo) ?? null) : v
    })
    .filter((d): d is string => !!d)
}

// 撈近 35 天所有活動 → 一次算 streak + 本月分鐘
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
  const cutoff = new Date(Date.now() - 35 * DAY_MS)
  const cutoffDate = cutoff.toISOString().slice(0, 10)
  const cutoffISO = cutoff.toISOString()

  const [charadesRes, listeningRes, idiomRes, speakingRes] = await Promise.all([
    supabase
      .from('charades_sessions')
      .select('session_date')
      .eq('user_id', userId)
      .gte('session_date', cutoffDate),
    supabase
      .from('listening_sessions')
      .select('session_date')
      .eq('user_id', userId)
      .gte('session_date', cutoffDate),
    supabase
      .from('idiom_attempts')
      .select('attempted_at')
      .eq('user_id', userId)
      .gte('attempted_at', cutoffISO),
    supabase
      .from('scenario_responses')
      .select('created_at')
      .eq('user_id', userId)
      .gte('created_at', cutoffISO),
  ])

  const charadesDates = toDates(charadesRes.data, 'session_date')
  const listeningDates = toDates(listeningRes.data, 'session_date')
  const idiomDates = toDates(idiomRes.data, 'attempted_at', 10)
  const speakingDates = toDates(speakingRes.data, 'created_at', 10)

  const inMonth = (d: string) => d >= startOfMonth
  const monthMinutes = Math.round(
    charadesDates.filter(inMonth).length * MIN_PER_CHARADES +
      listeningDates.filter(inMonth).length * MIN_PER_LISTENING +
      idiomDates.filter(inMonth).length * MIN_PER_IDIOM +
      speakingDates.filter(inMonth).length * MIN_PER_SPEAKING
  )

  const streak = calculateStreak([
    ...charadesDates,
    ...listeningDates,
    ...idiomDates,
    ...speakingDates,
  ])

  return { streak, monthMinutes }
}

function calculateStreak(dates: string[]): number {
  if (dates.length === 0) return 0
  const sorted = [...new Set(dates)].sort().reverse()
  const today = new Date().toISOString().slice(0, 10)

  let streak = 0
  const cursor = new Date(today)

  for (const d of sorted) {
    const cursorStr = cursor.toISOString().slice(0, 10)
    if (d === cursorStr) {
      streak++
      cursor.setDate(cursor.getDate() - 1)
    } else if (d < cursorStr) {
      break
    }
  }

  return streak
}
