'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

// content = 名詞、動詞、形容詞、副詞、否定詞、疑問詞、數字
// function = 冠詞、代名詞、介係詞、助動詞、be 動詞、連接詞
type Token = { text: string; content: boolean }

const EXAMPLES: Token[][] = [
  [
    { text: 'I', content: false },
    { text: 'have', content: false },
    { text: 'to', content: false },
    { text: 'send', content: true },
    { text: 'the', content: false },
    { text: 'report', content: true },
    { text: 'to', content: false },
    { text: 'the', content: false },
    { text: 'client', content: true },
    { text: 'by', content: false },
    { text: 'Friday', content: true },
    { text: '.', content: false },
  ],
  [
    { text: 'Can', content: false },
    { text: 'you', content: false },
    { text: 'give', content: true },
    { text: 'me', content: false },
    { text: 'a', content: false },
    { text: 'quick', content: true },
    { text: 'update', content: true },
    { text: 'on', content: false },
    { text: 'the', content: false },
    { text: 'project', content: true },
    { text: '?', content: false },
  ],
  [
    { text: 'We', content: false },
    { text: 'should', content: false },
    { text: 'schedule', content: true },
    { text: 'a', content: false },
    { text: 'follow-up', content: true },
    { text: 'meeting', content: true },
    { text: 'next', content: true },
    { text: 'week', content: true },
    { text: '.', content: false },
  ],
]

// Mini-drill: 使用者要挑出所有 content words
type DrillSentence = { tokens: Token[]; hint_zh?: string }

const DRILLS: DrillSentence[] = [
  {
    tokens: [
      { text: 'The', content: false },
      { text: 'deadline', content: true },
      { text: 'for', content: false },
      { text: 'the', content: false },
      { text: 'proposal', content: true },
      { text: 'is', content: false },
      { text: 'tomorrow', content: true },
      { text: '.', content: false },
    ],
    hint_zh: '名詞和時間副詞是重點',
  },
  {
    tokens: [
      { text: 'I', content: false },
      { text: 'will', content: false },
      { text: 'follow', content: true },
      { text: 'up', content: true },
      { text: 'with', content: false },
      { text: 'the', content: false },
      { text: 'team', content: true },
      { text: 'after', content: false },
      { text: 'lunch', content: true },
      { text: '.', content: false },
    ],
    hint_zh: 'follow up 是片語動詞，兩個字都算',
  },
  {
    tokens: [
      { text: 'They', content: false },
      { text: 'are', content: false },
      { text: 'launching', content: true },
      { text: 'a', content: false },
      { text: 'new', content: true },
      { text: 'product', content: true },
      { text: 'in', content: false },
      { text: 'Q4', content: true },
      { text: '.', content: false },
    ],
    hint_zh: '形容詞 new 也是實詞',
  },
]

