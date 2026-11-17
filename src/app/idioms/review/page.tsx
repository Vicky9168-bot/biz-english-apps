import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ReviewClient from './review-client'
import { AppNav } from '../../site-nav'
import { PageHeader, StatStrip } from '@/app/page-kit'
import { IDIOM_CATEGORIES, statusOf, summarizeAttempts } from '@/lib/idioms'

// 清單依類別分組顯示，順序跟首頁一致
const CATEGORY_META = Object.fromEntries(
  IDIOM_CATEGORIES.map((c, i) => [c.key, { label: c.label, order: i + 1 }])
)

type Idiom = {
  id: string
  idiom: string
  meaning_zh: string
  meaning_en: string
  formal_alt: string | null
  example_en: string
  example_zh: string
  category: string
  difficulty: number
  tags: string[] | null
}

export default async function IdiomsReviewPage() {
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
      .order('category', { ascending: true })
      .order('difficulty', { ascending: true }),
    supabase
      .from('idiom_attempts')
      .select('idiom_id, is_correct')
      .eq('user_id', user.id)
      .limit(2000),
  ])

  const { attemptedIds, wrongIds } = summarizeAttempts(attempts ?? [])

  const allIdioms = (idioms ?? []) as Idiom[]
  const withStatus = allIdioms.map((i) => ({
    ...i,
    status: statusOf(i.id, attemptedIds, wrongIds),
  }))

  const stats = {
    total: withStatus.length,
    learned: attemptedIds.size,
    wrong: wrongIds.size,
    fresh: withStatus.length - attemptedIds.size,
  }

  return (
    <main className="flex-1 bg-paper min-h-screen">
      <AppNav backHref="/idioms" />

      <div className="mx-auto max-w-4xl px-6 py-10">
        <PageHeader
          title="全部 100 個俚語瀏覽"
          subtitle={<>先看一遍中文意思跟情境例句，準備好再按下面「開始測驗」，走現有的複習流程（優先抽你答錯過的）。</>}
        />

        <StatStrip
          items={[
            { label: '曾答錯', value: stats.wrong, hint: '優先複習這批' },
            {
              label: '學過',
              value: stats.learned,
              hint: `累積作答 ${attempts?.length ?? 0} 次`,
            },
            { label: '沒碰過', value: stats.fresh, hint: '還沒進到今日題目' },
          ]}
        />

        <ReviewClient
          idioms={withStatus}
          categoryMeta={CATEGORY_META}
        />

        <div className="mt-10 border-t border-ink/15 pt-6">
          <p className="text-sm text-ink/70 mb-3">
            看完了嗎？來測驗一下
          </p>
          <Link
            href="/idioms/practice?mode=review"
            className="inline-block rounded-md bg-ink px-6 py-3 text-sm font-semibold text-paper hover:bg-ink/85 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40 focus-visible:ring-offset-2"
          >
            開始測驗
          </Link>
          <p className="text-xs text-ink/60 mt-3">
            走現有邏輯 · 優先抽你答錯過的
          </p>
        </div>
      </div>
    </main>
  )
}
