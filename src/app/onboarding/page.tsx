import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { OnboardingForm } from './onboarding-form'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (profile?.onboarding_completed) redirect('/')

  return (
    <main className="flex-1 py-12 px-6 bg-gradient-to-b from-paper to-white">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-block rounded-full bg-mark/30 px-4 py-1.5 text-xs font-medium text-ink mb-3">
            首次設定 · 只需 1 分鐘
          </div>
          <h1 className="text-3xl font-bold text-ink mb-2">
            讓我們認識你
          </h1>
          <p className="text-ink/70">
            這些資訊會用來客製化你的學習內容，讓每天的練習都貼近你的實戰情境
          </p>
        </div>

        <OnboardingForm userId={user.id} />
      </div>
    </main>
  )
}
