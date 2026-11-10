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
    <div className="space-y-8">
      {/* 規則 */}
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-sm font-semibold tracking-wide uppercase text-slate-500 mb-3">
          規則
        </h2>
        <p className="text-slate-800 leading-relaxed mb-4">
          英文是「重音時序語言」— 母語者只會把力氣放在
          <strong className="text-slate-900"> 實詞（content words）</strong>{' '}
          上，其他字幾乎糊帶而過，學會只抓實詞，聽力立刻鬆一半。
        </p>
        <div className="grid gap-4 sm:grid-cols-2 text-sm">
          <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4">
            <div className="text-xs font-semibold tracking-wide uppercase text-emerald-700 mb-2">
              實詞 · 要抓
            </div>
            <ul className="space-y-1 text-slate-700">
              <li>名詞 (report, deadline)</li>
              <li>主要動詞 (send, schedule)</li>
              <li>形容詞 (new, quick)</li>
              <li>副詞 (tomorrow, quickly)</li>
              <li>否定詞 (not, never)</li>
              <li>疑問詞 (what, when, why)</li>
              <li>數字 (Q4, 5, 100)</li>
            </ul>
          </div>
          <div className="rounded-lg bg-slate-100 border border-slate-200 p-4">
            <div className="text-xs font-semibold tracking-wide uppercase text-slate-500 mb-2">
              虛詞 · 可放掉
            </div>
            <ul className="space-y-1 text-slate-600">
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
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-sm font-semibold tracking-wide uppercase text-slate-500 mb-3">
          對照示範
        </h2>
        <p className="text-sm text-slate-600 mb-4">
          <span className="text-slate-900 font-semibold">深色 = 實詞</span>
          <span className="mx-2 text-slate-400">·</span>
          <span className="text-slate-400">淺色 = 虛詞</span>
          <span className="ml-3 text-slate-500">
            只用深色的字就足以理解整句意思
          </span>
        </p>
        <ul className="space-y-4">
          {EXAMPLES.map((tokens, i) => (
            <li key={i} className="space-y-1.5">
              <p className="text-base leading-relaxed">
                {tokens.map((t, j) => (
                  <TokenSpan key={j} token={t} />
                ))}
              </p>
              <p className="text-xs text-slate-500 italic pl-1">
                聽起來像：
                <span className="text-slate-800 font-medium" translate="no">
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
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-sm font-semibold tracking-wide uppercase text-slate-500 mb-3">
          小測驗 · 點選你認為的實詞
        </h2>
        <p className="text-sm text-slate-600 mb-5">
          每題點完後按「確認」看解答，全部做完就完成這一課。
        </p>
        <ol className="space-y-6">
          {DRILLS.map((drill, drillIdx) => {
            const score = revealed[drillIdx] ? drillScore(drillIdx) : null
            return (
              <li key={drillIdx} className="space-y-3">
                <div className="text-xs font-medium tracking-wide uppercase text-slate-500">
                  題 {drillIdx + 1}
                </div>
                <p className="text-base leading-loose">
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
                    className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/30 transition"
                  >
                    確認答案
                  </button>
                ) : (
                  <div
                    className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-sm"
                    aria-live="polite"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={
                          score && score.correct === score.total
                            ? 'text-emerald-700 font-semibold'
                            : 'text-slate-700 font-semibold'
                        }
                      >
                        {score?.correct} / {score?.total} 正確
                      </span>
                      {score && score.correct === score.total && (
                        <span className="text-xs text-emerald-600">
                          完美！
                        </span>
                      )}
                    </div>
                    {drill.hint_zh && (
                      <p className="text-xs text-slate-600">
                        {drill.hint_zh}
                      </p>
                    )}
                  </div>
                )}
              </li>
            )
          })}
        </ol>
      </section>

      {/* 完成按鈕 */}
      {allDone && (
        <section
          className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center"
          aria-live="polite"
        >
          <div className="text-xs font-medium tracking-wide uppercase text-emerald-700 mb-2">
            Ready
          </div>
          <p className="text-slate-800 mb-4">
            這一課答對 {totalCorrect} / {totalPossible}
            ，接下來聽 AI 商務對話時，用同樣的策略去抓實詞就好。
          </p>
          <button
            onClick={finish}
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/30 disabled:opacity-50 motion-safe:transition"
          >
            {submitting ? '前往中…' : '開始聽力訓練 →'}
          </button>
        </section>
      )}
    </div>
  )
}

function TokenSpan({ token }: { token: Token }) {
  const isPunct = /^[.,?!]$/.test(token.text)
  const classes = token.content
    ? 'text-slate-900 font-semibold'
    : 'text-slate-400'
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
  if (isPunct) return <span className="text-slate-400">{token.text}</span>

  let classes =
    'inline-block px-1.5 py-0.5 rounded-md motion-safe:transition cursor-pointer border '
  if (revealed) {
    const isCorrect = token.content === selected
    if (token.content && selected) {
      classes += 'bg-emerald-100 border-emerald-300 text-emerald-900'
    } else if (token.content && !selected) {
      classes += 'bg-amber-50 border-amber-300 text-amber-900'
    } else if (!token.content && selected) {
      classes += 'bg-rose-50 border-rose-300 text-rose-900 line-through'
    } else {
      classes += 'border-transparent text-slate-400'
    }
    classes += ' cursor-default'
    void isCorrect
  } else {
    classes += selected
      ? 'bg-slate-900 border-slate-900 text-white'
      : 'bg-white border-slate-200 hover:border-slate-400 text-slate-800'
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
