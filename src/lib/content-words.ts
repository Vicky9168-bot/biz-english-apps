// 判斷 English 單字是實詞(content)還是虛詞(function)
// 規則對齊 /listening/lesson/content-words 課程:
//   實詞 = 名詞/動詞/形容詞/副詞/否定/疑問/數字
//   虛詞 = 冠詞/代名詞/介係詞/助動詞/be 動詞/連接詞

const FUNCTION_WORDS = new Set<string>([
  // articles
  'a', 'an', 'the',
  // pronouns
  'i', 'you', 'he', 'she', 'it', 'we', 'they',
  'me', 'him', 'her', 'us', 'them',
  'my', 'your', 'his', 'its', 'our', 'their',
  'mine', 'yours', 'hers', 'ours', 'theirs',
  'this', 'that', 'these', 'those',
  'myself', 'yourself', 'himself', 'herself', 'itself', 'ourselves', 'yourselves', 'themselves',
  // be / aux / modal
  'be', 'am', 'is', 'are', 'was', 'were', 'being', 'been',
  'have', 'has', 'had', 'having',
  'do', 'does', 'did', 'doing', 'done',
  'will', 'would', 'shall', 'should', 'can', 'could', 'may', 'might', 'must', 'ought',
  // prepositions
  'in', 'on', 'at', 'to', 'from', 'of', 'for', 'with', 'by', 'about',
  'over', 'under', 'up', 'down', 'into', 'onto', 'out', 'off', 'through',
  'between', 'among', 'before', 'after', 'during', 'until', 'without', 'within',
  'against', 'along', 'around', 'behind', 'beside', 'beyond', 'near', 'throughout',
  'upon', 'across',
  // conjunctions
  'and', 'or', 'but', 'so', 'yet', 'nor',
  'if', 'because', 'although', 'though', 'while', 'whereas',
  'unless', 'since', 'as', 'than', 'that',
  // 常見縮寫尾巴會單獨切出來
  "'s", "'d", "'ll", "'re", "'ve", "'m",
  // 其他
  'there', 'here',
])

// 這些即使符合虛詞規則,也視為實詞(帶語意重量)
const FORCE_CONTENT = new Set<string>([
  'not', "n't", 'no', 'never', 'nothing', 'none', 'neither',
  'what', 'when', 'where', 'why', 'who', 'how', 'which', 'whose',
])

export type ClassifiedToken = {
  text: string          // 原始 token(含大小寫、標點)
  content: boolean      // true = 實詞(要重讀)
  isPunct: boolean      // 純標點不上色
}

// 把一段英文切成 tokens(單字 / 縮寫尾巴 / 標點)
// 例:"I'll send it." → ["I", "'ll", "send", "it", "."]
export function tokenize(text: string): string[] {
  const out: string[] = []
  const re = /([A-Za-z]+(?:-[A-Za-z]+)*|'[a-zA-Z]{1,3}|[0-9]+(?:[.,][0-9]+)*|[^\sA-Za-z0-9])/g
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    out.push(m[1])
  }
  return out
}

export function classify(rawToken: string): ClassifiedToken {
  const isPunct = !/[A-Za-z0-9]/.test(rawToken)
  if (isPunct) return { text: rawToken, content: false, isPunct: true }

  const lower = rawToken.toLowerCase()

  // 數字一律 content
  if (/^[0-9]/.test(lower)) return { text: rawToken, content: true, isPunct: false }

  if (FORCE_CONTENT.has(lower)) return { text: rawToken, content: true, isPunct: false }
  if (FUNCTION_WORDS.has(lower)) return { text: rawToken, content: false, isPunct: false }

  // 其他預設為 content(名/動/形/副 都會走到這)
  return { text: rawToken, content: true, isPunct: false }
}

export function classifyLine(text: string): ClassifiedToken[] {
  return tokenize(text).map(classify)
}

// 抓出一段文字中所有實詞(去重,保留第一次出現的大小寫)
export function extractContentWords(text: string): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const tok of tokenize(text)) {
    const c = classify(tok)
    if (!c.content || c.isPunct) continue
    const lower = tok.toLowerCase()
    if (seen.has(lower)) continue
    seen.add(lower)
    out.push(tok)
  }
  return out
}

// 比對 reference 的實詞是否有出現在 user text 中
export function checkContentWords(
  reference: string,
  userText: string
): Array<{ word: string; hit: boolean }> {
  const userTokens = new Set(tokenize(userText).map((t) => t.toLowerCase()))
  return extractContentWords(reference).map((word) => ({
    word,
    hit: userTokens.has(word.toLowerCase()),
  }))
}
