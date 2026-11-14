import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { OnboardingForm } from './onboarding-form'
import { PageHeader } from '@/app/page-kit'

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
    <main className="flex-1 bg-paper px-6 py-12 text-ink">
      <div className="mx-auto max-w-2xl">
        <PageHeader
          title="讓我們認識你"
          subtitle="首次設定只需 1 分鐘。這些資訊會用來客製化你的學習內容，讓每天的練習都貼近你的實戰情境。"
        />

        <OnboardingForm userId={user.id} />
      </div>
    </main>
  )
}
