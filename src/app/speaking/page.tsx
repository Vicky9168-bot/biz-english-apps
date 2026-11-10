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
  STAR: 'text-[#8A6508] bg-[#FBF0C8] border-[#EBD891]',
  PREP: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  SCQA: 'text-stone-700 bg-stone-100 border-stone-300',
  PYRAMID: 'text-orange-700 bg-orange-50 border-orange-200',
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
    <main className="flex-1 bg-slate-100 min-h-screen">
      <AppNav />

      <div className="mx-auto max-w-4xl px-6 py-10">
        <header className="mb-8">
          <div className="font-mono text-xs tracking-[0.2em] uppercase text-stone-500 mb-2">
            [Part 3]
          </div>
          <h1 className="text-3xl font-bold text-slate-900 text-pretty">
            商業場景練習
          </h1>
          <p className="text-slate-600 mt-2 max-w-2xl">
            用 STAR / PREP / SCQA / Pyramid 框架回答面試 · 主管 · 高層問題，錄音後 AI 給
            4 大面向評分 + 逐句改寫 + 模範答案。
          </p>
        </header>

        {/* 熱身影片 + 快速 cheat sheet */}
        <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
          <div className="flex items-baseline justify-between mb-3">
            <div>
              <div className="font-mono text-xs tracking-[0.2em] uppercase text-stone-500 mb-2">
                開始前 · 熱身
              </div>
              <h2 className="text-lg font-semibold text-slate-900">
                先看這支影片，搞懂 4 種商務 structure
              </h2>
            </div>
            <span className="text-xs text-slate-400 hidden sm:inline">
              ~5 min
            </span>
          </div>
          <div className="aspect-video rounded-lg overflow-hidden border border-slate-200 bg-black mb-4">
            <iframe
              src="https://www.youtube-nocookie.com/embed/-FMB6xtQdjM?start=529&rel=0"
              title="商務溝通框架介紹"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          </div>
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
            看完複習 · 點框架看詳細解釋 + 範例
          </div>
          <ul className="grid gap-2 sm:grid-cols-2">
            {(['STAR', 'PREP', 'SCQA', 'PYRAMID'] as const).map((fw) => (
              <li key={fw}>
                <Link
                  href={`/speaking/framework/${fw.toLowerCase()}`}
                  className="group flex items-start gap-2 rounded-md border border-slate-200 bg-slate-50 p-3 hover:border-slate-400 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 motion-safe:transition"
                >
                  <span
                    className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded border shrink-0 ${FRAMEWORK_COLOR[fw]}`}
                  >
                    {fw}
                  </span>
                  <span className="text-xs text-slate-700 leading-relaxed flex-1">
                    {FRAMEWORK_DESC[fw]}
                  </span>
                  <span className="text-slate-400 group-hover:text-slate-700 motion-safe:transition text-xs">
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
                <span className="text-sm text-slate-600">
                  {FRAMEWORK_DESC[fw]}
                </span>
              </div>
              <ul className="grid gap-3 sm:grid-cols-2">
                {grouped[fw].map((s) => (
                  <li key={s.id}>
                    <Link
                      href={`/speaking/${s.id}`}
                      className="block h-full rounded-xl border border-slate-200 bg-white p-5 hover:border-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 motion-safe:transition"
                    >
                      <div className="flex items-baseline justify-between mb-2">
                        <h3 className="text-base font-semibold text-slate-900">
                          {s.title_zh}
                        </h3>
                        <span className="text-[10px] font-mono text-slate-400 tabular-nums">
                          Lv.{s.difficulty}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 line-clamp-3 mb-3">
                        {s.context_zh ?? s.prompt_en}
                      </p>
                      {s.tags && s.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {s.tags.slice(0, 3).map((t) => (
                            <span
                              key={t}
                              className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600"
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
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
            尚未載入題庫，請先在 Supabase 執行{' '}
            <code className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">
              docs/apply-in-supabase.sql
            </code>
          </div>
        )}

        {/* 自訂情境 CTA */}
        <section className="mt-10">
          <Link
            href="/speaking/custom"
            className="block rounded-xl border-2 border-dashed border-slate-300 bg-white p-6 text-center hover:border-slate-500 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 motion-safe:transition"
          >
            <div className="text-base font-semibold text-slate-900 mb-1">
              沒有你要的場景？自訂一個 →
            </div>
            <p className="text-xs text-slate-600">
              用中文寫真實情境，AI 幫你挑框架、寫英文提問、直接錄音練習
            </p>
          </Link>
        </section>
      </div>
    </main>
  )
}
