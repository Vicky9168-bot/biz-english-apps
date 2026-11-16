'use client'

import Link from 'next/link'
import { useState } from 'react'
import { WORD_SOURCE_LABELS, type SavedWord, type WordContext } from '@/lib/words'
import { EmptyNote, IndexList, Mark, Pen, SectionTitle } from '../../page-kit'

type Question = {
  word: SavedWord
  // 這題用哪一句當語境（同一個字有多個出現場合時，每輪隨機挑一句）
  context: WordContext | null
  // 空陣列表示單字卡模式（單字太少或意思重複，湊不出四個選項）
  options: string[]
  correctIndex: number
}

const ROUND_SIZE = 10

const shuffle = <T,>(items: T[]) => {
  const a = [...items]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// 把句子裡的目標字換成空格；句子裡找不到就回傳 null
function blankOut(sentence: string | null, surface: string) {
  if (!sentence) return null
  const re = new RegExp(`\\b${surface.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi')
  return re.test(sentence) ? sentence.replace(re, '_____') : null
}

// 優先挑能挖空的句子；都不行就挑任一句（單字卡模式照樣能顯示）
function pickContext(word: SavedWord): WordContext | null {
  const usable = word.contexts.filter(
    (c) => blankOut(c.sentence, c.surface_form ?? word.word) !== null
  )
  const pool = usable.length > 0 ? usable : word.contexts
  return pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : null
}

// 答錯越多越優先，同分隨機
function buildRound(words: SavedWord[]): Question[] {
  const picked = shuffle(words)
    .sort((a, b) => b.wrong_count - b.correct_count - (a.wrong_count - a.correct_count))
    .slice(0, ROUND_SIZE)
  const meanings = [...new Set(words.map((w) => w.meaning_zh))]

  return picked.map((word) => {
    const context = pickContext(word)
    const others = shuffle(meanings.filter((m) => m !== word.meaning_zh)).slice(0, 3)
    if (others.length < 3) return { word, context, options: [], correctIndex: -1 }
    const options = shuffle([word.meaning_zh, ...others])
    return { word, context, options, correctIndex: options.indexOf(word.meaning_zh) }
  })
}

export function VocabClient({ initialWords }: { initialWords: SavedWord[] }) {
  const [words, setWords] = useState(initialWords)
  const [round, setRound] = useState<Question[] | null>(null)
  const [index, setIndex] = useState(0)
  const [chosen, setChosen] = useState<number | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [score, setScore] = useState(0)

  const record = (id: string, correct: boolean) => {
    setWords((prev) =>
      prev.map((w) =>
        w.id === id
          ? {
              ...w,
              correct_count: w.correct_count + (correct ? 1 : 0),
              wrong_count: w.wrong_count + (correct ? 0 : 1),
            }
          : w
      )
    )
    fetch('/api/words', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id, correct }),
    }).catch(() => {})
  }

  const remove = async (id: string) => {
    const res = await fetch(`/api/words?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    })
    if (res.ok) setWords((prev) => prev.filter((w) => w.id !== id))
  }

  const start = () => {
    setRound(buildRound(words))
    setIndex(0)
    setChosen(null)
    setRevealed(false)
    setScore(0)
  }

  const advance = () => {
    setIndex((i) => i + 1)
    setChosen(null)
    setRevealed(false)
  }

  const answer = (q: Question, correct: boolean) => {
    if (correct) setScore((s) => s + 1)
    record(q.word.id, correct)
  }

  if (words.length === 0) {
    return (
      <EmptyNote>
        生字本還是空的。去
        <Link href="/reading" className="mx-1 font-semibold underline underline-offset-4">
          讀一篇文章
        </Link>
        ，點不熟的單字再按「存到生字本」。
      </EmptyNote>
    )
  }

  // ---- 練習中 ----
  if (round) {
    const q = round[index]

    if (!q) {
      return (
        <div>
          <h2 className="text-2xl font-bold">
            這輪答對 <Mark>{score}</Mark> / {round.length}
          </h2>
          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={start}
              className="rounded-md bg-ink px-5 py-2.5 text-sm font-semibold text-paper hover:bg-ink/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40 focus-visible:ring-offset-2"
            >
              再練一輪
            </button>
            <button
              type="button"
              onClick={() => setRound(null)}
              className="rounded-md border border-ink/25 px-5 py-2.5 text-sm font-semibold hover:bg-white/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40"
            >
              回生字本
            </button>
          </div>
        </div>
      )
    }

    const blanked = q.context
      ? blankOut(q.context.sentence, q.context.surface_form ?? q.word.word)
      : null
    const isCard = q.options.length === 0

    return (
      <div>
        <div className="mb-6 flex items-baseline justify-between text-sm text-ink/65">
          <span>
            第 {index + 1} / {round.length} 題
          </span>
          <button
            type="button"
            onClick={() => setRound(null)}
            className="rounded-sm underline underline-offset-4 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40"
          >
            離開練習
          </button>
        </div>

        {isCard ? (
          <div>
            <p className="font-display text-3xl font-bold" translate="no">
              {q.word.word}
            </p>
            {q.context && (
              <p className="mt-3 text-base leading-relaxed text-ink/80" translate="no">
                {q.context.sentence}
              </p>
            )}
            {!revealed ? (
              <button
                type="button"
                onClick={() => setRevealed(true)}
                className="mt-6 rounded-md bg-ink px-5 py-2.5 text-sm font-semibold text-paper hover:bg-ink/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40 focus-visible:ring-offset-2"
              >
                顯示意思
              </button>
            ) : (
              <div className="mt-6">
                <p className="text-lg font-semibold">
                  <Mark>{q.word.meaning_zh}</Mark>
                </p>
                <div className="mt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      answer(q, true)
                      advance()
                    }}
                    className="rounded-md bg-ink px-5 py-2.5 text-sm font-semibold text-paper hover:bg-ink/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40 focus-visible:ring-offset-2"
                  >
                    記得
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      answer(q, false)
                      advance()
                    }}
                    className="rounded-md border border-ink/25 px-5 py-2.5 text-sm font-semibold hover:bg-white/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40"
                  >
                    不記得
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div>
            <p className="text-sm text-ink/65">
              {blanked ? '空格處的單字是什麼意思？' : '這個單字是什麼意思？'}
            </p>
            <p
              className={`mt-3 leading-relaxed ${
                blanked ? 'text-lg' : 'font-display text-3xl font-bold'
              }`}
              translate="no"
            >
              {blanked ?? q.word.word}
            </p>

            <ul className="mt-6 space-y-2">
              {q.options.map((opt, i) => {
                const done = chosen !== null
                const isRight = i === q.correctIndex
                const isWrongPick = done && i === chosen && !isRight
                return (
                  <li key={opt}>
                    <button
                      type="button"
                      disabled={done}
                      onClick={() => {
                        setChosen(i)
                        answer(q, isRight)
                      }}
                      className={`w-full rounded-md border px-4 py-3 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40 ${
                        done && isRight
                          ? 'border-ink bg-white font-semibold'
                          : 'border-ink/20 bg-white/60 hover:bg-white disabled:hover:bg-white/60'
                      }`}
                    >
                      {done && isRight ? <Mark>{opt}</Mark> : isWrongPick ? <Pen>{opt}</Pen> : opt}
                    </button>
                  </li>
                )
              })}
            </ul>

            {chosen !== null && (
              <div className="mt-6">
                <p className="text-sm leading-relaxed text-ink/80">
                  <span className="font-semibold" translate="no">
                    {q.word.word}
                  </span>
                  {q.word.pos ? `（${q.word.pos}）` : ''}：{q.word.meaning_zh}
                  {q.word.meaning_en && (
                    <span className="block text-ink/65" translate="no">
                      {q.word.meaning_en}
                    </span>
                  )}
                </p>
                <button
                  type="button"
                  onClick={advance}
                  className="mt-4 rounded-md bg-ink px-5 py-2.5 text-sm font-semibold text-paper hover:bg-ink/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40 focus-visible:ring-offset-2"
                >
                  {index + 1 === round.length ? '看結果' : '下一題'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  // ---- 生字本列表 ----
  const practiced = words.filter((w) => w.correct_count + w.wrong_count > 0).length

  return (
    <div>
      <div className="mb-10 flex flex-wrap items-center justify-between gap-4 border-b border-ink/15 pb-6">
        <p className="text-sm text-ink/70">
          共 {words.length} 個單字，練習過 {practiced} 個
        </p>
        <button
          type="button"
          onClick={start}
          className="rounded-md bg-ink px-5 py-2.5 text-sm font-semibold text-paper hover:bg-ink/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40 focus-visible:ring-offset-2"
        >
          開始練習（最多 {ROUND_SIZE} 題）
        </button>
      </div>

      <SectionTitle title="全部單字" />
      <IndexList>
        {words.map((w) => (
          <div
            key={w.id}
            className="flex items-start justify-between gap-4 border-t border-ink/15 px-2 py-5"
          >
            <div className="min-w-0">
              <p>
                <span className="text-lg font-semibold" translate="no">
                  {w.word}
                </span>
                {w.pos && (
                  <span className="ml-2 text-xs text-ink/65" translate="no">
                    {w.pos}
                  </span>
                )}
                <span className="ml-2 rounded-full border border-ink/20 px-2 py-0.5 text-xs text-ink/65">
                  {WORD_SOURCE_LABELS[w.source_type]}
                </span>
              </p>
              <p className="mt-1 text-sm">{w.meaning_zh}</p>
              {w.contexts.slice(0, 2).map((c) => (
                <p
                  key={c.sentence}
                  className="mt-2 text-sm leading-relaxed text-ink/70"
                  translate="no"
                >
                  {c.sentence}
                </p>
              ))}
              {w.contexts.length > 2 && (
                <p className="mt-1 text-xs text-ink/55">還有 {w.contexts.length - 2} 個語境</p>
              )}
              {w.correct_count + w.wrong_count > 0 && (
                <p className="mt-2 text-xs text-ink/55">
                  答對 {w.correct_count} · 答錯 {w.wrong_count}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => remove(w.id)}
              className="shrink-0 rounded-sm text-sm text-ink/65 underline-offset-4 hover:text-ink hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40"
            >
              移除
            </button>
          </div>
        ))}
      </IndexList>
    </div>
  )
}
