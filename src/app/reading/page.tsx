import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { READING_CATEGORIES, todayInTaipei } from '@/lib/reading'
import { AppNav } from '../site-nav'
import { GuideVideo } from '../guide-video'
import {
  Callout,
  IndexList,
  IndexRow,
  PageHeader,
  SectionTitle,
  StatStrip,
} from '../page-kit'

export default async function ReadingHome() {
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

  const today = todayInTaipei()

  const { data: todays } = await supabase
    .from('reading_articles')
    .select('category, title')
    .eq('article_date', today)
  const titleByCategory = new Map(
    (todays ?? []).map((a) => [a.category as string, a.title as string])
  )

  const { data: saved } = await supabase
    .from('user_words')
    .select('correct_count, wrong_count')
    .eq('user_id', user.id)
  const savedCount = saved?.length ?? 0
  const practicedCount = (saved ?? []).filter(
    (w) => w.correct_count + w.wrong_count > 0
  ).length

  return (
    <main className="flex-1 bg-paper text-ink min-h-screen">
      <AppNav />

      <div className="mx-auto max-w-4xl px-6 py-10">
        <PageHeader
          title="每日商業閱讀"
          subtitle="每天從國際媒體挑出最新的商業新聞，用英文解說。涵蓋財金、行銷、AI 趨勢、科技與國際議題，邊讀邊查生字，存起來再練習。"
        />

        <GuideVideo variant="collapsible" />

        <StatStrip
          items={[
            { label: '今日日期', value: today.slice(5).replace('-', '/') },
            {
              label: '生字本',
              value: savedCount,
              hint: savedCount > 0 ? '已存單字' : '讀文章時點單字就能存',
            },
            {
              label: '練習過',
              value: `${practicedCount} / ${savedCount}`,
              hint: savedCount > 0 ? '至少練過一次' : '存單字後開始練習',
            },
          ]}
        />

        <section className="mb-12">
          <SectionTitle title="今天的文章" hint="每天台北時間 00:00 換新" />
          <IndexList>
            {READING_CATEGORIES.map((c) => {
              const title = titleByCategory.get(c.key)
              return (
                <IndexRow
                  key={c.key}
                  href={`/reading/${c.key}`}
                  tag={c.en}
                  title={c.label}
                  desc={
                    title ? (
                      <>
                        <span translate="no" className="font-medium text-ink">
                          {title}
                        </span>
                        <span className="block">{c.desc}</span>
                      </>
                    ) : (
                      `${c.desc} · 今日文章還沒產生，點進去會自動準備`
                    )
                  }
                  aside={
                    <span className="hl-mark font-semibold text-ink">
                      {title ? '閱讀' : '產生'}
                    </span>
                  }
                />
              )
            })}
          </IndexList>
        </section>

        <section className="mb-12">
          <SectionTitle title="我的學習紀錄" />
          <IndexList>
            <IndexRow
              href="/reading/archive"
              title="收藏的文章"
              desc="在文章頁收藏想複習的新聞解說，可依類別回頭複習"
              aside="瀏覽"
            />
            <IndexRow
              href="/reading/vocab"
              title="生字本與練習"
              desc={
                savedCount > 0
                  ? `已存 ${savedCount} 個單字，用文章原句挖空複習`
                  : '還沒有單字。讀文章時點一下不熟的字，就能存進來'
              }
              aside="進入"
            />
          </IndexList>
        </section>

        <Callout title="關於文章內容">
          每篇都是依 BBC、CNBC、TechCrunch 等媒體的當日新聞標題與摘要，由 AI
          用自己的話寫成的英文學習解說，並附原文連結。它不是原文全文或翻譯，細節與數據請以原文報導為準。
        </Callout>
      </div>
    </main>
  )
}
