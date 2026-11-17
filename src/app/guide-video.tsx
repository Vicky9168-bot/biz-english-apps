import Link from 'next/link'
import { PlayCircle } from 'lucide-react'

// 教學影片（無聲，附 WebVTT 字幕軌）。影片由 video/ 資料夾的 Remotion 專案渲染，
// 影片與字幕檔都輸出到 public/videos/（字幕內容在 video/src/timeline.json，執行 npm run captions 產生）。
const VIDEOS = {
  // 單字學習 4 步驟（約 1 分鐘）
  word: {
    src: '/videos/word-guide.mp4',
    poster: '/videos/word-guide-poster.jpg',
    captions: '/videos/word-guide.vtt',
    label: '單字學習教學影片，約 1 分鐘，沒有聲音，附繁體中文字幕',
    summary: '不知道怎麼進行？看 1 分鐘單字教學',
  },
  // 比手畫腳新手短片（約 25 秒）
  charades: {
    src: '/videos/charades-guide.mp4',
    poster: '/videos/charades-guide-poster.jpg',
    captions: '/videos/charades-guide.vtt',
    label: '比手畫腳新手教學影片，約 25 秒，沒有聲音，附繁體中文字幕',
    summary: '第一次玩比手畫腳？看 25 秒怎麼開始',
  },
  // 聽力訓練新手短片（約 30 秒）
  listening: {
    src: '/videos/listening-guide.mp4',
    poster: '/videos/listening-guide-poster.jpg',
    captions: '/videos/listening-guide.vtt',
    label: '聽力訓練新手教學影片，約 30 秒，沒有聲音，附繁體中文字幕',
    summary: '第一次練聽力？看 30 秒怎麼開始',
  },
  // 商業場景練習新手短片（約 30 秒）
  speaking: {
    src: '/videos/speaking-guide.mp4',
    poster: '/videos/speaking-guide-poster.jpg',
    captions: '/videos/speaking-guide.vtt',
    label: '商業場景練習新手教學影片，約 30 秒，沒有聲音，附繁體中文字幕',
    summary: '第一次練口說？看 30 秒怎麼開始',
  },
} as const

export type GuideVideoKey = keyof typeof VIDEOS

function Player({ video, preload }: { video: GuideVideoKey; preload: 'none' | 'metadata' }) {
  const v = VIDEOS[video]
  return (
    <video
      controls
      playsInline
      preload={preload}
      poster={v.poster}
      aria-label={v.label}
      className="aspect-video w-full border border-ink/15 bg-white"
    >
      <source src={v.src} type="video/mp4" />
      <track kind="captions" src={v.captions} srcLang="zh-Hant" label="繁體中文" default />
      你的瀏覽器不支援影片播放，請改看文字版步驟。
    </video>
  )
}

// inline：直接顯示影片（新手指南頁）
// collapsible：預設收合的提示列，展開後才播放；用在功能頁面頂部，不佔版面也不會預先下載影片
export function GuideVideo({
  variant,
  video = 'word',
}: {
  variant: 'inline' | 'collapsible'
  video?: GuideVideoKey
}) {
  if (variant === 'inline') return <Player video={video} preload="metadata" />

  return (
    <details className="group mb-10 border border-ink/15 bg-white/60">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ink/40 [&::-webkit-details-marker]:hidden">
        <span className="flex items-center gap-3">
          <PlayCircle className="h-5 w-5 shrink-0 text-ink/70" strokeWidth={1.5} aria-hidden="true" />
          <span className="font-semibold">{VIDEOS[video].summary}</span>
        </span>
        <span className="text-sm text-ink/65 group-open:hidden">展開</span>
        <span className="hidden text-sm text-ink/65 group-open:inline">收合</span>
      </summary>
      <div className="px-5 pb-5">
        <Player video={video} preload="none" />
        <p className="mt-3 text-sm text-ink/70">
          影片沒有聲音，已預設開啟字幕。
          <Link
            href="/guide"
            className="ml-2 rounded-sm font-semibold text-ink underline decoration-ink/30 underline-offset-4 hover:decoration-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40"
          >
            看完整新手指南
          </Link>
        </p>
      </div>
    </details>
  )
}
