import Link from 'next/link'
import { notFound } from 'next/navigation'
import { AppNav } from '../../../site-nav'
import { IndexList, IndexRow, PageHeader, SectionTitle } from '@/app/page-kit'

type FrameworkKey = 'STAR' | 'PREP' | 'SCQA' | 'PYRAMID'

type LetterBreakdown = { letter: string; label: string; desc: string }
type Example = {
  scenario: string
  annotated: Array<{ text: string; tag: string }>
}

type FrameworkContent = {
  title: string
  subtitle: string
  overview: string
  letters: LetterBreakdown[]
  whenUse: string[]
  whenNotUse: string[]
  examples: [Example, Example]
}

const CONTENT: Record<FrameworkKey, FrameworkContent> = {
  STAR: {
    title: 'STAR',
    subtitle: '過去經驗 · 行為題（Situation-Task-Action-Result）',
    overview:
      'STAR 是回答「行為題」的黃金結構。當面試官問「Tell me about a time...」或主管請你回顧一個案例時，STAR 幫你從情境講到結果、不東拉西扯、也不會漏掉關鍵環節。核心精神是：給對方一個有時間軸、有貢獻、有量化結果的完整故事。',
    letters: [
      { letter: 'S', label: 'Situation', desc: '當時背景 — 什麼時間、什麼專案、你什麼角色（1-2 句）' },
      { letter: 'T', label: 'Task', desc: '你要達成的目標 — 具體、有數字最好' },
      { letter: 'A', label: 'Action', desc: '你做了哪 2-3 個具體行動 — 用「我」不是「我們」' },
      { letter: 'R', label: 'Result', desc: '結果數字 + 你學到什麼（帶點自省）' },
    ],
    whenUse: [
      '面試行為題（"Tell me about a time..."）',
      '主管請你回顧一個 case',
      '跨部門說明你的具體貢獻',
    ],
    whenNotUse: [
      '給意見 → 用 PREP',
      '複雜提案 → 用 SCQA',
      '快速 status update → 用 Pyramid',
    ],
    examples: [
      {
        scenario: '面試官："Tell me about a time you dealt with a tight deadline."',
        annotated: [
          {
            text: "Last quarter, our team was launching a new pricing page and marketing wanted it live in 2 weeks instead of the usual 6.",
            tag: 'S',
          },
          {
            text: "I was the lead engineer and had to deliver it without breaking the checkout flow.",
            tag: 'T',
          },
          {
            text: "I broke the work into three parallel streams, paired with a designer to lock scope on day one, and set up daily 15-minute sync-ups instead of the weekly meeting.",
            tag: 'A',
          },
          {
            text: "We shipped in 12 days, the page converted 18% better than the old one, and I learned that scope-locking early beats catching up later.",
            tag: 'R',
          },
        ],
      },
      {
        scenario: '主管：「這季 SMB 留存下滑，你怎麼看？」',
        annotated: [
          {
            text: "Retention dropped from 92% to 87% this quarter, mostly on the SMB segment.",
            tag: 'S',
          },
          {
            text: "I owned the SMB churn analysis and my target was to identify the top 2 causes by end of month.",
            tag: 'T',
          },
          {
            text: "I ran interviews with 15 churned accounts, cross-checked support tickets, and found onboarding friction was the #1 driver — not pricing like we assumed.",
            tag: 'A',
          },
          {
            text: "We shipped a guided onboarding flow last week — early signal is +11 points in week-1 activation.",
            tag: 'R',
          },
        ],
      },
    ],
  },

  PREP: {
    title: 'PREP',
    subtitle: '表達意見 · 立場（Point-Reason-Example-Point）',
    overview:
      'PREP 是給意見、表態立場的簡潔結構。當有人問你「你覺得呢？」「你支持嗎？」時，PREP 讓你 30-60 秒內講清楚立場，不會變成長篇大論、也不會立場模糊。核心精神：先亮牌 → 講理由 → 舉例 → 收尾。',
    letters: [
      { letter: 'P', label: 'Point', desc: '一句話立場 — 支持 / 反對 / 有條件支持' },
      { letter: 'R', label: 'Reason', desc: '1-2 個核心理由 — 為什麼你這樣想' },
      { letter: 'E', label: 'Example', desc: '具體例子或數據 — 讓對方相信，不是空談' },
      { letter: 'P', label: 'Point', desc: '重申立場 + 下一步建議（收尾強化）' },
    ],
    whenUse: [
      '主管徵詢意見（"What do you think?"）',
      '會議中被 cue 表態',
      '面試觀念題 / 開放題',
    ],
    whenNotUse: [
      '講過去經驗 → 用 STAR',
      '複雜提案給高層 → 用 SCQA',
      '30 秒 exec update → 用 Pyramid',
    ],
    examples: [
      {
        scenario: '主管：「要不要把 support team 從 3 人擴到 5 人？」',
        annotated: [
          {
            text: "Yes, I think we should hire two more support reps, and soon.",
            tag: 'P',
          },
          {
            text: "The main reason is our first-response time has slipped from 2 hours to 9 hours over the last quarter, and CSAT is starting to follow.",
            tag: 'R',
          },
          {
            text: "For example, last month we lost two enterprise renewals in the exit interviews specifically citing 'slow support.'",
            tag: 'E',
          },
          {
            text: "So — hire two by end of Q3, and re-evaluate against response-time SLA in 60 days.",
            tag: 'P',
          },
        ],
      },
      {
        scenario: '面試官：「你覺得 remote work 對新進工程師是好的嗎？」',
        annotated: [
          {
            text: "For fresh grads, no — their first 6 months should be in-office or heavily hybrid.",
            tag: 'P',
          },
          {
            text: "Early-career engineers learn most from ambient exposure — overhearing debugging sessions, catching side conversations after standups — and that's hard to replicate on Slack.",
            tag: 'R',
          },
          {
            text: "In my last team, remote juniors took roughly twice as long to reach independent shipping compared to in-office ones.",
            tag: 'E',
          },
          {
            text: "So my take: hybrid-first for the first 6 months, then let them choose.",
            tag: 'P',
          },
        ],
      },
    ],
  },

  SCQA: {
    title: 'SCQA',
    subtitle: '說服 · 提案（Situation-Complication-Question-Answer）',
    overview:
      'SCQA 由 Barbara Minto 提出，是說服型提案的鋪陳結構。它先建立共識 → 點出張力 → 讓對方自己想到問題 → 才給答案，適合對方本來不同意、或需要背景鋪陳的場景。跟 Pyramid 剛好相反 — Pyramid 答案先行，SCQA 答案殿後。',
    letters: [
      { letter: 'S', label: 'Situation', desc: '大家都同意的現況 — 建立共識起點' },
      { letter: 'C', label: 'Complication', desc: '但發生了什麼 — 點出張力 / 痛點' },
      { letter: 'Q', label: 'Question', desc: '那該怎麼辦（可明說可隱含）' },
      { letter: 'A', label: 'Answer', desc: '你的解方 — 為什麼是這個' },
    ],
    whenUse: [
      '提案改變現狀',
      '說服本來懷疑的對方',
      'Pitch 給不熟背景的高層',
    ],
    whenNotUse: [
      '對方已同意問題，只想聽答案 → 用 Pyramid',
      '被問過去經驗 → 用 STAR',
      '單純表態意見 → 用 PREP',
    ],
    examples: [
      {
        scenario: '提案：「把 QA team 併入 dev pods」',
        annotated: [
          {
            text: "Today we have a dedicated QA team of 6, sitting between eng and release.",
            tag: 'S',
          },
          {
            text: "But over the last two quarters, our release cycle stretched from 2 weeks to 5, and 70% of the delay is at the QA handoff — not because QA is slow, but because context gets re-explained every time.",
            tag: 'C',
          },
          {
            text: "So how do we cut release cycles without dropping quality?",
            tag: 'Q',
          },
          {
            text: "I propose embedding 2 QA engineers into each of the 3 dev pods, keeping 0 on a central team, and shifting QA from gatekeeper to in-team quality coach.",
            tag: 'A',
          },
        ],
      },
      {
        scenario: '跟 CFO pitch：「導入 AI 客服工具」',
        annotated: [
          {
            text: "Right now our support team handles 4,000 tickets a month, and 60% of them are the same top-10 questions we've seen for two years.",
            tag: 'S',
          },
          {
            text: "But ticket volume is growing 15% quarter-over-quarter, and we've hit the point where we either hire 3 more reps or start losing SLAs.",
            tag: 'C',
          },
          {
            text: "So the real question is: how do we scale support without linear headcount growth?",
            tag: 'Q',
          },
          {
            text: "I'm proposing an AI first-line responder for the top-10 repetitive queries. We piloted it in beta — it resolves 45% without a human. Net cost is 1/6 of hiring three reps.",
            tag: 'A',
          },
        ],
      },
    ],
  },

  PYRAMID: {
    title: 'PYRAMID',
    subtitle: 'Exec 溝通 · 答案先行（Answer → 3 支撐 → 佐證，McKinsey）',
    overview:
      'Pyramid Principle 由 Barbara Minto 提出，是 McKinsey 對高層溝通的黃金法則：結論先講、再給 3 個支撐點、細節放最後。對方時間少、只想聽重點時最好用。跟 SCQA 剛好相反 — SCQA 適合對方需要被說服時的鋪陳，Pyramid 適合對方已授權你、只要 headline。',
    letters: [
      { letter: 'A', label: 'Answer', desc: '一句話結論（對方只記這句也 OK）' },
      { letter: '3', label: '3 支撐', desc: '3 個平行的理由或面向（MECE — 不重疊、不遺漏）' },
      { letter: '·', label: '佐證', desc: '每個支撐點下面配 1 個數字 / 例子 / 事實' },
    ],
    whenUse: [
      'Exec update / 週報開場',
      'CEO 電梯裡的 30 秒',
      '給決策層的 recommendation',
    ],
    whenNotUse: [
      '對方需要被說服 → 用 SCQA',
      '講一個故事 → 用 STAR',
      '單純表態 → 用 PREP',
    ],
    examples: [
      {
        scenario: 'CEO：「Q3 產品線狀況如何？」',
        annotated: [
          {
            text: "Overall Q3 is on track — we'll hit the revenue target with about 3% headroom.",
            tag: 'Answer',
          },
          {
            text: "Three things worth flagging:",
            tag: '3',
          },
          {
            text: "First, enterprise deals closed 22% above target, driven by the new SOC 2 cert.",
            tag: '·',
          },
          {
            text: "Second, SMB is trailing by 8%, but Q4 pipeline is already 40% above the same time last year.",
            tag: '·',
          },
          {
            text: "Third, we shipped 4 of the 5 committed features — the delayed one is analytics, moving to early Q4.",
            tag: '·',
          },
        ],
      },
      {
        scenario: '週會開場：「本週最重要一件事」',
        annotated: [
          {
            text: "The one thing to know: we're pausing the checkout redesign to fix the abandonment spike.",
            tag: 'Answer',
          },
          {
            text: "Three reasons this is the right call:",
            tag: '3',
          },
          {
            text: "One, cart abandonment jumped from 68% to 74% after the last release — costing about $40K a week.",
            tag: '·',
          },
          {
            text: "Two, we've narrowed the cause to the new address form and can ship a fix in 3 days.",
            tag: '·',
          },
          {
            text: "Three, the redesign timeline can absorb a week of slip without missing launch.",
            tag: '·',
          },
        ],
      },
    ],
  },
}

