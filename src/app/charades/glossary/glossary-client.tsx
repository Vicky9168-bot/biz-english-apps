'use client'

import { useMemo, useState } from 'react'
import type { Vocabulary } from '@/lib/supabase/types'

const POS_LABELS: Record<string, string> = {
  noun: '名詞',
  verb: '動詞',
  adjective: '形容詞',
  adverb: '副詞',
  phrase: '片語',
}

const POS_FILTERS = ['all', 'noun', 'verb', 'phrase', 'adjective', 'adverb'] as const
type PosFilter = (typeof POS_FILTERS)[number]

export function GlossaryClient({ words }: { words: Vocabulary[] }) {
  const [query, setQuery] = useState('')
  const [pos, setPos] = useState<PosFilter>('all')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return words.filter((w) => {
      if (pos !== 'all' && w.part_of_speech !== pos) return false
      if (!q) return true
      return (
        w.word.toLowerCase().includes(q) ||
        (w.definition_zh?.toLowerCase().includes(q) ?? false) ||
        (w.scenario_tags?.some((t) => t.toLowerCase().includes(q)) ?? false)
      )
    })
  }, [words, query, pos])

  const posCounts = useMemo(() => {
    const acc: Record<string, number> = { all: words.length }
    for (const w of words) {
      const key = w.part_of_speech ?? 'other'
      acc[key] = (acc[key] ?? 0) + 1
    }
    return acc
  }, [words])

  return (
    <div>
      {/* 搜尋 + 篩選 */}
      <div className="sticky top-0 z-10 bg-paper pt-2 pb-4 -mx-6 px-6 mb-4 border-b border-ink/15">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜尋單字、中文意思或場景 tag..."
          className="w-full rounded-md border border-ink/25 bg-white px-4 py-2.5 text-sm text-ink placeholder-ink/50 focus:border-ink/50 focus:ring-2 focus:ring-ink/15 focus:outline-none mb-3"
        />
        <div className="flex flex-wrap gap-2">
          {POS_FILTERS.map((p) => (
            <button
              key={p}
              onClick={() => setPos(p)}
              className={`text-xs px-3 py-1.5 rounded-full transition ${
                pos === p
                  ? 'bg-ink text-white'
                  : 'bg-white border border-ink/15 text-ink/80 hover:border-ink/40'
              }`}
            >
              {p === 'all' ? '全部' : POS_LABELS[p] ?? p}
              <span className="ml-1.5 opacity-60 tabular-nums">
                {posCounts[p] ?? 0}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 結果數 */}
      <div className="text-xs text-ink/65 mb-3 tabular-nums">
        顯示 {filtered.length} / {words.length} 個字
      </div>

      {/* 單字卡列表 */}
      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-ink/15 bg-white p-10 text-center text-sm text-ink/65">
          沒找到符合的字
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((w) => (
            <li
              key={w.id}
              className="rounded-lg border border-ink/15 bg-white p-4 hover:border-ink/40 motion-safe:transition"
            >
              <div className="flex items-baseline justify-between mb-1.5">
                <span className="text-base font-semibold text-ink" translate="no">
                  {w.word}
                </span>
                {w.part_of_speech && (
                  <span className="text-[10px] font-mono uppercase text-ink/60 tracking-wide">
                    {POS_LABELS[w.part_of_speech] ?? w.part_of_speech}
                  </span>
                )}
              </div>
              {w.definition_zh && (
                <div className="text-sm text-ink/80 mb-2">
                  {w.definition_zh}
                </div>
              )}
              {w.example_sentence && (
                <div className="text-xs text-ink/65 italic mb-2 line-clamp-2">
                  &ldquo;{w.example_sentence}&rdquo;
                </div>
              )}
              {w.scenario_tags && w.scenario_tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {w.scenario_tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-paper text-ink/70"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
