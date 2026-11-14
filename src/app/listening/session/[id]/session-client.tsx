'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { classifyLine, type ClassifiedToken } from '@/lib/content-words'
import type { ListeningQuestion } from '@/lib/listening-questions'
import { ShadowingPractice } from './shadowing'
import { VideoTranscript, type TranscriptLine } from './video-transcript'
import { Mark, Pen } from '@/app/page-kit'

// module-level cache 避免 StrictMode 雙 mount 重複打 TTS
const ttsCache = new Map<string, Promise<string>>()

function fetchTTS(dialogueId: string): Promise<string> {
  const cached = ttsCache.get(dialogueId)
  if (cached) return cached
  const p = (async () => {
    const res = await fetch('/api/listening/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dialogueId }),
    })
    if (!res.ok) throw new Error(`tts failed: ${res.status}`)
    const blob = await res.blob()
    return URL.createObjectURL(blob)
  })()
  ttsCache.set(dialogueId, p)
  p.catch(() => ttsCache.delete(dialogueId))
  return p
}

type ScriptLine = { speaker: string; text: string }
type Question = ListeningQuestion

const SCENARIO_LABELS: Record<string, string> = {
  meeting: '內部會議',
  client_call: '客戶電話',
  presentation_qa: '簡報 Q&A',
  small_talk: '商務閒聊',
  negotiation: '商務談判',
  video: 'YouTube 影片',
}

const SPEEDS = [0.75, 1.0, 1.25] as const

interface Props {
  dialogueId: string
  title: string
  scenario: string
  script: ScriptLine[]
  questions: Question[]
  transcript: TranscriptLine[] | null
  isReview: boolean
  sourceType: 'ai_dialogue' | 'youtube'
  youtubeVideoId: string | null
  youtubeStartSeconds: number
  summaryZh: string | null
  shadowingText: string | null
  shadowingStartSeconds: number
}

