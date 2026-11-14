'use client'

import { useState } from 'react'

type Category = 'Summary' | 'Experience' | 'Skills' | 'Structure' | 'Keywords'
type Priority = 'high' | 'medium' | 'low'

type Result = {
  match_score: number
  score_reason_zh: string
  keyword_match: {
    matched: string[]
    missing: string[]
  }
  bullet_rewrites: Array<{
    original: string
    improved: string
    why_zh: string
  }>
  suggestions: Array<{
    category: Category
    priority: Priority
    tip_zh: string
  }>
}

const CATEGORY_TONE: Record<Category, string> = {
  Summary: 'text-ink bg-mark/30 border-mark',
  Experience: 'text-ink bg-mark/25 border-mark',
  Skills: 'text-ink/80 bg-paper border-ink/25',
  Structure: 'text-pen bg-pen/10 border-pen/30',
  Keywords: 'text-ink bg-paper border-ink/15',
}

const PRIORITY_TONE: Record<Priority, string> = {
  high: 'bg-pen/15 text-pen border-pen/30',
  medium: 'bg-mark/40 text-ink border-mark',
  low: 'bg-paper text-ink/70 border-ink/15',
}

const PRIORITY_LABEL: Record<Priority, string> = {
  high: '現在就改',
  medium: '面試前搞定',
  low: '有空優化',
}

const JD_MIN = 50
const JD_MAX = 4000
const RESUME_MIN = 100
const RESUME_MAX = 6000

export default function HealthCheckClient() {
  const [jd, setJd] = useState('')
  const [resume, setResume] = useState('')
  const [state, setState] = useState<'form' | 'loading' | 'result'>('form')
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<Result | null>(null)

  const jdOk = jd.trim().length >= JD_MIN && jd.trim().length <= JD_MAX
  const resumeOk =
    resume.trim().length >= RESUME_MIN && resume.trim().length <= RESUME_MAX
  const canSubmit = jdOk && resumeOk && state !== 'loading'

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setError(null)
    setState('loading')
    try {
      const res = await fetch('/api/resume/health-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jd: jd.trim(), resume: resume.trim() }),
      })
      const j = await res.json()
      if (!res.ok) throw new Error(j.error ?? 'health check failed')
      setResult(j as Result)
      setState('result')
    } catch (err) {
      setState('form')
      setError(err instanceof Error ? err.message : 'health check failed')
    }
  }

  function reset() {
    setResult(null)
    setError(null)
    setState('form')
  }

  if (state === 'result' && result) {
    return <ResultView result={result} onReset={reset} />
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-lg border border-ink/15 bg-white p-6 space-y-5"
    >
      <div>
        <label
          htmlFor="jd"
          className="block text-sm font-semibold text-ink mb-1"
        >
          Job Description <span className="text-pen">*</span>
        </label>
        <p className="text-xs text-ink/65 mb-2">
          貼上你想投的完整 JD（含 Responsibilities、Qualifications 越好）。
        </p>
        <textarea
          id="jd"
          required
          minLength={JD_MIN}
          maxLength={JD_MAX}
          rows={8}
          value={jd}
          onChange={(e) => setJd(e.target.value)}
          placeholder="Paste the full job description here..."
          className="w-full rounded-md border border-ink/25 bg-white px-3 py-2 text-sm text-ink placeholder-ink/50 focus:border-ink/50 focus:ring-2 focus:ring-ink/15 focus:outline-none resize-y font-mono"
          disabled={state === 'loading'}
          translate="no"
        />
        <div className="flex justify-between text-[11px] text-ink/60 mt-1 tabular-nums">
          <span>
            {jd.trim().length < JD_MIN
              ? `至少再輸入 ${JD_MIN - jd.trim().length} 字`
              : ''}
          </span>
          <span>
            {jd.length} / {JD_MAX}
          </span>
        </div>
      </div>

      <div>
        <label
          htmlFor="resume"
          className="block text-sm font-semibold text-ink mb-1"
        >
          你的英文履歷 <span className="text-pen">*</span>
        </label>
        <p className="text-xs text-ink/65 mb-2">
          貼 Summary + Work Experience 段落即可，不用整份 PDF 文字。
        </p>
        <textarea
          id="resume"
          required
          minLength={RESUME_MIN}
          maxLength={RESUME_MAX}
          rows={10}
          value={resume}
          onChange={(e) => setResume(e.target.value)}
          placeholder={`Summary:\n...\n\nWork Experience:\n- Company A, Title, Date\n  · Bullet 1\n  · Bullet 2`}
          className="w-full rounded-md border border-ink/25 bg-white px-3 py-2 text-sm text-ink placeholder-ink/50 focus:border-ink/50 focus:ring-2 focus:ring-ink/15 focus:outline-none resize-y font-mono"
          disabled={state === 'loading'}
          translate="no"
        />
        <div className="flex justify-between text-[11px] text-ink/60 mt-1 tabular-nums">
          <span>
            {resume.trim().length < RESUME_MIN
              ? `至少再輸入 ${RESUME_MIN - resume.trim().length} 字`
              : ''}
          </span>
          <span>
            {resume.length} / {RESUME_MAX}
          </span>
        </div>
      </div>

      {error && (
        <p className="text-sm text-pen" role="alert">
          {error}
        </p>
      )}

      <div className="rounded-md border border-ink/15 bg-paper p-3 text-xs text-ink/70 leading-relaxed">
        <span className="font-semibold text-ink/80">隱私提醒：</span>
        內容會傳給 OpenAI 做分析，不會存到資料庫，重新整理頁面就消失。避免貼敏感個資（身分證、地址）。
      </div>

      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full rounded-md bg-ink px-4 py-2.5 text-sm font-semibold text-white hover:bg-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40 transition disabled:bg-ink/20 disabled:cursor-not-allowed"
      >
        {state === 'loading' ? (
          <span className="inline-flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded-full border-2 border-white/40 border-t-white animate-spin" />
            AI 分析中... 約 30 秒
          </span>
        ) : (
          '開始健檢 →'
        )}
      </button>
    </form>
  )
}

