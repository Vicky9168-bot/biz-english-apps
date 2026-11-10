// 聽力題庫抽題：每次從 question_bank 抽題，優先抽使用者還沒答過的

export type ListeningQuestion = {
  id?: string
  q: string
  options: string[]
  answer_idx: number
  explanation_zh: string
}

export type SavedAnswer = { q_idx: number; q_id?: string }

export const QUESTIONS_PER_SESSION = 3

// 舊紀錄沒有 q_id：原本的題目在題庫裡依序是 q01、q02、q03，用 q_idx 還原
export function answerQuestionId(a: SavedAnswer): string {
  return a.q_id ?? `q${String(a.q_idx + 1).padStart(2, '0')}`
}

function shuffle<T>(items: readonly T[]): T[] {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

// 先抽沒答過的；不夠就從已答過的補齊，不會卡住
export function pickQuestions(
  bank: ListeningQuestion[],
  seenIds: ReadonlySet<string>,
  count = QUESTIONS_PER_SESSION
): ListeningQuestion[] {
  const unseen = shuffle(bank.filter((q) => !q.id || !seenIds.has(q.id)))
  const picked = unseen.slice(0, count)
  if (picked.length < count) {
    const fill = shuffle(bank.filter((q) => !picked.includes(q)))
    picked.push(...fill.slice(0, count - picked.length))
  }
  return picked
}

// 複習模式：還原上次實際作答的題目；還原不出來回傳空陣列，由呼叫端退回預設題目
export function questionsFromAnswers(
  bank: ListeningQuestion[],
  answers: SavedAnswer[]
): ListeningQuestion[] {
  return answers
    .map((a) => bank.find((q) => q.id === answerQuestionId(a)))
    .filter((q): q is ListeningQuestion => !!q)
}
