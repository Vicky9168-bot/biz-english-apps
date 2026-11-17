import type { CSSProperties } from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { LucideIcon } from 'lucide-react'
import { FEATURE_ICONS } from '@/lib/feature-icons'
import { getLearningStats } from '@/lib/learning-stats'
import { FEATURES, FEATURE_GROUPS, HOME_CAROUSEL_KEYS } from '@/lib/constants'
import { HomeCarousel } from './home-carousel'
import { SiteNav } from './site-nav'
import { HomeTour } from './home-tour'

// 首頁示範：兩句常見的職場英文，被紅筆改成道地說法
const REDLINE_EDITS = [
  {
    before: 'I want to ask you send me the report.',
    after: 'Could you send me the report by Friday?',
    note: '改成請求句，並補上期限',
    delay: '0s',
  },
  {
    before: 'We have a problem about the schedule.',
    after: "We're running behind schedule.",
    note: '用商務上常聽到的說法',
    delay: '2.4s',
  },
] as const

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ tour?: string }>
}) {
  const { tour } = await searchParams
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
    <main className="flex-1 bg-paper text-ink">
      <SiteNav
        user={
          user ? { email: user.email ?? null, profileTag, proficiencyLevel } : null
        }
      />

      {/* Hero：左邊說明，右邊是一張被校稿的紙 */}
      <section className="border-b border-ink/10">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 py-14 md:py-20 lg:grid-cols-[1fr_1.05fr] lg:items-center lg:gap-16">
          <div>
            <h1 className="text-balance text-[clamp(2.25rem,5vw,3.25rem)] font-bold leading-[1.15]">
              開口說職場英文，AI 陪你練到上場
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-ink/70">
              {user
                ? '每天練一點口說，AI 逐句幫你改，累積成職場上的即戰力。'
                : '依你的職位與產業出題，練口說、聽力、履歷與面試，AI 逐句幫你改。'}
            </p>
            {!user && (
              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
                <Link
                  href="/signup"
                  className="rounded-md bg-ink px-6 py-3 text-sm font-semibold text-paper transition hover:bg-ink/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40 focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
                >
                  免費開始學習
                </Link>
                <Link
                  href="/login"
                  className="rounded-sm text-sm font-semibold underline decoration-ink/30 underline-offset-4 transition hover:decoration-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40"
                >
                  我已有帳號
                </Link>
              </div>
            )}
          </div>

          <RedlineSheet />
        </div>
      </section>

      {/* 打卡 + 本月分鐘（登入後才有） */}
      {user && (
        <section
          aria-label="學習紀錄"
          data-tour="stats"
          className="border-b border-ink/10 bg-white"
        >
          <div className="mx-auto grid max-w-6xl grid-cols-2 divide-x divide-ink/10 px-6">
            <Stat
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
            <Stat
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
              inset
            />
          </div>
        </section>
      )}

      <div className="mx-auto max-w-6xl px-6 pb-8 pt-14 md:pt-16">
        {/* 熱門功能輪播 */}
        <HomeCarousel features={carouselFeatures} loggedIn={!!user} />

        {/* 完整功能：Part 1–6 是學習順序，所以用編號列表 */}
        {FEATURE_GROUPS.map((group) => {
          const items = FEATURES.filter((f) => f.group === group.key)
          return (
            <section
              key={group.key}
              data-tour={`group-${group.key}`}
              className="mt-16 grid gap-6 lg:grid-cols-[15rem_1fr] lg:gap-12"
            >
              <div>
                <h2 className="text-2xl font-bold">{group.title}</h2>
                <p className="mt-1 text-sm text-ink/65">{group.subtitle}</p>
              </div>
              <div className="border-b border-ink/15">
                {items.map((f) => (
                  <FeatureRow
                    key={f.key}
                    href={featureHref(f.href)}
                    icon={FEATURE_ICONS[f.key]}
                    title={f.title}
                    desc={f.desc}
                    tag={f.tag}
                    tourId={`feature-${f.key}`}
                  />
                ))}
              </div>
            </section>
          )
        })}
      </div>

      <footer className="mx-auto mt-12 max-w-6xl border-t border-ink/10 px-6 pb-12 pt-8 text-sm text-ink/65">
        {user && (
          <Link
            href="/progress"
            data-tour="progress-link"
            className="mb-4 inline-block rounded-sm font-semibold text-ink underline decoration-ink/30 underline-offset-4 hover:decoration-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40"
          >
            看完整成就
          </Link>
        )}
        <p>
          © {new Date().getFullYear()} BizVoice ·{' '}
          <span translate="no">with ironv makes you happy every day.</span>
        </p>
      </footer>
      {user && <HomeTour userId={user.id} force={tour === '1'} />}
    </main>
  )
}

