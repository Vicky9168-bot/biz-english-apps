import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppNav } from '../../site-nav'

const ACTION_VERBS: Array<{
  tag: string
  purpose: string
  verbs: string[]
}> = [
  {
    tag: 'Envision',
    purpose: '開發新專案、創新案件、達成新目標',
    verbs: ['Develop', 'Initiate', 'Create', 'Facilitate', 'Launch', 'Pioneer'],
  },
  {
    tag: 'Partner',
    purpose: '厲害廠商合作、拉資源、拿獎',
    verbs: ['Brought in Partners', 'Secured Funding', 'Recruited Resources'],
  },
  {
    tag: 'Lead',
    purpose: '管理、協助團隊',
    verbs: ['Led', 'Oversaw', 'Regulated', 'Supported', 'Supervised'],
  },
  {
    tag: 'Maintain',
    purpose: '維持基本內容、研究、支援',
    verbs: ['Maintained', 'Researched', 'Analyzed', 'Documented'],
  },
  {
    tag: 'Result',
    purpose: '賺錢、省成本、增加效率',
    verbs: [
      'Saved Time / Money',
      'Increased Efficiency / Sales / Revenue',
      'Improved',
      'Reduced',
    ],
  },
]

const STRATEGY_PREPOSITIONS: Array<{ prep: string; use: string }> = [
  { prep: 'By + Ving', use: '藉由做什麼事情' },
  { prep: 'Through', use: '透過某種方法或流程' },
  { prep: 'According to', use: '依據某個標準或分析' },
  { prep: 'Based on', use: '基於某項研究、數據' },
  { prep: 'Via', use: '透過某工具、管道' },
  { prep: 'With', use: '搭配資源、工具、團隊' },
]

const RESULT_CONNECTORS: Array<{ conn: string; use: string }> = [
  { conn: 'to V', use: '為了達成目標' },
  { conn: 'Ving', use: '接續產生的成效' },
  { conn: 'which resulted in', use: '導致什麼結果（含數據）' },
  { conn: 'leading to', use: '引發什麼後續影響' },
  { conn: 'from ... to ...', use: '前後對比變化' },
]

const QUANTIFY_TYPES: Array<{
  type: string
  desc: string
  examples: string
}> = [
  {
    type: 'Numbers',
    desc: '單位數量、案件數、客戶數',
    examples: '15 clients onboarded / 3 new stores opened',
  },
  {
    type: 'Dollars',
    desc: '營收、獲利、節省金額',
    examples: 'generated $2M revenue / saved $50K annually',
  },
  {
    type: 'Percentage',
    desc: '增加率、下降率、比重',
    examples: 'raised purchasing rate by 35% / reduced churn by 10%',
  },
  {
    type: 'Time Period',
    desc: '每月產出、縮短時間',
    examples: 'closed project within 1 month vs original 2 months',
  },
]

type Segment = { text: string; added?: boolean }
type Addition = { tag: string; content: string }

type Rewrite = {
  method: string
  before: string
  afterSegments: Segment[]
  additions: Addition[]
}

const REWRITES: Rewrite[] = [
  {
    method: 'Situation + Action + Result',
    before:
      'In 2015, led the 4-people team to open 2 new stores in Singapore, increasing total revenue by 130%.',
    afterSegments: [
      { text: 'In 2015, ' },
      { text: 'the luxury market hit the bottom. ', added: true },
      { text: 'Led a 4-people team to' },
      {
        text: ', based on market research, implement a new strategy targeting the youth generation,',
        added: true,
      },
      { text: ' and opened 2 new stores ' },
      { text: 'in XX area of ', added: true },
      { text: 'Singapore, increasing total revenue by 130%.' },
    ],
    additions: [
      { tag: 'Situation', content: '補上市場低迷背景，數據才有故事' },
      { tag: 'Strategy', content: '鎖定年輕客群，說明你的決策邏輯' },
      { tag: 'Specificity', content: '精準到區域，證明執行細節' },
    ],
  },
  {
    method: 'Action + Result',
    before:
      'Closely collaborated and communicated with cross functional teams to achieve better communication.',
    afterSegments: [
      { text: 'Collaborated with ' },
      { text: 'PM and Sales ', added: true },
      { text: 'to ' },
      {
        text: 'consolidate the information twice a week and well-documented all reports and meetings ',
        added: true,
      },
      { text: 'to achieve efficient communication' },
      {
        text: ', resulting in closing an original 2-month project within 1 month.',
        added: true,
      },
    ],
    additions: [
      { tag: 'Who', content: '具體合作對象：PM 與 Sales' },
      { tag: 'How', content: '每週兩次彙整、書面文件，方法可驗證' },
      { tag: 'Result', content: '2 個月專案 → 1 個月完成，用時間對比證明價值' },
    ],
  },
]

