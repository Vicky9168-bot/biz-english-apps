'use client'

import { useState } from 'react'
import { Check, Plus } from 'lucide-react'

export type WordBankCandidate = {
  vocabularyId: string
  word: string
  pos: string | null
  meaningZh: string
  meaningEn: string | null
  example: string | null
}

type Status = 'idle' | 'saving' | 'saved' | 'error'

// 結算時列出沒猜中（0 星）的字，一鍵加入「我的單字本」，來源記為 charades
export function AddToWordBank({
  candidates,
  savedWords,
}: {
  candidates: WordBankCandidate[]
  savedWords: string[]
}) {
  const alreadySaved = new Set(savedWords)
  const items = candidates.filter((c) => !alreadySaved.has(c.word.toLowerCase()))
  const [status, setStatus] = useState<Record<string, Status>>({})

  if (items.length === 0) return null

  const statusOf = (c: WordBankCandidate): Status => status[c.vocabularyId] ?? 'idle'

  async function add(c: WordBankCandidate) {
    setStatus((s) => ({ ...s, [c.vocabularyId]: 'saving' }))
    try {
      const res = await fetch('/api/words', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          word: c.word,
          pos: c.pos,
          meaning_zh: c.meaningZh,
          meaning_en: c.meaningEn,
          example_en: c.example,
          source_type: 'charades',
          source_id: c.vocabularyId,
          sentence: c.example,
        }),
      })
      if (!res.ok) throw new Error('save failed')
      setStatus((s) => ({ ...s, [c.vocabularyId]: 'saved' }))
    } catch {
      setStatus((s) => ({ ...s, [c.vocabularyId]: 'error' }))
    }
  }

  const pending = items.filter((c) => ['idle', 'error'].includes(statusOf(c)))

  return (
    <section className="border-t border-ink/15 pt-6 mb-6">
      <div className="mb-3 flex items-baseline justify-between gap-4">
        <h2 className="text-sm font-semibold text-ink/65">沒猜中的字，加入單字本再練？</h2>
        {pending.length > 1 && (
          <button
            type="button"
            onClick={() => pending.forEach(add)}
            className="rounded-sm text-sm font-semibold underline decoration-ink/30 underline-offset-4 hover:decoration-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40"
          >
            全部加入
          </button>
        )}
      </div>
      <ul className="divide-y divide-ink/10">
        {items.map((c) => {
          const s = statusOf(c)
          return (
            <li key={c.vocabularyId} className="flex items-center justify-between gap-4 py-2.5 text-sm">
              <span className="min-w-0">
                <span className="font-medium text-ink" translate="no">
                  {c.word}
                </span>
                <span className="ml-2 text-ink/65">{c.meaningZh}</span>
              </span>
              <button
                type="button"
                onClick={() => add(c)}
                disabled={s === 'saving' || s === 'saved'}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-ink/25 px-3 py-1.5 text-sm font-semibold text-ink hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40 disabled:opacity-60"
              >
                {s === 'saved' ? (
                  <>
                    <Check className="size-4" /> 已加入
                  </>
                ) : s === 'saving' ? (
                  '加入中…'
                ) : (
                  <>
                    <Plus className="size-4" /> {s === 'error' ? '失敗，再試一次' : '加入單字本'}
                  </>
                )}
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
