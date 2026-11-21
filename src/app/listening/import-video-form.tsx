'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function ImportVideoForm({ remaining, limit }: { remaining: number; limit: number }) {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!url.trim()) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/listening/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      })
      const j = (await res.json().catch(() => ({}))) as { id?: string; error?: string }
      if (!res.ok || !j.id) throw new Error(j.error ?? '匯入失敗,請稍後再試')
      router.push(`/listening/session/${j.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : '匯入失敗,請稍後再試')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} className="mb-6 max-w-xl">
      <label htmlFor="youtube-url" className="mb-2 block text-xs font-medium text-ink/70">
        貼上 YouTube 連結,自己挑影片練習
      </label>
      <div className="flex gap-2">
        <input
          id="youtube-url"
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={loading || remaining <= 0}
          placeholder="https://www.youtube.com/watch?v=..."
          className="min-w-0 flex-1 rounded-md border border-ink/25 bg-white px-3 py-2 text-sm text-ink focus:border-ink/50 focus:ring-2 focus:ring-ink/15 focus:outline-none disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={loading || remaining <= 0 || !url.trim()}
          className="shrink-0 rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-ink/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? '處理中...' : '匯入'}
        </button>
      </div>
      <p className="mt-2 text-xs text-ink/60">
        {loading
          ? '正在抓字幕、翻譯、出題,約 30–60 秒,請不要關閉頁面'
          : `需有英文字幕、1 小時內的影片。今天還能匯入 ${remaining} / ${limit} 部(題庫已有的影片不扣次數)`}
      </p>
      {error && (
        <p className="mt-2 text-sm text-pen" role="alert">
          {error}
        </p>
      )}
    </form>
  )
}
