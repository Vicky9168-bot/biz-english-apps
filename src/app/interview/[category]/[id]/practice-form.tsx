'use client'

import { useState } from 'react'
import type { PracticeQuestion } from '@/lib/interview/questions'

type Props = {
  question: PracticeQuestion
}

export default function PracticeForm({ question }: Props) {
  const [answer, setAnswer] = useState('')
  const [revealed, setRevealed] = useState(false)

  const wordCount = answer.trim() ? answer.trim().split(/\s+/).length : 0

  return (
    <div className="space-y-10">
      <section>
        <h2 className="mb-3 text-xl font-bold">你的答案</h2>
        {/* 稿紙：橫線 + 左側紅色邊線，字行高與線距一致 */}
        <div className="relative bg-white shadow-[0_1px_0_rgba(26,36,48,0.06),0_24px_40px_-28px_rgba(26,36,48,0.4)]">
          <span
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-10 w-px bg-pen/35"
          />
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="先用英文寫下你的回答，寫完再看提示。不用完美，先寫出來比較重要。"
            rows={10}
            aria-label="你的答案"
            className="block w-full resize-y bg-transparent py-[18px] pl-14 pr-5 text-base leading-9 text-ink placeholder:text-ink/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40"
            style={{
              backgroundImage:
                'repeating-linear-gradient(to bottom, transparent 0 35px, rgba(26,36,48,0.08) 35px 36px)',
              backgroundPosition: '0 18px',
            }}
          />
        </div>
        <div className="mt-3 flex items-center justify-between">
          <span className="font-display text-sm tabular-nums text-ink/65">
            {wordCount} words
          </span>
          {!revealed ? (
            <button
              type="button"
              onClick={() => setRevealed(true)}
              className="rounded-md bg-ink px-5 py-2.5 text-sm font-semibold text-paper transition hover:bg-ink/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40 focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
            >
              看提示與答題大綱
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setRevealed(false)}
              className="rounded-sm px-1 text-sm text-ink/70 underline decoration-ink/30 underline-offset-4 hover:text-ink hover:decoration-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40"
            >
              收起提示
            </button>
          )}
        </div>
      </section>

      {revealed && (
        <div className="space-y-8">
          <HintBlock label="為什麼考這題" items={question.why_asked} />
          <HintBlock
            label="面試官期待什麼"
            items={question.what_they_expect}
          />
          <HintBlock
            label="你該這樣答"
            items={question.how_to_answer}
            tone="do"
          />
          {question.what_to_avoid && question.what_to_avoid.length > 0 && (
            <HintBlock
              label="別踩這些雷"
              items={question.what_to_avoid}
              tone="avoid"
            />
          )}
          {question.answer_outline && question.answer_outline.length > 0 && (
            <HintBlock
              label="英文答題大綱"
              items={question.answer_outline}
              english
            />
          )}
        </div>
      )}
    </div>
  )
}

// 提示區塊：螢光黃線 = 該怎麼做、紅筆線 = 要避開、墨線 = 背景說明
function HintBlock({
  label,
  items,
  tone = 'plain',
  english = false,
}: {
  label: string
  items: string[]
  tone?: 'plain' | 'do' | 'avoid'
  english?: boolean
}) {
  const border = {
    plain: 'border-ink/25',
    do: 'border-mark',
    avoid: 'border-pen',
  }[tone]

  return (
    <section className={`border-l-4 pl-5 ${border}`}>
      <h2 className="mb-3 text-lg font-bold">{label}</h2>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li
            key={i}
            className="text-sm leading-relaxed text-ink/80"
            translate={english ? 'no' : undefined}
          >
            {item}
          </li>
        ))}
      </ul>
    </section>
  )
}