function ResultView({
  result,
  onReset,
}: {
  result: Result
  onReset: () => void
}) {
  const scoreTone =
    result.match_score >= 75
      ? 'text-ink bg-mark/25 border-mark'
      : result.match_score >= 50
        ? 'text-ink bg-mark/25 border-mark'
        : 'text-pen bg-pen/10 border-pen/30'

  const scoreLabel =
    result.match_score >= 75
      ? '契合度高'
      : result.match_score >= 50
        ? '有改進空間'
        : '要大改'

  return (
    <div className="space-y-6">
      {/* Score */}
      <section
        className={`rounded-lg border p-6 ${scoreTone.replace('text-', 'bg-').split(' ')[0].replace('bg-', 'border-')} ${scoreTone}`}
      >
        <div className="flex items-baseline justify-between gap-4">
          <div>
            <div className="text-xs font-medium uppercase tracking-wide mb-1 opacity-80">
              Match Score
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-bold tabular-nums">
                {result.match_score}
              </span>
              <span className="text-lg opacity-70">/ 100</span>
              <span className="text-sm font-semibold ml-2">
                · {scoreLabel}
              </span>
            </div>
          </div>
        </div>
        <p className="text-sm leading-relaxed mt-3 opacity-90">
          {result.score_reason_zh}
        </p>
      </section>

      {/* Keyword match */}
      <section className="rounded-lg border border-ink/15 bg-white p-6">
        <h2 className="text-lg font-semibold text-ink mb-1">
          關鍵字對照
        </h2>
        <p className="text-xs text-ink/65 mb-5">
          JD 常見關鍵字在你履歷有沒有出現。缺的優先補進 Summary 或 Skills。
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-mark/40 text-ink uppercase">
                Matched
              </span>
              <span className="text-xs text-ink/65 tabular-nums">
                {result.keyword_match.matched.length}
              </span>
            </div>
            {result.keyword_match.matched.length === 0 ? (
              <p className="text-xs text-ink/60 italic">
                沒抓到明顯對得上的關鍵字
              </p>
            ) : (
              <ul className="flex flex-wrap gap-1.5">
                {result.keyword_match.matched.map((k) => (
                  <li
                    key={k}
                    className="text-xs font-mono px-2 py-0.5 rounded bg-mark/25 border border-mark text-ink"
                    translate="no"
                  >
                    {k}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-pen/15 text-pen uppercase">
                Missing
              </span>
              <span className="text-xs text-ink/65 tabular-nums">
                {result.keyword_match.missing.length}
              </span>
            </div>
            {result.keyword_match.missing.length === 0 ? (
              <p className="text-xs text-ink/60 italic">
                JD 主要關鍵字都有涵蓋，讚
              </p>
            ) : (
              <ul className="flex flex-wrap gap-1.5">
                {result.keyword_match.missing.map((k) => (
                  <li
                    key={k}
                    className="text-xs font-mono px-2 py-0.5 rounded bg-pen/10 border border-pen/30 text-pen"
                    translate="no"
                  >
                    {k}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      {/* Bullet rewrites */}
      {result.bullet_rewrites.length > 0 && (
        <section className="rounded-lg border border-ink/15 bg-white p-6">
          <h2 className="text-lg font-semibold text-ink mb-1">
            AI 改寫的 {result.bullet_rewrites.length} 條 bullet
          </h2>
          <p className="text-xs text-ink/65 mb-6">
            挑最需要修的幾條 — 動詞 + 策略 + 量化成果，並對齊 JD 關鍵字。
          </p>
          <div className="space-y-6">
            {result.bullet_rewrites.map((b, i) => (
              <article
                key={i}
                className="rounded-lg border border-ink/15 bg-paper overflow-hidden"
              >
                <div className="border-b border-ink/15 bg-white px-4 py-2 flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-ink text-white">
                    #{i + 1}
                  </span>
                  <span className="text-xs text-ink/70">Bullet 改寫</span>
                </div>
                <div className="p-4 space-y-3">
                  <div className="rounded-md border border-pen/30 bg-pen/4">
                    <div className="px-3 pt-2">
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-pen/15 text-pen uppercase">
                        Original
                      </span>
                    </div>
                    <p
                      className="text-sm text-ink leading-relaxed px-3 py-2"
                      translate="no"
                    >
                      {b.original}
                    </p>
                  </div>
                  <div className="rounded-md border border-mark bg-mark/10">
                    <div className="px-3 pt-2">
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-mark/40 text-ink uppercase">
                        Improved
                      </span>
                    </div>
                    <p
                      className="text-sm text-ink leading-relaxed px-3 py-2"
                      translate="no"
                    >
                      {b.improved}
                    </p>
                  </div>
                  <p className="text-xs text-ink/70 leading-relaxed pl-1">
                    <span className="font-semibold text-ink/80">
                      Why：
                    </span>
                    {b.why_zh}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Suggestions */}
      {result.suggestions.length > 0 && (
        <section className="rounded-lg border border-ink/15 bg-white p-6">
          <h2 className="text-lg font-semibold text-ink mb-1">
            {result.suggestions.length} 個具體建議
          </h2>
          <p className="text-xs text-ink/65 mb-5">
            依優先順序排 — 先把「現在就改」的做完再看下一批。
          </p>
          <ul className="space-y-3">
            {result.suggestions.map((s, i) => (
              <li
                key={i}
                className="rounded-lg border border-ink/15 bg-paper p-4"
              >
                <div className="flex flex-wrap items-baseline gap-2 mb-2">
                  <span
                    className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded border ${CATEGORY_TONE[s.category]}`}
                    translate="no"
                  >
                    {s.category}
                  </span>
                  <span
                    className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded border ${PRIORITY_TONE[s.priority]}`}
                  >
                    {PRIORITY_LABEL[s.priority]}
                  </span>
                </div>
                <p className="text-sm text-ink leading-relaxed">
                  {s.tip_zh}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Actions */}
      <div className="flex justify-center pt-2">
        <button
          type="button"
          onClick={onReset}
          className="rounded-md bg-ink px-5 py-2.5 text-sm font-semibold text-white hover:bg-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40 transition"
        >
          ← 換一份 JD 或履歷再健檢
        </button>
      </div>
    </div>
  )
}
