import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  IDIOM_DAILY_LIMIT,
  getIdiomCategory,
  isIdiomCategory,
  practiceHref,
  statusOf,
  summarizeAttempts,
} from '@/lib/idioms'
import { AppNav } from '../../../site-nav'
import {
  EmptyNote,
  IndexList,
  IndexRow,
  PageHeader,
  SectionTitle,
  StatStrip,
} from '../../../page-kit'
import ReviewClient from '../../review/review-client'

// 某一類俚語：進度、開始學這類新題、複習這類，以及這類全部俚語的清單
export default async function IdiomCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>
}) {
  const { category } = await params
  if (!isIdiomCategory(category)) notFound()
  const meta = getIdiomCategory(category)!

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

  const [{ data: idioms }, { data: attempts }] = await Promise.all([
    supabase
      .from('business_idioms')
      .select(
        'id, idiom, meaning_zh, meaning_en, formal_alt, example_en, example_zh, category, difficulty, tags'
      )
      .eq('category', category)
      .order('difficulty', { ascending: true }),
    supabase
      .from('idiom_attempts')
      .select('idiom_id, is_correct, attempted_at')
      .eq('user_id', user.id)
      .limit(2000),
  ])

  const list = idioms ?? []
  const { attemptedIds, wrongIds } = summarizeAttempts(attempts ?? [])
  const withStatus = list.map((i) => ({ ...i, status: statusOf(i.id, attemptedIds, wrongIds) }))

  const total = withStatus.length
  const learned = withStatus.filter((i) => i.status !== 'new').length
  const wrong = withStatus.filter((i) => i.status === 'wrong').length
  const fresh = total - learned

  // 每日新題上限是跨類別合計（與首頁、出題 API 一致）
  const today = new Date().toISOString().slice(0, 10)
  const todayDone = new Set(
    (attempts ?? [])
      .filter((a) => (a.attempted_at ?? '').slice(0, 10) === today)
      .map((a) => a.idiom_id)
  ).size
  const limitReached = todayDone >= IDIOM_DAILY_LIMIT

  const learnDisabled = fresh === 0 || limitReached

  return (
    <main className="flex-1 bg-paper text-ink min-h-screen">
      <AppNav backHref="/idioms" />

      <div className="mx-auto max-w-4xl px-6 py-10">
        <PageHeader
          title={`${meta.label}俚語`}
          subtitle={
            <>
              {total} 個{meta.label}場景常用的俚語，例如{' '}
              <span translate="no">{meta.examples}</span>。先看一遍，再開始練習或複習。
            </>
          }
        />

        {total === 0 ? (
          <EmptyNote>這一類還沒有俚語。</EmptyNote>
        ) : (
          <>
            <StatStrip
              items={[
                { label: '已學', value: `${learned} / ${total}`, hint: `還有 ${fresh} 個沒碰過` },
                {
                  label: '待複習',
                  value: wrong,
                  hint: wrong > 0 ? '曾經答錯的俚語' : '目前沒有錯題',
                },
                {
                  label: '今日新題',
                  value: `${todayDone} / ${IDIOM_DAILY_LIMIT}`,
                  hint: limitReached ? '今日已達標' : '各類別合計',
                },
              ]}
            />

            <section className="mb-12">
              <SectionTitle title={`練習${meta.label}類`} />
              <IndexList>
                <IndexRow
                  href={practiceHref('learn', category)}
                  disabled={learnDisabled}
                  title={fresh === 0 ? '這一類都學過了' : '開始學這一類的新題'}
                  desc={
                    fresh === 0
                      ? '全部練過一輪，去複習讓它變成反射'
                      : limitReached
                        ? `今日已學 ${IDIOM_DAILY_LIMIT} 題，明天再來或去複習`
                        : `看情境例句選中文意思，這一類還有 ${fresh} 個沒碰過`
                  }
                  aside={
                    learnDisabled ? undefined : (
                      <span className="hl-mark font-semibold text-ink">開始</span>
                    )
                  }
                />
                <IndexRow
                  href={practiceHref('review', category)}
                  disabled={learned === 0}
                  title="複習這一類"
                  desc={
                    learned === 0
                      ? '還沒有學過的，先去學幾題'
                      : wrong > 0
                        ? `優先抽你答錯過的 ${wrong} 題`
                        : `從學過的 ${learned} 題裡抽`
                  }
                  aside={learned === 0 ? undefined : '複習'}
                />
              </IndexList>
            </section>

            <ReviewClient
              idioms={withStatus}
              categoryMeta={{ [category]: { label: meta.label, order: 1 } }}
            />
          </>
        )}
      </div>
    </main>
  )
}
