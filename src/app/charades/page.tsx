import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppNav } from '../site-nav'
import { BookOpen, Target } from 'lucide-react'

const DAILY_TARGET = 5

export default async function CharadesHome() {
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

  const today = new Date().toISOString().slice(0, 10)
  const { count: todayCount } = await supabase
    .from('charades_sessions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('session_date', today)

  // 本週學會 = 過去 7 天內答對過的 unique word_id 數
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10)
  const { data: weekCorrect } = await supabase
    .from('charades_sessions')
    .select('word_id')
    .eq('user_id', user.id)
    .eq('guessed_correctly', true)
    .gte('session_date', sevenDaysAgo)
  const weeklyMasteredCount = new Set(
    (weekCorrect ?? []).map((r) => r.word_id).filter(Boolean)
  ).size

  const done = (todayCount ?? 0) >= DAILY_TARGET
  const remaining = Math.max(0, DAILY_TARGET - (todayCount ?? 0))
  const progressPct = Math.min(100, ((todayCount ?? 0) / DAILY_TARGET) * 100)

  return (
    <main className="flex-1 bg-slate-100 min-h-screen">
      <AppNav />

      <div className="mx-auto max-w-3xl px-6 py-10">
        <header className="mb-8">
          <div className="font-mono text-xs tracking-[0.2em] uppercase text-stone-500 mb-2">
            [Part 1]
          </div>
          <h1 className="text-3xl font-bold text-slate-900 text-pretty">
            比手畫腳單字
          </h1>
          <p className="text-slate-600 mt-2 max-w-xl">
            用英文描述目標單字，讓 AI 猜出來 — 訓練口說表達與商務詞彙。
          </p>
        </header>

        {/* 學習進度 stats */}
        <section className="mb-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-500">今日單字</span>
              <Target className="h-5 w-5 text-stone-400" strokeWidth={1.5} aria-hidden="true" />
            </div>
            <div className="text-2xl font-bold text-slate-900 tabular-nums mb-3">
              {todayCount ?? 0} / {DAILY_TARGET}
            </div>
            <div
              className="h-1.5 bg-slate-100 rounded-full overflow-hidden"
              role="progressbar"
              aria-valuenow={todayCount ?? 0}
              aria-valuemin={0}
              aria-valuemax={DAILY_TARGET}
            >
              <div
                className="h-full bg-slate-900 motion-safe:transition-[width] duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <div className="text-xs text-slate-500 mt-2">
              {done ? '今日已完成！' : `還差 ${remaining} 題`}
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-500">本週學會</span>
              <BookOpen className="h-5 w-5 text-stone-400" strokeWidth={1.5} aria-hidden="true" />
            </div>
            <div className="text-2xl font-bold text-slate-900 tabular-nums">
              {weeklyMasteredCount} 個字
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {weeklyMasteredCount >= 20
                ? '這週有硬底子'
                : weeklyMasteredCount === 0
                  ? '開始累積吧'
                  : '持續加碼中'}
            </div>
          </div>
        </section>

        {/* 開始練習 */}
        <section className="rounded-xl border border-slate-200 bg-white p-8">
          <h2 className="text-sm font-semibold tracking-wide uppercase text-slate-500 mb-4">
            {done ? '今日目標達成 · 想再多練幾題' : '選擇今天的練習模式'}
          </h2>

          <div className="grid gap-3 md:grid-cols-2 mb-6">
            <ModeLink
              href="/charades/session?mode=user_describes"
              icon={<MicIcon />}
              title="我來描述"
              desc="AI 給你一個字，你用英文描述，讓 AI 猜"
              cta={done ? '再多練 →' : `開始 ${remaining} 題 →`}
              variant="primary"
            />
            <ModeLink
              href="/charades/session?mode=ai_describes"
              icon={<EarIcon />}
              title="AI 來描述"
              desc="AI 描述一個字，你用英文猜出來"
              cta={done ? '再多練 →' : `開始 ${remaining} 題 →`}
              variant="secondary"
            />
          </div>

          <p className="text-xs text-slate-500 text-center">
            需要允許瀏覽器使用麥克風
          </p>
        </section>

        {/* 錯題複習 + 詞彙表 */}
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Link
            href="/charades/review"
            className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-5 py-4 hover:border-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 motion-safe:transition group"
          >
            <div>
              <div className="text-sm font-semibold text-slate-900">
                錯題複習
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                翻看過去答錯的字
              </div>
            </div>
            <span
              aria-hidden="true"
              className="text-slate-400 group-hover:text-slate-900 motion-safe:transition"
            >
              →
            </span>
          </Link>

          <Link
            href="/charades/glossary"
            className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-5 py-4 hover:border-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 motion-safe:transition group"
          >
            <div>
              <div className="text-sm font-semibold text-slate-900">
                單字庫
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                看有哪些字可以練
              </div>
            </div>
            <span
              aria-hidden="true"
              className="text-slate-400 group-hover:text-slate-900 motion-safe:transition"
            >
              →
            </span>
          </Link>
        </div>
      </div>
    </main>
  )
}


function ModeLink({
  href,
  icon,
  title,
  desc,
  cta,
  variant,
}: {
  href: string
  icon: React.ReactNode
  title: string
  desc: string
  cta: string
  variant: 'primary' | 'secondary'
}) {
  const base =
    'group block rounded-lg border p-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20 motion-safe:transition'
  const style =
    variant === 'primary'
      ? 'border-slate-900 bg-slate-900 text-white hover:bg-slate-800'
      : 'border-slate-200 bg-white text-slate-900 hover:border-slate-400'
  const ctaClass =
    variant === 'primary'
      ? 'text-slate-100'
      : 'text-slate-500 group-hover:text-slate-900'
  return (
    <Link href={href} className={`${base} ${style}`}>
      <div
        className={
          variant === 'primary' ? 'text-slate-100 mb-3' : 'text-slate-500 mb-3'
        }
      >
        {icon}
      </div>
      <div className="font-semibold mb-1">{title}</div>
      <div
        className={
          variant === 'primary'
            ? 'text-xs text-slate-300 mb-4'
            : 'text-xs text-slate-600 mb-4'
        }
      >
        {desc}
      </div>
      <div className={`text-xs font-medium tabular-nums ${ctaClass}`}>
        {cta}
      </div>
    </Link>
  )
}

function MicIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="9" y="2" width="6" height="12" rx="3" />
      <path d="M5 10a7 7 0 0 0 14 0" />
      <path d="M12 17v4" />
      <path d="M8 21h8" />
    </svg>
  )
}

function EarIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 8a6 6 0 0 1 12 0c0 3-2 4-3 5s-1 3-3 3-2-1-3-1-2 1-3-1 1-3-1-4S6 9 6 8Z" />
      <path d="M9 12a3 3 0 0 1 6 0" />
    </svg>
  )
}
