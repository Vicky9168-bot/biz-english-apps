import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getFrameworkBySlug, LEADERSHIP_FRAMEWORKS } from '@/lib/interview/leadership'
import { AppNav } from '../../../site-nav'

export function generateStaticParams() {
  return LEADERSHIP_FRAMEWORKS.map((f) => ({ slug: f.slug }))
}

export default async function LeadershipPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const framework = getFrameworkBySlug(slug)
  if (!framework) notFound()

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
    <main className="flex-1 bg-slate-100 min-h-screen">
      <AppNav backHref="/interview" />

      <div className="mx-auto max-w-4xl px-6 py-10">
        <header className="mb-8">
          <div className="font-mono text-xs tracking-[0.2em] uppercase text-stone-500 mb-2">
            [{framework.company} · {framework.subtitle}]
          </div>
          <h1 className="text-3xl font-bold text-slate-900 text-pretty">
            {framework.title}
          </h1>
          <p className="text-slate-600 mt-3 max-w-2xl leading-relaxed">
            {framework.intro}
          </p>
          <a
            href={framework.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-3 text-xs text-slate-500 hover:text-slate-900 underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 rounded-sm"
          >
            官方原文 ↗
          </a>
        </header>

        <ol className="grid gap-4 sm:grid-cols-2">
          {framework.principles.map((p, i) => (
            <li
              key={p.id}
              className="rounded-xl border border-slate-200 bg-white p-5"
            >
              <div className="flex items-start gap-3 mb-2">
                <span className="text-xs font-mono text-slate-400 mt-1 shrink-0">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div className="min-w-0">
                  <h2 className="text-base font-semibold text-slate-900">
                    {p.name_en}
                  </h2>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {p.name_zh}
                  </div>
                </div>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed mb-3">
                {p.description}
              </p>
              {p.example_question && (
                <div className="text-xs text-slate-500 border-t border-slate-100 pt-3 font-mono leading-relaxed">
                  <span className="text-slate-400">Q：</span>
                  {p.example_question}
                </div>
              )}
            </li>
          ))}
        </ol>

        <div className="mt-8 rounded-xl border border-slate-200 bg-white p-5 text-center">
          <p className="text-sm text-slate-600 mb-3">
            準備行為題時，把每個故事對應到 1-2 條原則，講的時候刻意帶出關鍵字
          </p>
          <Link
            href="/interview/behavioral"
            className="inline-block text-sm font-medium bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
          >
            去練行為題 →
          </Link>
        </div>
      </div>
    </main>
  )
}
