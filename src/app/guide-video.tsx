import Link from 'next/link'
import { PlayCircle } from 'lucide-react'

// 教學影片（無聲，字幕在畫面內）。影片由 video/ 資料夾的 Remotion 專案渲染，輸出到 public/videos/。
const VIDEOS = {
  // 單字學習 4 步驟（約 1 分鐘）
  word: {
    src: '/videos/word-guide.mp4',
    poster: '/videos/word-guide-poster.jpg',
    label: '單字學習教學影片，約 1 分鐘，沒有聲音，字幕在畫面內',
    summary: '不知道怎麼進行？看 1 分鐘單字教學',
  },
  // 比手畫腳新手短片（約 25 秒）
  charades: {
    src: '/videos/charades-guide.mp4',
    poster: '/videos/charades-guide-poster.jpg',
    label: '比手畫腳新手教學影片，約 25 秒，沒有聲音，字幕在畫面內',
    summary: '第一次玩比手畫腳？看 25 秒怎麼開始',
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
          影片沒有聲音，字幕在畫面內。
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
