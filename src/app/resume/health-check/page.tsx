import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import HealthCheckClient from './health-check-client'
import { AppNav } from '../../site-nav'

export default async function ResumeHealthCheckPage() {
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
      <AppNav backHref="/resume" />

      <div className="mx-auto max-w-3xl px-6 py-10 space-y-6">
        <header className="rounded-lg border border-ink/15 bg-white p-6">
          <h1 className="text-2xl font-bold text-ink text-pretty mb-3">
            履歷健檢 · JD 對照 AI 改寫
          </h1>
          <p className="text-ink/80 leading-relaxed">
            貼上你想投的 Job Description 和目前的英文履歷，AI 幫你打分、抓出缺的關鍵字、挑 3–5 條 bullet 改寫，並給出具體建議。約 30 秒。
          </p>
        </header>

        <HealthCheckClient />
      </div>
    </main>
  )
}
