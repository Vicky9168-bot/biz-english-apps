import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppNav } from '../site-nav'

type ResumeType = {
  slug: string | null
  order: number
  title: string
  desc: string
  frameworks: string[]
  sampleTask: string
  status: 'ready' | 'coming'
}

const RESUME_TYPES: ResumeType[] = [
  {
    slug: 'summary',
    order: 1,
    title: 'Professional Summary',
    desc: '履歷最上方 3 句自我簡介，用固定公式講清楚你是誰、做過什麼最亮眼、還會什麼',
    frameworks: ['3-sentence formula', 'Role + Years + Impact', 'Keyword-rich'],
    sampleTask:
      '幫「行銷 5 年、擅長 CRM 自動化」的你寫 3 句 Summary 開頭',
    status: 'ready',
  },
  {
    slug: 'experience',
    order: 2,
    title: 'Work Experience',
    desc: '動詞 + 藉由策略 + 量化成就的三段式 bullet，HR 掃 6 秒就記住你',
    frameworks: ['V + Strategy + Result', 'Action verb table', 'STAR rewrite'],
    sampleTask:
      '把「負責帶團隊」改成「Led a 5-person team to launch X, driving 30% revenue growth」',
    status: 'ready',
  },
  {
    slug: 'cover-letter',
    order: 3,
    title: 'Cover Letter',
    desc: '300 字內講「為什麼是你、為什麼是這家公司」，附完整模板 + 兩種結尾',
    frameworks: ['Opening template', '4 useful patterns', '2 closing styles'],
    sampleTask: '寫給一家你嚮往的 SaaS 公司 PM 職位，30 秒吸引 HR 讀下去',
    status: 'ready',
  },
  {
    slug: 'health-check',
    order: 4,
    title: 'Resume Health Check',
    desc: '貼上 JD 和你目前的英文履歷，AI 幫你打分、抓缺的關鍵字、改寫 3–5 條 bullet',
    frameworks: ['Match score', 'Keyword gap', 'AI bullet rewrite'],
    sampleTask:
      '把 LinkedIn 上想投的 JD 貼進來，看你的履歷缺什麼、哪幾條 bullet 該重寫',
    status: 'ready',
  },
]

const JD_KEYWORD_CRITERIA: Array<{ criterion: string; note: string }> = [
  { criterion: 'Repetitive', note: '在 JD 裡重複出現的字' },
  { criterion: 'Form the basis of the role', note: '動詞或核心工作內容' },
  { criterion: 'Contribute the results / sales', note: '要達到什麼成效' },
  {
    criterion: 'Technical over Soft',
    note: '硬實力優先（工具、方法論），軟實力當補充',
  },
]

const JD_PATTERNS: Array<{ pattern: string; meaning: string }> = [
  {
    pattern: 'V ... to V',
    meaning: '做什麼事、達到什麼成效',
  },
  {
    pattern: 'V ... that ...',
    meaning: 'that 後面接的就是成效',
  },
  {
    pattern: 'by / with ...',
    meaning: '要用什麼硬實力達成',
  },
]

const AI_PROMPT_TEMPLATE = `請幫我從下面這則 Job Description 抓出關鍵字，並依 4 個維度分類：
1. Repetitive（重複出現的字）
2. Form the basis of the role（動詞 / 核心工作內容）
3. Contribute results / sales（要達成的成效）
4. Technical vs Soft skills（硬實力優先）

Job Description：
[貼上 JD 全文]`

