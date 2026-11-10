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
    <main className="flex-1 bg-slate-100 min-h-screen">
      <AppNav backHref="/" backLabel="← 回題庫" />

      <div className="mx-auto max-w-3xl px-6 py-10">
        <header className="mb-6">
          <div className="font-mono text-xs tracking-[0.2em] uppercase text-stone-500 mb-2">
            [自訂情境]
          </div>
          <h1 className="text-3xl font-bold text-slate-900">
            題庫沒有？寫一個給 AI 挑框架
          </h1>
          <p className="text-slate-600 mt-2">
            用中文描述真實情境（誰在問你、想達成什麼），AI 會幫你選 STAR / PREP / SCQA / Pyramid，寫英文提問，你就能直接錄音練。
          </p>
        </header>

        <CustomScenarioWizard />
      </div>
    </main>
  )
}
