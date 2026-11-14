'use client'

import { useMemo, useState } from 'react'
import type { Vocabulary } from '@/lib/supabase/types'
import { EmptyNote, IndexList, IndexRow } from '@/app/page-kit'

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
                  ? 'bg-ink text-paper'
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
      <div className="text-sm text-ink/65 mb-3 tabular-nums">
        顯示 {filtered.length} / {words.length} 個字
      </div>

      {/* 單字列表 */}
      {filtered.length === 0 ? (
        <EmptyNote>沒找到符合的字</EmptyNote>
      ) : (
        <IndexList>
          {filtered.map((w) => (
            <IndexRow
              key={w.id}
              title={w.word}
              translateTitle={false}
              desc={
                <>
                  {w.definition_zh}
                  {w.example_sentence && (
                    <span
                      className="mt-1 block italic text-ink/65 line-clamp-2"
                      translate="no"
                    >
                      &ldquo;{w.example_sentence}&rdquo;
                    </span>
                  )}
                  {w.scenario_tags && w.scenario_tags.length > 0 && (
                    <span className="mt-1 block text-ink/65">
                      {w.scenario_tags.slice(0, 3).join(' · ')}
                    </span>
                  )}
                </>
              }
              aside={
                w.part_of_speech
                  ? (POS_LABELS[w.part_of_speech] ?? w.part_of_speech)
                  : undefined
              }
            />
          ))}
        </IndexList>
      )}
    </div>
  )
}
