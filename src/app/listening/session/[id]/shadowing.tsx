'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

type Feedback = {
  userText: string
  referenceText: string
  contentWords: Array<{ word: string; hit: boolean }>
  accuracy_score: number
  fluency_score: number
  pronunciation_notes: string
  missed_or_wrong: string[]
  praise: string
  next_focus: string
}

const MAX_RECORD_MS = 60_000

export function ShadowingPractice({
  dialogueId,
  referenceText,
  videoId,
  startSeconds,
}: {
  dialogueId: string
  referenceText: string
  videoId: string
  startSeconds: number
}) {
  const [state, setState] = useState<'idle' | 'recording' | 'analyzing' | 'done' | 'error'>(
    'idle'
  )
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const startedAtRef = useRef<number>(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const endSeconds = startSeconds + 30
  const embedSrc = `https://www.youtube-nocookie.com/embed/${videoId}?start=${startSeconds}&end=${endSeconds}&rel=0`

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      const mr = mediaRecorderRef.current
      if (mr && mr.state !== 'inactive') mr.stop()
    }
  }, [])

  async function startRecording() {
    setErrorMsg(null)
    setFeedback(null)
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
      form.append('dialogueId', dialogueId)
      form.append('audio', blob, 'shadowing.webm')
      const res = await fetch('/api/listening/shadowing', {
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

  return (
    <section className="mb-6 rounded-lg border border-ink/15 bg-white p-6">
      <header className="mb-4">
        <div className="font-mono text-xs tracking-[0.2em] uppercase text-ink/65 mb-2">
          Shadowing 練習 · 前 30 秒
        </div>
        <h2 className="text-lg font-semibold text-ink">跟讀原音，AI 給發音回饋</h2>
        <p className="text-sm text-ink/70 mt-1">
          先聽 1–2 次，再邊聽邊跟讀，播完後按錄音，朗讀相同內容。
        </p>
      </header>

      <div className="aspect-video rounded-lg overflow-hidden border border-ink/15 bg-black mb-4">
        <iframe
          src={embedSrc}
          title="Shadowing segment"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
        />
      </div>

      <div className="rounded-lg bg-paper border border-ink/15 p-4 mb-4">
        <div className="text-xs font-medium text-ink/65 uppercase tracking-wide mb-2">
          逐字稿
        </div>
        <p className="text-sm text-ink leading-relaxed" translate="no">
          {referenceText}
        </p>
      </div>

      <div className="flex items-center gap-3 mb-4">
        {state === 'idle' || state === 'done' || state === 'error' ? (
          <button
            onClick={startRecording}
            className="rounded-md bg-pen text-white px-4 py-2 text-sm font-semibold hover:bg-pen/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pen/40 transition"
          >
            {feedback ? '再試一次' : '開始錄音'}
          </button>
        ) : state === 'recording' ? (
          <>
            <button
              onClick={stopRecording}
              className="rounded-md bg-ink text-white px-4 py-2 text-sm font-semibold hover:bg-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40 transition"
            >
              ⏹ 結束錄音
            </button>
            <span className="text-sm text-ink/70 font-mono">
              <span className="inline-block w-2 h-2 rounded-full bg-pen mr-2 animate-pulse" />
              {elapsed}s
            </span>
          </>
        ) : (
          <div className="text-sm text-ink/70 flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded-full border-2 border-ink/25 border-t-ink animate-spin" />
            AI 分析中...
          </div>
        )}
      </div>

      {errorMsg && (
        <p className="text-sm text-pen mb-4" role="alert">
          {errorMsg}
        </p>
      )}

      {feedback && state === 'done' && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <ScoreCard label="內容準確度" value={feedback.accuracy_score} />
            <ScoreCard label="流暢度" value={feedback.fluency_score} />
            <ScoreCard
              label="實詞命中"
              value={
                feedback.contentWords?.length
                  ? Math.round(
                      (feedback.contentWords.filter((w) => w.hit).length /
                        feedback.contentWords.length) *
                        100
                    )
                  : 0
              }
            />
          </div>

          {feedback.contentWords?.length > 0 && (
            <div className="rounded-lg border border-ink/15 bg-white p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs font-medium text-ink/65 uppercase tracking-wide">
                  實詞逐字檢查
                </div>
                <div className="flex items-center gap-3 text-[10px] text-ink/65">
                  <span className="flex items-center gap-1">
                    <span className="inline-block w-2 h-2 rounded-full bg-ink" />
                    唸到
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="inline-block w-2 h-2 rounded-full bg-pen/80" />
                    漏掉
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {feedback.contentWords.map((w, i) => (
                  <span
                    key={`${w.word}-${i}`}
                    className={`text-xs font-mono rounded px-2 py-0.5 border ${
                      w.hit
                        ? 'bg-mark/25 border-mark text-ink'
                        : 'bg-pen/10 border-pen/30 text-pen line-through'
                    }`}
                    translate="no"
                  >
                    {w.word}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-lg border border-ink/15 bg-white p-4">
            <div className="text-xs font-medium text-ink/65 uppercase tracking-wide mb-2">
              你剛才說的 (Whisper 轉文字)
            </div>
            <p className="text-sm text-ink italic" translate="no">
              &ldquo;{feedback.userText}&rdquo;
            </p>
          </div>

          <div className="rounded-lg border border-mark bg-mark/25 p-4">
            <div className="text-xs font-medium text-ink uppercase tracking-wide mb-2">
              發音提醒
            </div>
            <p className="text-sm text-ink">{feedback.pronunciation_notes}</p>
            {feedback.missed_or_wrong?.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {feedback.missed_or_wrong.map((w) => (
                  <span
                    key={w}
                    className="text-xs font-mono bg-white border border-mark text-ink rounded px-2 py-0.5"
                    translate="no"
                  >
                    {w}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-lg border border-mark bg-mark/25 p-4">
            <div className="text-xs font-medium text-ink uppercase tracking-wide mb-1">
              做得好
            </div>
            <p className="text-sm text-ink">{feedback.praise}</p>
          </div>

          <div className="rounded-lg border border-ink/15 bg-paper p-4">
            <div className="text-xs font-medium text-ink/65 uppercase tracking-wide mb-1">
              下次練習重點
            </div>
            <p className="text-sm text-ink">{feedback.next_focus}</p>
          </div>

          <div className="flex justify-center gap-2 pt-2">
            <button
              onClick={startRecording}
              className="rounded-md border border-ink/25 bg-white px-4 py-2 text-sm text-ink/80 hover:bg-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40 transition"
            >
              再錄一次
            </button>
            <Link
              href="/listening"
              className="rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40 transition"
            >
              完成 · 回聽力首頁 →
            </Link>
          </div>
        </div>
      )}
    </section>
  )
}

function ScoreCard({ label, value }: { label: string; value: number }) {
  const color =
    value >= 80
      ? 'text-ink border-mark bg-mark/25'
      : value >= 60
        ? 'text-ink border-mark bg-mark/25'
        : 'text-pen border-pen/30 bg-pen/10'
  return (
    <div className={`rounded-lg border p-4 ${color}`}>
      <div className="text-xs font-medium uppercase tracking-wide opacity-80 mb-1">
        {label}
      </div>
      <div className="text-3xl font-bold">{value}</div>
    </div>
  )
}
