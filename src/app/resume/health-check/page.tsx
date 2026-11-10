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
    <main className="flex-1 bg-slate-100 min-h-screen">
      <AppNav backHref="/" backLabel="← 回履歷首頁" />

      <div className="mx-auto max-w-3xl px-6 py-10 space-y-6">
        <header className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="font-mono text-xs tracking-[0.2em] uppercase text-stone-500 mb-2">
            [Part 5 · Resume Health Check]
          </div>
          <h1 className="text-2xl font-bold text-slate-900 text-pretty mb-3">
            履歷健檢 · JD 對照 AI 改寫
          </h1>
          <p className="text-slate-700 leading-relaxed">
            貼上你想投的 Job Description 和目前的英文履歷，AI 幫你打分、抓出缺的關鍵字、挑 3–5 條 bullet 改寫，並給出具體建議。約 30 秒。
          </p>
        </header>

        <HealthCheckClient />
      </div>
    </main>
  )
}