export function ListeningSession({
  dialogueId,
  title,
  scenario,
  script,
  questions,
  transcript,
  isReview,
  sourceType,
  youtubeVideoId,
  youtubeStartSeconds,
  summaryZh,
  shadowingText,
  shadowingStartSeconds,
}: Props) {
  const isYoutube = sourceType === 'youtube'
  const hasQuestions = questions.length > 0
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [audioLoading, setAudioLoading] = useState(true)
  const [audioError, setAudioError] = useState<string | null>(null)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState<(typeof SPEEDS)[number]>(1.0)
  const [scriptVisible, setScriptVisible] = useState(isReview)
  const [answers, setAnswers] = useState<Array<number | null>>(
    () => Array(questions.length).fill(null)
  )
  const [submitted, setSubmitted] = useState(isReview)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const questionsRef = useRef<HTMLElement | null>(null)
  const hasTranscript = isYoutube && !!transcript && transcript.length > 0

  function scrollToQuestions() {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    questionsRef.current?.scrollIntoView({
      behavior: reduced ? 'auto' : 'smooth',
      block: 'start',
    })
  }

  useEffect(() => {
    if (isYoutube) {
      setAudioLoading(false)
      return
    }
    let mounted = true
    setAudioLoading(true)
    setAudioError(null)
    fetchTTS(dialogueId).then(
      (url) => {
        if (mounted) {
          setAudioUrl(url)
          setAudioLoading(false)
        }
      },
      (err: unknown) => {
        if (mounted) {
          setAudioError(err instanceof Error ? err.message : 'audio load failed')
          setAudioLoading(false)
        }
      }
    )
    return () => {
      mounted = false
    }
  }, [dialogueId, isYoutube])

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = speed
    }
  }, [speed, audioUrl])

  const togglePlay = useCallback(() => {
    const a = audioRef.current
    if (!a) return
    if (a.paused) {
      a.play()
      setPlaying(true)
    } else {
      a.pause()
      setPlaying(false)
    }
  }, [])

  const restart = useCallback(() => {
    const a = audioRef.current
    if (!a) return
    a.currentTime = 0
    a.play()
    setPlaying(true)
  }, [])

  const allAnswered = answers.every((a) => a !== null)

  async function submit() {
    if (!allAnswered || submitted) return
    setSaving(true)
    setSaveError(null)
    try {
      const payload = {
        dialogueId,
        answers: answers.map((chosen, idx) => ({
          q_idx: idx,
          chosen_idx: chosen as number,
          correct: chosen === questions[idx].answer_idx,
          ...(questions[idx].id ? { q_id: questions[idx].id } : {}),
        })),
      }
      const res = await fetch('/api/listening/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error ?? 'save failed')
      }
      setSubmitted(true)
      setScriptVisible(true)
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'save failed')
    } finally {
      setSaving(false)
    }
  }

  const correctCount = submitted
    ? answers.reduce<number>(
        (acc, a, i) => acc + (a === questions[i].answer_idx ? 1 : 0),
        0
      )
    : 0

  return (
    <div className={hasTranscript ? '' : 'mx-auto max-w-3xl'}>
      <header className="mb-6 border-b border-ink/15 pb-6">
        <div className="text-sm text-ink/65 mb-2">
          {SCENARIO_LABELS[scenario] ?? scenario}
          {isReview && ' · 複習模式'}
        </div>
        <h1 className="text-3xl font-bold leading-[1.15] text-pretty">
          {title}
        </h1>
      </header>

      {/* 影片播放器 (YouTube)：有逐字稿時左影片右逐字稿，否則維持原本的單一嵌入 */}
      {isYoutube && youtubeVideoId && (
        <section className="mb-6">
          {hasTranscript ? (
            <VideoTranscript
              videoId={youtubeVideoId}
              startSeconds={youtubeStartSeconds}
              title={title}
              transcript={transcript}
              onStartQuiz={hasQuestions ? scrollToQuestions : undefined}
            />
          ) : (
            <div className="aspect-video rounded-lg overflow-hidden border border-ink/15 bg-black">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${youtubeVideoId}?start=${youtubeStartSeconds}&rel=0`}
                title={title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
          )}
        </section>
      )}

      <div className="mx-auto max-w-3xl">
      {isYoutube && summaryZh && (
        <div className="mb-6 border-l-4 border-mark pl-5">
          <div className="text-base font-bold mb-2">
            影片摘要
          </div>
          <p className="text-sm text-ink leading-relaxed">{summaryZh}</p>
        </div>
      )}

      {/* 音檔播放器 (AI 對話) */}
      {!isYoutube && (
      <section className="border-y border-ink/15 py-6 mb-6">
        {audioLoading && (
          <div className="text-center py-6 text-sm text-ink/65">
            AI 正在錄音中... (約 5–8 秒)
          </div>
        )}
        {audioError && (
          <div className="text-center py-6 text-sm text-pen">
            音檔載入失敗：{audioError}
          </div>
        )}
        {audioUrl && (
          <div>
            <audio
              ref={audioRef}
              src={audioUrl}
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              onEnded={() => setPlaying(false)}
              preload="auto"
              className="hidden"
            />
            <div className="flex items-center justify-center gap-3 mb-4">
              <button
                onClick={togglePlay}
                className="rounded-full bg-ink text-white w-14 h-14 flex items-center justify-center hover:bg-ink/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40 transition"
                aria-label={playing ? '暫停' : '播放'}
              >
                {playing ? (
                  <PauseIcon className="w-6 h-6" />
                ) : (
                  <PlayIcon className="w-6 h-6 ml-0.5" />
                )}
              </button>
              <button
                onClick={restart}
                className="rounded-md border border-ink/25 bg-white px-3 py-2 text-sm text-ink/80 hover:bg-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40 transition"
              >
                ↻ 從頭
              </button>
            </div>
            <div className="flex items-center justify-center gap-1">
              <span className="text-xs text-ink/65 mr-2">速度</span>
              {SPEEDS.map((s) => (
                <button
                  key={s}
                  onClick={() => setSpeed(s)}
                  className={`text-xs px-2 py-1 rounded-md transition ${
                    speed === s
                      ? 'bg-ink text-white'
                      : 'bg-paper text-ink/80 hover:bg-ink/10'
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>
        )}
      </section>
      )}

      {/* 原文(先隱藏) - YouTube 不顯示 Content Words 標記 */}
      {!isYoutube && (
      <section className="mb-6">
        {!scriptVisible ? (
          <button
            onClick={() => setScriptVisible(true)}
            className="rounded-sm text-sm text-ink/70 underline decoration-ink/30 underline-offset-4 hover:text-ink hover:decoration-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40"
          >
            聽不清楚？顯示原文
          </button>
        ) : (
          <div className="border-l-4 border-ink/25 pl-5">
            <div className="flex items-center justify-between mb-3">
              <div className="text-base font-bold">
                原文，Content Words 標記
              </div>
              <div className="flex items-center gap-3 text-sm text-ink/65">
                <span className="hl-mark">實詞</span>
                <span>虛詞</span>
              </div>
            </div>
            <ol className="space-y-2 text-sm">
              {script.map((line, i) => (
                <li key={i}>
                  <span className="font-semibold text-ink">
                    {line.speaker}:
                  </span>{' '}
                  <ClassifiedText tokens={classifyLine(line.text)} />
                </li>
              ))}
            </ol>
          </div>
        )}
      </section>
      )}

      {/* 純觀看模式（沒有題目）:直接給 CTA 回首頁 */}
      {!hasQuestions && (
        <div className="border-l-4 border-mark pl-6 py-2">
          <div className="text-base font-bold mb-1">
            這是延伸觀點影片
          </div>
          <p className="text-sm text-ink/70 mb-5">
            沒有測驗題，看完摘要對照著聽一遍就好
          </p>
          <Link
            href="/listening"
            className="inline-block rounded-md bg-ink px-5 py-2.5 text-sm font-semibold text-white hover:bg-ink/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40 motion-safe:transition"
          >
            回聽力首頁
          </Link>
        </div>
      )}

      {/* 題目 */}
      {hasQuestions && (
      <section ref={questionsRef} className="space-y-5 mb-6 scroll-mt-6">
        {questions.map((q, qIdx) => {
          const chosen = answers[qIdx]
          const isCorrect = chosen === q.answer_idx
          return (
            <div key={qIdx} className="border-t border-ink/15 pt-5">
              <div className="flex items-baseline gap-3 mb-3">
                <span className="font-display text-sm font-semibold text-ink/65">
                  Q{qIdx + 1}
                </span>
                <p className="text-base font-semibold">{q.q}</p>
              </div>
              <div>
                {q.options.map((opt, oIdx) => {
                  const chosenThis = chosen === oIdx
                  const showCorrect = submitted && oIdx === q.answer_idx
                  const showWrong = submitted && chosenThis && !isCorrect
                  return (
                    <button
                      key={oIdx}
                      onClick={() => {
                        if (submitted) return
                        setAnswers((prev) => {
                          const next = [...prev]
                          next[qIdx] = oIdx
                          return next
                        })
                      }}
                      disabled={submitted}
                      className={`w-full text-left border-t border-ink/10 px-2 py-2.5 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ink/40 ${
                        chosenThis && !submitted
                          ? 'bg-white font-semibold text-ink'
                          : showCorrect || showWrong
                            ? 'text-ink'
                            : submitted
                              ? 'text-ink/60'
                              : 'text-ink hover:bg-white/70'
                      } ${submitted ? 'cursor-default' : 'cursor-pointer'}`}
                    >
                      <span className="font-display text-sm font-semibold text-ink/65 mr-3">
                        {String.fromCharCode(65 + oIdx)}
                      </span>
                      {showCorrect ? (
                        <Mark>{opt}</Mark>
                      ) : showWrong ? (
                        <Pen>{opt}</Pen>
                      ) : (
                        opt
                      )}
                      {showCorrect && (
                        <span className="ml-3 font-semibold">正解</span>
                      )}
                      {showWrong && (
                        <span className="ml-3 font-semibold text-pen">
                          你選的
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
              {submitted && (
                <div className="mt-3 border-l-2 border-ink/25 pl-3 text-sm text-ink/75">
                  <span className="font-semibold text-ink">解說：</span>{' '}
                  {q.explanation_zh}
                </div>
              )}
            </div>
          )
        })}
      </section>
      )}

      {/* 送出 / 結果 */}
      {hasQuestions && (!submitted ? (
        <div className="border-y border-ink/15 py-5 flex items-center justify-between">
          <div className="text-sm text-ink/70">
            已回答 {answers.filter((a) => a !== null).length} / {questions.length}
          </div>
          <button
            onClick={submit}
            disabled={!allAnswered || saving}
            className="rounded-md bg-ink px-5 py-2.5 text-sm font-semibold text-white hover:bg-ink/85 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40 transition"
          >
            {saving ? '儲存中...' : '送出答案'}
          </button>
        </div>
      ) : (
        <div className="border-l-4 border-mark pl-6 py-2">
          <div className="font-display text-3xl font-bold tabular-nums mb-1">
            {correctCount} / {questions.length}
            <span className="ml-2 text-base font-normal text-ink/65">答對</span>
          </div>
          <p className="text-sm text-ink/70 mb-5">
            {correctCount === questions.length
              ? '全對！你抓 content words 的能力進步了'
              : correctCount >= 2
                ? '大部分抓到重點，再多聽兩題會更穩'
                : '沒關係，聽力靠累積 — 明天再來一題'}
          </p>
          <div className="flex gap-2">
            <Link
              href="/listening"
              className="rounded-md border border-ink/25 px-4 py-2 text-sm text-ink hover:bg-white transition"
            >
              回聽力首頁
            </Link>
            <Link
              href="/listening"
              className="rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-ink/85 transition"
            >
              再練一題
            </Link>
          </div>
        </div>
      ))}

      {saveError && (
        <p className="mt-3 text-sm text-pen" role="alert">
          儲存失敗：{saveError}
        </p>
      )}

      {/* 下一關:Shadowing 練習 (答完題目才解鎖) */}
      {submitted && isYoutube && youtubeVideoId && shadowingText && (
        <div className="mt-8">
          <div className="mb-4">
            <div className="text-sm text-ink/65 mb-1">
              下一關
            </div>
            <h2 className="text-xl font-bold text-ink">
              換你開口 · Shadowing 練習
            </h2>
            <p className="text-sm text-ink/70 mt-1">
              跟讀原音，AI 幫你檢查發音跟流暢度
            </p>
          </div>
          <ShadowingPractice
            dialogueId={dialogueId}
            referenceText={shadowingText}
            videoId={youtubeVideoId}
            startSeconds={shadowingStartSeconds}
          />
        </div>
      )}
      </div>
    </div>
  )
}

function ClassifiedText({ tokens }: { tokens: ClassifiedToken[] }) {
  return (
    <span>
      {tokens.map((t, i) => {
        if (t.isPunct) {
          return (
            <span key={i} className="text-ink/60">
              {t.text}
            </span>
          )
        }
        // 縮寫尾巴('ll / n't) 貼在前一個 token 後
        const noSpaceBefore = t.text.startsWith("'") || t.text === "n't"
        const cls = t.content
          ? 'hl-mark font-semibold text-ink'
          : 'text-ink/60'
        return (
          <span key={i}>
            {noSpaceBefore ? '' : i === 0 ? '' : ' '}
            <span className={cls}>{t.text}</span>
          </span>
        )
      })}
    </span>
  )
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M8 5v14l11-7z" />
    </svg>
  )
}

function PauseIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
    </svg>
  )
}
