'use client'

import { useState } from 'react'
import { SpeakingSession } from '../[id]/session-client'

type FW = 'STAR' | 'PREP' | 'SCQA' | 'PYRAMID'

type Recommendation = {
  recommended_framework: FW
  recommended_reason_zh: string
  framework_hint_zh: string
  alternative_framework: FW | null
  alternative_when_zh: string
  prompt_en: string
  title_zh: string
}

const FRAMEWORK_COLOR: Record<FW, string> = {
  STAR: 'text-ink bg-mark/30 border-mark',
  PREP: 'text-ink bg-mark/25 border-mark',
  SCQA: 'text-ink/80 bg-paper border-ink/25',
  PYRAMID: 'text-pen bg-pen/10 border-pen/30',
}

const FRAMEWORK_DESC: Record<FW, string> = {
  STAR: '過去經驗 · 行為題',
  PREP: '表達意見 · 立場',
  SCQA: '說服 · 提案',
  PYRAMID: 'Exec 溝通 · 答案先行',
}

export function CustomScenarioWizard() {
  const [context, setContext] = useState('')
  const [promptEn, setPromptEn] = useState('')
  const [state, setState] = useState<'form' | 'loading' | 'reviewing' | 'practicing'>(
    'form'
  )
  const [error, setError] = useState<string | null>(null)
  const [rec, setRec] = useState<Recommendation | null>(null)
  const [chosenFramework, setChosenFramework] = useState<FW | null>(null)

  async function submitForm(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setState('loading')
    try {
      const res = await fetch('/api/speaking/recommend-framework', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          context: context.trim(),
          promptEn: promptEn.trim() || undefined,
        }),
      })
      const j = await res.json()
      if (!res.ok) throw new Error(j.error ?? 'recommend failed')
      setRec(j)
      setChosenFramework(j.recommended_framework)
      setState('reviewing')
    } catch (err) {
      setState('form')
      setError(err instanceof Error ? err.message : 'recommend failed')
    }
  }

  if (state === 'practicing' && rec && chosenFramework) {
    return (
      <SpeakingSession
        titleZh={rec.title_zh}
        promptEn={rec.prompt_en}
        contextZh={context}
        framework={chosenFramework}
        frameworkHintZh={rec.framework_hint_zh}
        difficulty={3}
        tags={['自訂']}
        isCustom
      />
    )
  }

  if (state === 'reviewing' && rec) {
    const chosen = chosenFramework ?? rec.recommended_framework
    return (
      <div className="space-y-6">
        <section className="rounded-lg border border-ink/15 bg-white p-6">
          <div className="text-xs font-medium tracking-wide uppercase text-ink/65 mb-2">
            AI 的建議
          </div>
          <div className="flex flex-wrap items-baseline gap-3 mb-3">
            <span
              className={`text-sm font-mono font-bold px-2.5 py-1 rounded border ${FRAMEWORK_COLOR[rec.recommended_framework]}`}
            >
              {rec.recommended_framework}
            </span>
            <span className="text-sm text-ink/70">
              {FRAMEWORK_DESC[rec.recommended_framework]}
            </span>
          </div>
          <p className="text-sm text-ink/80 leading-relaxed">
            {rec.recommended_reason_zh}
          </p>

          {rec.alternative_framework && (
            <div className="mt-4 pt-4 border-t border-ink/10">
              <div className="text-[11px] font-medium text-ink/65 uppercase tracking-wide mb-1">
                備選
              </div>
              <div className="flex items-baseline gap-2 mb-1">
                <span
                  className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded border ${FRAMEWORK_COLOR[rec.alternative_framework]}`}
                >
                  {rec.alternative_framework}
                </span>
                <span className="text-xs text-ink/65">
                  {FRAMEWORK_DESC[rec.alternative_framework]}
                </span>
              </div>
              <p className="text-xs text-ink/70">{rec.alternative_when_zh}</p>
            </div>
          )}
        </section>

        <section className="rounded-lg border border-ink/15 bg-white p-6">
          <div className="text-xs font-medium tracking-wide uppercase text-ink/65 mb-3">
            你要練習的英文提問
          </div>
          <p className="text-base text-ink leading-relaxed" translate="no">
            &ldquo;{rec.prompt_en}&rdquo;
          </p>
        </section>

        <section className="rounded-lg border border-mark bg-mark/25 p-6">
          <div className="text-xs font-medium text-ink uppercase tracking-wide mb-2">
            {chosen} 應用提示（針對這個情境）
          </div>
          <p className="text-sm text-ink leading-relaxed whitespace-pre-line">
            {rec.framework_hint_zh}
          </p>
        </section>

        {/* 允許改用備選框架 */}
        {rec.alternative_framework && (
          <section className="rounded-lg border border-ink/15 bg-white p-4">
            <div className="text-xs font-medium text-ink/65 mb-2">
              要用哪個框架練？
            </div>
            <div className="flex gap-2">
              {(
                [rec.recommended_framework, rec.alternative_framework] as FW[]
              ).map((fw) => (
                <button
                  key={fw}
                  type="button"
                  onClick={() => setChosenFramework(fw)}
                  className={`text-xs px-3 py-1.5 rounded-md border transition ${
                    chosen === fw
                      ? `${FRAMEWORK_COLOR[fw]} font-semibold`
                      : 'bg-white border-ink/15 text-ink/80 hover:border-ink/40'
                  }`}
                >
                  {fw}
                  {fw === rec.recommended_framework && (
                    <span className="ml-1 opacity-70">（建議）</span>
                  )}
                </button>
              ))}
            </div>
          </section>
        )}

        <div className="flex flex-wrap justify-center gap-2 pt-2">
          <button
            type="button"
            onClick={() => {
              setState('form')
              setRec(null)
              setChosenFramework(null)
            }}
            className="rounded-md border border-ink/25 bg-white px-4 py-2 text-sm text-ink/80 hover:bg-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40 transition"
          >
            ← 改情境
          </button>
          <button
            type="button"
            onClick={() => setState('practicing')}
            className="rounded-md bg-ink px-5 py-2 text-sm font-semibold text-white hover:bg-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40 transition"
          >
            用 {chosen} 開始練習 →
          </button>
        </div>
      </div>
    )
  }

  // form / loading
  return (
    <form
      onSubmit={submitForm}
      className="rounded-lg border border-ink/15 bg-white p-6 space-y-5"
    >
      <div>
        <label
          htmlFor="context"
          className="block text-sm font-semibold text-ink mb-1"
        >
          情境描述 <span className="text-pen">*</span>
        </label>
        <p className="text-xs text-ink/65 mb-2">
          誰在問你、你想達成什麼、有什麼背景資訊，越具體 AI 挑得越準。
        </p>
        <textarea
          id="context"
          required
          minLength={10}
          maxLength={800}
          rows={5}
          value={context}
          onChange={(e) => setContext(e.target.value)}
          placeholder="例：下週要跟 VP of Product 一對一，他會問我為什麼上個 sprint 的 velocity 掉了 30%，我想解釋原因但不要聽起來像找藉口。"
          className="w-full rounded-md border border-ink/25 bg-white px-3 py-2 text-sm text-ink placeholder-ink/50 focus:border-ink/50 focus:ring-2 focus:ring-ink/15 focus:outline-none resize-y"
          disabled={state === 'loading'}
        />
        <div className="text-[11px] text-ink/60 mt-1 text-right tabular-nums">
          {context.length} / 800
        </div>
      </div>

      <div>
        <label
          htmlFor="promptEn"
          className="block text-sm font-semibold text-ink mb-1"
        >
          對方的英文提問 <span className="text-ink/60">(optional)</span>
        </label>
        <p className="text-xs text-ink/65 mb-2">
          知道對方會怎麼問就填，沒填 AI 會幫你寫一句。
        </p>
        <input
          id="promptEn"
          type="text"
          maxLength={300}
          value={promptEn}
          onChange={(e) => setPromptEn(e.target.value)}
          placeholder="e.g. Why did velocity drop last sprint?"
          className="w-full rounded-md border border-ink/25 bg-white px-3 py-2 text-sm text-ink placeholder-ink/50 focus:border-ink/50 focus:ring-2 focus:ring-ink/15 focus:outline-none"
          disabled={state === 'loading'}
          translate="no"
        />
      </div>

      {error && (
        <p className="text-sm text-pen" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={state === 'loading' || context.trim().length < 10}
        className="w-full rounded-md bg-ink px-4 py-2.5 text-sm font-semibold text-white hover:bg-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40 transition disabled:bg-ink/20 disabled:cursor-not-allowed"
      >
        {state === 'loading' ? (
          <span className="inline-flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded-full border-2 border-white/40 border-t-white animate-spin" />
            AI 挑框架中...
          </span>
        ) : (
          '讓 AI 挑框架 →'
        )}
      </button>
    </form>
  )
}
