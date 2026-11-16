import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SAVED_WORD_SELECT, toSavedWord } from '@/lib/words'
import { AppNav } from '../../site-nav'
import { PageHeader } from '../../page-kit'
import { VocabClient } from './vocab-client'

export default async function ReadingVocabPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data } = await supabase
    .from('user_words')
    .select(SAVED_WORD_SELECT)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <main className="flex-1 bg-paper text-ink min-h-screen">
      <AppNav backHref="/reading" />
      <div className="mx-auto max-w-3xl px-6 py-10">
        <PageHeader
          title="我的生字本"
          subtitle="在各處存下來的單字。用原本的句子挖空，選出正確意思，越常答錯的越先出現。"
        />
        <VocabClient
          initialWords={(data ?? []).map((row) =>
            toSavedWord(row as unknown as Parameters<typeof toSavedWord>[0])
          )}
        />
      </div>
    </main>
  )
}
