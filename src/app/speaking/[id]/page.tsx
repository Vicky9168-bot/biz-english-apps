import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SpeakingSession } from './session-client'
import { AppNav } from '../../site-nav'

export default async function SpeakingScenarioPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: scenario, error } = await supabase
    .from('speaking_scenarios')
    .select(
      'id, title_zh, prompt_en, context_zh, framework, framework_hint_zh, difficulty, tags'
    )
    .eq('id', id)
    .single()

  if (error || !scenario) notFound()

  return (
    <main className="flex-1 bg-slate-100 min-h-screen">
      <AppNav backHref="/speaking" />

      <div className="mx-auto max-w-3xl px-6 py-10">
        <SpeakingSession
          scenarioId={scenario.id}
          titleZh={scenario.title_zh}
          promptEn={scenario.prompt_en}
          contextZh={scenario.context_zh}
          framework={scenario.framework}
          frameworkHintZh={scenario.framework_hint_zh}
          difficulty={scenario.difficulty}
          tags={scenario.tags ?? []}
        />
      </div>
    </main>
  )
}