export default async function ResumeHome() {
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
            英文履歷
          </h1>
          <p className="text-slate-600 mt-2 max-w-2xl">
            英文履歷是給公司 HR 和聘用主管看的 — 他們只有 8 秒抓眼球。三大主體：Summary、Work Experience、Cover Letter，把「做過什麼」改寫成「影響是什麼」，用對動詞、加對數據。
          </p>
        </header>

        {/* 寫履歷前 — 讀懂 JD */}
        <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-slate-900 text-white">
              STEP 0
            </span>
            <span className="text-xs font-medium tracking-wide uppercase text-slate-500">
              寫履歷之前 · 讀懂 JD
            </span>
          </div>
          <h2 className="text-lg font-semibold text-slate-900 mb-3">
            先從 Job Description 抓對關鍵字
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed mb-5">
            好的 JD 會用完整句子交代 Summary、Responsibilities、Qualifications，說清楚職缺要用什麼能力達到什麼目標。壞的 JD 只列短 bullet、範圍模糊 — 這種可以直接跳過。
          </p>

          <div className="grid gap-4 sm:grid-cols-2 mb-5">
            <div>
              <div className="text-xs font-medium text-slate-700 uppercase tracking-wide mb-2">
                4 個抓關鍵字的原則
              </div>
              <ul className="space-y-1.5 text-sm text-slate-700">
                {JD_KEYWORD_CRITERIA.map((c) => (
                  <li key={c.criterion}>
                    <span
                      className="text-xs font-mono font-semibold text-slate-900"
                      translate="no"
                    >
                      {c.criterion}
                    </span>
                    <span className="text-xs text-slate-500 ml-2">
                      · {c.note}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="text-xs font-medium text-slate-700 uppercase tracking-wide mb-2">
                JD 常見句型解讀
              </div>
              <ul className="space-y-1.5 text-sm text-slate-700">
                {JD_PATTERNS.map((p) => (
                  <li key={p.pattern}>
                    <span
                      className="text-xs font-mono font-semibold text-slate-900"
                      translate="no"
                    >
                      {p.pattern}
                    </span>
                    <span className="text-xs text-slate-500 ml-2">
                      · {p.meaning}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="text-xs font-medium text-slate-700 uppercase tracking-wide mb-2">
              AI Prompt · 直接複製使用
            </div>
            <pre
              className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap font-mono"
              translate="no"
            >
              {AI_PROMPT_TEMPLATE}
            </pre>
          </div>
        </section>

        {/* 履歷黃金公式 */}
        <section className="mb-10 rounded-xl border border-slate-900 bg-slate-900 p-6 text-white">
          <div className="text-xs font-medium tracking-wide uppercase text-slate-400 mb-2">
            履歷黃金公式
          </div>
          <h2 className="text-lg font-semibold mb-3">
            動詞 + 藉由策略 + 量化成就
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            每條 bullet 都要有這三件事 — 動詞（做什麼）、策略（怎麼做）、量化成就（成果多少）。「Responsible for」開頭的 bullet HR 一律略過。
          </p>
        </section>

        {/* 練習類型 */}
        <div className="text-xs font-medium tracking-wide uppercase text-slate-500 mb-3">
          選一個練習類型
        </div>
        <ul className="grid gap-4 sm:grid-cols-2">
          {RESUME_TYPES.map((t) => {
            const isReady = t.status === 'ready' && t.slug
            const inner = (
              <div className="flex flex-col h-full rounded-xl border border-slate-200 bg-white p-5 relative motion-safe:transition hover:border-slate-400 hover:shadow-sm">
                {!isReady && (
                  <span className="absolute top-4 right-4 text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                    即將上線
                  </span>
                )}
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-900 text-white">
                    {String(t.order).padStart(2, '0')}
                  </span>
                  <h3
                    className="text-base font-semibold text-slate-900"
                    translate="no"
                  >
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
                      translate="no"
                    >
                      {f}
                    </span>
                  ))}
                </div>
                <div className="text-xs text-slate-500 border-t border-slate-100 pt-3 mt-auto">
                  <span className="text-slate-400">例：</span>
                  {t.sampleTask}
                </div>
              </div>
            )
            return (
              <li key={t.title} className="h-full">
                {isReady ? (
                  <Link
                    href={`/resume/${t.slug}`}
                    className="block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 rounded-xl"
                  >
                    {inner}
                  </Link>
                ) : (
                  inner
                )}
              </li>
            )
          })}
        </ul>
      </div>
    </main>
  )
}
