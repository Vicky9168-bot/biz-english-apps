import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppNav } from '../site-nav'

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

  // 打卡日 → 當前 streak + 最佳 streak
  const uniqueDates = [...new Set(rows.map((r) => r.session_date))].sort()
  const { current: currentStreak, best: bestStreak } =
    computeStreaks(uniqueDates)

  // 過去 30 天熱力圖
  const heatmap = buildHeatmap(rows.map((r) => r.session_date))

  return (
    <main className="flex-1 bg-slate-100 min-h-screen">
      <AppNav />

      <div className="mx-auto max-w-4xl px-6 py-10">
        <header className="mb-8">
          <div className="font-mono text-xs tracking-[0.2em] uppercase text-stone-500 mb-2">
            [My Progress]
          </div>
          <h1 className="text-3xl font-bold text-slate-900 text-pretty">
            我的學習成就
          </h1>
          <p className="text-slate-600 mt-2">
            自 {profile.created_at?.slice(0, 10) ?? '—'} 開始，你的累積成果
          </p>
        </header>

        {/* 主要指標 */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <BigStat
            label="目前連續"
            value={`${currentStreak}`}
            unit="天"
            emphasis="text-orange-600"
          />
          <BigStat
            label="最長 streak"
            value={`${bestStreak}`}
            unit="天"
            emphasis="text-slate-900"
          />
          <BigStat
            label="已掌握"
            value={`${masteredWords}`}
            unit="個字"
            emphasis="text-emerald-700"
          />
          <BigStat
            label="正確率"
            value={`${accuracy}`}
            unit="%"
            emphasis="text-[#8A6508]"
          />
        </div>

        {/* 次要指標 */}
        <div className="grid gap-4 sm:grid-cols-3 mb-8">
          <MiniStat label="總練習次數" value={totalAttempts.toString()} />
          <MiniStat label="累積答對" value={totalCorrect.toString()} />
          <MiniStat label="待複習" value={stillReviewing.toString()} />
        </div>

        {/* 熱力圖 */}
        <section className="rounded-xl bg-white border border-slate-200 p-6">
          <h2 className="text-sm font-semibold tracking-wide uppercase text-slate-500 mb-4">
            過去 30 天
          </h2>
          <div className="flex gap-1 flex-wrap">
            {heatmap.map((cell) => (
              <div
                key={cell.date}
                className={`w-6 h-6 rounded-sm ${cellColor(cell.count)}`}
                title={`${cell.date} · ${cell.count} 題`}
                aria-label={`${cell.date} 練習 ${cell.count} 題`}
              />
            ))}
          </div>
          <div className="flex items-center gap-2 mt-4 text-xs text-slate-500">
            <span>少</span>
            <div className="w-3 h-3 rounded-sm bg-slate-100" />
            <div className="w-3 h-3 rounded-sm bg-emerald-200" />
            <div className="w-3 h-3 rounded-sm bg-emerald-400" />
            <div className="w-3 h-3 rounded-sm bg-emerald-600" />
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
  emphasis,
}: {
  label: string
  value: string
  unit: string
  emphasis: string
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="text-xs text-slate-500 mb-2">{label}</div>
      <div className="flex items-baseline gap-1">
        <span className={`text-3xl font-bold tabular-nums ${emphasis}`}>
          {value}
        </span>
        <span className="text-sm text-slate-500">{unit}</span>
      </div>
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white border border-slate-200 px-4 py-3">
      <div className="text-xs text-slate-500 mb-0.5">{label}</div>
      <div className="text-lg font-semibold text-slate-900 tabular-nums">
        {value}
      </div>
    </div>
  )
}

function computeStreaks(sortedDates: string[]): {
  current: number
  best: number
} {
  if (sortedDates.length === 0) return { current: 0, best: 0 }

  const set = new Set(sortedDates)
  let best = 0

  // best streak: 從每個日期起算連續多長
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

  // current streak: 從今天(或昨天,允許今天還沒練)往回算
  const today = new Date().toISOString().slice(0, 10)
  let cursor = set.has(today) ? today : shiftDate(today, -1)
  let current = 0
  while (set.has(cursor)) {
    current++
    cursor = shiftDate(cursor, -1)
  }

  return { current, best }
}

function shiftDate(date: string, days: number): string {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function buildHeatmap(dates: string[]): Array<{ date: string; count: number }> {
  const counts = new Map<string, number>()
  dates.forEach((d) => counts.set(d, (counts.get(d) ?? 0) + 1))

  const cells: Array<{ date: string; count: number }> = []
  const today = new Date()
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const iso = d.toISOString().slice(0, 10)
    cells.push({ date: iso, count: counts.get(iso) ?? 0 })
  }
  return cells
}

function cellColor(count: number): string {
  if (count === 0) return 'bg-slate-100'
  if (count <= 2) return 'bg-emerald-200'
  if (count <= 4) return 'bg-emerald-400'
  return 'bg-emerald-600'
}
