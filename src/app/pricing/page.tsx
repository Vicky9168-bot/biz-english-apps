import Link from 'next/link'
import { Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { FEATURE_ICONS } from '@/lib/feature-icons'
import {
  FEATURES,
  PLANS,
  PLAN_ACCESS,
  PLAN_FREE_PERKS,
  PRICING_FAQ,
} from '@/lib/constants'
import { SiteNav } from '../site-nav'

export const metadata = {
  title: '方案與價格 · BizEnglish',
  description: '免費體驗核心學習方法，升級 Pro 解鎖無限 AI 評分與完整求職題庫。',
}

export default async function PricingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const startHref = user ? '/' : '/signup'

  return (
    <main className="flex-1 bg-paper text-ink">
      <SiteNav
        user={
          user
            ? { email: user.email ?? null, profileTag: '', proficiencyLevel: null }
            : null
        }
      />

      <div className="mx-auto max-w-6xl px-6 py-12 md:py-16">
        {/* 標題 */}
        <header className="max-w-2xl">
          <h1 className="text-balance text-3xl font-bold leading-[1.15] md:text-5xl">
            先免費練，再決定要不要升級
          </h1>
          <p className="mt-4 text-base leading-relaxed text-ink/70">
            免費版讓你完整體驗學習方法與每日打卡；Pro 解鎖無限 AI
            評分與完整求職題庫，把商務英語練到能直接上場。
          </p>
        </header>

        {/* 方案：Free 是一張白紙，Pro 加上墨水外框 */}
        <section className="mt-12 grid gap-6 md:grid-cols-2">
          {/* Free */}
          <div className="flex flex-col rounded-lg border border-ink/15 bg-white p-8">
            <div className="flex items-baseline justify-between">
              <h2 className="text-lg font-semibold">{PLANS.free.label}</h2>
              <span
                className="font-display text-sm font-semibold text-ink/65"
                translate="no"
              >
                {PLANS.free.name}
              </span>
            </div>
            <div className="mt-6 flex items-baseline gap-2">
              <span
                className="font-display text-4xl font-bold tabular-nums"
                translate="no"
              >
                {PLANS.free.price}
              </span>
              <span className="text-sm text-ink/65">{PLANS.free.period}</span>
            </div>
            <p className="mt-2 text-sm text-ink/70">{PLANS.free.tagline}</p>

            <ul className="mt-6 space-y-3 text-sm text-ink/80">
              {PLAN_FREE_PERKS.map((perk) => (
                <PerkItem key={perk} plan="free">
                  {perk}
                </PerkItem>
              ))}
              {PLAN_ACCESS.map((a) => {
                const f = FEATURES.find((x) => x.key === a.key)
                return (
                  <PerkItem key={a.key} plan="free">
                    <span className="font-medium text-ink">{f?.title}</span>
                    ：{a.free}
                  </PerkItem>
                )
              })}
            </ul>

            <Link
              href={startHref}
              className="mt-8 rounded-md border border-ink/30 px-6 py-3 text-center text-sm font-semibold transition hover:border-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40 focus-visible:ring-offset-2"
            >
              {user ? '前往學習' : PLANS.free.cta}
            </Link>
          </div>

          {/* Pro */}
          <div className="flex flex-col rounded-lg border-2 border-ink bg-white p-8">
            <div className="flex items-baseline justify-between">
              <h2 className="text-lg font-semibold">{PLANS.pro.label}</h2>
              <span
                className="rounded-sm bg-mark px-2 py-0.5 font-display text-sm font-semibold"
                translate="no"
              >
                {PLANS.pro.name}
              </span>
            </div>
            <div className="mt-6 flex items-baseline gap-2">
              <span
                className="font-display text-4xl font-bold tabular-nums"
                translate="no"
              >
                {PLANS.pro.price}
              </span>
              <span className="text-sm text-ink/65">{PLANS.pro.period}</span>
            </div>
            <p className="mt-1 text-sm text-ink/65">{PLANS.pro.yearly}</p>
            <p className="mt-3 text-sm text-ink/70">{PLANS.pro.tagline}</p>

            <ul className="mt-6 flex-1 space-y-3 text-sm text-ink/80">
              <PerkItem plan="pro">包含免費版全部內容</PerkItem>
              {PLAN_ACCESS.map((a) => {
                const f = FEATURES.find((x) => x.key === a.key)
                return (
                  <PerkItem key={a.key} plan="pro">
                    <span className="font-medium text-ink">{f?.title}</span>
                    ：{a.pro}
                  </PerkItem>
                )
              })}
            </ul>

            <Link
              href={startHref}
              className="mt-8 rounded-md bg-ink px-6 py-3 text-center text-sm font-semibold text-paper transition hover:bg-ink/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40 focus-visible:ring-offset-2"
            >
              {PLANS.pro.cta}
            </Link>
            <p className="mt-3 text-center text-sm text-ink/65">
              付費功能即將開放，現在加入可優先收到通知
            </p>
          </div>
        </section>

        {/* 功能對照 */}
        <section className="mt-16">
          <div className="mb-5 flex items-baseline justify-between gap-4">
            <h2 className="text-2xl font-bold">功能對照</h2>
            <span className="text-sm text-ink/65">
              含 AI 即時回饋的功能以標籤標示
            </span>
          </div>
          <div className="overflow-x-auto rounded-lg border border-ink/15 bg-white">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-ink/15 text-ink/65">
                  <th scope="col" className="px-6 py-4 font-medium">
                    功能
                  </th>
                  <th scope="col" className="px-6 py-4 font-medium">
                    免費
                  </th>
                  <th scope="col" className="px-6 py-4 font-semibold text-ink">
                    Pro
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/10">
                {PLAN_ACCESS.map((a) => {
                  const f = FEATURES.find((x) => x.key === a.key)
                  if (!f) return null
                  const Icon = FEATURE_ICONS[a.key]
                  return (
                    <tr key={a.key}>
                      <th scope="row" className="px-6 py-4 font-normal">
                        <div className="flex items-center gap-3">
                          <Icon
                            className="h-5 w-5 shrink-0 text-ink/50"
                            strokeWidth={1.5}
                            aria-hidden="true"
                          />
                          <div>
                            <div className="font-semibold">{f.title}</div>
                            <div
                              className="mt-0.5 flex items-center gap-2 font-display text-xs text-ink/65"
                              translate="no"
                            >
                              {f.tag}
                              {a.ai && (
                                <span className="rounded-sm bg-mark px-1.5 py-0.5 font-semibold text-ink">
                                  AI
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </th>
                      <td className="px-6 py-4 text-ink/70">{a.free}</td>
                      <td className="px-6 py-4 font-medium">{a.pro}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* FAQ */}
        <section className="mt-16 max-w-3xl">
          <h2 className="mb-5 text-2xl font-bold">常見問題</h2>
          <dl className="divide-y divide-ink/15 border-y border-ink/15">
            {PRICING_FAQ.map((item) => (
              <div key={item.q} className="py-5">
                <dt className="font-semibold">{item.q}</dt>
                <dd className="mt-1.5 text-sm leading-relaxed text-ink/70">
                  {item.a}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </main>
  )
}

function PerkItem({
  plan,
  children,
}: {
  plan: 'free' | 'pro'
  children: React.ReactNode
}) {
  return (
    <li className="flex gap-3">
      <Check
        className={`mt-0.5 h-4 w-4 shrink-0 ${
          plan === 'pro' ? 'text-ink' : 'text-ink/50'
        }`}
        strokeWidth={2}
        aria-hidden="true"
      />
      <span>{children}</span>
    </li>
  )
}