export default async function FrameworkDetailPage({
  params,
}: {
  params: Promise<{ fw: string }>
}) {
  const { fw } = await params
  const key = fw.toUpperCase() as FrameworkKey
  const content = CONTENT[key]
  if (!content) notFound()

  return (
    <main className="flex-1 bg-paper min-h-screen">
      <AppNav backHref="/speaking" />

      <div className="mx-auto max-w-3xl px-6 py-10">
        <PageHeader
          title={content.title}
          subtitle={
            <>
              <span className="font-semibold text-ink">{content.subtitle}</span>
              <span className="mt-3 block">{content.overview}</span>
            </>
          }
        />

        {/* 字母拆解：框架本身就是順序 */}
        <section className="mb-12">
          <SectionTitle title="每個字母代表什麼" />
          <IndexList>
            {content.letters.map((l) => (
              <IndexRow
                key={`${l.letter}-${l.label}`}
                tag={l.letter}
                title={l.label}
                translateTitle={false}
                desc={l.desc}
              />
            ))}
          </IndexList>
        </section>

        {/* 什麼時候用 / 不用 */}
        <section className="mb-12 grid gap-8 sm:grid-cols-2">
          <div className="border-l-4 border-mark pl-5">
            <h2 className="mb-2 text-lg font-bold">什麼時候用</h2>
            <ul className="space-y-1.5 text-sm leading-relaxed">
              {content.whenUse.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>
          <div className="border-l-4 border-pen pl-5">
            <h2 className="mb-2 text-lg font-bold">什麼時候不用</h2>
            <ul className="space-y-1.5 text-sm leading-relaxed">
              {content.whenNotUse.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>
        </section>

        {/* 範例 */}
        <section className="mb-12">
          <SectionTitle title="兩個範例，逐段拆解" />
          <p className="mb-6 text-sm text-ink/65">
            左側標籤對應框架的每個階段，幫你看清楚哪一段在做什麼。
          </p>
          <div className="space-y-10">
            {content.examples.map((ex, i) => (
              <div key={i}>
                <h3 className="mb-3 text-base font-semibold">
                  <span className="mr-3 font-display text-ink/65">
                    範例 {i + 1}
                  </span>
                  {ex.scenario}
                </h3>
                <ol className="border-t border-ink/15">
                  {ex.annotated.map((seg, j) => (
                    <li
                      key={j}
                      className="grid grid-cols-[6rem_1fr] gap-x-4 border-b border-ink/10 py-3 sm:grid-cols-[8rem_1fr]"
                    >
                      <span className="font-display text-sm font-semibold text-ink/65">
                        {seg.tag}
                      </span>
                      <p className="text-sm leading-relaxed" translate="no">
                        {seg.text}
                      </p>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </section>

        <Link
          href="/speaking"
          className="inline-block rounded-md bg-ink px-5 py-2.5 text-sm font-semibold text-paper hover:bg-ink/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40 focus-visible:ring-offset-2 transition"
        >
          來練 {content.title} 題目
        </Link>
      </div>
    </main>
  )
}
