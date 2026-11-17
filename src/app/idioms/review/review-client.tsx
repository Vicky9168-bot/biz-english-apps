'use client'

import { useMemo, useState } from 'react'
import type { IdiomStatus } from '@/lib/idioms'
import {
  EmptyNote,
  IndexList,
  IndexRow,
  Mark,
  SectionTitle,
} from '@/app/page-kit'

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

type CategoryMeta = Record<string, { label: string; order: number }>

type Props = {
  idioms: Idiom[]
  categoryMeta: CategoryMeta
}

const STATUS_LABEL: Record<IdiomStatus, string> = {
  wrong: '曾答錯',
  learned: '學過',
  new: '沒碰過',
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
            className={`text-sm px-3 py-1.5 rounded-full border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40 ${
              filter === k
                ? 'border-ink bg-ink text-paper'
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
        <EmptyNote>這個篩選沒有俚語</EmptyNote>
      ) : (
        <div className="space-y-10">
          {grouped.map(([cat, list]) => {
            const meta = categoryMeta[cat]
            return (
              <section key={cat}>
                <SectionTitle title={meta?.label ?? cat} hint={`${list.length} 個`} />
                <IndexList>
                  {list.map((i) => (
                    <IndexRow
                      key={i.id}
                      title={i.idiom}
                      translateTitle={false}
                      desc={
                        <>
                          {i.meaning_zh}
                          <span
                            className="mt-2 block border-l-2 border-ink/25 pl-3 italic text-ink/75"
                            translate="no"
                          >
                            &ldquo;{i.example_en}&rdquo;
                          </span>
                          <span className="mt-1 block text-ink/65">
                            {i.example_zh}
                          </span>
                          {i.formal_alt && (
                            <span className="mt-1 block text-ink/65">
                              正式說法：<span translate="no">{i.formal_alt}</span>
                            </span>
                          )}
                        </>
                      }
                      aside={
                        i.status === 'wrong' ? (
                          <span className="font-semibold text-pen">
                            {STATUS_LABEL[i.status]}
                          </span>
                        ) : i.status === 'learned' ? (
                          <Mark>{STATUS_LABEL[i.status]}</Mark>
                        ) : (
                          STATUS_LABEL[i.status]
                        )
                      }
                    />
                  ))}
                </IndexList>
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}
