import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  CATEGORY_META,
  QuestionCategory,
  getQuestionsByCategory,
} from '@/lib/interview/questions'
import { LEADERSHIP_FRAMEWORKS } from '@/lib/interview/leadership'
import { AppNav } from '../site-nav'

export default async function InterviewHome() {
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

  const categories = (Object.keys(CATEGORY_META) as QuestionCategory[])
    .map((cat) => ({
      slug: cat,
      ...CATEGORY_META[cat],
      count: getQuestionsByCategory(cat).length,
    }))
    .sort((a, b) => a.order - b.order)

  const badge = (n: number) => String(n).padStart(2, '0')

  return (
    <main className="flex-1 bg-slate-100 min-h-screen">
      <AppNav />

      <div className="mx-auto max-w-4xl px-6 py-10">
        <header className="mb-8">
          <div className="font-mono text-xs tracking-[0.2em] uppercase text-stone-500 mb-2">
            [Part 6]
          </div>
          <h1 className="text-3xl font-bold text-slate-900 text-pretty">
            英文模擬面試
          </h1>
          <p className="text-slate-600 mt-2 max-w-2xl">
            從自我介紹、行為題、談薪水到反問老闆，20 題實戰練習，回答後給你思考建議、答題大綱與外部資源。
          </p>
        </header>

        <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
          <div className="text-xs font-medium tracking-wide uppercase text-slate-500 mb-2">
            面試金律
          </div>
          <h2 className="text-lg font-semibold text-slate-900 mb-3">
            答題結構 &gt; 英文完美
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            面試官記不住你 3 分鐘的答案，只會記得「這人講話有沒有結構」。行為題用 BAR+L（Background-Action-Result-Learning）開頭把情境交代清楚，比堆砌高級單字有效 10 倍。
          </p>
        </section>

        <div className="text-xs font-medium tracking-wide uppercase text-slate-500 mb-3">
          選一個題型開始練
        </div>
        <ul className="grid gap-4 sm:grid-cols-2 mb-10">
          {categories.map((c) => (
            <li key={c.slug}>
              <Link
                href={`/interview/${c.slug}`}
                className="block h-full rounded-xl border border-slate-200 bg-white p-5 transition hover:border-slate-300 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
              >
                <div className="flex items-start justify-between mb-3 gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs font-mono text-slate-400 shrink-0">
                      {badge(c.order)}
                    </span>
                    <h3 className="text-base font-semibold text-slate-900 truncate">
                      {c.title}
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 shrink-0">
                    {c.count} 題
                  </span>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {c.desc}
                </p>
              </Link>
            </li>
          ))}
        </ul>

        <div className="text-xs font-medium tracking-wide uppercase text-slate-500 mb-3">
          面試前必讀 · 領導力框架
        </div>
        <ul className="grid gap-4 sm:grid-cols-2">
          {LEADERSHIP_FRAMEWORKS.map((f) => (
            <li key={f.slug}>
              <Link
                href={`/interview/leadership/${f.slug}`}
                className="block h-full rounded-xl border border-slate-200 bg-white p-5 transition hover:border-slate-300 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-base font-semibold text-slate-900">
                    {f.title}
                  </h3>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                    {f.principles.length} 條
                  </span>
                </div>
                <div className="text-xs text-slate-500 mb-2">
                  {f.company} · {f.subtitle}
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {f.intro.slice(0, 90)}
                  {f.intro.length > 90 ? '…' : ''}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  )
}
