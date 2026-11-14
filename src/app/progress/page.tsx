import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppNav } from '../site-nav'
import {
  allDates,
  computeStreaks,
  getActivityDates,
  shiftDate,
} from '@/lib/learning-stats'

export default async function ProgressPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('onboarding_completed, created_at')
    .eq('user_id', user.id)
    .single()

  if (!profile?.onboarding_completed) redirect('/onboarding')

  // 抓所有 sessions（單人量不會太多，全撈可接受）
  const { data: all } = await supabase
    .from('charades_sessions')
    .select('word_id, guessed_correctly, session_date, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const rows = all ?? []
  const totalAttempts = rows.length
  const totalCorrect = rows.filter((r) => r.guessed_correctly).length
  const accuracy =
    totalAttempts === 0 ? 0 : Math.round((totalCorrect / totalAttempts) * 100)

  // 已掌握的 unique 字數（最新一筆是對）
  const latest = new Map<string, { correct: boolean; ts: string }>()
  rows.forEach((r) => {
    if (!r.word_id) return
    const prev = latest.get(r.word_id)
    if (!prev || r.created_at > prev.ts) {
      latest.set(r.word_id, { correct: r.guessed_correctly, ts: r.created_at })
    }
  })
  const masteredWords = Array.from(latest.values()).filter((v) => v.correct)
    .length
  const stillReviewing = Array.from(latest.values()).filter((v) => !v.correct)
    .length

  // 打卡日：四種活動（比手畫腳、聽力、口說、俚語）合併，與首頁同一套算法
  const activityDates = allDates(await getActivityDates(supabase, user.id))
  const { current: currentStreak, best: bestStreak } =
    computeStreaks(activityDates)

  // 過去 30 天熱力圖
  const heatmap = buildHeatmap(activityDates)

  return (
    <main className="flex-1 bg-paper text-ink min-h-screen">
      <AppNav />

      <div className="mx-auto max-w-4xl px-6 py-10">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-pretty">我的學習成就</h1>
          <p className="text-ink/70 mt-2">
            自 {profile.created_at?.slice(0, 10) ?? '—'} 開始，你的累積成果
          </p>
        </header>

        {/* 主要指標 */}
        <div className="grid grid-cols-2 border-t border-ink/15 lg:grid-cols-4 mb-8">
          <BigStat label="目前連續" value={`${currentStreak}`} unit="天" />
          <BigStat label="最長 streak" value={`${bestStreak}`} unit="天" />
          <BigStat label="已掌握" value={`${masteredWords}`} unit="個字" />
          <BigStat label="正確率" value={`${accuracy}`} unit="%" />
        </div>

        {/* 次要指標 */}
        <div className="grid gap-x-8 sm:grid-cols-3 mb-12">
          <MiniStat label="總練習次數" value={totalAttempts.toString()} />
          <MiniStat label="累積答對" value={totalCorrect.toString()} />
          <MiniStat label="待複習" value={stillReviewing.toString()} />
        </div>

        {/* 熱力圖：次數越多，螢光筆越濃 */}
        <section className="border-t border-ink/15 pt-6">
          <h2 className="text-xl font-bold mb-4">過去 30 天</h2>
          <div className="flex gap-1 flex-wrap">
            {heatmap.map((cell) => (
              <div
                key={cell.date}
                className={`w-6 h-6 rounded-sm ${cellColor(cell.count)}`}
                title={`${cell.date} · ${cell.count} 次`}
                aria-label={`${cell.date} 練習 ${cell.count} 次`}
              />
            ))}
          </div>
          <div className="flex items-center gap-2 mt-4 text-sm text-ink/65">
            <span>少</span>
            <div className="w-3 h-3 rounded-sm bg-ink/10" />
            <div className="w-3 h-3 rounded-sm bg-mark/60" />
            <div className="w-3 h-3 rounded-sm bg-mark" />
            <div className="w-3 h-3 rounded-sm bg-ink" />
            <span>多</span>
          </div>
        </section>
      </div>
    </main>
  )
}

function BigStat({
  label,
  value,
  unit,
}: {
  label: string
  value: string
  unit: string
}) {
  return (
    <div className="border-b border-ink/15 py-5 pr-4 lg:border-l lg:pl-6 lg:first:border-l-0 lg:first:pl-0">
      <div className="text-sm text-ink/65 mb-1">{label}</div>
      <div className="flex items-baseline gap-1.5">
        <span className="font-display text-4xl font-bold tabular-nums">
          {value}
        </span>
        <span className="text-sm text-ink/65">{unit}</span>
      </div>
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between border-b border-ink/15 py-3">
      <div className="text-sm text-ink/65">{label}</div>
      <div className="font-display text-lg font-semibold tabular-nums">
        {value}
      </div>
    </div>
  )
}

function buildHeatmap(dates: string[]): Array<{ date: string; count: number }> {
  const counts = new Map<string, number>()
  dates.forEach((d) => counts.set(d, (counts.get(d) ?? 0) + 1))

  const cells: Array<{ date: string; count: number }> = []
  const today = new Date().toISOString().slice(0, 10)
  for (let i = 29; i >= 0; i--) {
    const iso = shiftDate(today, -i)
    cells.push({ date: iso, count: counts.get(iso) ?? 0 })
  }
  return cells
}

function cellColor(count: number): string {
  if (count === 0) return 'bg-ink/10'
  if (count <= 2) return 'bg-mark/60'
  if (count <= 4) return 'bg-mark'
  return 'bg-ink'
}
