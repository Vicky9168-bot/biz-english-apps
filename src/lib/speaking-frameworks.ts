// 商業場景練習（/speaking）可用的回答框架：單一來源，頁面、API、資料庫 CHECK 都要跟著這份走。
// 新增框架時一併更新：framework/[fw]/page.tsx 的說明內容，以及 speaking_scenarios.framework 的 CHECK（新 migration）。
export const SPEAKING_FRAMEWORKS = ['STAR', 'PREP', 'SCQA', 'PYRAMID', 'DIA', 'VTC'] as const

export type SpeakingFramework = (typeof SPEAKING_FRAMEWORKS)[number]

export function isSpeakingFramework(value: unknown): value is SpeakingFramework {
  return typeof value === 'string' && (SPEAKING_FRAMEWORKS as readonly string[]).includes(value)
}

// 商業場景首頁的完整說明
export const SPEAKING_FRAMEWORK_DESC: Record<SpeakingFramework, string> = {
  STAR: '過去經驗 · 行為題（Situation-Task-Action-Result）',
  PREP: '表達意見 · 立場（Point-Reason-Example-Point）',
  SCQA: '說服 · 提案（Situation-Complication-Question-Answer）',
  PYRAMID: 'Exec 溝通 · 答案先行（Answer → 3 支撐 → 佐證，McKinsey）',
  DIA: '數據分析簡報 · 從數字講到決策（Data → Insight → Action）',
  VTC: '業務談判 · 守住價值、條件交換（Value → Trade → Close）',
}

// 自訂情境頁的簡短說明
export const SPEAKING_FRAMEWORK_SHORT: Record<SpeakingFramework, string> = {
  STAR: '過去經驗 · 行為題',
  PREP: '表達意見 · 立場',
  SCQA: '說服 · 提案',
  PYRAMID: 'Exec 溝通 · 答案先行',
  DIA: '數據簡報 · 從數字到決策',
  VTC: '業務談判 · 條件交換',
}

// 給 AI 挑框架時的說明（recommend-framework API）
export const SPEAKING_FRAMEWORK_AI_NOTE: Record<SpeakingFramework, string> = {
  STAR: 'STAR (Situation-Task-Action-Result): 過去經驗、行為題 (Tell me about a time...)',
  PREP: 'PREP (Point-Reason-Example-Point): 表達意見、表態立場 (What do you think?)',
  SCQA: 'SCQA (Situation-Complication-Question-Answer): 說服型提案，需要鋪陳共識再給答案',
  PYRAMID: 'PYRAMID (Answer → 3 支撐 → 佐證): Exec 溝通、答案先行、對方時間少',
  DIA: 'DIA (Data → Insight → Action): 向主管或客戶報告數據分析，從數字講到發現再到建議',
  VTC: 'VTC (Value → Trade → Close): 業務談判、客戶殺價或加條件，守住價值並用條件交換讓步',
}
