import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Clock, Flame, type LucideIcon } from 'lucide-react'
import { FEATURE_ICONS } from '@/lib/feature-icons'
import { getLearningStats } from '@/lib/learning-stats'
import { FEATURES, FEATURE_GROUPS, HOME_CAROUSEL_KEYS } from '@/lib/constants'
import { HomeCarousel } from './home-carousel'
import { SiteNav } from './site-nav'

export default async function Home() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let profileTag = ''
  let proficiencyLevel: number | null = null
  let stats = { streak: 0, monthMinutes: 0 }

  if (user) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('job_title, industry, onboarding_completed, proficiency_level')
      .eq('user_id', user.id)
      .single()

    if (!profile?.onboarding_completed) redirect('/onboarding')

    profileTag = [profile.job_title, profile.industry]
      .filter(Boolean)
      .join(' · ')
    proficiencyLevel = profile.proficiency_level
    stats = await getLearningStats(supabase, user.id)
  }

  const carouselFeatures = HOME_CAROUSEL_KEYS.flatMap((key) =>
    FEATURES.filter((f) => f.key === key)
  )
  const featureHref = (href: string) => (user ? href : '/signup')

  return (
    <main className="flex-1 bg-stone-100">
      <SiteNav
        user={
          user ? { email: user.email ?? null, profileTag, proficiencyLevel } : null
        }
      />

      <div className="mx-auto max-w-6xl px-6 py-10">
        {/* Hero banner */}
        <section className="relative isolate mb-6 overflow-hidden rounded-2xl bg-[#3a3632] px-8 py-12 md:px-14 md:py-16 text-white">
          {/* 大樓玻璃帷幕：細方格暗示窗戶 */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.09]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,0.7) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.7) 1px, transparent 1px)',
              backgroundSize: '34px 34px',
            }}
          />
          {/* 右上光源漸層 */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(231,229,228,0.28),transparent_60%)]"
          />
          {/* 左上點陣波浪 */}
          <div
            aria-hidden
            className="pointer-events-none absolute -top-10 -left-10 h-56 w-56 opacity-50"
            style={{
              backgroundImage:
                'radial-gradient(circle, rgba(255,255,255,0.85) 1.2px, transparent 1.6px)',
              backgroundSize: '10px 10px',
              WebkitMaskImage:
                'radial-gradient(circle at top left, black 15%, transparent 70%)',
              maskImage:
                'radial-gradient(circle at top left, black 15%, transparent 70%)',
            }}
          />
          {/* 右下點陣波浪 */}
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-12 -right-12 h-72 w-72 opacity-50"
            style={{
              backgroundImage:
                'radial-gradient(circle, rgba(255,255,255,0.85) 1.2px, transparent 1.6px)',
              backgroundSize: '10px 10px',
              WebkitMaskImage:
                'radial-gradient(circle at bottom right, black 15%, transparent 70%)',
              maskImage:
                'radial-gradient(circle at bottom right, black 15%, transparent 70%)',
            }}
          />

          <div className="relative">
            {/* 品牌小標 */}
            <div className="mb-8 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md border border-white/40">
                <span
                  className="text-lg font-black tracking-tighter"
                  translate="no"
                >
                  B
                </span>
              </div>
              <div
                className="text-[11px] font-mono uppercase tracking-[0.25em] leading-tight text-white/70"
                translate="no"
              >
                BizEnglish
                <br />
                <span className="text-white/40">· Daily</span>
              </div>
            </div>

            {/* 主標 + 左側直線 */}
            <div className="flex gap-6 md:gap-8">
              <div
                aria-hidden
                className="w-px shrink-0 self-stretch bg-white/40"
              />
              <div className="flex-1">
                <h1
                  className="text-balance text-4xl font-black uppercase leading-[0.95] tracking-tight sm:text-5xl md:text-7xl"
                  translate="no"
                >
                  Learning Biz
                  <br />
                  Business
                </h1>
                <p
                  className="mt-6 max-w-lg text-sm leading-relaxed text-white/70 md:text-base"
                  translate="no"
                >
                  with ironv makes you happy every day.
                </p>
                <p className="mt-2 max-w-lg text-sm leading-relaxed text-white/50">
                  {user
                    ? '每天一點英文，累積成為職場上的即戰力'
                    : '專為商務人士設計的 AI 英語學習平台，依你的職位與產業客製化聽說讀寫訓練'}
                </p>
                {!user && (
                  <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                    <Link
                      href="/signup"
                      className="rounded-md bg-[#F5D368] px-6 py-3 text-center text-sm font-semibold text-stone-900 transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                    >
                      免費開始學習
                    </Link>
                    <Link
                      href="/login"
                      className="rounded-md border border-white/40 px-6 py-3 text-center text-sm font-semibold text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                    >
                      我已有帳號
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* 打卡 + 本月分鐘（登入後才有） */}
        {user && (
          <section className="mb-10 grid gap-4 sm:grid-cols-2">
            <StatCard
              icon={Flame}
              label="連續打卡"
              value={stats.streak}
              unit="天"
              hint={
                stats.streak >= 7
                  ? '一週高手，繼續穩住'
                  : stats.streak === 0
                    ? '今天開始第 1 天'
                    : '養成習慣中'
              }
            />
            <StatCard
              icon={Clock}
              label="本月學習"
              value={stats.monthMinutes}
              unit="分鐘"
              hint={
                stats.monthMinutes >= 120
                  ? '這個月很拼'
                  : stats.monthMinutes === 0
                    ? '這個月還沒開始'
                    : '持續累積中'
              }
            />
          </section>
        )}

        {/* 熱門功能輪播 */}
        <div className="mt-10">
          <HomeCarousel features={carouselFeatures} loggedIn={!!user} />
        </div>

        {/* 完整功能 */}
        {FEATURE_GROUPS.map((group) => {
          const items = FEATURES.filter((f) => f.group === group.key)
          return (
            <section key={group.key} className="mt-10">
              <div className="mb-4 flex items-baseline justify-between">
                <h2 className="text-lg font-semibold text-stone-900">
                  {group.title}
                </h2>
                <span className="text-xs text-stone-500">
                  {group.subtitle}
                </span>
              </div>
              <div
                className={`grid gap-4 sm:grid-cols-2 ${
                  items.length > 2 ? 'lg:grid-cols-4' : ''
                }`}
              >
                {items.map((f) => (
                  <FeatureLink
                    key={f.key}
                    href={featureHref(f.href)}
                    icon={FEATURE_ICONS[f.key]}
                    title={f.title}
                    desc={f.desc}
                    tag={f.tag}
                  />
                ))}
              </div>
            </section>
          )
        })}

        {user ? (
          <div className="mt-10 flex justify-end">
            <Link
              href="/progress"
              className="text-sm text-stone-500 hover:text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 rounded-sm px-1"
            >
              看完整成就 →
            </Link>
          </div>
        ) : (
          <footer className="mt-16 border-t border-stone-200 pt-8 text-center text-sm text-stone-500">
            © {new Date().getFullYear()} BizEnglish · 用 AI 練商務英語
          </footer>
        )}
      </div>
    </main>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  unit,
  hint,
}: {
  icon: LucideIcon
  label: string
  value: number
  unit: string
  hint: string
}) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-stone-500">{label}</span>
        <Icon
          className="h-5 w-5 text-stone-400"
          strokeWidth={1.5}
          aria-hidden="true"
        />
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-3xl font-bold text-stone-900 tabular-nums">
          {value}
        </span>
        <span className="text-sm text-stone-500">{unit}</span>
      </div>
      <div className="text-xs text-stone-500 mt-1">{hint}</div>
    </div>
  )
}

function FeatureLink({
  href,
  icon: Icon,
  title,
  desc,
  tag,
}: {
  href: string
  icon: LucideIcon
  title: string
  desc: string
  tag: string
}) {
  return (
    <Link
      href={href}
      className="group block h-full rounded-xl border border-stone-200 bg-white p-6 transition hover:-translate-y-0.5 hover:border-stone-900 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900/30"
    >
      <div className="flex items-center justify-between mb-4">
        <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-stone-900 text-[#F5D368]">
          <Icon className="h-5 w-5" strokeWidth={1.5} aria-hidden="true" />
        </span>
        <span className="rounded-full bg-[#FBF0C8] px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-[#8A6508]">
          {tag}
        </span>
      </div>
      <h3 className="text-lg font-semibold text-stone-900 mb-1">{title}</h3>
      <p className="text-sm text-stone-600">{desc}</p>
    </Link>
  )
}
