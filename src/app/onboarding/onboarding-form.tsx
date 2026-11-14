'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  JOB_TITLES,
  INDUSTRIES,
  ENGLISH_CHALLENGES,
  PROFICIENCY_LEVELS,
} from '@/lib/constants'

export function OnboardingForm({ userId }: { userId: string }) {
  const router = useRouter()
  const supabase = createClient()

  const [step, setStep] = useState(1)
  const [jobTitle, setJobTitle] = useState('')
  const [industry, setIndustry] = useState('')
  const [challenges, setChallenges] = useState<string[]>([])
  const [level, setLevel] = useState<number | null>(null)
  const [nickname, setNickname] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const totalSteps = 5
  const trimmedNickname = nickname.trim()
  const canNext =
    (step === 1 && jobTitle) ||
    (step === 2 && industry) ||
    (step === 3 && challenges.length > 0) ||
    (step === 4 && level !== null) ||
    (step === 5 && trimmedNickname.length >= 1 && trimmedNickname.length <= 20)

  function toggleChallenge(v: string) {
    setChallenges((prev) =>
      prev.includes(v) ? prev.filter((c) => c !== v) : [...prev, v]
    )
  }

  async function handleSubmit() {
    setSaving(true)
    setError(null)

    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        job_title: jobTitle,
        industry,
        english_challenges: challenges,
        proficiency_level: level,
        nickname: trimmedNickname,
        onboarding_completed: true,
      })
      .eq('user_id', userId)

    if (updateError) {
      // 23505 = unique_violation（暱稱重複）
      setError(
        updateError.code === '23505'
          ? '這個暱稱已被使用，請換一個'
          : updateError.message
      )
      setSaving(false)
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <div className="rounded-lg border border-ink/15 bg-white p-8">
      {/* Progress */}
      <div className="mb-8">
        <div className="flex justify-between text-xs text-ink/65 mb-2">
          <span>
            第 {step} / {totalSteps} 步
          </span>
          <span>{Math.round((step / totalSteps) * 100)}%</span>
        </div>
        <div className="h-2 bg-paper rounded-full overflow-hidden">
          <div
            className="h-full bg-ink transition-all duration-300"
            style={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Q1: 職位 */}
      {step === 1 && (
        <div>
          <h2 className="text-xl font-semibold text-ink mb-2">
            1. 你的職位是什麼？
          </h2>
          <p className="text-sm text-ink/65 mb-6">
            我們會用你的職位來推薦相關的商務場景
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {JOB_TITLES.map((title) => (
              <button
                key={title}
                onClick={() => setJobTitle(title)}
                className={`rounded-lg border px-4 py-3 text-sm font-medium transition ${
                  jobTitle === title
                    ? 'border-ink bg-mark/30 text-ink'
                    : 'border-ink/15 text-ink/80 hover:border-ink/25'
                }`}
              >
                {title}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Q2: 產業 */}
      {step === 2 && (
        <div>
          <h2 className="text-xl font-semibold text-ink mb-2">
            2. 你所在的產業？
          </h2>
          <p className="text-sm text-ink/65 mb-6">影響單字題庫的領域選擇</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {INDUSTRIES.map((ind) => (
              <button
                key={ind}
                onClick={() => setIndustry(ind)}
                className={`rounded-lg border px-4 py-3 text-sm font-medium transition ${
                  industry === ind
                    ? 'border-ink bg-mark/30 text-ink'
                    : 'border-ink/15 text-ink/80 hover:border-ink/25'
                }`}
              >
                {ind}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Q3: 英文挑戰 */}
      {step === 3 && (
        <div>
          <h2 className="text-xl font-semibold text-ink mb-2">
            3. 過往用英文最常遇到的挑戰？
          </h2>
          <p className="text-sm text-ink/65 mb-6">
            可多選，決定推題方向（已選 {challenges.length} 項）
          </p>
          <div className="grid gap-2">
            {ENGLISH_CHALLENGES.map((c) => (
              <button
                key={c.value}
                onClick={() => toggleChallenge(c.value)}
                className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm font-medium transition ${
                  challenges.includes(c.value)
                    ? 'border-ink bg-mark/30 text-ink'
                    : 'border-ink/15 text-ink/80 hover:border-ink/25'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                    challenges.includes(c.value)
                      ? 'border-ink bg-ink text-paper'
                      : 'border-ink/25'
                  }`}
                >
                  {challenges.includes(c.value) && (
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </span>
                {c.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Q4: 英文程度 */}
      {step === 4 && (
        <div>
          <h2 className="text-xl font-semibold text-ink mb-2">
            4. 你目前的英文程度？
          </h2>
          <p className="text-sm text-ink/65 mb-6">
            決定初始難度，之後系統會依表現自動調整
          </p>
          <div className="grid gap-2">
            {PROFICIENCY_LEVELS.map((l) => (
              <button
                key={l.value}
                onClick={() => setLevel(l.value)}
                className={`rounded-lg border px-4 py-3 text-left transition ${
                  level === l.value
                    ? 'border-ink bg-mark/30'
                    : 'border-ink/15 hover:border-ink/25'
                }`}
              >
                <div className="text-sm font-medium text-ink">{l.label}</div>
                <div className="text-xs text-ink/65 mt-0.5">{l.description}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Q5: 暱稱 */}
      {step === 5 && (
        <div>
          <h2 className="text-xl font-semibold text-ink mb-2">
            5. 幫自己取個暱稱
          </h2>
          <p className="text-sm text-ink/65 mb-6">
            排行榜只會顯示暱稱，不會顯示你的帳號或 Email（1 到 20 字）
          </p>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            maxLength={20}
            placeholder="例如：Vicky"
            className="w-full rounded-lg border border-ink/15 px-4 py-3 text-sm text-ink focus:border-ink focus:outline-none"
          />
          <div className="mt-2 text-right text-xs text-ink/60">
            {trimmedNickname.length} / 20
          </div>
        </div>
      )}

      {error && (
        <div className="mt-6 rounded-md bg-pen/10 border border-pen/30 px-3 py-2 text-sm text-pen">
          {error}
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between mt-8">
        <button
          onClick={() => setStep(step - 1)}
          disabled={step === 1}
          className="rounded-md border border-ink/25 bg-white px-4 py-2 text-sm font-medium text-ink/80 hover:bg-paper transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          上一步
        </button>
        {step < totalSteps ? (
          <button
            onClick={() => setStep(step + 1)}
            disabled={!canNext}
            className="rounded-md bg-ink px-6 py-2 text-sm font-semibold text-paper hover:bg-ink/85 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            下一步
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!canNext || saving}
            className="rounded-md bg-ink px-6 py-2 text-sm font-semibold text-paper hover:bg-ink/85 transition disabled:opacity-50"
          >
            {saving ? '儲存中...' : '完成，開始學習'}
          </button>
        )}
      </div>
    </div>
  )
}
