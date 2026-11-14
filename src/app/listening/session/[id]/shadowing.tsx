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
    <section className="mb-6 border-t border-ink/15 pt-6">
      <header className="mb-4">
        <div className="text-sm text-ink/65 mb-1">
          Shadowing 練習，前 30 秒
        </div>
        <h2 className="text-xl font-bold">跟讀原音，AI 給發音回饋</h2>
        <p className="text-sm text-ink/70 mt-1">
          先聽 1–2 次，再邊聽邊跟讀，播完後按錄音，朗讀相同內容。
        </p>
      </header>

      <div className="aspect-video rounded-sm overflow-hidden border border-ink/15 bg-black mb-4">
        <iframe
          src={embedSrc}
          title="Shadowing segment"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
        />
      </div>

      <div className="border-l-4 border-ink/25 pl-4 mb-4">
        <div className="text-sm text-ink/65 mb-1">
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
              className="rounded-md bg-ink text-paper px-4 py-2 text-sm font-semibold hover:bg-ink/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40 transition"
            >
              ⏹ 結束錄音
            </button>
            <span className="text-sm text-ink/70 font-display tabular-nums">
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
          <div className="grid grid-cols-3 border-y border-ink/15">
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
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-base font-bold">實詞逐字檢查</h3>
                <div className="flex items-center gap-3 text-sm text-ink/65">
                  <span className="hl-mark">唸到</span>
                  <span className="strike-pen">漏掉</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-2 text-base leading-relaxed">
                {feedback.contentWords.map((w, i) => (
                  <span
                    key={`${w.word}-${i}`}
                    className={w.hit ? 'hl-mark font-medium' : 'strike-pen'}
                    translate="no"
                  >
                    {w.word}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="border-l-4 border-ink/25 pl-4">
            <div className="mb-1 text-sm text-ink/65">
              你剛才說的（Whisper 轉文字）
            </div>
            <p className="text-sm italic" translate="no">
              &ldquo;{feedback.userText}&rdquo;
            </p>
          </div>

          <div className="border-l-4 border-pen pl-4">
            <div className="mb-1 text-base font-bold">發音提醒</div>
            <p className="text-sm text-ink">{feedback.pronunciation_notes}</p>
            {feedback.missed_or_wrong?.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {feedback.missed_or_wrong.map((w) => (
                  <span
                    key={w}
                    className="strike-pen text-sm"
                    translate="no"
                  >
                    {w}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="border-l-4 border-mark pl-4">
            <div className="mb-1 text-base font-bold">做得好</div>
            <p className="text-sm text-ink">{feedback.praise}</p>
          </div>

          <div className="border-l-4 border-ink/25 pl-4">
            <div className="mb-1 text-base font-bold">下次練習重點</div>
            <p className="text-sm text-ink">{feedback.next_focus}</p>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={startRecording}
              className="rounded-md border border-ink/25 px-4 py-2 text-sm text-ink hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40 transition"
            >
              再錄一次
            </button>
            <Link
              href="/listening"
              className="rounded-md bg-ink px-4 py-2 text-sm font-semibold text-paper hover:bg-ink/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40 transition"
            >
              完成，回聽力首頁
            </Link>
          </div>
        </div>
      )}
    </section>
  )
}

function ScoreCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="border-ink/15 px-4 py-4 first:pl-0 [&:not(:first-child)]:border-l">
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
