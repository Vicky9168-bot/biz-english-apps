'use client'

import { useState } from 'react'
import { SpeakingSession } from '../[id]/session-client'
import { SectionTitle } from '@/app/page-kit'

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
      <div className="space-y-10">
        <section>
          <SectionTitle title="AI 的建議" />
          <p className="mb-3 flex flex-wrap items-baseline gap-3">
            <span className="hl-mark font-display text-3xl font-bold">
              {rec.recommended_framework}
            </span>
            <span className="text-sm text-ink/70">
              {FRAMEWORK_DESC[rec.recommended_framework]}
            </span>
          </p>
          <p className="max-w-xl text-sm leading-relaxed text-ink/80">
            {rec.recommended_reason_zh}
          </p>

          {rec.alternative_framework && (
            <div className="mt-5 border-t border-ink/15 pt-4">
              <p className="mb-1 text-sm text-ink/65">備選</p>
              <p className="mb-1 flex items-baseline gap-2">
                <span className="font-display text-lg font-bold">
                  {rec.alternative_framework}
                </span>
                <span className="text-sm text-ink/65">
                  {FRAMEWORK_DESC[rec.alternative_framework]}
                </span>
              </p>
              <p className="text-sm text-ink/70">{rec.alternative_when_zh}</p>
            </div>
          )}
        </section>

        <section>
          <SectionTitle title="你要練習的英文提問" />
          <p
            className="border-l-4 border-ink/25 pl-5 text-lg leading-relaxed"
            translate="no"
          >
            &ldquo;{rec.prompt_en}&rdquo;
          </p>
        </section>

        <section className="border-l-4 border-mark pl-5">
          <h2 className="mb-2 text-lg font-bold">
            {chosen} 應用提示（針對這個情境）
          </h2>
          <p className="whitespace-pre-line text-sm leading-relaxed">
            {rec.framework_hint_zh}
          </p>
        </section>

        {/* 允許改用備選框架 */}
        {rec.alternative_framework && (
          <section>
            <p className="mb-2 text-sm text-ink/65">要用哪個框架練？</p>
            <div className="flex gap-2">
              {(
                [rec.recommended_framework, rec.alternative_framework] as FW[]
              ).map((fw) => (
                <button
                  key={fw}
                  type="button"
                  onClick={() => setChosenFramework(fw)}
                  aria-pressed={chosen === fw}
                  className={`rounded-md border px-4 py-2 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40 ${
                    chosen === fw
                      ? 'border-mark bg-mark font-semibold text-ink'
                      : 'border-ink/25 text-ink hover:border-ink'
                  }`}
                >
                  {fw}
                  {fw === rec.recommended_framework && (
                    <span className="ml-1 text-ink/70">（建議）</span>
                  )}
                </button>
              ))}
            </div>
          </section>
        )}

        <div className="flex flex-wrap gap-3 border-t border-ink/15 pt-6">
          <button
            type="button"
            onClick={() => {
              setState('form')
              setRec(null)
              setChosenFramework(null)
            }}
            className="rounded-md border border-ink/25 px-4 py-2.5 text-sm text-ink hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40 transition"
          >
            改情境
          </button>
          <button
            type="button"
            onClick={() => setState('practicing')}
            className="rounded-md bg-ink px-5 py-2.5 text-sm font-semibold text-paper hover:bg-ink/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40 focus-visible:ring-offset-2 transition"
          >
            用 {chosen} 開始練習
          </button>
        </div>
      </div>
    )
  }

  // form / loading
  return (
    <form
      onSubmit={submitForm}
      className="space-y-6"
    >
      <div>
        <label
          htmlFor="context"
          className="block text-sm font-semibold text-ink mb-1"
        >
          情境描述 <span className="text-pen">*</span>
        </label>
        <p className="text-sm text-ink/65 mb-2">
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
          className="w-full rounded-sm border border-ink/25 bg-white px-3 py-2 text-sm leading-relaxed text-ink placeholder-ink/50 focus:border-ink focus:ring-1 focus:ring-ink focus:outline-none resize-y"
          disabled={state === 'loading'}
        />
        <div className="mt-1 text-right text-sm text-ink/65 tabular-nums">
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
        <p className="text-sm text-ink/65 mb-2">
          知道對方會怎麼問就填，沒填 AI 會幫你寫一句。
        </p>
        <input
          id="promptEn"
          type="text"
          maxLength={300}
          value={promptEn}
          onChange={(e) => setPromptEn(e.target.value)}
          placeholder="e.g. Why did velocity drop last sprint?"
          className="w-full rounded-sm border border-ink/25 bg-white px-3 py-2 text-sm text-ink placeholder-ink/50 focus:border-ink focus:ring-1 focus:ring-ink focus:outline-none"
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
        className="w-full rounded-md bg-ink px-4 py-2.5 text-sm font-semibold text-paper hover:bg-ink/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40 transition disabled:bg-ink/20 disabled:cursor-not-allowed"
      >
        {state === 'loading' ? (
          <span className="inline-flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded-full border-2 border-paper/40 border-t-paper animate-spin" />
            AI 挑框架中...
          </span>
        ) : (
          '讓 AI 挑框架'
        )}
      </button>
    </form>
  )
}
