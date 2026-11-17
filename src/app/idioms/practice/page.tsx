import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PracticeClient from './practice-client'
import { AppNav } from '../../site-nav'
import { getIdiomCategory, isIdiomCategory } from '@/lib/idioms'

export default async function IdiomsPracticePage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; category?: string }>
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { mode: modeParam, category: categoryParam } = await searchParams
  const mode = modeParam === 'review' ? 'review' : 'learn'
  const category = isIdiomCategory(categoryParam) ? categoryParam : null
  const categoryLabel = category ? getIdiomCategory(category)?.label : null

  return (
    <main className="flex-1 bg-paper min-h-screen">
      <AppNav backHref={category ? `/idioms/category/${category}` : '/idioms'} />

      <div className="mx-auto max-w-2xl px-6 py-10">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-ink">
            {categoryLabel && `${categoryLabel}：`}
            {mode === 'review'
              ? '複習學過的俚語（優先答錯過的）'
              : '看情境，選出俚語的中文意思'}
          </h1>
          {mode === 'learn' && (
            <p className="text-xs text-ink/65 mt-2">
              每天最多 10 題新題，達標後可回來複習
            </p>
          )}
        </header>

        <PracticeClient mode={mode} category={category} />
      </div>
    </main>
  )
}