// 橫線筆記本上的校稿：紅筆劃掉、螢光筆標出新寫法（動畫定義在 globals.css）
function RedlineSheet() {
  return (
    <figure
      className="relative bg-white px-6 py-9 pl-14 shadow-[0_1px_0_rgba(26,36,48,0.06),0_24px_40px_-28px_rgba(26,36,48,0.4)] sm:pl-16 sm:pr-10"
      style={{
        backgroundImage:
          'repeating-linear-gradient(to bottom, transparent 0 35px, rgba(26,36,48,0.08) 35px 36px)',
      }}
    >
      <span
        aria-hidden
        className="absolute inset-y-0 left-10 w-px bg-pen/35 sm:left-12"
      />
      <figcaption className="sr-only">英文修改示範</figcaption>
      {REDLINE_EDITS.map((edit) => (
        <div
          key={edit.after}
          className="mb-9 last:mb-0"
          style={{ '--d': edit.delay } as CSSProperties}
          lang="en"
          translate="no"
        >
          <p className="text-lg leading-9 text-ink/60 sm:text-xl">
            <del className="redline-before no-underline">{edit.before}</del>
          </p>
          <p className="text-lg font-medium leading-9 sm:text-xl">
            <ins className="redline-after no-underline">{edit.after}</ins>
          </p>
          <p className="redline-note text-sm leading-9 text-pen" lang="zh-Hant">
            {edit.note}
          </p>
        </div>
      ))}
    </figure>
  )
}

function Stat({
  label,
  value,
  unit,
  hint,
  inset = false,
}: {
  label: string
  value: number
  unit: string
  hint: string
  inset?: boolean
}) {
  return (
    <div className={`py-6 ${inset ? 'pl-6 md:pl-10' : 'pr-6'}`}>
      <p className="text-sm text-ink/65">{label}</p>
      <p className="mt-1 flex items-baseline gap-1.5">
        <span className="font-display text-4xl font-bold tabular-nums">
          {value}
        </span>
        <span className="text-sm text-ink/65">{unit}</span>
      </p>
      <p className="mt-1 text-sm text-ink/65">{hint}</p>
    </div>
  )
}

function FeatureRow({
  href,
  icon: Icon,
  title,
  desc,
  tag,
  tourId,
}: {
  href: string
  icon: LucideIcon
  title: string
  desc: string
  tag: string
  tourId: string
}) {
  return (
    <Link
      href={href}
      data-tour={tourId}
      className="group grid grid-cols-[4.5rem_1fr_auto] items-start gap-x-4 border-t border-ink/15 px-2 py-6 transition-colors hover:bg-white/70 focus-visible:bg-white/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ink/40 sm:gap-x-6"
    >
      <span className="pt-1 font-display text-sm font-semibold text-ink/65">
        {tag}
      </span>
      <span>
        <span className="block text-lg font-semibold leading-snug">
          <span className="mark-hover">{title}</span>
        </span>
        <span className="mt-1 block max-w-md text-sm leading-relaxed text-ink/70">
          {desc}
        </span>
      </span>
      <Icon
        className="mt-1 h-5 w-5 text-ink/50 transition-colors group-hover:text-ink"
        strokeWidth={1.5}
        aria-hidden="true"
      />
    </Link>
  )
}
