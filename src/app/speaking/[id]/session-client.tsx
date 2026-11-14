'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { Mark, Pen } from '@/app/page-kit'

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
    <div className="space-y-12">
      {/* 情境 */}
      <section className="border-b border-ink/15 pb-8">
        <p className="mb-3 flex flex-wrap items-baseline gap-x-3 text-sm text-ink/65">
          <span className="font-display text-base font-bold text-ink">
            {framework}
          </span>
          <span className="tabular-nums">Lv.{difficulty}</span>
          {tags.slice(0, 3).length > 0 && <span>{tags.slice(0, 3).join(' · ')}</span>}
        </p>
        <h1 className="mb-3 text-balance text-3xl font-bold leading-[1.15]">{titleZh}</h1>
        {contextZh && (
          <p className="mb-6 max-w-xl text-base leading-relaxed text-ink/70">{contextZh}</p>
        )}
        <div className="mb-6 border-l-4 border-ink/25 pl-5">
          <div className="mb-1 text-sm text-ink/65">對方問你</div>
          <p className="text-xl leading-relaxed" translate="no">
            &ldquo;{promptEn}&rdquo;
          </p>
        </div>
        <div className="border-l-4 border-mark pl-5">
          <div className="mb-1 text-base font-bold">{framework} 應用提示</div>
          <p className="text-sm text-ink leading-relaxed whitespace-pre-line">
            {frameworkHintZh}
          </p>
        </div>
      </section>

      {/* 錄音區 */}
      <section>
        <header className="mb-4">
          <div className="mb-1 text-sm text-ink/65">回答，建議 30–90 秒</div>
          <h2 className="text-2xl font-bold">
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
              className="rounded-md bg-ink text-paper px-4 py-2 text-sm font-semibold hover:bg-ink/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40 transition"
            >
              開始 30 秒思考
            </button>
            <button
              onClick={startRecording}
              className="rounded-md border border-ink/25 text-ink px-4 py-2 text-sm hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40 transition"
            >
              直接錄音
            </button>
          </div>
        )}

        {state === 'prep' && (
          <div className="flex flex-wrap items-center gap-3">
            <div className="font-display text-3xl font-bold tabular-nums">
              {prepLeft}s
            </div>
            <button
              onClick={startRecording}
              className="rounded-md bg-pen text-white px-4 py-2 text-sm font-semibold hover:bg-pen/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pen/40 transition"
            >
              開始錄音
            </button>
            {prepLeft > 0 && (
              <button
                onClick={skipPrep}
                className="rounded-sm text-sm text-ink/65 underline decoration-ink/30 underline-offset-4 hover:text-ink hover:decoration-ink"
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
              className="rounded-md bg-ink text-paper px-4 py-2 text-sm font-semibold hover:bg-ink/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40 transition"
            >
              ⏹ 結束錄音
            </button>
            <span className="text-sm text-ink/70 font-mono tabular-nums">
              <span className="inline-block w-2 h-2 rounded-full bg-pen mr-2 animate-pulse" />
              {elapsed}s / {MAX_RECORD_MS / 1000}s
            </span>
          </div>
        )}

        {state === 'analyzing' && (
          <div className="text-sm text-ink/70 flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded-full border-2 border-ink/25 border-t-ink animate-spin" />
            Whisper 轉文字 + GPT 逐點評分中（約 15–30 秒）
          </div>
        )}

        {errorMsg && (
          <p className="mt-3 text-sm text-pen" role="alert">
            {errorMsg}
          </p>
        )}

        {feedback?.tooShort && (
          <div className="mt-4 border-l-4 border-pen pl-4">
            <div className="text-sm text-ink mb-2">
              沒錄到足夠內容，請完整說完再送出。
            </div>
            {feedback.userText && (
              <p className="text-sm text-ink/70 italic" translate="no">
                聽到的：&ldquo;{feedback.userText}&rdquo;
              </p>
            )}
            <button
              onClick={startRecording}
              className="mt-3 rounded-md bg-ink text-paper px-3 py-1.5 text-sm font-semibold hover:bg-ink/85"
            >
              再試一次
            </button>
          </div>
        )}
      </section>

      {/* 回饋區 */}
      {feedback && !feedback.tooShort && state === 'done' && (
        <>
          <section>
            <div className="mb-4 flex items-baseline justify-between">
              <h2 className="text-2xl font-bold">四大面向分數</h2>
              {avgScore != null && (
                <p className="text-sm text-ink/65">
                  平均{' '}
                  <span className="font-display text-3xl font-bold tabular-nums text-ink">
                    {avgScore}
                  </span>
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 border-y border-ink/15 sm:grid-cols-4">
              <ScoreCard
                label={`${framework} 框架`}
                value={feedback.framework_score}
              />
              <ScoreCard label="商務用詞" value={feedback.vocab_score} />
              <ScoreCard label="文法" value={feedback.grammar_score} />
              <ScoreCard label="流暢度" value={feedback.fluency_score} />
            </div>
            <ul className="mt-2 text-sm text-ink/80">
              {[
                ['框架', feedback.framework_note],
                ['用詞', feedback.vocab_note],
                ['文法', feedback.grammar_note],
                ['流暢', feedback.fluency_note],
              ].map(([k, note]) => (
                <li
                  key={k}
                  className="grid grid-cols-[3.5rem_1fr] gap-x-3 border-b border-ink/10 py-3"
                >
                  <span className="font-display font-semibold text-ink/65">
                    {k}
                  </span>
                  <span className="leading-relaxed">{note}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="border-l-4 border-ink/25 pl-5">
            <div className="mb-1 text-sm text-ink/65">
              你剛才說的（Whisper 轉文字）
            </div>
            <p className="text-sm italic" translate="no">
              &ldquo;{feedback.userText}&rdquo;
            </p>
          </section>

          {feedback.rewrites?.length > 0 && (
            <section>
              <h2 className="mb-3 text-2xl font-bold">
                逐句改寫建議
              </h2>
              <ul className="space-y-4">
                {feedback.rewrites.map((r, i) => (
                  <li
                    key={i}
                    className="border-t border-ink/15 pt-4"
                  >
                    <div className="text-sm text-ink/65 mb-1">原句</div>
                    <p className="text-sm mb-3" translate="no">
                      <Pen>{r.original}</Pen>
                    </p>
                    <div className="text-sm text-ink/65 mb-1">改寫</div>
                    <p className="text-sm font-medium mb-2" translate="no">
                      <Mark>{r.improved}</Mark>
                    </p>
                    <p className="text-sm text-ink/70">{r.why_zh}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {feedback.model_answer_en && (
            <section className="border-l-4 border-mark pl-5">
              <div className="mb-2 text-lg font-bold">
                {framework} 模範答案
              </div>
              <p
                className="text-sm text-ink leading-relaxed whitespace-pre-line"
                translate="no"
              >
                {feedback.model_answer_en}
              </p>
            </section>
          )}

          {feedback.next_focus_zh && (
            <section className="border-l-4 border-ink/25 pl-5">
              <div className="mb-1 text-lg font-bold">下次練習重點</div>
              <p className="text-sm">{feedback.next_focus_zh}</p>
            </section>
          )}

          <div className="flex flex-wrap gap-2 border-t border-ink/15 pt-6">
            <button
              onClick={() => {
                setFeedback(null)
                setState('idle')
              }}
              className="rounded-md border border-ink/25 px-4 py-2 text-sm text-ink hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40 transition"
            >
              這題再試一次
            </button>
            <Link
              href={isCustom ? '/speaking/custom' : '/speaking'}
              className="rounded-md bg-ink px-4 py-2 text-sm font-semibold text-paper hover:bg-ink/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40 transition"
            >
              {isCustom ? '再自訂一題' : '換一題'}
            </Link>
          </div>
        </>
      )}
    </div>
  )
}

function ScoreCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="border-ink/15 px-4 py-4 first:pl-0 sm:[&:not(:first-child)]:border-l">
      <div className="mb-1 text-sm text-ink/65">{label}</div>
      <div
        className={`font-display text-3xl font-bold tabular-nums ${
          value >= 60 ? 'text-ink' : 'text-pen'
        }`}
      >
        {value}
      </div>
    </div>
  )
}
