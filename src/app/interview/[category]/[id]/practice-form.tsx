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
    <div className="space-y-6">
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="text-xs font-medium tracking-wide uppercase text-slate-500 mb-2">
          你的答案
        </div>
        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="先用英文寫下你的回答，寫完再看提示。不用完美，先寫出來比較重要。"
          rows={10}
          className="w-full rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:border-slate-400 resize-y"
        />
        <div className="flex items-center justify-between mt-3">
          <span className="text-xs font-mono text-slate-500">
            {wordCount} words
          </span>
          {!revealed ? (
            <button
              type="button"
              onClick={() => setRevealed(true)}
              className="text-sm font-medium bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
            >
              看提示與答題大綱 →
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setRevealed(false)}
              className="text-sm text-slate-600 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 rounded-sm px-1"
            >
              收起提示
            </button>
          )}
        </div>
      </section>

      {revealed && (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <HintCard
            label="為什麼考這題"
            code="WHY"
            items={question.why_asked}
            tone="slate"
          />
          <HintCard
            label="面試官期待什麼"
            code="EXPECT"
            items={question.what_they_expect}
            tone="slate"
          />
          <HintCard
            label="你該這樣答"
            code="DO"
            items={question.how_to_answer}
            tone="emerald"
          />
          {question.what_to_avoid && question.what_to_avoid.length > 0 && (
            <HintCard
              label="別踩這些雷"
              code="AVOID"
              items={question.what_to_avoid}
              tone="amber"
            />
          )}
          {question.answer_outline && question.answer_outline.length > 0 && (
            <HintCard
              label="英文答題大綱"
              code="OUTLINE"
              items={question.answer_outline}
              tone="slate"
              mono
            />
          )}
        </div>
      )}
    </div>
  )
}

type Tone = 'slate' | 'emerald' | 'amber'

function HintCard({
  label,
  code,
  items,
  tone,
  mono = false,
}: {
  label: string
  code: string
  items: string[]
  tone: Tone
  mono?: boolean
}) {
  const toneClass = {
    slate: 'border-slate-200 bg-white',
    emerald: 'border-emerald-200 bg-emerald-50/50',
    amber: 'border-amber-200 bg-amber-50/50',
  }[tone]

  const codeToneClass = {
    slate: 'bg-slate-100 text-slate-600',
    emerald: 'bg-emerald-100 text-emerald-700',
    amber: 'bg-amber-100 text-amber-800',
  }[tone]

  return (
    <section className={`rounded-xl border p-5 ${toneClass}`}>
      <div className="flex items-center gap-2 mb-3">
        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${codeToneClass}`}>
          {code}
        </span>
        <span className="text-xs font-medium tracking-wide uppercase text-slate-500">
          {label}
        </span>
      </div>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li
            key={i}
            className={`text-sm leading-relaxed text-slate-700 flex gap-2 ${mono ? 'font-mono' : ''}`}
          >
            <span className="text-slate-400 shrink-0">·</span>
            <span className="min-w-0">{item}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
