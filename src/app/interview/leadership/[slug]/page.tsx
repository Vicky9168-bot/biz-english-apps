import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getFrameworkBySlug, LEADERSHIP_FRAMEWORKS } from '@/lib/interview/leadership'
import { AppNav } from '../../../site-nav'
import { Callout, IndexList, IndexRow, PageHeader } from '@/app/page-kit'

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
    <main className="flex-1 bg-paper min-h-screen">
      <AppNav backHref="/interview" />

      <div className="mx-auto max-w-4xl px-6 py-10">
        <PageHeader title={framework.title} subtitle={framework.intro}>
          <a
            href={framework.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-block rounded-sm text-sm text-ink/65 underline decoration-ink/30 underline-offset-4 hover:text-ink hover:decoration-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40"
          >
            官方原文 ↗
          </a>
        </PageHeader>

        <IndexList>
          {framework.principles.map((p, i) => (
            <IndexRow
              key={p.id}
              tag={String(i + 1).padStart(2, '0')}
              title={p.name_en}
              translateTitle={false}
              desc={
                <>
                  <span className="text-ink/65">{p.name_zh}</span>
                  <span className="mt-1 block">{p.description}</span>
                  {p.example_question && (
                    <span className="mt-2 block border-l-2 border-ink/25 pl-3 text-ink/75" translate="no">
                      Q：{p.example_question}
                    </span>
                  )}
                </>
              }
            />
          ))}
        </IndexList>

        <div className="mt-10">
          <Callout>
            準備行為題時，把每個故事對應到 1-2 條原則，講的時候刻意帶出關鍵字。
          </Callout>
          <Link
            href="/interview/behavioral"
            className="inline-block rounded-md bg-ink px-5 py-2.5 text-sm font-semibold text-paper hover:bg-ink/85 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40 focus-visible:ring-offset-2"
          >
            去練行為題
          </Link>
        </div>
      </div>
    </main>
  )
}
