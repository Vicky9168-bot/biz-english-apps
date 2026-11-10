import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { GlossaryClient } from './glossary-client'
import type { Vocabulary } from '@/lib/supabase/types'
import { AppNav } from '../../site-nav'

export default async function GlossaryPage() {
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

  const { data: words } = await supabase
    .from('vocabulary')
    .select('id, word, part_of_speech, difficulty, scenario_tags, definition_zh, example_sentence')
    .order('word', { ascending: true })
    .limit(1000)

  return (
    <main className="flex-1 bg-slate-100 min-h-screen">
      <AppNav backHref="/" backLabel="← 回比手畫腳" />

      <div className="mx-auto max-w-5xl px-6 py-10">
        <header className="mb-6">
          <div className="font-mono text-xs tracking-[0.2em] uppercase text-stone-500 mb-2">
            [Part 1 · 詞彙表]
          </div>
          <h1 className="text-3xl font-bold text-slate-900 text-pretty">
            商務單字庫
          </h1>
          <p className="text-slate-600 mt-2 max-w-xl">
            目前系統收錄 {words?.length ?? 0} 個商務單字，涵蓋動詞、名詞、片語。
            每天練 5 題，系統會挑「你還沒學會或錯過」的字。
          </p>
        </header>

        <GlossaryClient words={(words ?? []) as Vocabulary[]} />
      </div>
    </main>
  )
}
