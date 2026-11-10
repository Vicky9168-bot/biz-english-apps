'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

type Feedback = {
  userText: string
  tooShort?: boolean
  framework_score: number
  framework_note: string
  vocab_score: number
  vocab_note: string
  grammar_score: number
  grammar_note: string
  fluency_score: number
  fluency_note: string
  rewrites: Array<{ original: string; improved: string; why_zh: string }>
  model_answer_en: string
  next_focus_zh: string
}

const MAX_RECORD_MS = 90_000
const MIN_PREP_S = 30

const FRAMEWORK_COLOR: Record<string, string> = {
  STAR: 'text-[#8A6508] bg-[#FBF0C8] border-[#EBD891]',
  PREP: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  SCQA: 'text-stone-700 bg-stone-100 border-stone-300',
  PYRAMID: 'text-orange-700 bg-orange-50 border-orange-200',
}

export function SpeakingSession({
  scenarioId,
  titleZh,
  promptEn,
  contextZh,
  framework,
  frameworkHintZh,
  difficulty,
  tags,
  isCustom = false,
}: {
  scenarioId?: string
  titleZh: string
  promptEn: string
  contextZh: string | null
  framework: 'STAR' | 'PREP' | 'SCQA' | 'PYRAMID'
  frameworkHintZh: string
  difficulty: number
  tags: string[]
  isCustom?: boolean
}) {
  const [state, setState] = useState<
    'idle' | 'prep' | 'recording' | 'analyzing' | 'done' | 'error'
  >('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const [prepLeft, setPrepLeft] = useState(MIN_PREP_S)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const startedAtRef = useRef<number>(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const prepTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (prepTimerRef.current) clearInterval(prepTimerRef.current)
      // 離開頁面：放棄這段錄音（不送去分析），只釋放麥克風
      const mr = mediaRecorderRef.current
      if (mr) {
        mr.onstop = null
        if (mr.state !== 'inactive') mr.stop()
        mr.stream.getTracks().forEach((t) => t.stop())
      }
    }
  }, [])

  function startPrep() {
    setErrorMsg(null)
    setFeedback(null)
    setPrepLeft(MIN_PREP_S)
    setState('prep')
    prepTimerRef.current = setInterval(() => {
      setPrepLeft((v) => {
        if (v <= 1) {
          if (prepTimerRef.current) {
            clearInterval(prepTimerRef.current)
            prepTimerRef.current = null
          }
          return 0
        }
        return v - 1
      })
    }, 1000)
  }

  function skipPrep() {
    if (prepTimerRef.current) {
      clearInterval(prepTimerRef.current)
      prepTimerRef.current = null
    }
    setPrepLeft(0)
  }

  async function startRecording() {
    setErrorMsg(null)
    setFeedback(null)
    if (prepTimerRef.current) {
      clearInterval(prepTimerRef.current)
      prepTimerRef.current = null
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream)
      chunksRef.current = []
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      mr.onstop = () => {
        stream.getTracks().forEach((t) => t.stop())
        if (timerRef.current) {
          clearInterval(timerRef.current)
          timerRef.current = null
        }
        const blob = new Blob(chunksRef.current, {
          type: mr.mimeType || 'audio/webm',
        })
        void submit(blob)
      }
      mr.start()
      mediaRecorderRef.current = mr
      startedAtRef.current = Date.now()
      setElapsed(0)
      setState('recording')
      timerRef.current = setInterval(() => {
        const e = Math.floor((Date.now() - startedAtRef.current) / 1000)
        setElapsed(e)
        if (e * 1000 >= MAX_RECORD_MS) stopRecording()
      }, 250)
    } catch (err) {
      setState('error')
      setErrorMsg(
        err instanceof Error
          ? `無法取得麥克風權限：${err.message}`
          : '無法取得麥克風權限'
      )
    }
  }

  function stopRecording() {
    const mr = mediaRecorderRef.current
    if (mr && mr.state === 'recording') mr.stop()
    setState('analyzing')
  }

  async function submit(blob: Blob) {
    try {
      const form = new FormData()
      if (scenarioId) {
        form.append('scenarioId', scenarioId)
      } else {
        form.append('titleZh', titleZh)
        form.append('promptEn', promptEn)
        form.append('framework', framework)
        form.append('frameworkHintZh', frameworkHintZh)
      }
      form.append('audio', blob, 'speaking.webm')
      const res = await fetch('/api/speaking/analyze', {
        method: 'POST',
        body: form,
      })
      const j = await res.json()
      if (!res.ok) throw new Error(j.error ?? 'analysis failed')
      setFeedback(j)
      setState('done')
    } catch (err) {
      setState('error')
      setErrorMsg(err instanceof Error ? err.message : 'analysis failed')
    }
  }

  const avgScore =
    feedback && !feedback.tooShort
      ? Math.round(
          (feedback.framework_score +
            feedback.vocab_score +
            feedback.grammar_score +
            feedback.fluency_score) /
            4
        )
      : null

  return (
    <div className="space-y-6">
      {/* 情境卡 */}
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex items-baseline gap-3 mb-2">
          <span
            className={`text-xs font-mono font-semibold px-2 py-1 rounded border ${FRAMEWORK_COLOR[framework]}`}
          >
            {framework}
          </span>
          <span className="text-[11px] font-mono text-slate-400 tabular-nums">
            Lv.{difficulty}
          </span>
          {tags.slice(0, 3).map((t) => (
            <span
              key={t}
              className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600"
            >
              {t}
            </span>
          ))}
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-3">{titleZh}</h1>
        {contextZh && (
          <p className="text-sm text-slate-600 mb-4">{contextZh}</p>
        )}
        <div className="rounded-lg bg-slate-50 border border-slate-200 p-4 mb-4">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
            對方問你（Prompt）
          </div>
          <p
            className="text-base text-slate-900 leading-relaxed"
            translate="no"
          >
            &ldquo;{promptEn}&rdquo;
          </p>
        </div>
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
          <div className="text-xs font-medium text-amber-800 uppercase tracking-wide mb-2">
            {framework} 應用提示
          </div>
          <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-line">
            {frameworkHintZh}
          </p>
        </div>
      </section>

      {/* 錄音區 */}
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <header className="mb-4">
          <div className="font-mono text-xs tracking-[0.2em] uppercase text-stone-500 mb-2">
            回答 · 建議 30–90 秒
          </div>
          <h2 className="text-lg font-semibold text-slate-900">
            {state === 'idle' && '先花 30 秒思考，再按錄音'}
            {state === 'prep' &&
              (prepLeft > 0 ? '思考中...' : '準備好了，按開始錄音')}
            {state === 'recording' && '錄音中...'}
            {state === 'analyzing' && 'AI 分析中'}
            {state === 'done' && '這次的回饋'}
            {state === 'error' && '出了點問題'}
          </h2>
        </header>

        {state === 'idle' && (
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={startPrep}
              className="rounded-md bg-slate-900 text-white px-4 py-2 text-sm font-semibold hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 transition"
            >
              開始 30 秒思考
            </button>
            <button
              onClick={startRecording}
              className="rounded-md border border-slate-300 bg-white text-slate-700 px-4 py-2 text-sm hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 transition"
            >
              直接錄音
            </button>
          </div>
        )}

        {state === 'prep' && (
          <div className="flex flex-wrap items-center gap-3">
            <div className="text-3xl font-bold text-slate-900 font-mono tabular-nums">
              {prepLeft}s
            </div>
            <button
              onClick={startRecording}
              className="rounded-md bg-red-600 text-white px-4 py-2 text-sm font-semibold hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 transition"
            >
              開始錄音
            </button>
            {prepLeft > 0 && (
              <button
                onClick={skipPrep}
                className="text-xs text-slate-500 hover:text-slate-900"
              >
                跳過倒數
              </button>
            )}
          </div>
        )}

        {state === 'recording' && (
          <div className="flex items-center gap-3">
            <button
              onClick={stopRecording}
              className="rounded-md bg-slate-900 text-white px-4 py-2 text-sm font-semibold hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 transition"
            >
              ⏹ 結束錄音
            </button>
            <span className="text-sm text-slate-600 font-mono tabular-nums">
              <span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-2 animate-pulse" />
              {elapsed}s / {MAX_RECORD_MS / 1000}s
            </span>
          </div>
        )}

        {state === 'analyzing' && (
          <div className="text-sm text-slate-600 flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded-full border-2 border-slate-300 border-t-slate-900 animate-spin" />
            Whisper 轉文字 + GPT 逐點評分中（約 15–30 秒）
          </div>
        )}

        {errorMsg && (
          <p className="mt-3 text-sm text-red-600" role="alert">
            {errorMsg}
          </p>
        )}

        {feedback?.tooShort && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <div className="text-sm text-amber-900 mb-2">
              沒錄到足夠內容，請完整說完再送出。
            </div>
            {feedback.userText && (
              <p className="text-xs text-slate-600 italic" translate="no">
                聽到的：&ldquo;{feedback.userText}&rdquo;
              </p>
            )}
            <button
              onClick={startRecording}
              className="mt-3 rounded-md bg-slate-900 text-white px-3 py-1.5 text-xs font-semibold hover:bg-slate-800"
            >
              再試一次
            </button>
          </div>
        )}
      </section>

      {/* 回饋區 */}
      {feedback && !feedback.tooShort && state === 'done' && (
        <>
          <section className="rounded-xl border border-slate-200 bg-white p-6">
            <div className="flex items-baseline justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">
                四大面向分數
              </h2>
              {avgScore != null && (
                <div className="text-sm text-slate-500">
                  平均{' '}
                  <span className="text-2xl font-bold text-slate-900 tabular-nums">
                    {avgScore}
                  </span>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <ScoreCard
                label={`${framework} 框架`}
                value={feedback.framework_score}
              />
              <ScoreCard label="商務用詞" value={feedback.vocab_score} />
              <ScoreCard label="文法" value={feedback.grammar_score} />
              <ScoreCard label="流暢度" value={feedback.fluency_score} />
            </div>
            <ul className="mt-4 space-y-2 text-sm text-slate-700">
              <li>
                <span className="text-xs font-mono text-slate-400 mr-2">
                  框架
                </span>
                {feedback.framework_note}
              </li>
              <li>
                <span className="text-xs font-mono text-slate-400 mr-2">
                  用詞
                </span>
                {feedback.vocab_note}
              </li>
              <li>
                <span className="text-xs font-mono text-slate-400 mr-2">
                  文法
                </span>
                {feedback.grammar_note}
              </li>
              <li>
                <span className="text-xs font-mono text-slate-400 mr-2">
                  流暢
                </span>
                {feedback.fluency_note}
              </li>
            </ul>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-6">
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
              你剛才說的（Whisper 轉文字）
            </div>
            <p className="text-sm text-slate-800 italic" translate="no">
              &ldquo;{feedback.userText}&rdquo;
            </p>
          </section>

          {feedback.rewrites?.length > 0 && (
            <section className="rounded-xl border border-slate-200 bg-white p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-3">
                逐句改寫建議
              </h2>
              <ul className="space-y-4">
                {feedback.rewrites.map((r, i) => (
                  <li
                    key={i}
                    className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="text-[10px] font-mono text-slate-400 uppercase mb-1">
                      原句
                    </div>
                    <p
                      className="text-sm text-slate-700 mb-3 line-through opacity-75"
                      translate="no"
                    >
                      {r.original}
                    </p>
                    <div className="text-[10px] font-mono text-emerald-700 uppercase mb-1">
                      改寫
                    </div>
                    <p
                      className="text-sm text-slate-900 font-medium mb-2"
                      translate="no"
                    >
                      {r.improved}
                    </p>
                    <p className="text-xs text-slate-500">→ {r.why_zh}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {feedback.model_answer_en && (
            <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-6">
              <div className="text-xs font-medium text-emerald-800 uppercase tracking-wide mb-2">
                {framework} 模範答案
              </div>
              <p
                className="text-sm text-slate-900 leading-relaxed whitespace-pre-line"
                translate="no"
              >
                {feedback.model_answer_en}
              </p>
            </section>
          )}

          {feedback.next_focus_zh && (
            <section className="rounded-xl border border-slate-200 bg-white p-6">
              <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
                下次練習重點
              </div>
              <p className="text-sm text-slate-800">{feedback.next_focus_zh}</p>
            </section>
          )}

          <div className="flex flex-wrap justify-center gap-2 pt-2">
            <button
              onClick={() => {
                setFeedback(null)
                setState('idle')
              }}
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 transition"
            >
              這題再試一次
            </button>
            <Link
              href={isCustom ? '/speaking/custom' : '/speaking'}
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 transition"
            >
              {isCustom ? '再自訂一題 →' : '換一題 →'}
            </Link>
          </div>
        </>
      )}
    </div>
  )
}

function ScoreCard({ label, value }: { label: string; value: number }) {
  const color =
    value >= 80
      ? 'text-emerald-700 border-emerald-200 bg-emerald-50'
      : value >= 60
        ? 'text-amber-700 border-amber-200 bg-amber-50'
        : 'text-red-700 border-red-200 bg-red-50'
  return (
    <div className={`rounded-lg border p-4 ${color}`}>
      <div className="text-[11px] font-medium uppercase tracking-wide opacity-80 mb-1">
        {label}
      </div>
      <div className="text-3xl font-bold tabular-nums">{value}</div>
    </div>
  )
}
