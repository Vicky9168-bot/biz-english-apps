import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  CATEGORY_META,
  QuestionCategory,
  getQuestionsByCategory,
} from '@/lib/interview/questions'
import { AppNav } from '../../site-nav'
import { IndexList, IndexRow, PageHeader } from '@/app/page-kit'

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
        <PageHeader
          title={meta.title}
          subtitle={`${meta.desc}（共 ${questions.length} 題）`}
        />

        <IndexList>
          {questions.map((q, idx) => (
            <IndexRow
              key={q.id}
              href={`/interview/${cat}/${q.id}`}
              tag={String(idx + 1).padStart(2, '0')}
              title={<span translate="no">{q.question_en}</span>}
              desc={
                <>
                  {q.question_zh}
                  {(q.framework || q.focus) && (
                    <span className="mt-1 block text-ink/65">
                      {[q.framework, q.focus].filter(Boolean).join(' · ')}
                    </span>
                  )}
                </>
              }
            />
          ))}
        </IndexList>
      </div>
    </main>
  )
}
