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
  Summary: 'text-[#8A6508] bg-[#FBF0C8] border-[#EBD891]',
  Experience: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  Skills: 'text-stone-700 bg-stone-100 border-stone-300',
  Structure: 'text-orange-700 bg-orange-50 border-orange-200',
  Keywords: 'text-cyan-700 bg-cyan-50 border-cyan-200',
}

const PRIORITY_TONE: Record<Priority, string> = {
  high: 'bg-rose-100 text-rose-700 border-rose-200',
  medium: 'bg-amber-100 text-amber-800 border-amber-200',
  low: 'bg-slate-100 text-slate-600 border-slate-200',
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
      className="rounded-xl border border-slate-200 bg-white p-6 space-y-5"
    >
      <div>
        <label
          htmlFor="jd"
          className="block text-sm font-semibold text-slate-900 mb-1"
        >
          Job Description <span className="text-red-500">*</span>
        </label>
        <p className="text-xs text-slate-500 mb-2">
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
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 focus:outline-none resize-y font-mono"
          disabled={state === 'loading'}
          translate="no"
        />
        <div className="flex justify-between text-[11px] text-slate-400 mt-1 tabular-nums">
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
          className="block text-sm font-semibold text-slate-900 mb-1"
        >
          你的英文履歷 <span className="text-red-500">*</span>
        </label>
        <p className="text-xs text-slate-500 mb-2">
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
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 focus:outline-none resize-y font-mono"
          disabled={state === 'loading'}
          translate="no"
        />
        <div className="flex justify-between text-[11px] text-slate-400 mt-1 tabular-nums">
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
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600 leading-relaxed">
        <span className="font-semibold text-slate-700">隱私提醒：</span>
        內容會傳給 OpenAI 做分析，不會存到資料庫，重新整理頁面就消失。避免貼敏感個資（身分證、地址）。
      </div>

      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full rounded-md bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 transition disabled:bg-slate-300 disabled:cursor-not-allowed"
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
      ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
      : result.match_score >= 50
        ? 'text-amber-800 bg-amber-50 border-amber-200'
        : 'text-rose-700 bg-rose-50 border-rose-200'

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
        className={`rounded-xl border p-6 ${scoreTone.replace('text-', 'bg-').split(' ')[0].replace('bg-', 'border-')} ${scoreTone}`}
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
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-1">
          關鍵字對照
        </h2>
        <p className="text-xs text-slate-500 mb-5">
          JD 常見關鍵字在你履歷有沒有出現。缺的優先補進 Summary 或 Skills。
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 uppercase">
                Matched
              </span>
              <span className="text-xs text-slate-500 tabular-nums">
                {result.keyword_match.matched.length}
              </span>
            </div>
            {result.keyword_match.matched.length === 0 ? (
              <p className="text-xs text-slate-400 italic">
                沒抓到明顯對得上的關鍵字
              </p>
            ) : (
              <ul className="flex flex-wrap gap-1.5">
                {result.keyword_match.matched.map((k) => (
                  <li
                    key={k}
                    className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800"
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
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 uppercase">
                Missing
              </span>
              <span className="text-xs text-slate-500 tabular-nums">
                {result.keyword_match.missing.length}
              </span>
            </div>
            {result.keyword_match.missing.length === 0 ? (
              <p className="text-xs text-slate-400 italic">
                JD 主要關鍵字都有涵蓋，讚
              </p>
            ) : (
              <ul className="flex flex-wrap gap-1.5">
                {result.keyword_match.missing.map((k) => (
                  <li
                    key={k}
                    className="text-xs font-mono px-2 py-0.5 rounded bg-rose-50 border border-rose-200 text-rose-800"
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
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-1">
            AI 改寫的 {result.bullet_rewrites.length} 條 bullet
          </h2>
          <p className="text-xs text-slate-500 mb-6">
            挑最需要修的幾條 — 動詞 + 策略 + 量化成果，並對齊 JD 關鍵字。
          </p>
          <div className="space-y-6">
            {result.bullet_rewrites.map((b, i) => (
              <article
                key={i}
                className="rounded-xl border border-slate-200 bg-slate-50 overflow-hidden"
              >
                <div className="border-b border-slate-200 bg-white px-4 py-2 flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-900 text-white">
                    #{i + 1}
                  </span>
                  <span className="text-xs text-slate-600">Bullet 改寫</span>
                </div>
                <div className="p-4 space-y-3">
                  <div className="rounded-md border border-rose-200 bg-rose-50/40">
                    <div className="px-3 pt-2">
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 uppercase">
                        Original
                      </span>
                    </div>
                    <p
                      className="text-sm text-slate-800 leading-relaxed px-3 py-2"
                      translate="no"
                    >
                      {b.original}
                    </p>
                  </div>
                  <div className="rounded-md border border-emerald-200 bg-emerald-50/40">
                    <div className="px-3 pt-2">
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 uppercase">
                        Improved
                      </span>
                    </div>
                    <p
                      className="text-sm text-slate-800 leading-relaxed px-3 py-2"
                      translate="no"
                    >
                      {b.improved}
                    </p>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed pl-1">
                    <span className="font-semibold text-slate-700">
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
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-1">
            {result.suggestions.length} 個具體建議
          </h2>
          <p className="text-xs text-slate-500 mb-5">
            依優先順序排 — 先把「現在就改」的做完再看下一批。
          </p>
          <ul className="space-y-3">
            {result.suggestions.map((s, i) => (
              <li
                key={i}
                className="rounded-lg border border-slate-200 bg-slate-50 p-4"
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
                <p className="text-sm text-slate-800 leading-relaxed">
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
          className="rounded-md bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 transition"
        >
          ← 換一份 JD 或履歷再健檢
        </button>
      </div>
    </div>
  )
}
