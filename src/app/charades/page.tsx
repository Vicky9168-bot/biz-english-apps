import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppNav } from '../site-nav'
import { BookOpen, Target } from 'lucide-react'
import {
  IndexList,
  IndexRow,
  PageHeader,
  SectionTitle,
  StatStrip,
} from '../page-kit'

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

  // 我的單字本有幾個字，決定「用我的生字玩」能不能開始
  const { count: bankCount } = await supabase
    .from('user_words')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
  const myWords = bankCount ?? 0

  const done = (todayCount ?? 0) >= DAILY_TARGET
  const remaining = Math.max(0, DAILY_TARGET - (todayCount ?? 0))

  return (
    <main className="flex-1 bg-paper text-ink min-h-screen">
      <AppNav />

      <div className="mx-auto max-w-3xl px-6 py-10">
        <PageHeader
          title="比手畫腳單字"
          subtitle="用英文描述目標單字，讓 AI 猜出來 — 訓練口說表達與商務詞彙。"
        />

        <StatStrip
          items={[
            {
              label: '今日單字',
              value: `${todayCount ?? 0} / ${DAILY_TARGET}`,
              hint: done ? '今日已完成' : `還差 ${remaining} 題`,
            },
            {
              label: '本週學會',
              value: `${weeklyMasteredCount} 個字`,
              hint:
                weeklyMasteredCount >= 20
                  ? '這週有硬底子'
                  : weeklyMasteredCount === 0
                    ? '開始累積吧'
                    : '持續加碼中',
            },
          ]}
        />

        <section className="mb-10">
          <SectionTitle
            title={done ? '今日目標達成，想再多練幾題' : '選擇今天的練習模式'}
          />
          <IndexList>
            <IndexRow
              href="/charades/session?mode=user_describes"
              title="我來描述"
              desc="AI 給你一個字，你用英文描述，讓 AI 猜"
              aside={
                <span className="hl-mark font-semibold text-ink">
                  {done ? '再多練' : `開始 ${remaining} 題`}
                </span>
              }
            />
            <IndexRow
              href="/charades/session?mode=ai_describes"
              title="AI 來描述"
              desc="AI 描述一個字，你用英文猜出來"
              aside={done ? '再多練' : `開始 ${remaining} 題`}
            />
          </IndexList>
          <p className="mt-3 text-sm text-ink/65">需要允許瀏覽器使用麥克風</p>
        </section>

        <section className="mb-10">
          <SectionTitle
            title="用我的生字玩"
            hint="不計入排行榜"
          />
          <IndexList>
            <IndexRow
              href="/charades/session?mode=user_describes&source=mine"
              disabled={myWords === 0}
              title="我來描述（我的生字）"
              desc={
                myWords === 0
                  ? '單字本還是空的，先去讀文章把不熟的字存起來'
                  : `從單字本的 ${myWords} 個字抽 5 題，優先出你常答錯的`
              }
              aside={myWords === 0 ? undefined : '開始'}
            />
            <IndexRow
              href="/charades/session?mode=ai_describes&source=mine"
              disabled={myWords === 0}
              title="AI 來描述（我的生字）"
              desc="AI 描述你單字本裡的字，你用英文猜"
              aside={myWords === 0 ? undefined : '開始'}
            />
          </IndexList>
        </section>

        <section>
          <SectionTitle title="複習與詞彙" />
          <IndexList>
            <IndexRow
              href="/charades/review"
              title="錯題複習"
              desc="翻看過去答錯的字"
              aside={<Target className="h-5 w-5" strokeWidth={1.5} aria-hidden="true" />}
            />
            <IndexRow
              href="/charades/glossary"
              title="單字庫"
              desc="看有哪些字可以練"
              aside={<BookOpen className="h-5 w-5" strokeWidth={1.5} aria-hidden="true" />}
            />
          </IndexList>
        </section>
      </div>
    </main>
  )
}
