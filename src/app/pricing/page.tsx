import Link from 'next/link'
import { Check, Sparkles } from 'lucide-react'
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
    <main className="flex-1 bg-stone-100">
      <SiteNav
        user={
          user
            ? { email: user.email ?? null, profileTag: '', proficiencyLevel: null }
            : null
        }
      />

      <div className="mx-auto max-w-6xl px-6 py-12 md:py-16">
        {/* 標題 */}
        <header className="mx-auto max-w-2xl text-center">
          <p
            className="font-mono text-xs uppercase tracking-[0.25em] text-stone-500"
            translate="no"
          >
            [Pricing]
          </p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-stone-900 md:text-5xl">
            先免費練，再決定要不要升級
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-stone-600 md:text-base">
            免費版讓你完整體驗學習方法與每日打卡；Pro 解鎖無限 AI
            評分與完整求職題庫，把商務英語練到能直接上場。
          </p>
        </header>

        {/* 方案卡 */}
        <section className="mt-12 grid gap-6 md:grid-cols-2">
          {/* Free */}
          <div className="flex flex-col rounded-2xl border border-stone-200 bg-white p-8">
            <div className="flex items-baseline justify-between">
              <h2 className="text-lg font-semibold text-stone-900">
                {PLANS.free.label}
              </h2>
              <span
                className="font-mono text-xs uppercase tracking-wider text-stone-400"
                translate="no"
              >
                {PLANS.free.name}
              </span>
            </div>
            <div className="mt-6 flex items-baseline gap-2">
              <span
                className="text-4xl font-black tabular-nums text-stone-900"
                translate="no"
              >
                {PLANS.free.price}
              </span>
              <span className="text-sm text-stone-500">{PLANS.free.period}</span>
            </div>
            <p className="mt-2 text-sm text-stone-600">{PLANS.free.tagline}</p>

            <ul className="mt-6 space-y-3 text-sm text-stone-700">
              {PLAN_FREE_PERKS.map((perk) => (
                <PerkItem key={perk} tone="light">
                  {perk}
                </PerkItem>
              ))}
              {PLAN_ACCESS.map((a) => {
                const f = FEATURES.find((x) => x.key === a.key)
                return (
                  <PerkItem key={a.key} tone="light">
                    <span className="font-medium text-stone-900">
                      {f?.title}
                    </span>
                    ：{a.free}
                  </PerkItem>
                )
              })}
            </ul>

            <Link
              href={startHref}
              className="mt-8 rounded-md border border-stone-300 bg-white px-6 py-3 text-center text-sm font-semibold text-stone-900 transition hover:border-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900/30"
            >
              {user ? '前往學習' : PLANS.free.cta}
            </Link>
          </div>

          {/* Pro */}
          <div className="relative flex flex-col overflow-hidden rounded-2xl bg-[#3a3632] p-8 text-white">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(245,211,104,0.22),transparent_60%)]"
            />
            <div className="relative flex flex-1 flex-col">
              <div className="flex items-baseline justify-between">
                <h2 className="text-lg font-semibold">{PLANS.pro.label}</h2>
                <span className="inline-flex items-center gap-1 rounded-full bg-[#F5D368] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-stone-900">
                  <Sparkles className="h-3 w-3" aria-hidden="true" />
                  <span translate="no">{PLANS.pro.name}</span>
                </span>
              </div>
              <div className="mt-6 flex items-baseline gap-2">
                <span
                  className="text-4xl font-black tabular-nums text-[#F5D368]"
                  translate="no"
                >
                  {PLANS.pro.price}
                </span>
                <span className="text-sm text-white/60">{PLANS.pro.period}</span>
              </div>
              <p className="mt-1 text-xs text-[#F5D368]/80">
                {PLANS.pro.yearly}
              </p>
              <p className="mt-3 text-sm text-white/75">{PLANS.pro.tagline}</p>

              <ul className="mt-6 space-y-3 text-sm text-white/85">
                <PerkItem tone="dark">包含免費版全部內容</PerkItem>
                {PLAN_ACCESS.map((a) => {
                  const f = FEATURES.find((x) => x.key === a.key)
                  return (
                    <PerkItem key={a.key} tone="dark">
                      <span className="font-medium text-white">{f?.title}</span>
                      ：{a.pro}
                    </PerkItem>
                  )
                })}
              </ul>

              <Link
                href={startHref}
                className="mt-8 rounded-md bg-[#F5D368] px-6 py-3 text-center text-sm font-semibold text-stone-900 transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
              >
                {PLANS.pro.cta}
              </Link>
              <p className="mt-3 text-center text-xs text-white/50">
                付費功能即將開放，現在加入可優先收到通知
              </p>
            </div>
          </div>
        </section>

        {/* 功能對照 */}
        <section className="mt-16">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="text-lg font-semibold text-stone-900">功能對照</h2>
            <span className="text-xs text-stone-500">
              含 AI 即時回饋的功能以標籤標示
            </span>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-stone-200 text-xs uppercase tracking-wider text-stone-500">
                  <th scope="col" className="px-6 py-4 font-medium">
                    功能
                  </th>
                  <th scope="col" className="px-6 py-4 font-medium">
                    免費
                  </th>
                  <th scope="col" className="px-6 py-4 font-medium text-[#8A6508]">
                    Pro
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {PLAN_ACCESS.map((a) => {
                  const f = FEATURES.find((x) => x.key === a.key)
                  if (!f) return null
                  const Icon = FEATURE_ICONS[a.key]
                  return (
                    <tr key={a.key}>
                      <th scope="row" className="px-6 py-4 font-normal">
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-stone-900 text-[#F5D368]">
                            <Icon
                              className="h-4 w-4"
                              strokeWidth={1.5}
                              aria-hidden="true"
                            />
                          </span>
                          <div>
                            <div className="font-semibold text-stone-900">
                              {f.title}
                            </div>
                            <div
                              className="font-mono text-[10px] uppercase tracking-wider text-stone-400"
                              translate="no"
                            >
                              {f.tag}
                              {a.ai && (
                                <span className="ml-2 rounded-full bg-[#FBF0C8] px-1.5 py-0.5 font-semibold text-[#8A6508]">
                                  AI
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </th>
                      <td className="px-6 py-4 text-stone-600">{a.free}</td>
                      <td className="px-6 py-4 font-medium text-stone-900">
                        {a.pro}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* FAQ */}
        <section className="mt-16 mx-auto max-w-3xl">
          <h2 className="mb-4 text-lg font-semibold text-stone-900">常見問題</h2>
          <dl className="divide-y divide-stone-200 rounded-2xl border border-stone-200 bg-white">
            {PRICING_FAQ.map((item) => (
              <div key={item.q} className="px-6 py-5">
                <dt className="font-semibold text-stone-900">{item.q}</dt>
                <dd className="mt-1.5 text-sm leading-relaxed text-stone-600">
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
  tone,
  children,
}: {
  tone: 'light' | 'dark'
  children: React.ReactNode
}) {
  return (
    <li className="flex gap-3">
      <Check
        className={`mt-0.5 h-4 w-4 shrink-0 ${
          tone === 'dark' ? 'text-[#F5D368]' : 'text-[#8A6508]'
        }`}
        strokeWidth={2}
        aria-hidden="true"
      />
      <span>{children}</span>
    </li>
  )
}
