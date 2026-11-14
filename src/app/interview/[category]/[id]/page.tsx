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
        <header className="mb-8">
          <div className="text-xs font-medium tracking-wide uppercase text-ink/65 mb-2 flex items-center gap-2">
            <span>{meta.title}</span>
            {question.framework && (
              <span className="font-mono px-1.5 py-0.5 rounded bg-ink text-white text-[10px] normal-case">
                {question.framework}
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-ink text-pretty leading-snug">
            {question.question_en}
          </h1>
          <p className="text-ink/70 mt-2">{question.question_zh}</p>
          {question.focus && (
            <p className="text-xs text-ink/65 mt-3 border-l-2 border-ink/25 pl-3">
              {question.focus}
            </p>
          )}
        </header>

        <PracticeForm question={question} />

        {question.external_resources.length > 0 && (
          <section className="mt-8 rounded-lg border border-ink/15 bg-white p-6">
            <div className="text-xs font-medium tracking-wide uppercase text-ink/65 mb-3">
              延伸學習資源
            </div>
            <ul className="space-y-3">
              {question.external_resources.map((r) => {
                const isInternal = r.url.startsWith('/')
                const linkProps = isInternal
                  ? { href: r.url }
                  : {
                      href: r.url,
                      target: '_blank',
                      rel: 'noopener noreferrer',
                    }
                return (
                  <li key={r.url}>
                    <a
                      {...linkProps}
                      className="group block rounded-lg border border-ink/10 p-3 hover:border-ink/25 hover:bg-paper transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40"
                    >
                      <div className="text-sm font-medium text-ink group-hover:underline underline-offset-2">
                        {r.title}
                        <span className="text-ink/60 ml-1 text-xs">
                          {isInternal ? '→' : '↗'}
                        </span>
                      </div>
                      {r.note && (
                        <div className="text-xs text-ink/65 mt-1">
                          {r.note}
                        </div>
                      )}
                    </a>
                  </li>
                )
              })}
            </ul>
          </section>
        )}

        <div className="mt-6 text-center">
          <Link
            href={`/interview/${cat}`}
            className="text-sm text-ink/65 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40 rounded-sm px-1"
          >
            ← 換一題練
          </Link>
        </div>
      </div>
    </main>
  )
}
