import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ContentWordsLesson } from './lesson-client'
import { AppNav } from '../../../site-nav'

export default async function ContentWordsLessonPage({
  searchParams,
}: {
  searchParams: Promise<{ review?: string }>
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('onboarding_completed, content_words_lesson_completed_at')
    .eq('user_id', user.id)
    .single()

  if (!profile?.onboarding_completed) redirect('/onboarding')

  const { review } = await searchParams
  const isReview =
    review === '1' && !!profile.content_words_lesson_completed_at

  return (
    <main className="flex-1 bg-slate-100 min-h-screen">
      <AppNav
        backHref={isReview ? '/listening' : '/'}
        backLabel={isReview ? '← 回聽力訓練' : '← 回首頁'}
      />

      <div className="mx-auto max-w-3xl px-6 py-10">
        <header className="mb-8">
          <div className="font-mono text-xs tracking-[0.2em] uppercase text-stone-500 mb-2">
            [Listening · Lesson 1]
          </div>
          <h1 className="text-3xl font-bold text-slate-900 text-pretty">
            如何抓住 Content Words
          </h1>
          <p className="text-slate-600 mt-2 max-w-xl">
            正式聽力練習前必修的一課 — 母語者只重讀「實詞」，學會這個策略聽力立刻輕鬆一半。
          </p>
        </header>

        <ContentWordsLesson />
      </div>
    </main>
  )
}
