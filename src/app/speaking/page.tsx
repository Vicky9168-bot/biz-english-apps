import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppNav } from '../site-nav'
import { GuideVideo } from '../guide-video'
import {
  EmptyNote,
  IndexList,
  IndexRow,
  PageHeader,
  SectionTitle,
} from '../page-kit'

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
    <main className="flex-1 bg-paper text-ink min-h-screen">
      <AppNav />

      <div className="mx-auto max-w-4xl px-6 py-10">
        <PageHeader
          title="商業場景練習"
          subtitle="用 STAR / PREP / SCQA / Pyramid 框架回答面試 · 主管 · 高層問題，錄音後 AI 給 4 大面向評分 + 逐句改寫 + 模範答案。"
        />

        <GuideVideo variant="collapsible" video="speaking" />

        {/* 熱身影片 + 快速 cheat sheet */}
        <section className="mb-12">
          <SectionTitle title="先看這支影片，搞懂 4 種商務 structure" hint="約 5 分鐘" />
          <div className="mb-6 aspect-video overflow-hidden rounded-sm border border-ink/15 bg-black">
            <iframe
              src="https://www.youtube-nocookie.com/embed/-FMB6xtQdjM?start=529&rel=0"
              title="商務溝通框架介紹"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="h-full w-full"
            />
          </div>
          <p className="mb-2 text-sm text-ink/65">
            看完複習，點框架看詳細解釋與範例
          </p>
          <IndexList>
            {(['STAR', 'PREP', 'SCQA', 'PYRAMID'] as const).map((fw) => (
              <IndexRow
                key={fw}
                href={`/speaking/framework/${fw.toLowerCase()}`}
                title={fw}
                desc={FRAMEWORK_DESC[fw]}
                aside="看解釋"
              />
            ))}
          </IndexList>
        </section>

        {(['STAR', 'PREP', 'SCQA', 'PYRAMID'] as const).map((fw) =>
          grouped[fw]?.length ? (
            <section key={fw} className="mb-12">
              <SectionTitle title={fw} hint={FRAMEWORK_DESC[fw]} />
              <IndexList>
                {grouped[fw].map((s) => (
                  <IndexRow
                    key={s.id}
                    href={`/speaking/${s.id}`}
                    tag={`Lv.${s.difficulty}`}
                    title={s.title_zh}
                    desc={s.context_zh ?? s.prompt_en}
                    aside={s.tags?.slice(0, 2).join(' · ')}
                  />
                ))}
              </IndexList>
            </section>
          ) : null
        )}

        {(!scenarios || scenarios.length === 0) && (
          <EmptyNote>
            尚未載入題庫，請先在 Supabase 執行{' '}
            <code className="font-mono text-xs">docs/apply-in-supabase.sql</code>
          </EmptyNote>
        )}

        {/* 自訂情境 */}
        <section className="mt-4">
          <IndexList>
            <IndexRow
              href="/speaking/custom"
              title="沒有你要的場景？自訂一個"
              desc="用中文寫真實情境，AI 幫你挑框架、寫英文提問、直接錄音練習"
              aside="自訂"
            />
          </IndexList>
        </section>
      </div>
    </main>
  )
}
