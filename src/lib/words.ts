// 我的單字本（單一來源）：閱讀、影片、比手畫腳等各處存的字都放在 user_words，
// 這個字在各處出現的原句放在 user_word_contexts。

export const WORD_SOURCE_TYPES = ['reading', 'video', 'charades', 'manual'] as const

export type WordSourceType = (typeof WORD_SOURCE_TYPES)[number]

export function isWordSourceType(value: unknown): value is WordSourceType {
  return WORD_SOURCE_TYPES.some((t) => t === value)
}

export const WORD_SOURCE_LABELS: Record<WordSourceType, string> = {
  reading: '閱讀',
  video: '影片',
  charades: '比手畫腳',
  manual: '手動新增',
}

// 字在句子裡實際出現的樣子（surface_form）可能有變化形，挖空練習要靠它找位置
export type WordContext = {
  sentence: string
  surface_form: string | null
}

export type SavedWord = {
  id: string
  word: string
  pos: string | null
  meaning_zh: string
  meaning_en: string | null
  example_en: string | null
  source_type: WordSourceType
  source_id: string | null
  correct_count: number
  wrong_count: number
  contexts: WordContext[]
}

// 查詢 user_words 並一起帶出語境的 select 字串；頁面與 API 共用，欄位才不會各改各的
export const SAVED_WORD_SELECT =
  'id, word, pos, meaning_zh, meaning_en, example_en, source_type, source_id, correct_count, wrong_count, user_word_contexts(sentence, surface_form)'

type SavedWordRow = Omit<SavedWord, 'contexts'> & {
  user_word_contexts: WordContext[] | null
}

export function toSavedWord(row: SavedWordRow): SavedWord {
  const { user_word_contexts, ...rest } = row
  return { ...rest, contexts: user_word_contexts ?? [] }
}
