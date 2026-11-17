import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppNav } from '../site-nav'
import {
  EmptyNote,
  IndexList,
  IndexRow,
  PageHeader,
  SectionTitle,
  StatStrip,
} from '../page-kit'
import { IDIOM_CATEGORIES, IDIOM_DAILY_LIMIT } from '@/lib/idioms'

export default async function IdiomsHome() {
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

  const { data: idiomRows } = await supabase
    .from('business_idioms')
    .select('id, category')

  const { data: attempts } = await supabase
    .from('idiom_attempts')
    .select('idiom_id, is_correct, attempted_at')
    .eq('user_id', user.id)
    .order('attempted_at', { ascending: false })
    .limit(1000)

  const uniqueAttempted = new Set(
    (attempts ?? []).map((a) => a.idiom_id)
  )
  const correctCount = (attempts ?? []).filter((a) => a.is_correct).length
  const accuracy =
    (attempts?.length ?? 0) > 0
      ? Math.round((correctCount / (attempts?.length ?? 1)) * 100)
      : 0

  // 今日新學（同一 idiom 當天多次算 1）
  const today = new Date().toISOString().slice(0, 10)
  const todayIds = new Set(
    (attempts ?? [])
      .filter((a) => (a.attempted_at ?? '').slice(0, 10) === today)
      .map((a) => a.idiom_id)
  )
  const todayDone = todayIds.size
  const DAILY_LIMIT = IDIOM_DAILY_LIMIT
  const todayReachedLimit = todayDone >= DAILY_LIMIT

  // 複習池:曾經答錯過的
  const wrongIds = new Set(
    (attempts ?? []).filter((a) => a.is_correct === false).map((a) => a.idiom_id)
  )

  const total = idiomRows?.length ?? 0

  // 每個類別：共幾個、你學過幾個
  const byCategory = new Map<string, { total: number; learned: number }>()
  ;(idiomRows ?? []).forEach((r) => {
    const stat = byCategory.get(r.category) ?? { total: 0, learned: 0 }
    stat.total += 1
    if (uniqueAttempted.has(r.id)) stat.learned += 1
    byCategory.set(r.category, stat)
  })
  const seedMissing = total === 0

  return (
    <main className="flex-1 bg-paper text-ink min-h-screen">
      <AppNav />

      <div className="mx-auto max-w-4xl px-6 py-10">
        <PageHeader
          title="商務俚語練習"
          subtitle="100 個會議、談判、回饋場景常聽到的英文俚語，看情境例句選中文意思，練到聽到就秒懂。"
        />

        {seedMissing ? (
          <div className="mb-10">
            <EmptyNote>
              尚未載入題庫，請先在 Supabase 執行{' '}
              <code className="font-mono text-xs">docs/apply-idioms.sql</code>
            </EmptyNote>
          </div>
        ) : (
          <>
            <StatStrip
              items={[
                {
                  label: '今日新題',
                  value: `${todayDone} / ${DAILY_LIMIT}`,
                  hint: todayReachedLimit
                    ? '今日達標，可以複習'
                    : `還可以學 ${DAILY_LIMIT - todayDone} 題`,
                },
                {
                  label: '累積學過',
                  value: `${uniqueAttempted.size} / ${total}`,
                  hint:
                    uniqueAttempted.size >= total
                      ? '全部練過一輪'
                      : `還有 ${total - uniqueAttempted.size} 題沒碰過`,
                },
                {
                  label: '待複習',
                  value: `${wrongIds.size}`,
                  hint: wrongIds.size > 0 ? '曾經答錯的題目' : '目前沒有錯題',
                },
                {
                  label: '答對率',
                  value:
                    attempts && attempts.length > 0 ? `${accuracy}%` : '—',
                  hint:
                    attempts && attempts.length > 0
                      ? `累積 ${attempts.length} 次作答`
                      : '開始練習後顯示',
                },
              ]}
            />

            <section className="mb-12">
              <SectionTitle title="開始練習" />
              <IndexList>
                <IndexRow
                  href="/idioms/practice"
                  disabled={todayReachedLimit}
                  title={todayReachedLimit ? '今日已達標' : '開始今日練習'}
                  desc={
                    todayReachedLimit
                      ? `今日已學 ${DAILY_LIMIT} 題，明天再來或去複習`
                      : `每天最多 10 題新題，剩 ${DAILY_LIMIT - todayDone} 題`
                  }
                  aside={
                    todayReachedLimit ? undefined : (
                      <span className="hl-mark font-semibold text-ink">
                        開始
                      </span>
                    )
                  }
                />
                <IndexRow
                  href="/idioms/review"
                  title="瀏覽全部 100 題"
                  desc={
                    wrongIds.size > 0
                      ? `先看一遍再測驗，優先抽你答錯過的 ${wrongIds.size} 題`
                      : uniqueAttempted.size > 0
                        ? '看完全部再進測驗，從已學過的抽'
                        : '看完全部俚語再開始測驗'
                  }
                  aside="瀏覽"
                />
              </IndexList>
            </section>
          </>
        )}

        {/* 7 大類：點進去看這一類的俚語、學習或複習 */}
        <section>
          <SectionTitle title="7 大類商務場景" hint="點進去學習或複習" />
          <IndexList>
            {IDIOM_CATEGORIES.map((c) => {
              const stat = byCategory.get(c.key) ?? { total: 0, learned: 0 }
              return (
                <IndexRow
                  key={c.key}
                  href={`/idioms/category/${c.key}`}
                  title={c.label}
                  desc={<span translate="no">{c.examples}</span>}
                  aside={`已學 ${stat.learned} / ${stat.total}`}
                />
              )
            })}
          </IndexList>
        </section>
      </div>
    </main>
  )
}
