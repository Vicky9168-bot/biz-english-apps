import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppNav } from '../site-nav'

const CATEGORY_META: Record<
  string,
  { label: string; desc: string; color: string }
> = {
  meeting: {
    label: '會議',
    desc: 'touch base · loop in · circle back',
    color: 'text-ink bg-mark/30 border-mark',
  },
  negotiation: {
    label: '談判',
    desc: 'push back · hash out · deal breaker',
    color: 'text-ink bg-mark/25 border-mark',
  },
  strategy: {
    label: '策略',
    desc: 'pivot · double down · north star',
    color: 'text-ink/80 bg-paper border-ink/25',
  },
  feedback: {
    label: '回饋',
    desc: 'drop the ball · above and beyond · nail it',
    color: 'text-pen bg-pen/10 border-pen/30',
  },
  urgency: {
    label: '時間壓力',
    desc: 'crunch time · put out fires · buy some time',
    color: 'text-pen bg-pen/10 border-pen/30',
  },
  interpersonal: {
    label: '人際',
    desc: 'team player · rock the boat · see eye to eye',
    color: 'text-ink bg-paper border-ink/15',
  },
  general: {
    label: '通用',
    desc: 'cut corners · bite the bullet · from scratch',
    color: 'text-ink/80 bg-paper border-ink/15',
  },
}

export default async function IdiomsHome() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('onboarding_completed')
    .eq('user_id', user.id)
    .single()
  if (!profile?.onboarding_completed) redirect('/onboarding')

  const { count: totalCount } = await supabase
    .from('business_idioms')
    .select('*', { count: 'exact', head: true })

  const { data: attempts } = await supabase
    .from('idiom_attempts')
    .select('idiom_id, is_correct, attempted_at')
    .eq('user_id', user.id)
    .order('attempted_at', { ascending: false })
    .limit(1000)

  const uniqueAttempted = new Set(
    (attempts ?? []).map((a) => a.idiom_id)
  )
  const correctCount = (attempts ?? []).filter((a) => a.is_correct).length
  const accuracy =
    (attempts?.length ?? 0) > 0
      ? Math.round((correctCount / (attempts?.length ?? 1)) * 100)
      : 0

  // 今日新學（同一 idiom 當天多次算 1）
  const today = new Date().toISOString().slice(0, 10)
  const todayIds = new Set(
    (attempts ?? [])
      .filter((a) => (a.attempted_at ?? '').slice(0, 10) === today)
      .map((a) => a.idiom_id)
  )
  const todayDone = todayIds.size
  const DAILY_LIMIT = 10
  const todayReachedLimit = todayDone >= DAILY_LIMIT

  // 複習池:曾經答錯過的
  const wrongIds = new Set(
    (attempts ?? []).filter((a) => a.is_correct === false).map((a) => a.idiom_id)
  )

  const total = totalCount ?? 0
  const seedMissing = total === 0

  return (
    <main className="flex-1 bg-paper min-h-screen">
      <AppNav />

      <div className="mx-auto max-w-4xl px-6 py-10">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-ink text-pretty">
            商務俚語練習
          </h1>
          <p className="text-ink/70 mt-2 max-w-2xl">
            100 個會議、談判、回饋場景常聽到的英文俚語，看情境例句選中文意思，練到聽到就秒懂。
          </p>
        </header>

        {seedMissing ? (
          <div className="rounded-lg border border-dashed border-ink/25 bg-white p-10 text-center text-sm text-ink/65 mb-8">
            尚未載入題庫，請先在 Supabase 執行{' '}
            <code className="font-mono text-xs bg-paper px-1.5 py-0.5 rounded">
              docs/apply-idioms.sql
            </code>
          </div>
        ) : (
          <>
            {/* 進度 */}
            <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                label="今日新題"
                value={`${todayDone} / ${DAILY_LIMIT}`}
                hint={
                  todayReachedLimit
                    ? '今日達標！可以複習'
                    : `還可以學 ${DAILY_LIMIT - todayDone} 題`
                }
              />
              <StatCard
                label="累積學過"
                value={`${uniqueAttempted.size} / ${total}`}
                hint={
                  uniqueAttempted.size >= total
                    ? '全部練過一輪！'
                    : `還有 ${total - uniqueAttempted.size} 題沒碰過`
                }
              />
              <StatCard
                label="待複習"
                value={`${wrongIds.size}`}
                hint={
                  wrongIds.size > 0
                    ? '曾經答錯的題目'
                    : '目前沒有錯題'
                }
              />
              <StatCard
                label="答對率"
                value={
                  attempts && attempts.length > 0 ? `${accuracy}%` : '—'
                }
                hint={
                  attempts && attempts.length > 0
                    ? `累積 ${attempts.length} 次作答`
                    : '開始練習後顯示'
                }
              />
            </section>

            {/* 開始 CTA */}
            <section className="mb-10 grid gap-3 sm:grid-cols-2">
              <Link
                href="/idioms/practice"
                aria-disabled={todayReachedLimit}
                className={`block rounded-lg border-2 p-6 text-center motion-safe:transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40 ${
                  todayReachedLimit
                    ? 'border-ink/15 bg-white text-ink/60 cursor-not-allowed pointer-events-none'
                    : 'border-ink bg-ink text-white hover:bg-ink'
                }`}
              >
                <div className="text-base font-semibold mb-1">
                  {todayReachedLimit ? '今日已達標' : '開始今日練習 →'}
                </div>
                <p
                  className={`text-xs ${
                    todayReachedLimit ? 'text-ink/60' : 'text-paper/70'
                  }`}
                >
                  {todayReachedLimit
                    ? `今日已學 ${DAILY_LIMIT} 題，明天再來或去複習`
                    : `每天最多 10 題新題，剩 ${DAILY_LIMIT - todayDone} 題`}
                </p>
              </Link>
              <Link
                href="/idioms/review"
                className="block rounded-lg border-2 border-ink/25 bg-white p-6 text-center text-ink hover:border-ink/50 hover:bg-paper motion-safe:transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40"
              >
                <div className="text-base font-semibold mb-1">
                  瀏覽全部 100 題 →
                </div>
                <p className="text-xs text-ink/70">
                  {wrongIds.size > 0
                    ? `先看一遍再測驗，優先抽你答錯過的 ${wrongIds.size} 題`
                    : uniqueAttempted.size > 0
                      ? `看完全部再進測驗，從已學過的抽`
                      : '看完全部俚語再開始測驗'}
                </p>
              </Link>
            </section>
          </>
        )}

        {/* 分類簡介 */}
        <section>
          <div className="text-xs font-medium text-ink/65 uppercase tracking-wide mb-3">
            涵蓋 7 大類商務場景
          </div>
          <ul className="grid gap-2 sm:grid-cols-2">
            {Object.entries(CATEGORY_META).map(([key, meta]) => (
              <li
                key={key}
                className="flex items-start gap-2 rounded-md border border-ink/15 bg-white p-3"
              >
                <span
                  className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded border shrink-0 ${meta.color}`}
                >
                  {meta.label}
                </span>
                <span className="text-xs text-ink/80 leading-relaxed">
                  {meta.desc}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  )
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string
  value: string
  hint: string
}) {
  return (
    <div className="rounded-lg border border-ink/15 bg-white p-5">
      <div className="text-sm text-ink/65 mb-2">{label}</div>
      <div className="text-2xl font-bold text-ink tabular-nums">
        {value}
      </div>
      <div className="text-xs text-ink/65 mt-1">{hint}</div>
    </div>
  )
}
