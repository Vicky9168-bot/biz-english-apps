'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

// 今天這類文章還沒有時，呼叫後端生成（約 20–40 秒），完成後重新載入頁面
export function GenerateClient({
  category,
  label,
}: {
  category: string
  label: string
}) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const started = useRef(false)

  const generate = useCallback(async () => {
    setError(null)
    try {
      const res = await fetch('/api/reading/article', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ category }),
      })
      if (!res.ok) throw new Error('生成失敗')
      router.refresh()
    } catch {
      setError('今天的文章準備失敗了，請再試一次。')
    }
  }, [category, router])

  useEffect(() => {
    if (started.current) return
    started.current = true
    generate()
  }, [generate])

  if (error) {
    return (
      <div className="border-l-4 border-mark pl-5">
        <p className="text-sm text-ink/80">{error}</p>
        <button
          type="button"
          onClick={generate}
          className="mt-4 rounded-md bg-ink px-5 py-2.5 text-sm font-semibold text-paper hover:bg-ink/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40 focus-visible:ring-offset-2"
        >
          重新產生
        </button>
      </div>
    )
  }

  return (
    <div role="status" aria-live="polite">
      <h1 className="text-2xl font-bold">正在準備今天的「{label}」文章</h1>
      <p className="mt-3 text-sm leading-relaxed text-ink/70">
        第一位讀者會觸發生成，大約需要 20–40 秒。之後今天所有人都直接看到同一篇。
      </p>
      <div className="mt-8 h-1 w-full overflow-hidden bg-ink/10">
        <div className="h-full w-1/3 animate-pulse bg-mark" />
      </div>
    </div>
  )
}