export default async function ResumeExperiencePage() {
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
    <main className="flex-1 bg-paper min-h-screen">
      <AppNav backHref="/resume" />

      <div className="mx-auto max-w-3xl px-6 py-10 space-y-6">
        <header className="rounded-lg border border-ink/15 bg-white p-6">
          <h1 className="text-2xl font-bold text-ink text-pretty mb-3">
            工作經驗怎麼寫，才會被 HR 記住
          </h1>
          <p className="text-ink/80 leading-relaxed">
            寫工作經驗只有一個公式：<span className="font-semibold">動詞 + 藉由策略 + 量化成就</span>。每一條 bullet 都要能明確看到你做了什麼行動、用什麼方法、拿到什麼結果。
          </p>
        </header>

        {/* 核心公式 */}
        <section className="rounded-lg border border-ink bg-ink p-6 text-white">
          <div className="text-xs font-mono uppercase tracking-wide text-ink/60 mb-2">
            The Formula
          </div>
          <h2 className="text-lg font-semibold mb-4">
            動詞 + 策略 + 量化成就
          </h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg bg-ink p-4">
              <div className="text-[10px] font-mono uppercase text-mark mb-1">
                Verb
              </div>
              <div className="text-sm font-semibold mb-1">動詞</div>
              <p className="text-xs text-paper/70 leading-relaxed">
                Powerful action verb 開頭，分「Routine」與「Creative」兩類。
              </p>
            </div>
            <div className="rounded-lg bg-ink p-4">
              <div className="text-[10px] font-mono uppercase text-mark mb-1">
                Strategy
              </div>
              <div className="text-sm font-semibold mb-1">策略</div>
              <p className="text-xs text-paper/70 leading-relaxed">
                by Ving / through / based on 說明你的方法或途徑。
              </p>
            </div>
            <div className="rounded-lg bg-ink p-4">
              <div className="text-[10px] font-mono uppercase text-mark mb-1">
                Result
              </div>
              <div className="text-sm font-semibold mb-1">量化成就</div>
              <p className="text-xs text-paper/70 leading-relaxed">
                to V / which resulted in / from...to... 帶入數字。
              </p>
            </div>
          </div>
        </section>

        {/* Action verbs 分類表 */}
        <section className="rounded-lg border border-ink/15 bg-white p-6">
          <h2 className="text-lg font-semibold text-ink mb-1">
            Powerful Action Verbs
          </h2>
          <p className="text-xs text-ink/65 mb-4">
            依你當時做的事情類型挑動詞，避開「Responsible for」「Handled」這種被 HR 秒略過的字。
          </p>
          <ul className="space-y-3">
            {ACTION_VERBS.map((row) => (
              <li
                key={row.tag}
                className="rounded-lg border border-ink/15 bg-paper p-4"
              >
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded border border-ink/25 bg-white text-ink/80">
                    {row.tag}
                  </span>
                  <span className="text-xs text-ink/70">{row.purpose}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {row.verbs.map((v) => (
                    <span
                      key={v}
                      className="text-xs font-mono px-2 py-0.5 rounded bg-white border border-ink/15 text-ink/80"
                      translate="no"
                    >
                      {v}
                    </span>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* 策略介系詞 + 成果連接詞 */}
        <section className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-mark bg-mark/25 p-5">
            <div className="text-xs font-medium text-ink uppercase tracking-wide mb-2">
              策略介系詞
            </div>
            <p className="text-[11px] text-ink/70 mb-3">
              接在動詞後面，說明你怎麼做到的
            </p>
            <ul className="space-y-2 text-sm text-ink">
              {STRATEGY_PREPOSITIONS.map((p) => (
                <li key={p.prep} className="flex items-baseline gap-2">
                  <span
                    className="text-xs font-mono font-semibold text-ink shrink-0 w-20"
                    translate="no"
                  >
                    {p.prep}
                  </span>
                  <span className="text-xs text-ink/80">{p.use}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-lg border border-mark bg-mark/25 p-5">
            <div className="text-xs font-medium text-ink uppercase tracking-wide mb-2">
              成果連接詞
            </div>
            <p className="text-[11px] text-ink/70 mb-3">
              把結果接上去，讓數據不孤單
            </p>
            <ul className="space-y-2 text-sm text-ink">
              {RESULT_CONNECTORS.map((c) => (
                <li key={c.conn} className="flex items-baseline gap-2">
                  <span
                    className="text-xs font-mono font-semibold text-ink shrink-0 w-32"
                    translate="no"
                  >
                    {c.conn}
                  </span>
                  <span className="text-xs text-ink/80">{c.use}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 量化成就四種類型 */}
        <section className="rounded-lg border border-ink/15 bg-white p-6">
          <h2 className="text-lg font-semibold text-ink mb-1">
            量化成就的 4 種類型
          </h2>
          <p className="text-xs text-ink/65 mb-4">
            數字最有說服力，但也要合理 — 想清楚這個數字是要證明你什麼特質。
          </p>
          <ul className="grid gap-3 sm:grid-cols-2">
            {QUANTIFY_TYPES.map((q) => (
              <li
                key={q.type}
                className="rounded-lg border border-ink/15 bg-paper p-4"
              >
                <div
                  className="text-sm font-semibold text-ink mb-1"
                  translate="no"
                >
                  {q.type}
                </div>
                <p className="text-xs text-ink/70 mb-2">{q.desc}</p>
                <p
                  className="text-xs text-ink/65 italic border-l-2 border-ink/25 pl-2"
                  translate="no"
                >
                  {q.examples}
                </p>
              </li>
            ))}
          </ul>
        </section>

        {/* 修改前後 */}
        <section className="rounded-lg border border-ink/15 bg-white p-6">
          <h2 className="text-lg font-semibold text-ink mb-1">
            修改前 vs 修改後
          </h2>
          <p className="text-xs text-ink/65 mb-6">
            綠底標示是新增的部分 — 看清楚加了什麼，說服力差在哪。
          </p>
          <div className="space-y-8">
            {REWRITES.map((r) => (
              <article
                key={r.method}
                className="rounded-lg border border-ink/15 bg-paper overflow-hidden"
              >
                {/* Method header */}
                <div className="border-b border-ink/15 bg-white px-5 py-3 flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-ink text-white">
                    METHOD
                  </span>
                  <span
                    className="text-sm font-semibold text-ink"
                    translate="no"
                  >
                    {r.method}
                  </span>
                </div>

                <div className="p-5 space-y-3">
                  {/* Before */}
                  <div className="rounded-md border border-pen/30 bg-pen/4">
                    <div className="flex items-center gap-2 px-3 pt-2.5">
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-pen/15 text-pen uppercase">
                        Before
                      </span>
                      <span className="text-[11px] text-pen/80">
                        泛泛而談、看不到策略
                      </span>
                    </div>
                    <p
                      className="text-sm text-ink leading-relaxed px-3 py-2.5"
                      translate="no"
                    >
                      {r.before}
                    </p>
                  </div>

                  {/* Arrow */}
                  <div
                    className="flex items-center justify-center gap-2 text-ink/60"
                    aria-hidden="true"
                  >
                    <span className="h-px flex-1 bg-ink/10" />
                    <span className="text-xs font-mono">加上細節</span>
                    <span className="text-lg leading-none">↓</span>
                    <span className="h-px flex-1 bg-ink/10" />
                  </div>

                  {/* After (with highlighted additions) */}
                  <div className="rounded-md border border-mark bg-mark/10">
                    <div className="flex items-center gap-2 px-3 pt-2.5">
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-mark/40 text-ink uppercase">
                        After
                      </span>
                      <span className="text-[11px] text-ink/80">
                        看得到情境、策略、成果
                      </span>
                    </div>
                    <p
                      className="text-sm text-ink leading-relaxed px-3 py-2.5"
                      translate="no"
                    >
                      {r.afterSegments.map((seg, i) =>
                        seg.added ? (
                          <mark
                            key={i}
                            className="bg-mark/40 text-ink rounded px-0.5 py-px"
                          >
                            {seg.text}
                          </mark>
                        ) : (
                          <span key={i}>{seg.text}</span>
                        )
                      )}
                    </p>
                  </div>

                  {/* Additions breakdown */}
                  <div className="rounded-md bg-white border border-ink/15 p-3 mt-2">
                    <div className="text-[10px] font-mono font-semibold text-ink/65 uppercase tracking-wide mb-2">
                      加了什麼 · 為什麼變好
                    </div>
                    <ul className="space-y-1.5">
                      {r.additions.map((a) => (
                        <li key={a.tag} className="flex items-baseline gap-2">
                          <span
                            className="shrink-0 text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded border border-mark bg-mark/25 text-ink"
                            translate="no"
                          >
                            + {a.tag}
                          </span>
                          <span className="text-xs text-ink/80 leading-relaxed">
                            {a.content}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* 檢查清單 */}
        <section className="rounded-lg border border-ink/15 bg-white p-6">
          <h2 className="text-lg font-semibold text-ink mb-3">
            最後檢查清單
          </h2>
          <ul className="space-y-2 text-sm text-ink/80">
            <li>
              <span className="text-ink font-mono mr-2">✓</span>
              每條 bullet 都有 Action + Result，看得到你做了什麼、成果如何
            </li>
            <li>
              <span className="text-ink font-mono mr-2">✓</span>
              遇到挑戰或難題，補上 Situation + Task 表達解題邏輯
            </li>
            <li>
              <span className="text-ink font-mono mr-2">✓</span>
              行政類經驗聚焦 Result — 做了什麼變動，讓成本／時間變好
            </li>
            <li>
              <span className="text-ink font-mono mr-2">✓</span>
              數字合理，且說得出這個數字要證明你什麼能力
            </li>
            <li>
              <span className="text-ink font-mono mr-2">✓</span>
              動詞不重複，Routine 與 Creative 兩類都出現
            </li>
          </ul>
        </section>

        {/* CTA */}
        <div className="flex justify-center gap-3 pt-2">
          <Link
            href="/resume/summary"
            className="rounded-md border border-ink/25 bg-white px-5 py-2.5 text-sm font-semibold text-ink/80 hover:bg-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40 transition"
          >
            ← 看 Summary 寫法
          </Link>
          <Link
            href="/resume/cover-letter"
            className="rounded-md bg-ink px-5 py-2.5 text-sm font-semibold text-white hover:bg-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40 transition"
          >
            下一步：Cover Letter →
          </Link>
        </div>
      </div>
    </main>
  )
}
