import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppNav } from '../../site-nav'
import { PageHeader } from '../../page-kit'
import { VocabClient, type SavedWord } from './vocab-client'

export default async function ReadingVocabPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data } = await supabase
    .from('reading_saved_words')
    .select(
      'id, word, surface_form, pos, meaning_zh, meaning_en, example_en, context_sentence, correct_count, wrong_count'
    )
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <main className="flex-1 bg-paper text-ink min-h-screen">
      <AppNav backHref="/reading" />
      <div className="mx-auto max-w-3xl px-6 py-10">
        <PageHeader
          title="我的生字本"
          subtitle="讀文章時存下來的單字。用原本的句子挖空，選出正確意思，越常答錯的越先出現。"
        />
        <VocabClient initialWords={(data ?? []) as SavedWord[]} />
      </div>
    </main>
  )
}
