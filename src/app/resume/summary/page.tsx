import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppNav } from '../../site-nav'

const CHECKLIST: string[] = [
  '履歷最上方第一個區塊，HR 一定會看',
  '涵蓋你的背景、經驗、教育（一個快照）',
  '講你是誰、你擅長什麼',
  '技術面 + 軟實力（人格特質、工作態度）並用',
  '3–4 個 bullet points 為上限，多會失焦',
]

type SentenceTemplate = {
  order: string
  label: string
  formula: string
  purpose: string
  example: string
}

const TEMPLATES: SentenceTemplate[] = [
  {
    order: '第一句',
    label: '專業背景 + 方向',
    formula:
      '[N] years of [Title / Job Role] expertise in [Industry / Function], specializing in [specific skills or JD requirements].',
    purpose: '概述你是誰、幾年經驗、擅長什麼領域，第一句就要對得上 JD。',
    example:
      '8 years of business analyst expertise in luxury retail, specializing in customer segmentation and churn modeling.',
  },
  {
    order: '第二句',
    label: '重要成功案例 / 職業高峰',
    formula:
      'Proven track record in [Experience 1, focusing on key achievements or responsibilities].',
    purpose: '突出你做過最亮眼的一件事，最好帶數字或知名專案。',
    example:
      'Proven track record in launching CRM automation programs that raised repurchase rate by 35% and cut churn by 10% YoY.',
  },
  {
    order: '第三句',
    label: '其他硬實力 / 策略規劃',
    formula: 'Especially skilled in [skill 1], [skill 2], [skill 3].',
    purpose: '補上其他技術或方法論，讓 HR 一眼看到你的工具箱。',
    example:
      'Especially skilled in SQL, Tableau, and cross-functional stakeholder alignment across marketing and merchandising.',
  },
]

const FULL_EXAMPLE = {
  role: 'Senior Business Analyst · Luxury Retail',
  lines: [
    '8 years of business analyst expertise in luxury retail, specializing in customer segmentation and churn modeling.',
    'Proven track record in launching CRM automation programs that raised repurchase rate by 35% and cut churn by 10% YoY.',
    'Especially skilled in SQL, Tableau, and cross-functional stakeholder alignment across marketing and merchandising.',
  ],
}

export default async function ResumeSummaryPage() {
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
            [Part 5 · Professional Summary]
          </div>
          <h1 className="text-2xl font-bold text-slate-900 text-pretty mb-3">
            用 3 句 Summary 講完整份履歷
          </h1>
          <p className="text-slate-700 leading-relaxed">
            Summary 是 HR 拿到你履歷的第一眼，決定他要不要往下看。用固定 3 句公式，把「你是誰、做過什麼最亮眼、還會什麼」講清楚，比洋洋灑灑一大段還有效。
          </p>
        </header>

        {/* Summary 定義 */}
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-3">
            什麼是 Summary / Profile
          </h2>
          <ul className="space-y-2 text-sm text-slate-700">
            {CHECKLIST.map((c) => (
              <li key={c} className="flex gap-2">
                <span className="text-slate-400 shrink-0">·</span>
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* 3 句架構 */}
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-1">
            3 句話架構圖
          </h2>
          <p className="text-xs text-slate-500 mb-5">
            按順序寫，每句功能不重複。填空即可完成 Summary 初稿。
          </p>
          <div className="space-y-4">
            {TEMPLATES.map((t, i) => (
              <div
                key={t.order}
                className="rounded-lg border border-slate-200 bg-slate-50 p-5"
              >
                <div className="flex items-baseline gap-2 mb-3">
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-900 text-white">
                    {i + 1}
                  </span>
                  <span className="text-sm font-semibold text-slate-900">
                    {t.order} · {t.label}
                  </span>
                </div>
                <div className="rounded-md bg-white border border-slate-200 p-3 mb-2">
                  <div className="text-[10px] font-mono uppercase text-slate-400 mb-1">
                    Formula
                  </div>
                  <p
                    className="text-sm text-slate-800 leading-relaxed font-mono"
                    translate="no"
                  >
                    {t.formula}
                  </p>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed mb-2">
                  <span className="font-semibold text-slate-700">目的：</span>
                  {t.purpose}
                </p>
                <div className="rounded-md bg-white border border-emerald-200 p-3">
                  <div className="text-[10px] font-mono uppercase text-emerald-700 mb-1">
                    Example
                  </div>
                  <p
                    className="text-sm text-slate-800 leading-relaxed italic"
                    translate="no"
                  >
                    &ldquo;{t.example}&rdquo;
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 三句串起來的完整範例 */}
        <section className="rounded-xl border border-slate-900 bg-slate-900 p-6 text-white">
          <div className="text-[10px] font-mono uppercase tracking-wide text-slate-400 mb-2">
            Full Example
          </div>
          <div className="text-sm font-semibold mb-4" translate="no">
            {FULL_EXAMPLE.role}
          </div>
          <ol className="space-y-3">
            {FULL_EXAMPLE.lines.map((line, i) => (
              <li key={i} className="flex gap-3">
                <span className="shrink-0 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-700 text-slate-200 h-fit">
                  {i + 1}
                </span>
                <p
                  className="text-sm text-slate-100 leading-relaxed"
                  translate="no"
                >
                  {line}
                </p>
              </li>
            ))}
          </ol>
        </section>

        {/* 常見錯誤 */}
        <section className="rounded-xl border border-rose-200 bg-rose-50 p-5">
          <div className="text-xs font-medium text-rose-800 uppercase tracking-wide mb-3">
            常見寫壞的地雷
          </div>
          <ul className="space-y-1.5 text-sm text-slate-800">
            <li>· 開頭寫成「I am a hardworking, passionate...」— 沒資訊量</li>
            <li>· 只寫軟實力（team player、self-motivated），HR 沒感覺</li>
            <li>· 寫成一大段話，沒有 3 句拆解，讀者不知道重點在哪</li>
            <li>· 跟 JD 完全對不上關鍵字，投什麼職缺都用同一份 Summary</li>
          </ul>
        </section>

        {/* CTA */}
        <div className="flex justify-center gap-3 pt-2">
          <Link
            href="/resume"
            className="rounded-md border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 transition"
          >
            ← 回履歷首頁
          </Link>
          <Link
            href="/resume/experience"
            className="rounded-md bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 transition"
          >
            下一步：Work Experience →
          </Link>
        </div>
      </div>
    </main>
  )
}
