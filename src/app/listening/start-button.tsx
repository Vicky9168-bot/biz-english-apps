'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const SCENARIOS = [
  { value: '', label: '隨機抽一個' },
  { value: 'meeting', label: '內部會議' },
  { value: 'client_call', label: '客戶電話' },
  { value: 'presentation_qa', label: '簡報 Q&A' },
  { value: 'small_talk', label: '商務閒聊' },
  { value: 'negotiation', label: '商務談判' },
] as const

export function StartButton() {
  const [loading, setLoading] = useState(false)
  const [scenario, setScenario] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function start() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/listening/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scenario ? { scenario } : {}),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error ?? 'generate failed')
      }
      const { id } = (await res.json()) as { id: string }
      router.push(`/listening/session/${id}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'unexpected error')
      setLoading(false)
    }
  }

  return (
    <div>
      <label
        htmlFor="scenario-select"
        className="block text-xs font-medium text-ink/70 mb-2"
      >
        場景
      </label>
      <select
        id="scenario-select"
        value={scenario}
        onChange={(e) => setScenario(e.target.value)}
        disabled={loading}
        className="w-full mb-4 rounded-md border border-ink/25 bg-white px-3 py-2 text-sm text-ink focus:border-ink/50 focus:ring-2 focus:ring-ink/15 focus:outline-none disabled:opacity-60"
      >
        {SCENARIOS.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
      <button
        onClick={start}
        disabled={loading}
        className="w-full rounded-md bg-ink px-4 py-3 text-sm font-semibold text-white hover:bg-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40 disabled:opacity-60 disabled:cursor-not-allowed transition"
      >
        {loading ? 'AI 正在寫劇本... (約 10 秒)' : '開始今日聽力訓練'}
      </button>
      {error && (
        <p className="mt-3 text-sm text-pen" role="alert">
          出錯了：{error}，再試一次？
        </p>
      )}
    </div>
  )
}
