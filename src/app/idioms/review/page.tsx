import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ReviewClient from './review-client'
import { AppNav } from '../../site-nav'

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

const CATEGORY_META: Record<
  string,
  { label: string; color: string; order: number }
> = {
  meeting: {
    label: '會議',
    color: 'text-[#8A6508] bg-[#FBF0C8] border-[#EBD891]',
    order: 1,
  },
  negotiation: {
    label: '談判',
    color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    order: 2,
  },
  strategy: {
    label: '策略',
    color: 'text-stone-700 bg-stone-100 border-stone-300',
    order: 3,
  },
  feedback: {
    label: '回饋',
    color: 'text-orange-700 bg-orange-50 border-orange-200',
    order: 4,
  },
  urgency: {
    label: '時間壓力',
    color: 'text-rose-700 bg-rose-50 border-rose-200',
    order: 5,
  },
  interpersonal: {
    label: '人際',
    color: 'text-cyan-700 bg-cyan-50 border-cyan-200',
    order: 6,
  },
  general: {
    label: '通用',
    color: 'text-slate-700 bg-slate-50 border-slate-200',
    order: 7,
  },
}

export type IdiomStatus = 'wrong' | 'learned' | 'new'

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

  const attemptedIds = new Set<string>()
  const wrongIds = new Set<string>()
  ;(attempts ?? []).forEach((a) => {
    attemptedIds.add(a.idiom_id)
    if (!a.is_correct) wrongIds.add(a.idiom_id)
  })

  const allIdioms = (idioms ?? []) as Idiom[]
  const withStatus = allIdioms.map((i) => ({
    ...i,
    status: (wrongIds.has(i.id)
      ? 'wrong'
      : attemptedIds.has(i.id)
        ? 'learned'
        : 'new') as IdiomStatus,
  }))

  const stats = {
    total: withStatus.length,
    learned: attemptedIds.size,
    wrong: wrongIds.size,
    fresh: withStatus.length - attemptedIds.size,
  }

  return (
    <main className="flex-1 bg-slate-100 min-h-screen">
      <AppNav backHref="/idioms" />

      <div className="mx-auto max-w-4xl px-6 py-10">
        <header className="mb-6">
          <div className="font-mono text-xs tracking-[0.2em] uppercase text-stone-500 mb-2">
            [Part 4 · Review]
          </div>
          <h1 className="text-3xl font-bold text-slate-900 text-pretty">
            全部 100 個俚語瀏覽
          </h1>
          <p className="text-slate-600 mt-2 max-w-2xl">
            先看一遍中文意思跟情境例句，準備好再按下面「開始測驗」，走現有的複習流程（優先抽你答錯過的）。
          </p>
        </header>

        <section className="mb-6 grid gap-3 sm:grid-cols-3">
          <StatCard
            label="曾答錯"
            value={stats.wrong}
            hint="優先複習這批"
            tone="rose"
          />
          <StatCard
            label="學過"
            value={stats.learned}
            hint={`累積作答 ${attempts?.length ?? 0} 次`}
            tone="slate"
          />
          <StatCard
            label="沒碰過"
            value={stats.fresh}
            hint="還沒進到今日題目"
            tone="slate"
          />
        </section>

        <ReviewClient
          idioms={withStatus}
          categoryMeta={CATEGORY_META}
        />

        <div className="mt-10 rounded-xl border border-slate-900 bg-slate-900 p-6 text-center">
          <p className="text-sm text-slate-300 mb-3">
            看完了嗎？來測驗一下
          </p>
          <Link
            href="/idioms/practice?mode=review"
            className="inline-block text-base font-semibold bg-white text-slate-900 px-6 py-2.5 rounded-lg hover:bg-slate-100 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            開始測驗 →
          </Link>
          <p className="text-xs text-slate-400 mt-3">
            走現有邏輯 · 優先抽你答錯過的
          </p>
        </div>
      </div>
    </main>
  )
}

function StatCard({
  label,
  value,
  hint,
  tone,
}: {
  label: string
  value: number
  hint: string
  tone: 'slate' | 'rose'
}) {
  const toneClass =
    tone === 'rose'
      ? 'border-rose-200 bg-rose-50'
      : 'border-slate-200 bg-white'
  const valueClass =
    tone === 'rose' ? 'text-rose-900' : 'text-slate-900'
  return (
    <div className={`rounded-xl border p-5 ${toneClass}`}>
      <div className="text-xs text-slate-500 mb-1">{label}</div>
      <div className={`text-2xl font-bold tabular-nums ${valueClass}`}>
        {value}
      </div>
      <div className="text-xs text-slate-500 mt-1">{hint}</div>
    </div>
  )
}
