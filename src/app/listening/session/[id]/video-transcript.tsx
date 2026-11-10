'use client'

import { useEffect, useRef, useState, useSyncExternalStore } from 'react'

export type TranscriptLine = {
  start: number
  end: number
  en: string
  zh: string | null
}

type SubtitleMode = 'off' | 'en' | 'zh'

const SUBTITLE_MODES: ReadonlyArray<{ value: SubtitleMode; label: string }> = [
  { value: 'off', label: '無字幕' },
  { value: 'en', label: '英文' },
  { value: 'zh', label: '中文' },
]

const MODE_STORAGE_KEY = 'listening-subtitle-mode'
const DEFAULT_MODE: SubtitleMode = 'en'
const POLL_MS = 250
const USER_SCROLL_PAUSE_MS = 3000
const API_TIMEOUT_MS = 10000
const YT_STATE_ENDED = 0
const YT_STATE_PLAYING = 1

// ---------- YouTube IFrame API（專案沒有 @types/youtube，只宣告用到的部分）----------

interface YTPlayer {
  getCurrentTime(): number
  seekTo(seconds: number, allowSeekAhead: boolean): void
  playVideo(): void
  unloadModule(name: string): void
  destroy(): void
}

interface YTNamespace {
  Player: new (
    el: HTMLElement,
    opts: {
      videoId: string
      host: string
      playerVars: Record<string, string | number>
      events: {
        onStateChange: (e: { data: number }) => void
      }
    }
  ) => YTPlayer
}

declare global {
  interface Window {
    YT?: YTNamespace
    onYouTubeIframeAPIReady?: () => void
  }
}

let apiPromise: Promise<YTNamespace> | null = null

function loadYouTubeApi(): Promise<YTNamespace> {
  if (apiPromise) return apiPromise
  const p = new Promise<YTNamespace>((resolve, reject) => {
    if (window.YT?.Player) {
      resolve(window.YT)
      return
    }
    const previous = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      previous?.()
      if (window.YT) resolve(window.YT)
    }
    const script = document.createElement('script')
    script.src = 'https://www.youtube.com/iframe_api'
    script.async = true
    script.onerror = () => reject(new Error('youtube api load failed'))
    document.head.appendChild(script)
    setTimeout(() => reject(new Error('youtube api timeout')), API_TIMEOUT_MS)
  })
  apiPromise = p
  p.catch(() => {
    apiPromise = null
  })
  return p
}

// ---------- 字幕模式偏好（存在瀏覽器；儲存被擋時退回記憶體）----------

let memoryMode: SubtitleMode = DEFAULT_MODE
const modeListeners = new Set<() => void>()

function readMode(): SubtitleMode {
  try {
    const v = localStorage.getItem(MODE_STORAGE_KEY)
    if (v === 'off' || v === 'en' || v === 'zh') return v
  } catch {
    // localStorage 不可用（無痕、被封鎖）→ 用記憶體值
  }
  return memoryMode
}

function writeMode(mode: SubtitleMode) {
  memoryMode = mode
  try {
    localStorage.setItem(MODE_STORAGE_KEY, mode)
  } catch {
    // 同上，記憶體值已更新
  }
  modeListeners.forEach((l) => l())
}

function subscribeMode(onChange: () => void) {
  modeListeners.add(onChange)
  window.addEventListener('storage', onChange)
  return () => {
    modeListeners.delete(onChange)
    window.removeEventListener('storage', onChange)
  }
}

// ---------- 工具 ----------

