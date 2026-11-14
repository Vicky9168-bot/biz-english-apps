'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ExitButton } from '../../back-button'
import type { Vocabulary } from '@/lib/supabase/types'

const MAX_ATTEMPTS = 3
const MAX_RECORDING_MS = 30000

type Attempt = {
  transcript: string
  aiGuess: string
  isCorrect: boolean
}

type Explanation = {
  one_tip_zh: string
  better_phrase: { you_said: string; better: string } | null
  describe_next_time?: { angle_zh: string; sample_en?: string | null } | null
  usage_context_zh: string
}

type WordResult = {
  wordId: string
  targetWord: string
  attempts: Attempt[]
  guessedCorrectly: boolean
  explanation: Explanation | null
}

interface SessionClientProps {
  words: Vocabulary[]
  mode: 'user_describes' | 'ai_describes'
  profile: { job_title: string | null; industry: string | null }
}

export function SessionClient({ words, mode, profile }: SessionClientProps) {
  const router = useRouter()
  const [wordIdx, setWordIdx] = useState(0)
  const [results, setResults] = useState<WordResult[]>([])
  const [currentAttempts, setCurrentAttempts] = useState<Attempt[]>([])
  const [phase, setPhase] = useState<
    'idle' | 'recording' | 'transcribing' | 'guessing' | 'result' | 'complete' | 'saving'
  >('idle')
  const [recordingTime, setRecordingTime] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<{
    grammar_errors?: Array<{ original: string; corrected: string; explanation_zh: string }>
    better_expressions?: Array<{ you_said: string; better: string; why_zh: string }>
    description_tips?: Array<{
      word: string
      your_description_summary_zh: string
      better_approach_zh: string
      sample_sentence?: string
    }>
    business_tip?: { word: string; tip_zh: string }
    overall_encouragement_zh?: string
  } | null>(null)
  const [totalStars, setTotalStars] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [explanation, setExplanation] = useState<Explanation | null>(null)
  const [explainLoading, setExplainLoading] = useState(false)
  const [aiDescription, setAiDescription] = useState<string | null>(null)
  const [descLoading, setDescLoading] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [audioLoading, setAudioLoading] = useState(false)
  const [scriptShown, setScriptShown] = useState(false)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const stopTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const describeInFlightRef = useRef<string | null>(null)
  const ttsInFlightRef = useRef<string | null>(null)

  const currentWord = words[wordIdx]
  const isLast = wordIdx === words.length - 1

  // 練習結果只在整輪結束時才存檔，中途離開前先確認
  function handleExit() {
    const hasProgress = results.length > 0 || currentAttempts.length > 0
    if (
      hasProgress &&
      !window.confirm('確定要離開嗎？這一輪還沒完成，目前的練習結果不會被儲存。')
    ) {
      return
    }
    cleanupStream()
    router.push('/charades')
  }

  const cleanupStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    if (timerRef.current) clearInterval(timerRef.current)
    if (stopTimeoutRef.current) clearTimeout(stopTimeoutRef.current)
  }, [])

  useEffect(() => () => cleanupStream(), [cleanupStream])

  // 卸載時釋放最後一個 audio blob URL
  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl)
    }
  }, [audioUrl])

  // Mode B:進題時自動抓 AI 描述
  useEffect(() => {
    if (mode !== 'ai_describes') return
    if (!currentWord || aiDescription) return
    if (phase !== 'idle') return
    if (describeInFlightRef.current === currentWord.id) return

    describeInFlightRef.current = currentWord.id
    setDescLoading(true)

    fetch('/api/charades/describe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetWord: currentWord.word,
        definitionZh: currentWord.definition_zh,
        exampleSentence: currentWord.example_sentence,
        scenarioTags: currentWord.scenario_tags,
        jobTitle: profile.job_title,
        industry: profile.industry,
      }),
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((data: { description: string }) => {
        // 只在還在同一題時才 apply
        if (describeInFlightRef.current === currentWord.id) {
          setAiDescription(data.description)
        }
      })
      .catch((err) => {
        console.error('describe fetch failed', err)
        if (describeInFlightRef.current === currentWord.id) {
          setError('無法載入題目描述，請重新整理')
        }
      })
      .finally(() => {
        if (describeInFlightRef.current === currentWord.id) {
          setDescLoading(false)
          describeInFlightRef.current = null
        }
      })
  }, [mode, currentWord, aiDescription, phase, profile])

  // Mode B:拿到描述後,抓 TTS 音檔(用 ref 追蹤 in-flight,避免 audioLoading 反覆進 deps 觸發 race)
  useEffect(() => {
    if (mode !== 'ai_describes' || !aiDescription || audioUrl) return
    if (ttsInFlightRef.current === aiDescription) return

    ttsInFlightRef.current = aiDescription
    setAudioLoading(true)

    fetch('/api/charades/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: aiDescription }),
    })
      .then((res) => (res.ok ? res.blob() : Promise.reject(res)))
      .then((blob) => {
        if (ttsInFlightRef.current !== aiDescription) return
        const objectUrl = URL.createObjectURL(blob)
        setAudioUrl(objectUrl)
      })
      .catch((err) => console.error('tts fetch failed', err))
      .finally(() => {
        if (ttsInFlightRef.current === aiDescription) {
          setAudioLoading(false)
          ttsInFlightRef.current = null
        }
      })
  }, [mode, aiDescription, audioUrl])

  // 自動播放一次
  useEffect(() => {
    if (audioUrl && audioPlayerRef.current) {
      audioPlayerRef.current.play().catch(() => {})
    }
  }, [audioUrl])

  function replayAudio() {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.currentTime = 0
      audioPlayerRef.current.play().catch(() => {})
    }
  }

  async function startRecording() {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/mp4'
      const recorder = new MediaRecorder(stream, { mimeType })
      audioChunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data)
      }
      recorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: mimeType })
        cleanupStream()
        await handleAudio(blob, mimeType)
      }

      recorder.start()
      mediaRecorderRef.current = recorder
      setPhase('recording')
      setRecordingTime(0)

      timerRef.current = setInterval(() => setRecordingTime((t) => t + 1), 1000)
      stopTimeoutRef.current = setTimeout(() => {
        stopRecording()
      }, MAX_RECORDING_MS)
    } catch (err) {
      console.error(err)
      setError('無法使用麥克風，請確認瀏覽器權限')
      setPhase('idle')
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop()
      setPhase('transcribing')
    }
  }

  async function handleAudio(blob: Blob, mimeType: string) {
    if (blob.size < 1000) {
      setError('錄音太短，請至少說 3 秒')
      setPhase('idle')
      return
    }

    try {
      const ext = mimeType.includes('webm') ? 'webm' : 'mp4'
      const file = new File([blob], `recording.${ext}`, { type: mimeType })
      const fd = new FormData()
      fd.append('audio', file)

      const res = await fetch('/api/transcribe', { method: 'POST', body: fd })
      if (!res.ok) throw new Error('轉寫失敗')
      const { text } = (await res.json()) as { text: string }

      if (!text || text.trim().length < 3) {
        setError('聽不清楚你的描述，請再試一次')
        setPhase('idle')
        return
      }

      setPhase('guessing')
      if (mode === 'ai_describes') {
        checkGuess(text)
      } else {
        await askAI(text)
      }
    } catch (err) {
      console.error(err)
      setError('語音處理失敗，請重試')
      setPhase('idle')
    }
  }

  function checkGuess(transcript: string) {
    const target = currentWord.word.toLowerCase().trim()
    const spoken = transcript.toLowerCase().replace(/[^a-z\s'-]/g, ' ')

    // 相符判斷:整字比對 + 詞根寬鬆(去尾 s/es/ed/ing)
    const tokens = spoken.split(/\s+/).filter(Boolean)
    const stem = (w: string) => w.replace(/(ing|ed|es|s)$/i, '')
    const isCorrect =
      tokens.includes(target) ||
      tokens.some((t) => stem(t) === stem(target) && stem(target).length >= 3)

    const attempt: Attempt = {
      transcript,
      aiGuess: '', // Mode B: transcript 就是學員的猜測,aiGuess 空
      isCorrect,
    }
    const nextAttempts = [...currentAttempts, attempt]
    setCurrentAttempts(nextAttempts)
    setPhase('result')

    const concluded = isCorrect || nextAttempts.length >= MAX_ATTEMPTS
    if (concluded) {
      setRevealed(true)
      fireExplain(nextAttempts, isCorrect)
    }
  }

  async function askAI(transcript: string) {
    try {
      const allDescriptions = [
        ...currentAttempts.map((a) => a.transcript),
        transcript,
      ]
      const previousGuesses = currentAttempts.map((a) => a.aiGuess)

      const res = await fetch('/api/charades/guess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetWord: currentWord.word,
          descriptions: allDescriptions,
          previousGuesses,
        }),
      })
      if (!res.ok) throw new Error('AI guess failed')

      const data = (await res.json()) as {
        guess: string
        is_correct: boolean
      }

      const attempt: Attempt = {
        transcript,
        aiGuess: data.guess,
        isCorrect: data.is_correct,
      }
      const nextAttempts = [...currentAttempts, attempt]
      setCurrentAttempts(nextAttempts)
      setPhase('result')

      const concluded = data.is_correct || nextAttempts.length >= MAX_ATTEMPTS
      if (concluded) {
        setRevealed(true)
        fireExplain(nextAttempts, data.is_correct)
      }
    } catch (err) {
      console.error(err)
      setError('AI 判斷失敗，請重試')
      setPhase('idle')
    }
  }

  async function fireExplain(attempts: Attempt[], correct: boolean) {
    setExplainLoading(true)
    setExplanation(null)
    try {
      const res = await fetch('/api/charades/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetWord: currentWord.word,
          definitionZh: currentWord.definition_zh,
          exampleSentence: currentWord.example_sentence,
          descriptions: attempts.map((a) => a.transcript).filter(Boolean),
          guessedCorrectly: correct,
          mode,
          jobTitle: profile.job_title,
          industry: profile.industry,
        }),
      })
      if (res.ok) {
        setExplanation((await res.json()) as Explanation)
      }
    } catch (err) {
      console.error('explain failed', err)
    } finally {
      setExplainLoading(false)
    }
  }

  function nextWord() {
    const lastAttempt = currentAttempts[currentAttempts.length - 1]
    const correct = lastAttempt?.isCorrect ?? false

    const result: WordResult = {
      wordId: currentWord.id,
      targetWord: currentWord.word,
      attempts: currentAttempts,
      guessedCorrectly: correct,
      explanation,
    }

    const newResults = [...results, result]
    setResults(newResults)
    setCurrentAttempts([])
    setRevealed(false)
    setExplanation(null)
    setExplainLoading(false)
    setAiDescription(null)
    if (audioUrl) URL.revokeObjectURL(audioUrl)
    setAudioUrl(null)
    setAudioLoading(false)
    setScriptShown(false)

    if (isLast) {
      finishSession(newResults)
    } else {
      setWordIdx((i) => i + 1)
      setPhase('idle')
    }
  }

  function giveUp() {
    // 揭曉答案 + 呼叫 explain,學員閱讀後再手動 next
    const attempts =
      currentAttempts.length > 0
        ? currentAttempts
        : [{ transcript: '', aiGuess: '', isCorrect: false }]

    if (currentAttempts.length === 0) {
      setCurrentAttempts(attempts)
    }
    setRevealed(true)
    setPhase('result')
    fireExplain(attempts, false)
  }

  async function finishSession(finalResults: WordResult[]) {
    setPhase('saving')

    try {
      // 平行取回饋 + 儲存
      const [fbRes, saveRes] = await Promise.all([
        fetch('/api/charades/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessions: finalResults.map((r) => ({
              targetWord: r.targetWord,
              descriptions: r.attempts.map((a) => a.transcript).filter(Boolean),
              guessedCorrectly: r.guessedCorrectly,
            })),
            mode,
            jobTitle: profile.job_title,
            industry: profile.industry,
          }),
        }),
        fetch('/api/charades/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            results: finalResults.map((r) => ({
              wordId: r.wordId,
              mode,
              attempts: r.attempts.length,
              guessedCorrectly: r.guessedCorrectly,
              transcript: r.attempts.map((a) => ({
                role: 'user',
                content: a.transcript,
              })),
            })),
          }),
        }),
      ])

      if (fbRes.ok) {
        const fb = await fbRes.json()
        setFeedback(fb)
      }
      if (saveRes.ok) {
        const s = (await saveRes.json()) as { total_stars: number }
        setTotalStars(s.total_stars)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setPhase('complete')
    }
  }

  // ============ RENDER ============

  if (phase === 'complete') {
    return <CompleteView results={results} totalStars={totalStars} feedback={feedback} />
  }

  if (phase === 'saving') {
    return (
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="text-center" aria-live="polite">
          <Spinner className="mx-auto mb-4 text-ink/60" size={40} />
          <p className="text-ink/70">AI 正在分析你的表現…</p>
        </div>
      </main>
    )
  }

  const attemptsLeft = MAX_ATTEMPTS - currentAttempts.length
  const lastAttempt = currentAttempts[currentAttempts.length - 1]

  return (
    <main className="flex-1 bg-paper min-h-screen">
      <nav className="border-b border-ink/15 bg-white">
        <div className="mx-auto max-w-3xl px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <ExitButton onClick={handleExit} />
            <span className="text-sm text-ink/70">
              第 {wordIdx + 1} / {words.length} 題
            </span>
          </div>
          <div className="flex gap-1">
            {[...Array(MAX_ATTEMPTS)].map((_, i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full ${
                  i < currentAttempts.length
                    ? currentAttempts[i].isCorrect
                      ? 'bg-ink'
                      : 'bg-pen/80'
                    : 'bg-ink/10'
                }`}
              />
            ))}
          </div>
        </div>
        <div className="h-1 bg-paper">
          <div
            className="h-full bg-ink transition-all"
            style={{ width: `${((wordIdx + 1) / words.length) * 100}%` }}
          />
        </div>
      </nav>

      <div className="mx-auto max-w-2xl px-6 py-10">
        {/* 目標字 / AI 描述卡 */}
        {mode === 'user_describes' ? (
          <div className="rounded-lg border border-ink/15 bg-white p-8 mb-6 text-center">
            <div className="text-xs font-medium tracking-wide uppercase text-ink/65 mb-3">
              目標單字 · AI 看不到
            </div>
            <div
              className="text-4xl font-bold text-ink mb-2 text-balance"
              translate="no"
            >
              {currentWord.word}
            </div>
            {currentWord.definition_zh && (
              <div className="text-sm text-ink/65">
                {currentWord.definition_zh}
              </div>
            )}
            {currentWord.scenario_tags.length > 0 && (
              <div className="mt-4 flex justify-center gap-1.5 flex-wrap">
                {currentWord.scenario_tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-2 py-0.5 rounded-full bg-paper text-ink/80"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-lg border border-ink/15 bg-white p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-xs font-medium tracking-wide uppercase text-ink">
                AI 出題 · 聽力理解
              </div>
              {audioUrl && (
                <button
                  onClick={() => setScriptShown((v) => !v)}
                  className="text-xs text-ink/65 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40 rounded px-1"
                >
                  {scriptShown ? '隱藏原文' : '顯示原文'}
                </button>
              )}
            </div>

            {(descLoading || audioLoading) && !audioUrl && (
              <div
                className="flex items-center gap-3 py-6 text-sm text-ink/65"
                aria-live="polite"
              >
                <Spinner className="text-ink/60" size={20} />
                <span>{descLoading ? 'AI 出題中…' : '生成語音中…'}</span>
              </div>
            )}

            {audioUrl && (
              <div className="flex items-center gap-4 py-2">
                <button
                  onClick={replayAudio}
                  className="w-14 h-14 rounded-full bg-ink text-paper hover:bg-ink/85 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ink/25 motion-safe:transition-transform motion-safe:hover:scale-105 inline-flex items-center justify-center shrink-0"
                  aria-label="重新播放題目"
                >
                  <PlayIcon className="w-6 h-6" />
                </button>
                <div className="text-sm text-ink/70">
                  聽 AI 描述，然後說出你猜的英文單字
                </div>
              </div>
            )}

            {audioUrl && scriptShown && aiDescription && (
              <p className="mt-4 rounded-lg bg-paper p-3 text-sm text-ink/80 leading-relaxed">
                {aiDescription}
              </p>
            )}

            {audioUrl && (
              <audio
                ref={audioPlayerRef}
                src={audioUrl}
                preload="auto"
                className="hidden"
              />
            )}

            {currentWord.scenario_tags.length > 0 && (
              <div className="mt-4 flex gap-1 flex-wrap">
                {currentWord.scenario_tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-2 py-0.5 rounded-full bg-paper text-ink/70"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 錄音按鈕 / 狀態 */}
        <div className="rounded-lg bg-white border border-ink/15 p-8 text-center">
          {phase === 'idle' && (
            <>
              <p className="text-ink/70 mb-6">
                {mode === 'user_describes'
                  ? '用英文描述這個字（不要說出這個字本身）'
                  : audioUrl
                    ? '聽完後，用英文說出你猜的字'
                    : '等 AI 出題…'}
              </p>
              <button
                onClick={startRecording}
                disabled={mode === 'ai_describes' && !audioUrl}
                className="group relative w-24 h-24 rounded-full bg-ink text-white hover:bg-ink focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ink/20 motion-safe:transition-transform motion-safe:hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 inline-flex items-center justify-center"
                aria-label="開始錄音"
              >
                <MicIcon className="w-9 h-9" />
              </button>
              <p className="mt-3 text-xs text-ink/65">
                點擊開始錄音（最多 30 秒）
              </p>
            </>
          )}

          {phase === 'recording' && (
            <>
              <p className="text-ink/70 mb-4">錄音中…</p>
              <button
                onClick={stopRecording}
                className="relative w-24 h-24 rounded-full bg-pen text-white hover:bg-pen/90 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pen/10 inline-flex items-center justify-center"
                aria-label="停止錄音"
              >
                <span
                  className="absolute inset-0 rounded-full bg-pen motion-safe:animate-ping opacity-40"
                  aria-hidden="true"
                />
                <span
                  className="relative block w-6 h-6 rounded-sm bg-white"
                  aria-hidden="true"
                />
              </button>
              <p className="mt-3 text-sm text-pen tabular-nums">
                {recordingTime}s / 30s
              </p>
            </>
          )}

          {phase === 'transcribing' && (
            <div className="py-8" aria-live="polite">
              <Spinner className="mx-auto mb-3 text-ink/60" />
              <p className="text-ink/70">辨識你的語音…</p>
            </div>
          )}

          {phase === 'guessing' && (
            <div className="py-8" aria-live="polite">
              <Spinner className="mx-auto mb-3 text-ink/60" />
              <p className="text-ink/70">
                {mode === 'user_describes' ? 'AI 思考中…' : '判定中…'}
              </p>
            </div>
          )}

          {phase === 'result' && lastAttempt && (
            <div className="text-left">
              {lastAttempt.transcript && (
                <div className="mb-4 rounded-lg bg-paper p-4">
                  <div className="text-xs text-ink/65 mb-1">
                    {mode === 'user_describes' ? '你剛才說' : '你猜的'}
                  </div>
                  <div className="text-sm text-ink">
                    &ldquo;{lastAttempt.transcript}&rdquo;
                  </div>
                </div>
              )}

              {mode === 'user_describes' && lastAttempt.aiGuess && (
                <div
                  className={`mb-4 rounded-lg p-4 ${
                    lastAttempt.isCorrect
                      ? 'bg-mark/25 border border-mark'
                      : 'bg-pen/10 border border-pen/30'
                  }`}
                >
                  <div
                    className={`text-xs mb-1 font-semibold ${
                      lastAttempt.isCorrect ? 'text-ink' : 'text-pen'
                    }`}
                  >
                    {lastAttempt.isCorrect ? '✓ AI 猜對了！' : '✗ AI 猜錯了'}
                  </div>
                  <div
                    className={`text-lg font-semibold ${
                      lastAttempt.isCorrect ? 'text-ink' : 'text-pen'
                    }`}
                    translate="no"
                  >
                    {lastAttempt.aiGuess}
                  </div>
                </div>
              )}

              {mode === 'ai_describes' && (
                <div
                  className={`mb-4 rounded-lg p-4 ${
                    lastAttempt.isCorrect
                      ? 'bg-mark/25 border border-mark'
                      : 'bg-pen/10 border border-pen/30'
                  }`}
                >
                  <div
                    className={`text-xs mb-1 font-semibold ${
                      lastAttempt.isCorrect ? 'text-ink' : 'text-pen'
                    }`}
                  >
                    {lastAttempt.isCorrect ? '✓ 猜對了！' : '✗ 不對喔'}
                  </div>
                </div>
              )}

              {revealed && (
                <>
                  {!lastAttempt.isCorrect && (
                    <div className="rounded-lg bg-mark/30 border border-mark p-4 mb-3">
                      <div className="text-xs text-ink mb-1">答案</div>
                      <div className="text-xl font-bold text-ink">
                        {currentWord.word}
                      </div>
                      {currentWord.example_sentence && (
                        <div className="mt-2 text-sm text-ink/80 italic">
                          &ldquo;{currentWord.example_sentence}&rdquo;
                        </div>
                      )}
                    </div>
                  )}

                  <div
                    className="rounded-lg bg-white border border-ink/15 p-4 mb-4"
                    aria-live="polite"
                  >
                    <div className="text-xs font-medium text-ink/65 mb-2">
                      本題解說
                    </div>
                    {explainLoading && (
                      <div className="text-sm text-ink/65">AI 正在準備解說…</div>
                    )}
                    {explanation && (
                      <div className="space-y-3 text-sm">
                        <div className="flex gap-2 text-ink">
                          <span
                            className="inline-block w-1 h-4 mt-0.5 rounded-sm bg-ink shrink-0"
                            aria-hidden="true"
                          />
                          <span>{explanation.one_tip_zh}</span>
                        </div>
                        {explanation.better_phrase && (
                          <div className="rounded bg-paper p-3">
                            <div className="text-xs text-ink/65 mb-1">你說</div>
                            <div className="text-ink/80 mb-2 line-through">
                              {explanation.better_phrase.you_said}
                            </div>
                            <div className="text-xs text-ink/65 mb-1">更好</div>
                            <div className="text-ink font-medium">
                              {explanation.better_phrase.better}
                            </div>
                          </div>
                        )}
                        {explanation.describe_next_time?.angle_zh && (
                          <div className="rounded-md border border-mark bg-mark/25 p-3">
                            <div className="text-[10px] font-semibold tracking-wide uppercase text-ink mb-1.5">
                              下次這樣描述，對方更容易猜到
                            </div>
                            <div className="text-sm text-ink leading-relaxed mb-2">
                              {explanation.describe_next_time.angle_zh}
                            </div>
                            {explanation.describe_next_time.sample_en && (
                              <div className="rounded bg-white border border-mark/40 px-3 py-2 text-sm text-ink italic">
                                <span
                                  className="not-italic text-[10px] font-mono font-semibold text-ink mr-2 uppercase tracking-wide"
                                  translate="no"
                                >
                                  Sample
                                </span>
                                <span translate="no">
                                  {explanation.describe_next_time.sample_en}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                        <div className="text-xs text-ink/70 border-t border-ink/10 pt-2">
                          <span className="font-medium text-ink/80">
                            你的職務怎麼用
                          </span>
                          <span className="mx-1 text-ink/60">·</span>
                          {explanation.usage_context_zh}
                        </div>
                      </div>
                    )}
                    {!explainLoading && !explanation && (
                      <div className="text-xs text-ink/65">解說載入失敗</div>
                    )}
                  </div>

                  <button
                    onClick={nextWord}
                    className="w-full rounded-md bg-ink py-3 text-paper font-semibold hover:bg-ink/85 transition"
                  >
                    {isLast ? '看今日回饋 →' : '下一題 →'}
                  </button>
                </>
              )}

              {!revealed && !lastAttempt.isCorrect && attemptsLeft > 0 && (
                <div className="space-y-2">
                  <button
                    onClick={() => setPhase('idle')}
                    className="w-full rounded-md bg-ink py-3 text-paper font-semibold hover:bg-ink/85 transition"
                  >
                    再試一次 (剩 {attemptsLeft} 次)
                  </button>
                  <button
                    onClick={giveUp}
                    className="w-full rounded-md border border-ink/25 py-2 text-sm text-ink/70 hover:bg-paper transition"
                  >
                    放棄，看答案
                  </button>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="mt-4 rounded-md bg-pen/10 border border-pen/30 px-3 py-2 text-sm text-pen">
              {error}
            </div>
          )}
        </div>

        {/* 累積歷史 */}
        {currentAttempts.length > 0 && phase !== 'result' && (
          <div className="mt-6 rounded-lg bg-white border border-ink/15 p-4">
            <div className="text-xs font-medium tracking-wide uppercase text-ink/65 mb-2">
              本題歷史
            </div>
            <ul className="divide-y divide-ink/10">
              {currentAttempts.map((a, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between text-xs text-ink/70 py-1.5"
                >
                  <span>
                    <span className="text-ink/60 tabular-nums mr-2">
                      #{i + 1}
                    </span>
                    {mode === 'user_describes'
                      ? `AI 猜「${a.aiGuess}」`
                      : `你猜「${a.transcript}」`}
                  </span>
                  <span
                    className={
                      a.isCorrect ? 'text-ink' : 'text-ink/60'
                    }
                  >
                    {a.isCorrect ? '對' : '否'}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </main>
  )
}

// ============ 結束畫面 ============
function CompleteView({
  results,
  totalStars,
  feedback,
}: {
  results: WordResult[]
  totalStars: number
  feedback: {
    grammar_errors?: Array<{ original: string; corrected: string; explanation_zh: string }>
    better_expressions?: Array<{ you_said: string; better: string; why_zh: string }>
    description_tips?: Array<{
      word: string
      your_description_summary_zh: string
      better_approach_zh: string
      sample_sentence?: string
    }>
    business_tip?: { word: string; tip_zh: string }
    overall_encouragement_zh?: string
  } | null
}) {
  const correct = results.filter((r) => r.guessedCorrectly).length
  const maxStars = results.length * 3

  return (
    <main className="flex-1 bg-paper py-10 px-6">
      <div className="max-w-2xl mx-auto">
        {/* 總覽 */}
        <div className="rounded-lg bg-white border border-ink/15 p-8 mb-6 text-center">
          <div className="inline-block px-3 py-1 mb-4 text-xs font-medium tracking-wide uppercase text-ink bg-mark/30 rounded-full">
            Session Complete
          </div>
          <h1 className="text-2xl font-bold text-ink mb-2 text-pretty">
            今日練習完成
          </h1>
          <p className="text-ink/70 mb-6">
            {feedback?.overall_encouragement_zh ?? '每天一點點，進步看得見。'}
          </p>

          <div className="grid grid-cols-3 gap-4 mb-4">
            <StatBig label="猜中" value={`${correct} / ${results.length}`} />
            <StatBig
              label="星星"
              value={
                <>
                  {'★'.repeat(Math.min(3, Math.floor(totalStars / results.length)))}
                  <span className="text-sm text-ink/65 ml-1">
                    {totalStars}/{maxStars}
                  </span>
                </>
              }
            />
            <StatBig label="題數" value={results.length.toString()} />
          </div>
        </div>

        {/* 每題結果 */}
        <section className="rounded-lg bg-white border border-ink/15 p-6 mb-6">
          <h2 className="text-sm font-semibold tracking-wide uppercase text-ink/65 mb-3">
            每題結果
          </h2>
          <ul className="divide-y divide-ink/10">
            {results.map((r, i) => (
              <li
                key={i}
                className="flex items-center justify-between py-2.5 text-sm"
              >
                <span className="flex items-center gap-2 font-medium text-ink">
                  <span className="text-xs text-ink/60 tabular-nums w-4">
                    {i + 1}
                  </span>
                  <span translate="no">{r.targetWord}</span>
                </span>
                <span
                  className={
                    r.guessedCorrectly ? 'text-ink' : 'text-ink/60'
                  }
                >
                  {r.guessedCorrectly
                    ? `第 ${r.attempts.length} 次過關`
                    : '未過關'}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* AI 回饋 */}
        {feedback && (
          <div className="space-y-4 mb-6">
            {feedback.grammar_errors && feedback.grammar_errors.length > 0 && (
              <FeedbackCard title="文法修正" accent="rose">
                <div className="space-y-4">
                  {feedback.grammar_errors.map((e, i) => (
                    <div key={i} className="text-sm">
                      <div className="text-pen line-through">
                        {e.original}
                      </div>
                      <div className="text-ink font-medium">
                        {e.corrected}
                      </div>
                      <div className="text-xs text-ink/65 mt-1">
                        {e.explanation_zh}
                      </div>
                    </div>
                  ))}
                </div>
              </FeedbackCard>
            )}

            {feedback.better_expressions && feedback.better_expressions.length > 0 && (
              <FeedbackCard title="更道地的說法" accent="blue">
                <div className="space-y-4">
                  {feedback.better_expressions.map((e, i) => (
                    <div key={i} className="text-sm">
                      <div className="text-ink/70">你說：{e.you_said}</div>
                      <div className="text-ink font-medium">
                        更好：{e.better}
                      </div>
                      <div className="text-xs text-ink/65 mt-1">{e.why_zh}</div>
                    </div>
                  ))}
                </div>
              </FeedbackCard>
            )}

            {feedback.description_tips && feedback.description_tips.length > 0 && (
              <FeedbackCard title="下次這樣描述會更好" accent="emerald">
                <div className="space-y-4">
                  {feedback.description_tips.map((tip, i) => (
                    <div
                      key={i}
                      className="rounded-lg border border-ink/15 bg-paper p-4"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-ink text-white"
                          translate="no"
                        >
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <span
                          className="text-sm font-semibold text-ink"
                          translate="no"
                        >
                          {tip.word}
                        </span>
                      </div>
                      <div className="text-xs text-ink/65 mb-1">
                        你當時的描述
                      </div>
                      <div className="text-sm text-ink/80 mb-3 leading-relaxed">
                        {tip.your_description_summary_zh}
                      </div>
                      <div className="text-xs text-ink font-medium mb-1">
                        下次可以這樣切入
                      </div>
                      <div className="text-sm text-ink leading-relaxed">
                        {tip.better_approach_zh}
                      </div>
                      {tip.sample_sentence && (
                        <div className="mt-3 rounded-md border border-mark bg-white px-3 py-2 text-sm text-ink italic">
                          <span
                            className="not-italic text-[10px] font-mono font-semibold text-ink mr-2 uppercase tracking-wide"
                            translate="no"
                          >
                            Sample
                          </span>
                          <span translate="no">{tip.sample_sentence}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </FeedbackCard>
            )}

            {feedback.business_tip && (
              <FeedbackCard title="商業實戰 Tip" accent="slate">
                <div className="text-sm text-ink">
                  <span className="font-semibold" translate="no">
                    {feedback.business_tip.word}
                  </span>
                  <span className="text-ink/65 mx-1">·</span>
                  {feedback.business_tip.tip_zh}
                </div>
              </FeedbackCard>
            )}
          </div>
        )}

        <div className="flex gap-3">
          <Link
            href="/"
            className="flex-1 rounded-md border border-ink/25 bg-white px-4 py-3 text-center text-sm font-semibold text-ink/80 hover:bg-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40 transition"
          >
            回 Dashboard
          </Link>
          <Link
            href="/charades"
            className="flex-1 rounded-md bg-ink px-4 py-3 text-center text-sm font-semibold text-white hover:bg-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30 transition"
          >
            再練一輪
          </Link>
        </div>
      </div>
    </main>
  )
}

function StatBig({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-paper py-3">
      <div className="text-xs text-ink/65 mb-1">{label}</div>
      <div className="text-xl font-bold text-ink tabular-nums">{value}</div>
    </div>
  )
}

function FeedbackCard({
  title,
  accent,
  children,
}: {
  title: string
  accent: 'rose' | 'blue' | 'slate' | 'emerald'
  children: React.ReactNode
}) {
  const bar =
    accent === 'rose'
      ? 'bg-pen'
      : accent === 'blue'
        ? 'bg-ink'
        : accent === 'emerald'
          ? 'bg-ink'
          : 'bg-ink/50'
  return (
    <section className="rounded-lg bg-white border border-ink/15 overflow-hidden">
      <header className="flex items-center gap-3 px-6 pt-5">
        <span
          className={`inline-block w-1 h-4 rounded-sm ${bar}`}
          aria-hidden="true"
        />
        <h3 className="text-sm font-semibold tracking-wide uppercase text-ink/65">
          {title}
        </h3>
      </header>
      <div className="px-6 pb-5 pt-3">{children}</div>
    </section>
  )
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M8 5.5v13a1 1 0 0 0 1.53.85l10-6.5a1 1 0 0 0 0-1.7l-10-6.5A1 1 0 0 0 8 5.5Z" />
    </svg>
  )
}

function MicIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="9" y="2" width="6" height="12" rx="3" />
      <path d="M5 10a7 7 0 0 0 14 0" />
      <path d="M12 17v4" />
      <path d="M8 21h8" />
    </svg>
  )
}

function Spinner({
  className,
  size = 28,
}: {
  className?: string
  size?: number
}) {
  return (
    <svg
      className={`${className ?? ''} motion-safe:animate-spin`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeOpacity="0.2"
        strokeWidth="3"
      />
      <path
        d="M22 12a10 10 0 0 1-10 10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  )
}
