import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  CATEGORY_META,
  QuestionCategory,
  getQuestionById,
} from '@/lib/interview/questions'
import PracticeForm from './practice-form'
import { AppNav } from '../../../site-nav'
import { IndexList, IndexRow, SectionTitle } from '@/app/page-kit'

const VALID_CATEGORIES: QuestionCategory[] = [
  'basic',
  'behavioral',
  'salary',
  'ask-back',
]

export default async function QuestionPracticePage({
  params,
}: {
  params: Promise<{ category: string; id: string }>
}) {
  const { category, id } = await params

  if (!VALID_CATEGORIES.includes(category as QuestionCategory)) {
    notFound()
  }

  const question = getQuestionById(id)
  if (!question || question.category !== category) {
    notFound()
  }

  const cat = category as QuestionCategory
  const meta = CATEGORY_META[cat]

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
      <AppNav backHref={`/interview/${cat}`} />

      <div className="mx-auto max-w-3xl px-6 py-10">
        <header className="mb-10 border-b border-ink/15 pb-8">
          <p className="mb-3 text-sm text-ink/65">
            {meta.title}
            {question.framework && (
              <span className="ml-3 font-display font-semibold text-ink">
                {question.framework}
              </span>
            )}
          </p>
          <h1
            className="text-balance text-2xl font-bold leading-snug md:text-3xl"
            translate="no"
          >
            {question.question_en}
          </h1>
          <p className="mt-3 text-base text-ink/70">{question.question_zh}</p>
          {question.focus && (
            <p className="mt-4 border-l-4 border-mark pl-4 text-sm leading-relaxed text-ink/75">
              {question.focus}
            </p>
          )}
        </header>

        <PracticeForm question={question} />

        {question.external_resources.length > 0 && (
          <section className="mt-12">
            <SectionTitle title="延伸學習資源" />
            <IndexList>
              {question.external_resources.map((r) => {
                const isInternal = r.url.startsWith('/')
                return (
                  <IndexRow
                    key={r.url}
                    href={r.url}
                    external={!isInternal}
                    title={r.title}
                    desc={r.note}
                    aside={isInternal ? '站內' : '外部連結 ↗'}
                  />
                )
              })}
            </IndexList>
          </section>
        )}

        <div className="mt-10">
          <Link
            href={`/interview/${cat}`}
            className="rounded-sm text-sm text-ink/65 underline decoration-ink/30 underline-offset-4 hover:text-ink hover:decoration-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40"
          >
            換一題練
          </Link>
        </div>
      </div>
    </main>
  )
}
