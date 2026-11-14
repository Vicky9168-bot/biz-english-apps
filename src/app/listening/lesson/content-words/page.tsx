import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ContentWordsLesson } from './lesson-client'
import { AppNav } from '../../../site-nav'
import { PageHeader } from '@/app/page-kit'

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
    <main className="flex-1 bg-paper min-h-screen">
      <AppNav backHref={isReview ? '/listening' : '/'} />

      <div className="mx-auto max-w-3xl px-6 py-10">
        <PageHeader
          title="如何抓住 Content Words"
          subtitle={<>正式聽力練習前必修的一課 — 母語者只重讀「實詞」，學會這個策略聽力立刻輕鬆一半。</>}
        />

        <ContentWordsLesson />
      </div>
    </main>
  )
}