export function ContentWordsLesson() {
  const router = useRouter()
  const [selections, setSelections] = useState<boolean[][]>(
    DRILLS.map((d) => d.tokens.map(() => false))
  )
  const [revealed, setRevealed] = useState<boolean[]>(DRILLS.map(() => false))
  const [submitting, setSubmitting] = useState(false)

  function toggle(drillIdx: number, tokenIdx: number) {
    if (revealed[drillIdx]) return
    setSelections((prev) => {
      const next = prev.map((row) => [...row])
      next[drillIdx][tokenIdx] = !next[drillIdx][tokenIdx]
      return next
    })
  }

  function checkAnswer(drillIdx: number) {
    setRevealed((prev) => {
      const next = [...prev]
      next[drillIdx] = true
      return next
    })
  }

  function drillScore(drillIdx: number) {
    const tokens = DRILLS[drillIdx].tokens
    let correct = 0
    let total = 0
    tokens.forEach((t, i) => {
      if (t.text.match(/^[.,?!]$/)) return
      total++
      if (t.content === selections[drillIdx][i]) correct++
    })
    return { correct, total }
  }

  const allDone = revealed.every((r) => r)
  const totalCorrect = revealed
    .map((_, i) => drillScore(i))
    .reduce((sum, s) => sum + s.correct, 0)
  const totalPossible = revealed
    .map((_, i) => drillScore(i))
    .reduce((sum, s) => sum + s.total, 0)

  async function finish() {
    setSubmitting(true)
    try {
      await fetch('/api/listening/lesson/complete', { method: 'POST' })
      router.push('/listening')
    } catch (err) {
      console.error(err)
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-12">
      {/* 規則 */}
      <section>
        <h2 className="mb-3 text-2xl font-bold">規則</h2>
        <p className="mb-6 max-w-xl leading-relaxed text-ink/80">
          英文是「重音時序語言」— 母語者只會把力氣放在
          <strong className="text-ink"> 實詞（content words）</strong>{' '}
          上，其他字幾乎糊帶而過，學會只抓實詞，聽力立刻鬆一半。
        </p>
        <div className="grid gap-8 text-sm sm:grid-cols-2">
          <div className="border-l-4 border-mark pl-5">
            <h3 className="mb-2 text-base font-bold">實詞：要抓</h3>
            <ul className="space-y-1 text-ink/80">
              <li>名詞 (report, deadline)</li>
              <li>主要動詞 (send, schedule)</li>
              <li>形容詞 (new, quick)</li>
              <li>副詞 (tomorrow, quickly)</li>
              <li>否定詞 (not, never)</li>
              <li>疑問詞 (what, when, why)</li>
              <li>數字 (Q4, 5, 100)</li>
            </ul>
          </div>
          <div className="border-l-4 border-ink/25 pl-5">
            <h3 className="mb-2 text-base font-bold text-ink/70">虛詞：可放掉</h3>
            <ul className="space-y-1 text-ink/70">
              <li>冠詞 (a, an, the)</li>
              <li>代名詞 (I, you, he, it)</li>
              <li>介係詞 (of, in, on, to)</li>
              <li>助動詞 (do, does, have, will)</li>
              <li>be 動詞 (is, are, was)</li>
              <li>連接詞 (and, but, or)</li>
            </ul>
          </div>
        </div>
      </section>

      {/* 對照範例 */}
      <section>
        <h2 className="mb-3 text-2xl font-bold">對照示範</h2>
        <p className="mb-5 text-sm text-ink/70">
          <span className="hl-mark font-semibold text-ink">螢光標出 = 實詞</span>
          <span className="mx-3 text-ink/60">淺色 = 虛詞</span>
          只用標出的字就足以理解整句意思
        </p>
        <ul className="border-t border-ink/15">
          {EXAMPLES.map((tokens, i) => (
            <li key={i} className="space-y-1.5 border-b border-ink/10 py-4">
              <p className="text-lg leading-loose">
                {tokens.map((t, j) => (
                  <TokenSpan key={j} token={t} />
                ))}
              </p>
              <p className="text-sm text-ink/65">
                聽起來像：
                <span className="font-medium text-ink" translate="no">
                  {tokens
                    .filter((t) => t.content)
                    .map((t) => t.text.toUpperCase())
                    .join(' · ')}
                </span>
              </p>
            </li>
          ))}
        </ul>
      </section>

      {/* Mini-drill */}
      <section>
        <h2 className="mb-3 text-2xl font-bold">小測驗：點選你認為的實詞</h2>
        <p className="mb-5 text-sm text-ink/70">
          每題點完後按「確認」看解答，全部做完就完成這一課。選對的字被螢光筆標出，選錯的被紅筆劃掉，漏掉的字底下會有紅線。
        </p>
        <ol className="border-t border-ink/15">
          {DRILLS.map((drill, drillIdx) => {
            const score = revealed[drillIdx] ? drillScore(drillIdx) : null
            return (
              <li
                key={drillIdx}
                className="grid gap-3 border-b border-ink/15 py-6 sm:grid-cols-[4.5rem_1fr] sm:gap-x-6"
              >
                <span className="font-display text-sm font-semibold tabular-nums text-ink/65">
                  題 {drillIdx + 1}
                </span>
                <div className="space-y-3">
                  <p className="text-lg leading-[2.6]">
                    {drill.tokens.map((t, tokenIdx) => (
                      <DrillToken
                        key={tokenIdx}
                        token={t}
                        selected={selections[drillIdx][tokenIdx]}
                        revealed={revealed[drillIdx]}
                        onClick={() => toggle(drillIdx, tokenIdx)}
                      />
                    ))}
                  </p>
                  {!revealed[drillIdx] ? (
                    <button
                      onClick={() => checkAnswer(drillIdx)}
                      className="rounded-md bg-ink px-4 py-2 text-sm font-semibold text-paper hover:bg-ink/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40 focus-visible:ring-offset-2 focus-visible:ring-offset-paper transition"
                    >
                      確認答案
                    </button>
                  ) : (
                    <div
                      className="border-l-4 border-mark pl-4 text-sm"
                      aria-live="polite"
                    >
                      <p className="font-semibold">
                        {score?.correct} / {score?.total} 正確
                        {score && score.correct === score.total && (
                          <span className="ml-2 hl-mark">完美</span>
                        )}
                      </p>
                      {drill.hint_zh && (
                        <p className="mt-1 text-ink/70">{drill.hint_zh}</p>
                      )}
                    </div>
                  )}
                </div>
              </li>
            )
          })}
        </ol>
      </section>

      {/* 完成按鈕 */}
      {allDone && (
        <section className="border-l-4 border-mark pl-6 py-1" aria-live="polite">
          <p className="mb-4 max-w-xl">
            這一課答對 <span className="hl-mark font-semibold">{totalCorrect} / {totalPossible}</span>
            ，接下來聽 AI 商務對話時，用同樣的策略去抓實詞就好。
          </p>
          <button
            onClick={finish}
            disabled={submitting}
            className="rounded-md bg-ink px-6 py-3 text-sm font-semibold text-paper hover:bg-ink/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40 focus-visible:ring-offset-2 focus-visible:ring-offset-paper disabled:opacity-50 motion-safe:transition"
          >
            {submitting ? '前往中…' : '開始聽力訓練'}
          </button>
        </section>
      )}
    </div>
  )
}

function TokenSpan({ token }: { token: Token }) {
  const isPunct = /^[.,?!]$/.test(token.text)
  const classes = token.content
    ? 'hl-mark text-ink font-semibold'
    : 'text-ink/60'
  return (
    <>
      {!isPunct && ' '}
      <span className={classes} translate="no">
        {token.text}
      </span>
    </>
  )
}

function DrillToken({
  token,
  selected,
  revealed,
  onClick,
}: {
  token: Token
  selected: boolean
  revealed: boolean
  onClick: () => void
}) {
  const isPunct = /^[.,?!]$/.test(token.text)
  if (isPunct) return <span className="text-ink/60">{token.text}</span>

  let classes =
    'rounded-sm px-1 py-0.5 text-ink motion-safe:transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40 '
  if (revealed) {
    if (token.content && selected) {
      classes += 'hl-mark font-semibold'
    } else if (token.content && !selected) {
      classes += 'font-semibold underline decoration-pen decoration-2 underline-offset-4'
    } else if (!token.content && selected) {
      classes += 'strike-pen'
    } else {
      classes += 'text-ink/60'
    }
    classes += ' cursor-default'
  } else {
    classes += selected
      ? 'hl-mark font-semibold cursor-pointer'
      : 'cursor-pointer hover:bg-white'
  }

  return (
    <>
      {' '}
      <button
        type="button"
        onClick={onClick}
        className={classes}
        disabled={revealed}
        translate="no"
      >
        {token.text}
      </button>
    </>
  )
}
