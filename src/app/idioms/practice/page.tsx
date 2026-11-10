import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PracticeClient from './practice-client'
import { AppNav } from '../../site-nav'

export default async function IdiomsPracticePage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { mode: modeParam } = await searchParams
  const mode = modeParam === 'review' ? 'review' : 'learn'

  return (
    <main className="flex-1 bg-slate-100 min-h-screen">
      <AppNav backHref="/idioms" backLabel="← 回題庫首頁" />

      <div className="mx-auto max-w-2xl px-6 py-10">
        <header className="mb-6">
          <div className="font-mono text-xs tracking-[0.2em] uppercase text-stone-500 mb-2">
            [Part 4 · {mode === 'review' ? '複習模式' : '今日新題'}]
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            {mode === 'review'
              ? '複習學過的俚語（優先答錯過的）'
              : '看情境，選出俚語的中文意思'}
          </h1>
          {mode === 'learn' && (
            <p className="text-xs text-slate-500 mt-2">
              每天最多 10 題新題，達標後可回來複習
            </p>
          )}
        </header>

        <PracticeClient mode={mode} />
      </div>
    </main>
  )
}
