'use client'

import Link from 'next/link'
import { useCallback, useMemo, useState } from 'react'
import { Plus, Check, X } from 'lucide-react'
import type { ReadingArticle, ReadingWord } from '@/lib/reading'

type Entry = {
  word: string // 小寫原形，存進生字本的 key
  surface: string // 文章裡實際出現的樣子
  pos: string
  meaning_zh: string
  meaning_en: string
  example_en: string
  context: string // 該字所在的句子
}

const WORD_RE = /([A-Za-z][A-Za-z'’-]*)/

// 取出 offset 位置所在的那一句
function sentenceAt(text: string, offset: number) {
  const before = text.slice(0, offset)
  const lastEnd = Math.max(
    before.lastIndexOf('. '),
    before.lastIndexOf('! '),
    before.lastIndexOf('? ')
  )
  const start = lastEnd === -1 ? 0 : lastEnd + 2
  const next = text.slice(offset).search(/[.!?](\s|$)/)
  const end = next === -1 ? text.length : offset + next + 1
  return text.slice(start, end).trim()
}

function findSentence(paragraphs: { en: string }[], word: string) {
  const re = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i')
  for (const p of paragraphs) {
    const m = re.exec(p.en)
    if (m) return sentenceAt(p.en, m.index)
  }
  return ''
}

function Tokens({
  text,
  keyWords,
  activeWord,
  onPick,
}: {
  text: string
  keyWords: Set<string>
  activeWord: string | null
  onPick: (surface: string, offset: number) => void
}) {
  const parts = text.split(WORD_RE)
  const starts: number[] = []
  let acc = 0
  for (const part of parts) {
    starts.push(acc)
    acc += part.length
  }
  return (
    <>
      {parts.map((part, i) => {
        const start = starts[i]
        if (i % 2 === 0) return part
        const lower = part.toLowerCase()
        const isKey = keyWords.has(lower)
        const isActive = activeWord === lower
        return (
          <button
            key={i}
            type="button"
            onClick={() => onPick(part, start)}
            className={`rounded-sm px-px text-left align-baseline transition-colors hover:bg-mark/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40 ${
              isActive ? 'bg-mark' : isKey ? 'hl-mark' : ''
            }`}
          >
            {part}
          </button>
        )
      })}
    </>
  )
}

export function ReaderClient({
  article,
  categoryLabel,
  categoryEn,
  savedWords,
}: {
  article: ReadingArticle
  categoryLabel: string
  categoryEn: string
  savedWords: string[]
}) {
  const [showZh, setShowZh] = useState(false)
  const [entry, setEntry] = useState<Entry | null>(null)
  const [looking, setLooking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(() => new Set(savedWords))
  const [saving, setSaving] = useState(false)

  const keyWordMap = useMemo(
    () => new Map(article.key_words.map((w) => [w.word.toLowerCase(), w])),
    [article.key_words]
  )
  const keyWordSet = useMemo(() => new Set(keyWordMap.keys()), [keyWordMap])

  const showKeyWord = useCallback(
    (w: ReadingWord, context: string) => {
      setError(null)
      setLooking(false)
      setEntry({
        word: w.word.toLowerCase(),
        surface: w.word,
        pos: w.pos,
        meaning_zh: w.meaning_zh,
        meaning_en: w.meaning_en,
        example_en: w.example_en,
        context,
      })
    },
    []
  )

  const pickWord = useCallback(
    async (surface: string, paragraphText: string, offset: number) => {
      const context = sentenceAt(paragraphText, offset)
      const key = keyWordMap.get(surface.toLowerCase())
      if (key) {
        showKeyWord(key, context)
        return
      }
      setError(null)
      setLooking(true)
      setEntry(null)
      try {
        const res = await fetch('/api/reading/lookup', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ word: surface, sentence: context }),
        })
        if (!res.ok) throw new Error('lookup failed')
        const data = (await res.json()) as Omit<Entry, 'surface' | 'context'>
        setEntry({ ...data, surface, context })
      } catch {
        setError(`查不到「${surface}」，請再點一次。`)
      } finally {
        setLooking(false)
      }
    },
    [keyWordMap, showKeyWord]
  )

  const save = useCallback(
    async (e: Entry) => {
      if (saved.has(e.word)) return
      setSaving(true)
      try {
        const res = await fetch('/api/words', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            word: e.word,
            pos: e.pos,
            meaning_zh: e.meaning_zh,
            meaning_en: e.meaning_en,
            example_en: e.example_en,
            source_type: 'reading',
            source_id: article.id,
            sentence: e.context,
            surface_form: e.surface,
          }),
        })
        if (!res.ok) throw new Error('save failed')
        setSaved((prev) => new Set(prev).add(e.word))
      } catch {
        setError('存入生字本失敗，請再試一次。')
      } finally {
        setSaving(false)
      }
    },
    [saved, article.id]
  )

  const saveKeyWord = (w: ReadingWord) =>
    save({
      word: w.word.toLowerCase(),
      surface: w.word,
      pos: w.pos,
      meaning_zh: w.meaning_zh,
      meaning_en: w.meaning_en,
      example_en: w.example_en,
      context: findSentence(article.paragraphs, w.word),
    })

  const panel = (
    <>
      {looking && (
        <p className="text-sm text-ink/70" role="status">
          查詢中…
        </p>
      )}
      {error && <p className="text-sm text-ink/80">{error}</p>}
      {entry && (
        <div>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-display text-2xl font-bold" translate="no">
                {entry.word}
              </p>
              {entry.pos && (
                <p className="text-xs text-ink/65" translate="no">
                  {entry.pos}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => setEntry(null)}
              aria-label="關閉"
              className="rounded-sm p-1 text-ink/65 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40 lg:hidden"
            >
              <X className="size-4" />
            </button>
          </div>
          <p className="mt-2 text-base font-semibold">{entry.meaning_zh}</p>
          {entry.meaning_en && (
            <p className="mt-1 text-sm text-ink/70" translate="no">
              {entry.meaning_en}
            </p>
          )}
          {entry.example_en && (
            <p className="mt-3 text-sm leading-relaxed text-ink/80" translate="no">
              例句：{entry.example_en}
            </p>
          )}
          <button
            type="button"
            onClick={() => save(entry)}
            disabled={saving || saved.has(entry.word)}
            className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-ink px-4 py-2 text-sm font-semibold text-paper transition hover:bg-ink/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40 focus-visible:ring-offset-2 disabled:opacity-60"
          >
            {saved.has(entry.word) ? (
              <>
                <Check className="size-4" /> 已在生字本
              </>
            ) : (
              <>
                <Plus className="size-4" /> 存到生字本
              </>
            )}
          </button>
        </div>
      )}
      {!entry && !looking && !error && (
        <p className="text-sm leading-relaxed text-ink/65">
          點文章裡任何一個單字，這裡會顯示它在這句話的意思。黃色螢光的是今日重點單字。
        </p>
      )}
    </>
  )

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_20rem] lg:gap-12">
      <article>
        <header className="mb-8 border-b border-ink/15 pb-6">
          <p className="text-sm text-ink/65">
            {categoryLabel} ·{' '}
            <span translate="no">{categoryEn}</span> · {article.article_date}
          </p>
          <h1
            className="mt-2 text-balance text-3xl font-bold leading-[1.15] md:text-4xl"
            translate="no"
          >
            {article.title}
          </h1>
          {article.source_url && (
            <p className="mt-3 text-sm text-ink/70">
              新聞來源：
              <a
                href={article.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-sm font-semibold text-ink underline decoration-ink/30 underline-offset-4 hover:decoration-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40"
                translate="no"
              >
                {article.source_name ?? '原文'}
              </a>
              （看原文全文）
            </p>
          )}
          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
            <label className="inline-flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={showZh}
                onChange={(e) => setShowZh(e.target.checked)}
                className="size-4 accent-ink"
              />
              顯示中文翻譯
            </label>
            <Link
              href="/reading/vocab"
              className="rounded-sm font-semibold underline decoration-ink/30 underline-offset-4 hover:decoration-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40"
            >
              我的生字本（{saved.size}）
            </Link>
            <Link
              href={`/reading/archive?category=${article.category}`}
              className="rounded-sm font-semibold underline decoration-ink/30 underline-offset-4 hover:decoration-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40"
            >
              往期文章
            </Link>
          </div>
        </header>

        <div className="space-y-6">
          {article.paragraphs.map((p, i) => (
            <div key={i}>
              <p className="text-lg leading-[1.9]" translate="no">
                <Tokens
                  text={p.en}
                  keyWords={keyWordSet}
                  activeWord={entry?.surface.toLowerCase() ?? null}
                  onPick={(surface, offset) => pickWord(surface, p.en, offset)}
                />
              </p>
              {showZh && (
                <p className="mt-2 border-l-2 border-ink/15 pl-4 text-sm leading-relaxed text-ink/70">
                  {p.zh}
                </p>
              )}
            </div>
          ))}
        </div>

        <section className="mt-12 border-t border-ink/15 pt-8">
          <h2 className="text-xl font-bold">文章解析</h2>
          <p className="mt-3 text-sm leading-relaxed text-ink/80">{article.summary_zh}</p>
          {article.takeaways_zh.length > 0 && (
            <ul className="mt-4 space-y-2 text-sm leading-relaxed">
              {article.takeaways_zh.map((t, i) => (
                <li key={i} className="flex gap-3">
                  <span className="font-display font-semibold tabular-nums text-ink/65">
                    {i + 1}
                  </span>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-6 text-xs text-ink/55">
            {article.source_url
              ? '本文為 AI 依新聞標題與摘要撰寫的英文學習解說，並非原文全文或翻譯；細節與數據請以原文報導為準。'
              : '本文由 AI 撰寫，用於英文學習，不代表真實新聞或數據。'}
          </p>
        </section>
      </article>

      <aside className="lg:sticky lg:top-6 lg:self-start">
        {/* 查詢結果：大螢幕在右側，手機浮在畫面底部 */}
        <div
          className={`border-t-4 border-mark bg-white p-5 shadow-[0_-4px_16px_rgba(26,36,48,0.12)] max-lg:fixed max-lg:inset-x-0 max-lg:bottom-0 max-lg:z-20 max-lg:max-h-[55vh] max-lg:overflow-y-auto lg:border lg:border-t-4 lg:shadow-none ${
            entry || looking || error ? '' : 'max-lg:hidden'
          }`}
          aria-live="polite"
        >
          {panel}
        </div>

        <section className="mt-8">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-lg font-bold">今日重點單字</h2>
            <span className="text-sm text-ink/65">{article.key_words.length} 個</span>
          </div>
          <ul className="border-b border-ink/15">
            {article.key_words.map((w) => {
              const lower = w.word.toLowerCase()
              const isSaved = saved.has(lower)
              return (
                <li
                  key={lower}
                  className="flex items-start gap-2 border-t border-ink/15 py-3"
                >
                  <button
                    type="button"
                    onClick={() => showKeyWord(w, findSentence(article.paragraphs, w.word))}
                    className="min-w-0 flex-1 rounded-sm text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40"
                  >
                    <span className="font-semibold" translate="no">
                      <span className="mark-hover">{w.word}</span>
                    </span>
                    <span className="ml-2 text-xs text-ink/65" translate="no">
                      {w.pos}
                    </span>
                    <span className="mt-0.5 block text-sm text-ink/75">{w.meaning_zh}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => saveKeyWord(w)}
                    disabled={isSaved || saving}
                    aria-label={isSaved ? `${w.word} 已在生字本` : `把 ${w.word} 存到生字本`}
                    className="mt-0.5 rounded-sm p-1.5 text-ink/65 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40 disabled:text-ink/40"
                  >
                    {isSaved ? <Check className="size-4" /> : <Plus className="size-4" />}
                  </button>
                </li>
              )
            })}
          </ul>
        </section>
      </aside>
    </div>
  )
}
