import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  CATEGORY_META,
  QuestionCategory,
  getQuestionsByCategory,
} from '@/lib/interview/questions'
import { AppNav } from '../../site-nav'

const VALID_CATEGORIES: QuestionCategory[] = [
  'basic',
  'behavioral',
  'salary',
  'ask-back',
]

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>
}) {
  const { category } = await params

  if (!VALID_CATEGORIES.includes(category as QuestionCategory)) {
    notFound()
  }

  const cat = category as QuestionCategory
  const meta = CATEGORY_META[cat]
  const questions = getQuestionsByCategory(cat)

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

  return (
    <main className="flex-1 bg-paper min-h-screen">
      <AppNav backHref="/interview" />

      <div className="mx-auto max-w-4xl px-6 py-10">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-ink text-pretty flex items-baseline gap-3">
            <span>{meta.title}</span>
            <span className="text-sm font-mono font-normal text-ink/65">
              {questions.length} 題
            </span>
          </h1>
          <p className="text-ink/70 mt-2 max-w-2xl">{meta.desc}</p>
        </header>

        <ul className="grid gap-3">
          {questions.map((q, idx) => (
            <li key={q.id}>
              <Link
                href={`/interview/${cat}/${q.id}`}
                className="block rounded-lg border border-ink/15 bg-white p-5 transition hover:border-ink/25 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40"
              >
                <div className="flex items-start gap-4">
                  <span className="text-xs font-mono text-ink/60 mt-1 shrink-0">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-ink mb-1">
                      {q.question_en}
                    </div>
                    <div className="text-xs text-ink/65 mb-2">
                      {q.question_zh}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {q.framework && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-ink text-white">
                          {q.framework}
                        </span>
                      )}
                      {q.focus && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-paper text-ink/70">
                          {q.focus}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-ink/60 text-sm shrink-0" aria-hidden>
                    →
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  )
}
