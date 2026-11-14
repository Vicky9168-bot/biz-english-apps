import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CustomScenarioWizard } from './custom-client'
import { AppNav } from '../../site-nav'

export default async function SpeakingCustomPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <main className="flex-1 bg-paper min-h-screen">
      <AppNav backHref="/speaking" />

      <div className="mx-auto max-w-3xl px-6 py-10">
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-ink">
            題庫沒有？寫一個給 AI 挑框架
          </h1>
          <p className="text-ink/70 mt-2">
            用中文描述真實情境（誰在問你、想達成什麼），AI 會幫你選 STAR / PREP / SCQA / Pyramid，寫英文提問，你就能直接錄音練。
          </p>
        </header>

        <CustomScenarioWizard />
      </div>
    </main>
  )
}
