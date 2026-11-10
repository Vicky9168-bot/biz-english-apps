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
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const totalSteps = 4
  const canNext =
    (step === 1 && jobTitle) ||
    (step === 2 && industry) ||
    (step === 3 && challenges.length > 0) ||
    (step === 4 && level !== null)

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
        onboarding_completed: true,
      })
      .eq('user_id', userId)

    if (updateError) {
      setError(updateError.message)
      setSaving(false)
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
      {/* Progress */}
      <div className="mb-8">
        <div className="flex justify-between text-xs text-slate-500 mb-2">
          <span>
            第 {step} / {totalSteps} 步
          </span>
          <span>{Math.round((step / totalSteps) * 100)}%</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-stone-800 transition-all duration-300"
            style={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Q1: 職位 */}
      {step === 1 && (
        <div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">
            1. 你的職位是什麼？
          </h2>
          <p className="text-sm text-slate-500 mb-6">
            我們會用你的職位來推薦相關的商務場景
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {JOB_TITLES.map((title) => (
              <button
                key={title}
                onClick={() => setJobTitle(title)}
                className={`rounded-lg border px-4 py-3 text-sm font-medium transition ${
                  jobTitle === title
                    ? 'border-stone-800 bg-[#FBF0C8] text-[#8A6508]'
                    : 'border-slate-200 text-slate-700 hover:border-slate-300'
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
          <h2 className="text-xl font-semibold text-slate-900 mb-2">
            2. 你所在的產業？
          </h2>
          <p className="text-sm text-slate-500 mb-6">影響單字題庫的領域選擇</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {INDUSTRIES.map((ind) => (
              <button
                key={ind}
                onClick={() => setIndustry(ind)}
                className={`rounded-lg border px-4 py-3 text-sm font-medium transition ${
                  industry === ind
                    ? 'border-stone-800 bg-[#FBF0C8] text-[#8A6508]'
                    : 'border-slate-200 text-slate-700 hover:border-slate-300'
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
          <h2 className="text-xl font-semibold text-slate-900 mb-2">
            3. 過往用英文最常遇到的挑戰？
          </h2>
          <p className="text-sm text-slate-500 mb-6">
            可多選，決定推題方向（已選 {challenges.length} 項）
          </p>
          <div className="grid gap-2">
            {ENGLISH_CHALLENGES.map((c) => (
              <button
                key={c.value}
                onClick={() => toggleChallenge(c.value)}
                className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm font-medium transition ${
                  challenges.includes(c.value)
                    ? 'border-stone-800 bg-[#FBF0C8] text-[#8A6508]'
                    : 'border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                    challenges.includes(c.value)
                      ? 'border-stone-800 bg-stone-800 text-[#F5D368]'
                      : 'border-slate-300'
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
          <h2 className="text-xl font-semibold text-slate-900 mb-2">
            4. 你目前的英文程度？
          </h2>
          <p className="text-sm text-slate-500 mb-6">
            決定初始難度，之後系統會依表現自動調整
          </p>
          <div className="grid gap-2">
            {PROFICIENCY_LEVELS.map((l) => (
              <button
                key={l.value}
                onClick={() => setLevel(l.value)}
                className={`rounded-lg border px-4 py-3 text-left transition ${
                  level === l.value
                    ? 'border-stone-800 bg-[#FBF0C8]'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="text-sm font-medium text-slate-900">{l.label}</div>
                <div className="text-xs text-slate-500 mt-0.5">{l.description}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="mt-6 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between mt-8">
        <button
          onClick={() => setStep(step - 1)}
          disabled={step === 1}
          className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          上一步
        </button>
        {step < totalSteps ? (
          <button
            onClick={() => setStep(step + 1)}
            disabled={!canNext}
            className="rounded-md bg-stone-800 px-6 py-2 text-sm font-semibold text-[#F5D368] hover:bg-stone-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            下一步
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!canNext || saving}
            className="rounded-md bg-stone-800 px-6 py-2 text-sm font-semibold text-[#F5D368] hover:bg-stone-700 transition disabled:opacity-50"
          >
            {saving ? '儲存中...' : '完成，開始學習'}
          </button>
        )}
      </div>
    </div>
  )
}
