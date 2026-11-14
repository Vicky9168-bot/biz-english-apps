import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppNav } from '../site-nav'
import {
  Callout,
  IndexList,
  IndexRow,
  PageHeader,
  Pen,
  SectionTitle,
} from '../page-kit'

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
    <main className="flex-1 bg-paper text-ink min-h-screen">
      <AppNav />

      <div className="mx-auto max-w-4xl px-6 py-10">
        <PageHeader
          title="英文履歷"
          subtitle="英文履歷是給公司 HR 和聘用主管看的 — 他們只有 8 秒抓眼球。三大主體：Summary、Work Experience、Cover Letter，把「做過什麼」改寫成「影響是什麼」，用對動詞、加對數據。"
        />

        {/* 寫履歷前 — 讀懂 JD */}
        <section className="mb-12">
          <SectionTitle title="先從 Job Description 抓對關鍵字" hint="寫履歷之前" />
          <p className="mb-6 max-w-2xl text-sm leading-relaxed text-ink/70">
            好的 JD 會用完整句子交代 Summary、Responsibilities、Qualifications，說清楚職缺要用什麼能力達到什麼目標。壞的 JD 只列短 bullet、範圍模糊 — 這種可以直接跳過。
          </p>

          <div className="mb-6 grid gap-x-10 gap-y-6 sm:grid-cols-2">
            <div>
              <h3 className="mb-2 text-base font-semibold">4 個抓關鍵字的原則</h3>
              <ul className="border-t border-ink/15">
                {JD_KEYWORD_CRITERIA.map((c) => (
                  <li key={c.criterion} className="border-b border-ink/10 py-2.5 text-sm">
                    <span className="font-semibold" translate="no">
                      {c.criterion}
                    </span>
                    <span className="block text-ink/70">{c.note}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="mb-2 text-base font-semibold">JD 常見句型解讀</h3>
              <ul className="border-t border-ink/15">
                {JD_PATTERNS.map((p) => (
                  <li key={p.pattern} className="border-b border-ink/10 py-2.5 text-sm">
                    <span className="font-semibold" translate="no">
                      {p.pattern}
                    </span>
                    <span className="block text-ink/70">{p.meaning}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <h3 className="mb-2 text-base font-semibold">AI Prompt，直接複製使用</h3>
          <pre
            className="whitespace-pre-wrap border-l-2 border-ink/25 bg-white px-4 py-3 font-mono text-xs leading-relaxed"
            translate="no"
          >
            {AI_PROMPT_TEMPLATE}
          </pre>
        </section>

        {/* 履歷黃金公式 */}
        <Callout title="履歷黃金公式：動詞 + 藉由策略 + 量化成就">
          每條 bullet 都要有這三件事 — 動詞（做什麼）、策略（怎麼做）、量化成就（成果多少）。「
          <Pen>Responsible for</Pen>」開頭的 bullet HR 一律略過。
        </Callout>

        {/* 練習類型 */}
        <section>
          <SectionTitle title="選一個練習類型" />
          <IndexList>
            {RESUME_TYPES.map((t) => {
              const isReady = t.status === 'ready' && t.slug
              return (
                <IndexRow
                  key={t.title}
                  href={isReady ? `/resume/${t.slug}` : undefined}
                  disabled={!isReady}
                  tag={String(t.order).padStart(2, '0')}
                  title={t.title}
                  translateTitle={false}
                  desc={
                    <>
                      {t.desc}
                      <span className="mt-2 block text-ink/65" translate="no">
                        {t.frameworks.join(' · ')}
                      </span>
                      <span className="mt-1 block text-ink/65">
                        例：{t.sampleTask}
                      </span>
                    </>
                  }
                  aside={isReady ? undefined : '即將上線'}
                />
              )
            })}
          </IndexList>
        </section>
      </div>
    </main>
  )
}
