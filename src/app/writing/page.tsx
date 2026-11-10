import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppNav } from '../site-nav'
import { BarChart3, BriefcaseBusiness, FileText, Mail, type LucideIcon } from 'lucide-react'
import { IconTile } from '../icon-tile'

type WritingType = {
  slug: string
  icon: LucideIcon
  title: string
  desc: string
  frameworks: string[]
  sampleScenario: string
}

const WRITING_TYPES: WritingType[] = [
  {
    slug: 'email',
    icon: Mail,
    title: '商務 Email',
    desc: '客戶回覆、內部通知、跨部門協調，練最常用的商用信件格式',
    frameworks: ['Subject line', 'BLUF (Bottom Line Up Front)', 'Call to action'],
    sampleScenario: '客戶抱怨產品晚交 3 天，你要回一封 email 說明原因 + 補償方案',
  },
  {
    slug: 'proposal',
    icon: BarChart3,
    title: '提案 / Pitch',
    desc: '產品說明、業務提案、內部立案，用結構化寫法讓對方 30 秒就懂',
    frameworks: ['SCQA', 'Problem-Solution-Impact', 'One-page memo'],
    sampleScenario: '向老闆提案增聘 2 個 engineer，你要用 300 字說服他',
  },
  {
    slug: 'report',
    icon: FileText,
    title: '週報 / Status Update',
    desc: '每週向主管同步進度，練「做了什麼 + 卡在哪 + 需要什麼」的簡潔寫法',
    frameworks: ['Highlights / Lowlights', 'RAG status', 'Ask & Blocker'],
    sampleScenario: '這週 A 專案上線、B 專案被合規卡住，寫一封週報給老闆',
  },
  {
    slug: 'linkedin',
    icon: BriefcaseBusiness,
    title: 'LinkedIn / Cold Message',
    desc: '找工作、開發新客、要 referral，練 3 行讓對方願意回你的訊息',
    frameworks: ['Hook-Value-Ask', 'Personalization', 'Soft CTA'],
    sampleScenario: '你想加某個 PM 為好友請他分享面試經驗，寫一段開場訊息',
  },
]

export default async function WritingHome() {
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
      <AppNav />

      <div className="mx-auto max-w-4xl px-6 py-10">
        <header className="mb-8">
          <div className="font-mono text-xs tracking-[0.2em] uppercase text-stone-500 mb-2">
            [Part 5]
          </div>
          <h1 className="text-3xl font-bold text-slate-900 text-pretty">
            商務寫作
          </h1>
          <p className="text-slate-600 mt-2 max-w-2xl">
            寫 email、提案、週報、LinkedIn 開發訊息，選一個情境動筆，AI 會逐句幫你改寫 + 給語氣與結構建議。
          </p>
        </header>

        {/* 學前提示 */}
        <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
          <div className="text-xs font-medium tracking-wide uppercase text-slate-500 mb-2">
            寫作黃金法則
          </div>
          <h2 className="text-lg font-semibold text-slate-900 mb-3">
            BLUF：Bottom Line Up Front
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            商務讀者只給你前 3 秒，把結論、需求、時間點寫在第 1 句，理由跟細節放後面。反之亦然的寫法會讓對方直接關掉信件。
          </p>
        </section>

        {/* 練習類型 */}
        <div className="text-xs font-medium tracking-wide uppercase text-slate-500 mb-3">
          選一個練習類型
        </div>
        <ul className="grid gap-4 sm:grid-cols-2">
          {WRITING_TYPES.map((t) => (
            <li key={t.slug}>
              <div className="block h-full rounded-xl border border-slate-200 bg-white p-5 relative">
                <span className="absolute top-4 right-4 text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                  即將上線
                </span>
                <div className="flex items-center gap-3 mb-3">
                  <IconTile icon={t.icon} />
                  <h3 className="text-base font-semibold text-slate-900">
                    {t.title}
                  </h3>
                </div>
                <p className="text-sm text-slate-600 mb-3 leading-relaxed">
                  {t.desc}
                </p>
                <div className="flex flex-wrap gap-1 mb-3">
                  {t.frameworks.map((f) => (
                    <span
                      key={f}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono"
                    >
                      {f}
                    </span>
                  ))}
                </div>
                <div className="text-xs text-slate-500 border-t border-slate-100 pt-3">
                  <span className="text-slate-400">例：</span>
                  {t.sampleScenario}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </main>
  )
}