function formatTime(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

// 找最後一個 start <= time 的句子；還沒到第一句回傳 -1
function findActiveIndex(lines: TranscriptLine[], time: number): number {
  let lo = 0
  let hi = lines.length - 1
  let found = -1
  while (lo <= hi) {
    const mid = (lo + hi) >> 1
    if (lines[mid].start <= time) {
      found = mid
      lo = mid + 1
    } else {
      hi = mid - 1
    }
  }
  return found
}

// ---------- 元件 ----------

export function VideoTranscript({
  videoId,
  startSeconds,
  title,
  transcript,
  onStartQuiz,
}: {
  videoId: string
  startSeconds: number
  title: string
  transcript: TranscriptLine[]
  onStartQuiz?: () => void
}) {
  const mode = useSyncExternalStore(subscribeMode, readMode, () => DEFAULT_MODE)
  const [activeIdx, setActiveIdx] = useState(-1)
  const [ended, setEnded] = useState(false)
  const [apiFailed, setApiFailed] = useState(false)

  const playerHostRef = useRef<HTMLDivElement | null>(null)
  const playerRef = useRef<YTPlayer | null>(null)
  const listRef = useRef<HTMLDivElement | null>(null)
  const lineRefs = useRef<Array<HTMLButtonElement | null>>([])
  const userScrollUntilRef = useRef(0)

  // 建立播放器
  useEffect(() => {
    const host = playerHostRef.current
    if (!host) return
    let cancelled = false
    let player: YTPlayer | null = null

    loadYouTubeApi().then(
      (YT) => {
        if (cancelled) return
        // YT.Player 會把節點換成 iframe，不能讓 React 管理這個節點
        const mount = document.createElement('div')
        host.appendChild(mount)
        player = new YT.Player(mount, {
          videoId,
          host: 'https://www.youtube-nocookie.com',
          playerVars: {
            start: startSeconds,
            rel: 0,
            playsinline: 1,
            cc_load_policy: 0,
          },
          events: {
            onStateChange: (e) => {
              setEnded(e.data === YT_STATE_ENDED)
              // 字幕只由頁面上的「無字幕／英文／中文」控制，關掉 YouTube 自帶字幕
              if (e.data === YT_STATE_PLAYING) {
                try {
                  playerRef.current?.unloadModule('captions')
                  playerRef.current?.unloadModule('cc')
                } catch {
                  // 模組尚未載入時會丟錯，忽略
                }
              }
            },
          },
        })
        playerRef.current = player
      },
      () => {
        if (!cancelled) setApiFailed(true)
      }
    )

    return () => {
      cancelled = true
      playerRef.current = null
      try {
        player?.destroy()
      } catch {
        // 播放器尚未就緒時 destroy 可能丟錯，忽略
      }
      host.replaceChildren()
    }
  }, [videoId, startSeconds])

  // 輪詢播放時間 → 更新目前這句
  useEffect(() => {
    if (mode === 'off') return
    const timer = setInterval(() => {
      const player = playerRef.current
      if (!player) return
      try {
        const idx = findActiveIndex(transcript, player.getCurrentTime())
        setActiveIdx((prev) => (prev === idx ? prev : idx))
      } catch {
        // 播放器尚未就緒
      }
    }, POLL_MS)
    return () => clearInterval(timer)
  }, [mode, transcript])

  // 目前這句捲到逐字稿欄中間（只捲逐字稿欄，不動整頁）
  useEffect(() => {
    if (mode === 'off' || activeIdx < 0) return
    if (Date.now() < userScrollUntilRef.current) return
    const list = listRef.current
    const el = lineRefs.current[activeIdx]
    if (!list || !el) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    list.scrollTo({
      top: el.offsetTop - list.clientHeight / 2 + el.clientHeight / 2,
      behavior: reduced ? 'auto' : 'smooth',
    })
  }, [activeIdx, mode])

  function seekTo(seconds: number) {
    const player = playerRef.current
    if (!player) return
    player.seekTo(seconds, true)
    player.playVideo()
    userScrollUntilRef.current = 0
  }

  const pauseAutoScroll = () => {
    userScrollUntilRef.current = Date.now() + USER_SCROLL_PAUSE_MS
  }

  const showTranscript = mode !== 'off'

  return (
    <div>
      <div
        className={`grid gap-4 ${
          showTranscript ? 'lg:grid-cols-5' : 'mx-auto max-w-3xl'
        }`}
      >
        <div
          className={`aspect-video self-start overflow-hidden rounded-xl border border-slate-200 bg-black ${
            showTranscript ? 'lg:col-span-3' : ''
          }`}
        >
          {apiFailed ? (
            // IFrame API 載入失敗：退回一般嵌入，逐字稿仍可閱讀但不會同步
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${videoId}?start=${startSeconds}&rel=0`}
              title={title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="h-full w-full"
            />
          ) : (
            <div
              ref={playerHostRef}
              className="h-full w-full [&_iframe]:h-full [&_iframe]:w-full"
            />
          )}
        </div>

        {showTranscript && (
          <div className="relative h-72 lg:col-span-2 lg:h-auto">
            <div
              ref={listRef}
              onWheel={pauseAutoScroll}
              onTouchMove={pauseAutoScroll}
              className="absolute inset-0 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2"
              aria-label={mode === 'zh' ? '中文逐字稿' : '英文逐字稿'}
            >
              {transcript.map((line, i) => {
                const active = i === activeIdx
                const text = mode === 'zh' ? (line.zh ?? line.en) : line.en
                return (
                  <button
                    key={i}
                    type="button"
                    ref={(el) => {
                      lineRefs.current[i] = el
                    }}
                    onClick={() => seekTo(line.start)}
                    aria-current={active ? 'true' : undefined}
                    disabled={apiFailed}
                    className={`flex w-full gap-3 rounded-md px-3 py-2 text-left text-sm leading-relaxed transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 ${
                      active
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-600 hover:bg-slate-100'
                    } ${apiFailed ? 'cursor-default' : 'cursor-pointer'}`}
                  >
                    <span
                      className={`shrink-0 pt-0.5 font-mono text-[11px] tabular-nums ${
                        active ? 'text-white/60' : 'text-slate-400'
                      }`}
                    >
                      {formatTime(line.start)}
                    </span>
                    <span>{text}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">字幕</span>
          <div
            role="group"
            aria-label="字幕模式"
            className="flex rounded-md border border-slate-300 bg-white p-0.5"
          >
            {SUBTITLE_MODES.map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() => writeMode(m.value)}
                aria-pressed={mode === m.value}
                className={`rounded px-3 py-1 text-xs transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 ${
                  mode === m.value
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {onStartQuiz && (
          <button
            type="button"
            onClick={onStartQuiz}
            className={`rounded-md px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 ${
              ended
                ? 'bg-slate-900 text-white hover:bg-slate-800'
                : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            聽完了，開始練習題目 ↓
          </button>
        )}
      </div>
    </div>
  )
}
