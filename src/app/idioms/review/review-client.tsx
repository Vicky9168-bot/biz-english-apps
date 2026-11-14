'use client'

import { useMemo, useState } from 'react'
import type { IdiomStatus } from './page'

type Idiom = {
  id: string
  idiom: string
  meaning_zh: string
  meaning_en: string
  formal_alt: string | null
  example_en: string
  example_zh: string
  category: string
  difficulty: number
  tags: string[] | null
  status: IdiomStatus
}

type CategoryMeta = Record<
  string,
  { label: string; color: string; order: number }
>

type Props = {
  idioms: Idiom[]
  categoryMeta: CategoryMeta
}

const STATUS_LABEL: Record<IdiomStatus, string> = {
  wrong: '曾答錯',
  learned: '學過',
  new: '沒碰過',
}

const STATUS_TONE: Record<IdiomStatus, string> = {
  wrong: 'bg-pen/15 text-pen',
  learned: 'bg-mark/40 text-ink',
  new: 'bg-paper text-ink/65',
}

type FilterKey = 'all' | 'wrong' | 'learned' | 'new'

export default function ReviewClient({ idioms, categoryMeta }: Props) {
  const [filter, setFilter] = useState<FilterKey>('all')

  const filtered = useMemo(() => {
    if (filter === 'all') return idioms
    return idioms.filter((i) => i.status === filter)
  }, [idioms, filter])

  const grouped = useMemo(() => {
    const map = new Map<string, Idiom[]>()
    filtered.forEach((i) => {
      const arr = map.get(i.category) ?? []
      arr.push(i)
      map.set(i.category, arr)
    })
    return Array.from(map.entries()).sort(
      ([a], [b]) =>
        (categoryMeta[a]?.order ?? 999) - (categoryMeta[b]?.order ?? 999)
    )
  }, [filtered, categoryMeta])

  const filterCounts: Record<FilterKey, number> = {
    all: idioms.length,
    wrong: idioms.filter((i) => i.status === 'wrong').length,
    learned: idioms.filter((i) => i.status === 'learned').length,
    new: idioms.filter((i) => i.status === 'new').length,
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        {(['all', 'wrong', 'learned', 'new'] as FilterKey[]).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setFilter(k)}
            className={`text-xs px-3 py-1.5 rounded-full border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40 ${
              filter === k
                ? 'border-ink bg-ink text-white'
                : 'border-ink/15 bg-white text-ink/80 hover:border-ink/40'
            }`}
          >
            {k === 'all' ? '全部' : STATUS_LABEL[k as IdiomStatus]}
            <span
              className={`ml-1.5 font-mono tabular-nums ${
                filter === k ? 'text-paper/70' : 'text-ink/60'
              }`}
            >
              {filterCounts[k]}
            </span>
          </button>
        ))}
      </div>

      {grouped.length === 0 ? (
        <div className="rounded-lg border border-dashed border-ink/25 bg-white p-10 text-center text-sm text-ink/65">
          這個篩選沒有俚語
        </div>
      ) : (
        <div className="space-y-8">
          {grouped.map(([cat, list]) => {
            const meta = categoryMeta[cat]
            return (
              <section key={cat}>
                <div className="flex items-baseline gap-2 mb-3">
                  <span
                    className={`text-xs font-mono font-semibold px-2 py-0.5 rounded border ${meta?.color ?? ''}`}
                  >
                    {meta?.label ?? cat}
                  </span>
                  <span className="text-xs text-ink/65 font-mono">
                    {list.length}
                  </span>
                </div>
                <ul className="grid gap-3 sm:grid-cols-2">
                  {list.map((i) => (
                    <li
                      key={i.id}
                      className="rounded-lg border border-ink/15 bg-white p-4"
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div
                          className="text-base font-semibold text-ink"
                          translate="no"
                        >
                          {i.idiom}
                        </div>
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.5 rounded shrink-0 ${STATUS_TONE[i.status]}`}
                        >
                          {STATUS_LABEL[i.status]}
                        </span>
                      </div>
                      <div className="text-sm text-ink/80 mb-2">
                        {i.meaning_zh}
                      </div>
                      <p
                        className="text-xs text-ink/70 italic border-l-2 border-ink/15 pl-2 mb-1"
                        translate="no"
                      >
                        &ldquo;{i.example_en}&rdquo;
                      </p>
                      <p className="text-xs text-ink/65">{i.example_zh}</p>
                      {i.formal_alt && (
                        <div className="mt-2 text-[11px] text-ink/65">
                          <span className="font-mono text-ink/60">
                            formal:
                          </span>{' '}
                          <span translate="no">{i.formal_alt}</span>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}
