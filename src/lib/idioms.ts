// 商務俚語（單一來源）：類別、每日新題上限、學習狀態、練習連結。
// 類別的鍵值要和 business_idioms.category 的 check 限制一致（見 supabase/migrations/20260928000000_idioms.sql）。

export const IDIOM_DAILY_LIMIT = 10

export const IDIOM_CATEGORIES = [
  { key: 'meeting', label: '會議', examples: 'touch base · loop in · circle back' },
  { key: 'negotiation', label: '談判', examples: 'push back · hash out · deal breaker' },
  { key: 'strategy', label: '策略', examples: 'pivot · double down · north star' },
  { key: 'feedback', label: '回饋', examples: 'drop the ball · above and beyond · nail it' },
  { key: 'urgency', label: '時間壓力', examples: 'crunch time · put out fires · buy some time' },
  { key: 'interpersonal', label: '人際', examples: "team player · rock the boat · see eye to eye" },
  { key: 'general', label: '通用', examples: 'cut corners · bite the bullet · from scratch' },
] as const

export type IdiomCategory = (typeof IDIOM_CATEGORIES)[number]['key']

export function isIdiomCategory(value: unknown): value is IdiomCategory {
  return IDIOM_CATEGORIES.some((c) => c.key === value)
}

export function getIdiomCategory(key: string) {
  return IDIOM_CATEGORIES.find((c) => c.key === key)
}

// 每個俚語對這位使用者的狀態：答錯過 > 學過 > 沒碰過
export type IdiomStatus = 'wrong' | 'learned' | 'new'

// 從作答紀錄整理出「練過的」與「答錯過的」俚語 id
export function summarizeAttempts(attempts: { idiom_id: string; is_correct: boolean }[]) {
  const attemptedIds = new Set<string>()
  const wrongIds = new Set<string>()
  attempts.forEach((a) => {
    attemptedIds.add(a.idiom_id)
    if (!a.is_correct) wrongIds.add(a.idiom_id)
  })
  return { attemptedIds, wrongIds }
}

export function statusOf(id: string, attemptedIds: Set<string>, wrongIds: Set<string>): IdiomStatus {
  return wrongIds.has(id) ? 'wrong' : attemptedIds.has(id) ? 'learned' : 'new'
}

// 練習頁的連結；category 為空代表全部類別
export function practiceHref(mode: 'learn' | 'review', category?: IdiomCategory | null) {
  const params = new URLSearchParams()
  if (mode === 'review') params.set('mode', 'review')
  if (category) params.set('category', category)
  const qs = params.toString()
  return `/idioms/practice${qs ? `?${qs}` : ''}`
}
