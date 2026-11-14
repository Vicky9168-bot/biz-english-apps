'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { Mark, Pen } from '@/app/page-kit'

type Question = {
  id: string
  idiom: string
  example_en: string
  example_zh: string
  meaning_zh: string
  meaning_en: string
  formal_alt: string | null
  category: string
  difficulty: number
  options: string[]
  correct_index: number
  total: number
  today_done: number
  daily_limit: number
  mode: 'learn' | 'review'
  remaining_new?: number
  learned_total?: number
  wrong_total?: number
}

type ApiResp =
  | Question
  | { done_for_today: true; today_done: number; daily_limit: number }
  | { all_learned: true; today_done: number; daily_limit: number }
  | { empty_review: true; today_done: number; daily_limit: number }

const CATEGORY_LABEL: Record<string, string> = {
  meeting: '會議',
  negotiation: '談判',
  strategy: '策略',
  feedback: '回饋',
  urgency: '時間壓力',
  interpersonal: '人際',
  general: '通用',
}

type EndState =
  | { kind: 'done_for_today'; today_done: number; daily_limit: number }
  | { kind: 'all_learned'; today_done: number; daily_limit: number }
  | { kind: 'empty_review' }

export default function PracticeClient({
  mode,
}: {
  mode: 'learn' | 'review'
}) {
  const [q, setQ] = useState<Question | null>(null)
  const [chosen, setChosen] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [session, setSession] = useState({ done: 0, correct: 0 })
  const [endState, setEndState] = useState<EndState | null>(null)

  const loadNext = useCallback(async () => {
    setLoading(true)
    setChosen(null)
    setError(null)
    setEndState(null)
    try {
      const res = await fetch(`/api/idioms/next?mode=${mode}`, {
        cache: 'no-store',
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j?.error ?? '載入失敗')
      }
      const data = (await res.json()) as ApiResp
      if ('done_for_today' in data) {
        setEndState({
          kind: 'done_for_today',
          today_done: data.today_done,
          daily_limit: data.daily_limit,
        })
        setQ(null)
      } else if ('all_learned' in data) {
        setEndState({
          kind: 'all_learned',
          today_done: data.today_done,
          daily_limit: data.daily_limit,
        })
        setQ(null)
      } else if ('empty_review' in data) {
        setEndState({ kind: 'empty_review' })
        setQ(null)
      } else {
        setQ(data)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }, [mode])

  useEffect(() => {
    loadNext()
  }, [loadNext])

  const submitAnswer = useCallback(
    async (index: number) => {
      if (!q || chosen !== null) return
      setChosen(index)
      const isCorrect = index === q.correct_index
      setSession((s) => ({
        done: s.done + 1,
        correct: s.correct + (isCorrect ? 1 : 0),
      }))
      // fire and forget，失敗不擋 UX
      fetch('/api/idioms/attempt', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ idiomId: q.id, isCorrect }),
      }).catch(() => {})
    },
    [q, chosen]
  )

  if (loading && !q && !endState) {
    return (
      <div className="rounded-sm border border-ink/15 bg-white p-10 text-center text-sm text-ink/65">
        載入中…
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-pen/30 bg-pen/10 p-6 text-sm text-pen">
        {error}
        <button
          type="button"
          onClick={loadNext}
          className="ml-3 underline hover:no-underline"
        >
          重試
        </button>
      </div>
    )
  }

  if (endState) {
    return <EndStateCard state={endState} sessionDone={session.done} />
  }

  if (!q) return null

  const isAnswered = chosen !== null
  const isCorrect = chosen === q.correct_index

  // 例句把 idiom 高亮
  const highlighted = highlightIdiom(q.example_en, q.idiom)

  return (
    <>
      {/* 本次進度列 */}
      <div className="mb-4 flex items-center justify-between text-xs text-ink/65">
        <span>
          本次已練{' '}
          <span className="font-semibold text-ink/80 tabular-nums">
            {session.done}
          </span>{' '}
          題
          {session.done > 0 && (
            <>
              {' '}· 答對{' '}
              <span className="font-semibold text-ink/80 tabular-nums">
                {session.correct}
              </span>
            </>
          )}
        </span>
        <span>
          {q.mode === 'review' ? (
            q.wrong_total && q.wrong_total > 0 ? (
              <>
                錯題池{' '}
                <span className="font-semibold text-ink/80 tabular-nums">
                  {q.wrong_total}
                </span>{' '}
                題
              </>
            ) : (
              <>
                已學{' '}
                <span className="font-semibold text-ink/80 tabular-nums">
                  {q.learned_total}
                </span>{' '}
                題複習中
              </>
            )
          ) : (
            <>
              今日{' '}
              <span className="font-semibold text-ink/80 tabular-nums">
                {q.today_done + (isAnswered ? 1 : 0)}
              </span>{' '}
              / {q.daily_limit}
            </>
          )}
        </span>
      </div>

      {/* 題目卡 */}
      <div className="border-y border-ink/15 bg-white px-1 py-6 mb-6">
        <div className="flex items-center gap-3 mb-4 text-sm text-ink/65">
          <span className="font-semibold text-ink">
            {CATEGORY_LABEL[q.category] ?? q.category}
          </span>
          <span className="font-display tabular-nums">
            Lv.{q.difficulty}
          </span>
        </div>

        <div className="text-sm text-ink/65 mb-2">
          在這個情境裡，畫線的俚語是什麼意思？
        </div>
        <p className="text-lg text-ink leading-relaxed mb-6">
          {highlighted}
        </p>

        <ul className="border-b border-ink/15">
          {q.options.map((opt, i) => {
            const isChosen = chosen === i
            const isRight = i === q.correct_index
            let cls = 'text-ink hover:bg-paper'
            if (isAnswered) {
              cls = isRight || isChosen ? 'text-ink' : 'text-ink/60'
            }
            return (
              <li key={i}>
                <button
                  type="button"
                  disabled={isAnswered}
                  onClick={() => submitAnswer(i)}
                  className={`w-full text-left border-t border-ink/15 px-2 py-3.5 text-sm motion-safe:transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40 disabled:cursor-default ${cls}`}
                >
                  <span className="font-display text-sm font-semibold text-ink/65 mr-3">
                    {String.fromCharCode(65 + i)}
                  </span>
                  {isAnswered && isRight ? (
                    <Mark>{opt}</Mark>
                  ) : isAnswered && isChosen ? (
                    <Pen>{opt}</Pen>
                  ) : (
                    opt
                  )}
                  {isAnswered && isRight && (
                    <span className="ml-3 text-sm font-semibold">正解</span>
                  )}
                  {isAnswered && isChosen && !isRight && (
                    <span className="ml-3 text-sm font-semibold text-pen">
                      你選的
                    </span>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      </div>

      {/* 解釋區（答完後才顯示） */}
      {isAnswered && (
        <div className="border-l-4 border-mark pl-5 mb-6">
          <div
            className={`text-base font-bold mb-3 ${
              isCorrect ? 'text-ink' : 'text-pen'
            }`}
          >
            {isCorrect ? '答對！' : '再看一次'}
          </div>
          <dl className="grid gap-3 text-sm">
            <div>
              <dt className="text-sm text-ink/65 mb-1">
                俚語
              </dt>
              <dd className="text-ink font-semibold">{q.idiom}</dd>
            </div>
            <div>
              <dt className="text-sm text-ink/65 mb-1">
                中文意思
              </dt>
              <dd className="text-ink">{q.meaning_zh}</dd>
            </div>
            <div>
              <dt className="text-sm text-ink/65 mb-1">
                英文解釋
              </dt>
              <dd className="text-ink/80">{q.meaning_en}</dd>
            </div>
            {q.formal_alt && (
              <div>
                <dt className="text-sm text-ink/65 mb-1">
                  正式對照詞
                </dt>
                <dd className="text-ink/80">
                  <code className="font-mono text-xs">
                    {q.formal_alt}
                  </code>
                </dd>
              </div>
            )}
            <div>
              <dt className="text-sm text-ink/65 mb-1">
                例句中譯
              </dt>
              <dd className="text-ink/80 leading-relaxed">
                {q.example_zh}
              </dd>
            </div>
          </dl>
        </div>
      )}

      {/* 下一題 */}
      {isAnswered && (
        <button
          type="button"
          onClick={loadNext}
          disabled={loading}
          className="w-full rounded-md bg-ink text-paper py-3 text-sm font-semibold hover:bg-ink/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40 motion-safe:transition disabled:opacity-50"
        >
          {loading ? '載入中…' : '下一題'}
        </button>
      )}
    </>
  )
}

function EndStateCard({
  state,
  sessionDone,
}: {
  state: EndState
  sessionDone: number
}) {
  if (state.kind === 'done_for_today') {
    return (
      <div className="border-l-4 border-mark pl-6 py-2">
        
        <h2 className="text-xl font-bold text-ink mb-2">
          今日 {state.daily_limit} 題已達標
        </h2>
        <p className="text-sm text-ink mb-6">
          本次答對 {sessionDone > 0 ? `${sessionDone} 題後結束` : ''}
          明天再回來學新的，現在可以複習之前學過的
        </p>
        <div className="flex gap-3">
          <Link
            href="/idioms/practice?mode=review"
            className="rounded-md bg-ink text-paper px-5 py-2.5 text-sm font-semibold hover:bg-ink/85 motion-safe:transition"
          >
            去複習
          </Link>
          <Link
            href="/idioms"
            className="rounded-md border border-ink/25 text-ink px-5 py-2.5 text-sm font-semibold hover:bg-paper motion-safe:transition"
          >
            回題庫首頁
          </Link>
        </div>
      </div>
    )
  }
  if (state.kind === 'all_learned') {
    return (
      <div className="border-y border-ink/15 py-8">
        
        <h2 className="text-xl font-bold text-ink mb-2">
          100 個俚語全部練過了！
        </h2>
        <p className="text-sm text-ink/70 mb-6">
          剩下就是不斷複習，讓聽到就秒懂
        </p>
        <Link
          href="/idioms/practice?mode=review"
          className="rounded-md bg-ink text-paper px-5 py-2.5 text-sm font-semibold hover:bg-ink/85 motion-safe:transition"
        >
          開始複習
        </Link>
      </div>
    )
  }
  // empty_review
  return (
    <div className="border-y border-ink/15 py-8">
      
      <h2 className="text-xl font-bold text-ink mb-2">
        還沒有可以複習的題目
      </h2>
      <p className="text-sm text-ink/70 mb-6">
        先去學一些新題，之後再回來複習
      </p>
      <Link
        href="/idioms/practice"
        className="rounded-md bg-ink text-paper px-5 py-2.5 text-sm font-semibold hover:bg-ink/85 motion-safe:transition"
      >
        去學今日新題
      </Link>
    </div>
  )
}

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function highlightIdiom(sentence: string, idiom: string) {
  // 先把 placeholder 換成通配符再 escape，避免 double-escape
  const PLACEHOLDER = '\u0001'
  const withPlaceholder = idiom
    .replace(/\b(someone|something|one'?s)\b/gi, PLACEHOLDER)
  const escaped = escapeRegex(withPlaceholder).replace(
    new RegExp(PLACEHOLDER, 'g'),
    '\\S+'
  )
  let re: RegExp
  try {
    re = new RegExp(`(${escaped})`, 'i')
  } catch {
    re = new RegExp(`(${escapeRegex(idiom)})`, 'i')
  }
  const parts = sentence.split(re)
  return parts.map((part, i) =>
    part && re.test(part) ? (
      <span
        key={i}
        className="hl-mark font-semibold text-ink"
      >
        {part}
      </span>
    ) : (
      <span key={i}>{part}</span>
    )
  )
}
