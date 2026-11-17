// 在例句裡找出俚語出現的位置，供俚語練習題畫線。
//
// 例句很少把俚語一字不差地照抄：
//   - 動詞會變化：drop the ball → "dropped the ball"、put out fires → "putting out fires"
//   - 會插入受詞：get on the same page → "get everyone on the same page"
//   - 會換掉代名詞：nail it → "nailed the positioning"、buy some time → "buy us time"
// 所以不能只比對原文，要把每個字展開成可能的變化形，字與字之間允許少量插入詞。

export type IdiomSpan = { start: number; end: number }

// 俚語裡代表「某人／某物」的字，在例句中可以是任何一個字
const WILDCARD = /^(?:someone|something|one'?s|someone'?s)$/i

// 這些字在例句裡常被換掉或省略（buy some time → buy us time），中間的位置視為可有可無
const OPTIONAL_WORDS = new Set(['the', 'a', 'an', 'some', 'my', 'your', 'his', 'her', 'our', 'their', 'its'])

// 兩個字之間最多可插入幾個詞（get [everyone] on、take [his revenue projections] with）
const MAX_FILLER_WORDS = 3

// 不規則動詞：原形 → 其他常見形態
const IRREGULAR: Record<string, string[]> = {
  bite: ['bit', 'bitten'],
  break: ['broke', 'broken'],
  bring: ['brought'],
  burn: ['burnt'],
  buy: ['bought'],
  come: ['came'],
  cut: ['cut'],
  do: ['did', 'done'],
  draw: ['drew', 'drawn'],
  drink: ['drank', 'drunk'],
  fall: ['fell', 'fallen'],
  get: ['got', 'gotten'],
  give: ['gave', 'given'],
  go: ['went', 'gone'],
  hit: ['hit'],
  hold: ['held'],
  keep: ['kept'],
  know: ['knew', 'known'],
  lead: ['led'],
  leave: ['left'],
  lose: ['lost'],
  make: ['made'],
  meet: ['met'],
  pay: ['paid'],
  put: ['put'],
  run: ['ran'],
  say: ['said'],
  see: ['saw', 'seen'],
  sell: ['sold'],
  send: ['sent'],
  set: ['set'],
  spend: ['spent'],
  stand: ['stood'],
  take: ['took', 'taken'],
  think: ['thought'],
  throw: ['threw', 'thrown'],
  wear: ['wore', 'worn'],
  win: ['won'],
}

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// 一個字的所有可能寫法：原形、s/es/ed/ing、去 e 加 ing、字尾子音重複（drop → dropped）、不規則變化
function wordPattern(token: string): string {
  const w = token.toLowerCase()
  const forms = new Set<string>([w, ...(IRREGULAR[w] ?? [])])

  // 三個字母以下（up、out、on…）多半是介系詞，不變化，避免誤抓
  if (w.length >= 3 && /^[a-z]+$/.test(w)) {
    forms.add(`${w}s`).add(`${w}es`).add(`${w}ed`).add(`${w}d`).add(`${w}ing`)
    if (w.endsWith('e')) forms.add(`${w.slice(0, -1)}ing`)
    if (w.endsWith('y')) forms.add(`${w.slice(0, -1)}ies`).add(`${w.slice(0, -1)}ied`)
    const last = w[w.length - 1]
    if (!'aeiouwxy'.includes(last)) forms.add(`${w}${last}ed`).add(`${w}${last}ing`)
  }
  return `(?:${[...forms].map(escapeRegex).join('|')})`
}

function buildRegex(tokens: string[]): RegExp | null {
  if (tokens.length === 0) return null

  const filler = `(?:\\s+\\S+){0,${MAX_FILLER_WORDS}}?\\s+`
  const part = (t: string) => (WILDCARD.test(t) ? '\\S+' : wordPattern(t))

  let source = `\\b${part(tokens[0])}`
  let pendingOptional = ''

  for (let i = 1; i < tokens.length; i++) {
    const lower = tokens[i].toLowerCase()
    const isLast = i === tokens.length - 1

    if (isLast && WILDCARD.test(lower)) {
      // table something：結尾的「某物／某人」是受詞，不算俚語本身，不畫進去（例句寫 table the rebrand discussion）
      continue
    }
    if (lower === 'it') {
      // nail it：例句可能寫 "nailed it"，也可能寫 "nailed the positioning"
      source += isLast ? '(?:\\s+it\\b)?' : '(?:\\s+it)?'
      continue
    }
    if (!isLast && OPTIONAL_WORDS.has(lower)) {
      pendingOptional += `(?:${escapeRegex(lower)}\\s+)?`
      continue
    }
    source += `${filler}${pendingOptional}${part(tokens[i])}`
    pendingOptional = ''
  }

  try {
    return new RegExp(`${source}\\b`, 'i')
  } catch {
    return null
  }
}

// 回傳俚語在例句中的位置；找不到回傳 null（呼叫端要有備案，不能假設一定找得到）
//
// 先試完整的俚語；整句比對不到時，退一步只比對前半段（park an idea → 例句寫 "park it"，
// 至少把 park 標出來）。前半段不能以 the／it 這類字結尾，單字也要夠長，才不會標到不相干的字。
export function findIdiomSpan(sentence: string, idiom: string): IdiomSpan | null {
  const tokens = idiom.trim().split(/\s+/).filter(Boolean)

  for (let n = tokens.length; n >= 1; n--) {
    const last = tokens[n - 1].toLowerCase()
    const isPrefix = n < tokens.length
    if (isPrefix && (OPTIONAL_WORDS.has(last) || last === 'it' || WILDCARD.test(last))) continue
    if (isPrefix && n === 1 && last.length < 4) continue

    const m = buildRegex(tokens.slice(0, n))?.exec(sentence)
    if (m) return { start: m.index, end: m.index + m[0].length }
  }
  return null
}
