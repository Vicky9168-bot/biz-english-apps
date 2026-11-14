import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppNav } from '../site-nav'

type Scenario = {
  id: string
  title_zh: string
  prompt_en: string
  context_zh: string | null
  framework: 'STAR' | 'PREP' | 'SCQA' | 'PYRAMID'
  framework_hint_zh: string
  difficulty: number
  tags: string[] | null
}

const FRAMEWORK_DESC: Record<Scenario['framework'], string> = {
  STAR: '過去經驗 · 行為題（Situation-Task-Action-Result）',
  PREP: '表達意見 · 立場（Point-Reason-Example-Point）',
  SCQA: '說服 · 提案（Situation-Complication-Question-Answer）',
  PYRAMID: 'Exec 溝通 · 答案先行（Answer → 3 支撐 → 佐證，McKinsey）',
}

const FRAMEWORK_COLOR: Record<Scenario['framework'], string> = {
  STAR: 'text-ink bg-mark/30 border-mark',
  PREP: 'text-ink bg-mark/25 border-mark',
  SCQA: 'text-ink/80 bg-paper border-ink/25',
  PYRAMID: 'text-pen bg-pen/10 border-pen/30',
}

export default async function SpeakingHome() {
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

  const { data: scenarios } = await supabase
    .from('speaking_scenarios')
    .select(
      'id, title_zh, prompt_en, context_zh, framework, framework_hint_zh, difficulty, tags'
    )
    .order('framework', { ascending: true })
    .order('difficulty', { ascending: true })

  const grouped = ((scenarios as Scenario[] | null) ?? []).reduce(
    (acc, s) => {
      ;(acc[s.framework] ??= []).push(s)
      return acc
    },
    {} as Record<Scenario['framework'], Scenario[]>
  )

  return (
    <main className="flex-1 bg-paper min-h-screen">
      <AppNav />

      <div className="mx-auto max-w-4xl px-6 py-10">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-ink text-pretty">
            商業場景練習
          </h1>
          <p className="text-ink/70 mt-2 max-w-2xl">
            用 STAR / PREP / SCQA / Pyramid 框架回答面試 · 主管 · 高層問題，錄音後 AI 給
            4 大面向評分 + 逐句改寫 + 模範答案。
          </p>
        </header>

        {/* 熱身影片 + 快速 cheat sheet */}
        <section className="mb-10 rounded-lg border border-ink/15 bg-white p-6">
          <div className="flex items-baseline justify-between mb-3">
            <div>
              <div className="font-mono text-xs tracking-[0.2em] uppercase text-ink/65 mb-2">
                開始前 · 熱身
              </div>
              <h2 className="text-lg font-semibold text-ink">
                先看這支影片，搞懂 4 種商務 structure
              </h2>
            </div>
            <span className="text-xs text-ink/60 hidden sm:inline">
              ~5 min
            </span>
          </div>
          <div className="aspect-video rounded-lg overflow-hidden border border-ink/15 bg-black mb-4">
            <iframe
              src="https://www.youtube-nocookie.com/embed/-FMB6xtQdjM?start=529&rel=0"
              title="商務溝通框架介紹"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          </div>
          <div className="text-xs font-medium text-ink/65 uppercase tracking-wide mb-2">
            看完複習 · 點框架看詳細解釋 + 範例
          </div>
          <ul className="grid gap-2 sm:grid-cols-2">
            {(['STAR', 'PREP', 'SCQA', 'PYRAMID'] as const).map((fw) => (
              <li key={fw}>
                <Link
                  href={`/speaking/framework/${fw.toLowerCase()}`}
                  className="group flex items-start gap-2 rounded-md border border-ink/15 bg-paper p-3 hover:border-ink/40 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40 motion-safe:transition"
                >
                  <span
                    className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded border shrink-0 ${FRAMEWORK_COLOR[fw]}`}
                  >
                    {fw}
                  </span>
                  <span className="text-xs text-ink/80 leading-relaxed flex-1">
                    {FRAMEWORK_DESC[fw]}
                  </span>
                  <span className="text-ink/60 group-hover:text-ink/80 motion-safe:transition text-xs">
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {(['STAR', 'PREP', 'SCQA', 'PYRAMID'] as const).map((fw) =>
          grouped[fw]?.length ? (
            <section key={fw} className="mb-8">
              <div className="flex items-baseline gap-3 mb-3">
                <span
                  className={`text-xs font-mono font-semibold px-2 py-1 rounded border ${FRAMEWORK_COLOR[fw]}`}
                >
                  {fw}
                </span>
                <span className="text-sm text-ink/70">
                  {FRAMEWORK_DESC[fw]}
                </span>
              </div>
              <ul className="grid gap-3 sm:grid-cols-2">
                {grouped[fw].map((s) => (
                  <li key={s.id}>
                    <Link
                      href={`/speaking/${s.id}`}
                      className="block h-full rounded-lg border border-ink/15 bg-white p-5 hover:border-ink/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40 motion-safe:transition"
                    >
                      <div className="flex items-baseline justify-between mb-2">
                        <h3 className="text-base font-semibold text-ink">
                          {s.title_zh}
                        </h3>
                        <span className="text-[10px] font-mono text-ink/60 tabular-nums">
                          Lv.{s.difficulty}
                        </span>
                      </div>
                      <p className="text-sm text-ink/70 line-clamp-3 mb-3">
                        {s.context_zh ?? s.prompt_en}
                      </p>
                      {s.tags && s.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {s.tags.slice(0, 3).map((t) => (
                            <span
                              key={t}
                              className="text-[10px] px-1.5 py-0.5 rounded bg-paper text-ink/70"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null
        )}

        {(!scenarios || scenarios.length === 0) && (
          <div className="rounded-lg border border-dashed border-ink/25 bg-white p-10 text-center text-sm text-ink/65">
            尚未載入題庫，請先在 Supabase 執行{' '}
            <code className="font-mono text-xs bg-paper px-1.5 py-0.5 rounded">
              docs/apply-in-supabase.sql
            </code>
          </div>
        )}

        {/* 自訂情境 CTA */}
        <section className="mt-10">
          <Link
            href="/speaking/custom"
            className="block rounded-lg border-2 border-dashed border-ink/25 bg-white p-6 text-center hover:border-ink/50 hover:bg-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40 motion-safe:transition"
          >
            <div className="text-base font-semibold text-ink mb-1">
              沒有你要的場景？自訂一個 →
            </div>
            <p className="text-xs text-ink/70">
              用中文寫真實情境，AI 幫你挑框架、寫英文提問、直接錄音練習
            </p>
          </Link>
        </section>
      </div>
    </main>
  )
}
