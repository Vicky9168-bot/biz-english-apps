import { getOpenAI, MODELS } from '@/lib/openai'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

// 每日商業閱讀：類別、新聞來源、型別與文章生成（單一來源）
//
// 流程：抓各類別 RSS（只取標題與摘要，不抓全文）→ 挑一則最適合學英文的新聞
// → AI 用自己的話寫英文解說 + 重點單字 → 存進資料庫並附原文連結。
// 每天每個類別一篇，之前的文章全部保留成為檔案庫。

export type ReadingFeed = { name: string; url: string }

export const READING_CATEGORIES = [
  {
    key: 'finance',
    label: '財金',
    en: 'Finance',
    desc: '利率、市場、企業財報、投資與總體經濟',
    scope: 'finance and economics: interest rates, markets, corporate earnings, investing, inflation, banking',
    feeds: [
      { name: 'BBC News', url: 'https://feeds.bbci.co.uk/news/business/rss.xml' },
      { name: 'CNBC', url: 'https://www.cnbc.com/id/10000664/device/rss/rss.html' },
    ],
  },
  {
    key: 'marketing',
    label: '行銷',
    en: 'Marketing',
    desc: '品牌、廣告、消費者行為、成長策略',
    scope: 'marketing and branding: advertising, consumer behavior, growth strategy, pricing, customer retention',
    feeds: [{ name: 'Marketing Dive', url: 'https://www.marketingdive.com/feeds/news/' }],
  },
  {
    key: 'ai',
    label: 'AI 趨勢',
    en: 'AI Trends',
    desc: '生成式 AI、企業導入、人機協作與監管',
    scope: 'artificial intelligence in business: generative AI adoption, AI agents, productivity, regulation, workforce impact',
    feeds: [
      { name: 'TechCrunch', url: 'https://techcrunch.com/category/artificial-intelligence/feed/' },
      { name: 'MIT Technology Review', url: 'https://www.technologyreview.com/topic/artificial-intelligence/feed' },
    ],
  },
  {
    key: 'tech',
    label: '科技',
    en: 'Tech',
    desc: '半導體、雲端、軟體、硬體與新創生態',
    scope: 'the technology industry: semiconductors, cloud, software, devices, startups, cybersecurity, platforms',
    feeds: [
      { name: 'BBC News', url: 'https://feeds.bbci.co.uk/news/technology/rss.xml' },
      { name: 'TechCrunch', url: 'https://techcrunch.com/feed/' },
    ],
  },
  {
    key: 'world',
    label: '國際社會',
    en: 'World Affairs',
    desc: '貿易、地緣政治、氣候、人口與社會議題',
    scope: 'global affairs that matter to business: trade, supply chains, geopolitics, climate and energy, demographics, labor',
    feeds: [
      { name: 'BBC News', url: 'https://feeds.bbci.co.uk/news/world/rss.xml' },
      { name: 'The Guardian', url: 'https://www.theguardian.com/world/rss' },
      { name: 'NPR', url: 'https://feeds.npr.org/1004/rss.xml' },
    ],
  },
] as const

export type ReadingCategory = (typeof READING_CATEGORIES)[number]['key']

export function isReadingCategory(value: string): value is ReadingCategory {
  return READING_CATEGORIES.some((c) => c.key === value)
}

export function getReadingCategory(key: ReadingCategory) {
  return READING_CATEGORIES.find((c) => c.key === key)!
}

export type ReadingWord = {
  word: string
  pos: string
  meaning_zh: string
  meaning_en: string
  example_en: string
}

export type ReadingParagraph = { en: string; zh: string }

export type ReadingArticle = {
  id: string
  article_date: string
  category: ReadingCategory
  title: string
  paragraphs: ReadingParagraph[]
  summary_zh: string
  takeaways_zh: string[]
  key_words: ReadingWord[]
  source_name: string | null
  source_url: string | null
  source_published_at: string | null
}

export const ARTICLE_COLUMNS =
  'id, article_date, category, title, paragraphs, summary_zh, takeaways_zh, key_words, source_name, source_url, source_published_at'

export const MIN_KEY_WORDS = 5
export const MAX_KEY_WORDS = 8

const FRESH_NEWS_AGE_MS = 72 * 60 * 60 * 1000
// 來源更新慢的類別（例如行銷）若 72 小時內沒有新的，放寬到一週
const FALLBACK_NEWS_AGE_MS = 7 * 24 * 60 * 60 * 1000
const CANDIDATES_FOR_PICKER = 8

// 「今天」以台北時間為準，文章在台北時間 00:00 換日
export function todayInTaipei(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Taipei' })
}

export function isValidDateString(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value))
}

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// ---------- RSS ----------

type NewsItem = {
  title: string
  summary: string
  link: string
  source: string
  publishedAt: number
}

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“', hellip: '…', mdash: '—', ndash: '–',
}

function decodeEntities(s: string) {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) => {
    if (e[0] === '#') {
      const code = e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10)
      return Number.isFinite(code) ? String.fromCodePoint(code) : m
    }
    return NAMED_ENTITIES[e.toLowerCase()] ?? m
  })
}

// RSS 欄位可能是 CDATA、跳脫過的 HTML，或純文字；統一轉成乾淨純文字
function cleanText(raw: string) {
  const unwrapped = raw.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
  return decodeEntities(
    decodeEntities(unwrapped)
      .replace(/<figure[\s\S]*?<\/figure>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
  )
    .replace(/Continue reading\.\.\./gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function tagContent(block: string, tag: string) {
  const m = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, 'i').exec(block)
  return m ? m[1] : ''
}

// 去掉追蹤參數，同一則新聞才不會因為網址不同而重複
export function normalizeLink(link: string) {
  try {
    const u = new URL(link.trim())
    return `${u.origin}${u.pathname}`
  } catch {
    return ''
  }
}

function parseRss(xml: string, source: string): NewsItem[] {
  const items: NewsItem[] = []
  for (const m of xml.matchAll(/<item[\s>][\s\S]*?<\/item>/gi)) {
    const block = m[0]
    const title = cleanText(tagContent(block, 'title'))
    const link = normalizeLink(cleanText(tagContent(block, 'link')))
    const publishedAt = Date.parse(cleanText(tagContent(block, 'pubDate')))
    if (!title || !link || Number.isNaN(publishedAt)) continue
    items.push({
      title,
      summary: cleanText(tagContent(block, 'description')).slice(0, 600),
      link,
      source,
      publishedAt,
    })
  }
  return items
}

export async function fetchFeed(feed: ReadingFeed): Promise<NewsItem[]> {
  try {
    const res = await fetch(feed.url, {
      headers: { 'user-agent': 'Mozilla/5.0 BizEnglishReader' },
      signal: AbortSignal.timeout(10_000),
      cache: 'no-store',
    })
    if (!res.ok) return []
    return parseRss(await res.text(), feed.name)
  } catch {
    // 單一來源掛掉不影響其他來源
    return []
  }
}

// ---------- 挑選新聞 ----------

export async function pickNews(category: ReadingCategory, usedLinks: Set<string>): Promise<NewsItem | null> {
  const { feeds, scope } = getReadingCategory(category)
  const all = (await Promise.all(feeds.map(fetchFeed))).flat()

  const seen = new Set<string>()
  const unused = all
    .filter((n) => !usedLinks.has(n.link))
    .filter((n) => (seen.has(n.link) ? false : (seen.add(n.link), true)))
    .sort((a, b) => b.publishedAt - a.publishedAt)
  const within = (ms: number) => unused.filter((n) => n.publishedAt >= Date.now() - ms)
  const fresh = within(FRESH_NEWS_AGE_MS)
  const candidates = (fresh.length > 0 ? fresh : within(FALLBACK_NEWS_AGE_MS)).slice(
    0,
    CANDIDATES_FOR_PICKER
  )

  if (candidates.length === 0) return null
  if (candidates.length === 1) return candidates[0]

  // 讓便宜的模型從最新幾則挑最適合商業英文學習的；失敗就用最新的一則
  try {
    const list = candidates.map((n, i) => `${i}. ${n.title} — ${n.summary.slice(0, 160)}`).join('\n')
    const completion = await getOpenAI().chat.completions.create({
      model: MODELS.cheap,
      messages: [
        {
          role: 'system',
          content: `You choose one news story for a business English learning reader. Category scope: ${scope}.
Prefer substantive stories about business, economy, technology, policy or society with rich business vocabulary. Avoid sports, celebrity, crime, obituaries, and pure opinion.
Return strict JSON: {"index": <number>}`,
        },
        { role: 'user', content: list },
      ],
      response_format: { type: 'json_object' },
      temperature: 0,
    })
    const idx = Number(JSON.parse(completion.choices[0].message.content ?? '{}').index)
    if (Number.isInteger(idx) && candidates[idx]) return candidates[idx]
  } catch (err) {
    console.error('reading pick error:', err)
  }
  return candidates[0]
}

// ---------- 生成解說 ----------

type RawArticle = {
  paragraphs?: unknown
  summary_zh?: unknown
  takeaways_zh?: unknown
  key_words?: unknown
}

const isText = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0

// 驗證模型輸出；重點單字必須真的出現在文章裡，才能在內文標示
function validateArticle(raw: RawArticle) {
  if (!isText(raw.summary_zh)) return null

  if (!Array.isArray(raw.paragraphs) || raw.paragraphs.length < 3) return null
  const paragraphs: ReadingParagraph[] = []
  for (const p of raw.paragraphs as Array<Partial<ReadingParagraph>>) {
    if (!isText(p?.en) || !isText(p?.zh)) return null
    paragraphs.push({ en: p.en.trim(), zh: p.zh.trim() })
  }

  const takeaways = Array.isArray(raw.takeaways_zh)
    ? (raw.takeaways_zh as unknown[]).filter(isText).map((t) => t.trim())
    : []

  const fullText = paragraphs.map((p) => p.en).join(' ')
  const seen = new Set<string>()
  const keyWords: ReadingWord[] = []
  if (Array.isArray(raw.key_words)) {
    for (const w of raw.key_words as Array<Partial<ReadingWord>>) {
      if (!isText(w?.word) || !isText(w?.meaning_zh)) continue
      const word = w.word.trim()
      const lower = word.toLowerCase()
      if (seen.has(lower)) continue
      if (!new RegExp(`\\b${escapeRegExp(word)}\\b`, 'i').test(fullText)) continue
      seen.add(lower)
      keyWords.push({
        word,
        pos: isText(w.pos) ? w.pos.trim() : '',
        meaning_zh: w.meaning_zh.trim(),
        meaning_en: isText(w.meaning_en) ? w.meaning_en.trim() : '',
        example_en: isText(w.example_en) ? w.example_en.trim() : '',
      })
      if (keyWords.length === MAX_KEY_WORDS) break
    }
  }
  if (keyWords.length < MIN_KEY_WORDS) return null

  return {
    paragraphs,
    summary_zh: raw.summary_zh.trim(),
    takeaways_zh: takeaways,
    key_words: keyWords,
  }
}

export async function explainNews(category: ReadingCategory, news: NewsItem) {
  const { en } = getReadingCategory(category)

  const system = `You write English explainers for Taiwanese business professionals (CEFR B2-C1), based on a real news story.

You only receive the headline and a short summary from ${news.source}. You do NOT have the full article.

Rules:
- Category: ${en}
- Write an ORIGINAL explainer of 300-380 words in 4 paragraphs of 75-95 words each, in your own words. Never copy sentences from the headline or summary
- Paragraph 1 — "What happened": state ONLY facts present in the headline/summary. Do not invent names, numbers, quotes, causes or outcomes
- Paragraphs 2-4 — background, why it matters to business people, and what to watch next. Use general knowledge, hedge with words like "likely", "may", "analysts often argue", and never present speculation as reported fact
- Natural business vocabulary (collocations, phrasal verbs, abstract nouns), not textbook-simple English
- For every paragraph, give a natural Traditional Chinese translation in "zh"
- summary_zh: 2-3 sentences in Traditional Chinese
- takeaways_zh: exactly 3 short Traditional Chinese bullet points a manager could remember
- key_words: 6-8 useful B2-C1 business words. Each "word" MUST be a SINGLE word copied EXACTLY as it appears in your explainer (same inflection and spelling, no phrases). Skip words an intermediate (B1) learner already knows, such as confidence, growth or demand; prefer words like vulnerable, headwinds, subdued, leverage. "pos" is one of noun/verb/adjective/adverb. "meaning_zh" is the meaning in this context (Traditional Chinese). "meaning_en" is a short English definition. "example_en" is a NEW business sentence using the word

Return strict JSON:
{
  "paragraphs": [{"en":"...","zh":"..."}],
  "summary_zh": "...",
  "takeaways_zh": ["...","...","..."],
  "key_words": [{"word":"...","pos":"...","meaning_zh":"...","meaning_en":"...","example_en":"..."}]
}`

  const completion = await getOpenAI().chat.completions.create({
    model: MODELS.quality,
    messages: [
      { role: 'system', content: system },
      {
        role: 'user',
        content: `Headline: ${news.title}\nSummary: ${news.summary || '(none provided)'}\nSource: ${news.source}`,
      },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.7,
  })

  const content = completion.choices[0].message.content
  if (!content) return null
  return validateArticle(JSON.parse(content) as RawArticle)
}

// 取得（必要時生成）今天這個類別的文章。每天每類只會有一篇：unique(article_date, category)
export async function getOrCreateTodayArticle(category: ReadingCategory): Promise<ReadingArticle> {
  const admin = getSupabaseAdmin()
  const date = todayInTaipei()

  const fetchExisting = async () => {
    const { data } = await admin
      .from('reading_articles')
      .select(ARTICLE_COLUMNS)
      .eq('article_date', date)
      .eq('category', category)
      .maybeSingle()
    return (data as ReadingArticle | null) ?? null
  }

  const existing = await fetchExisting()
  if (existing) return existing

  // 已用過的新聞不再重複；跨類別也要排除，因為同一則新聞可能同時出現在不同類別的來源
  const { data: recent } = await admin
    .from('reading_articles')
    .select('source_url')
    .not('source_url', 'is', null)
    .order('article_date', { ascending: false })
    .limit(200)
  const usedLinks = new Set(
    ((recent ?? []) as Array<{ source_url: string }>).map((r) => r.source_url)
  )

  const news = await pickNews(category, usedLinks)
  if (!news) throw new Error('no fresh news found for category')

  // 模型偶爾會漏掉重點單字，最多重試一次
  let explained = await explainNews(category, news)
  if (!explained) explained = await explainNews(category, news)
  if (!explained) throw new Error('article generation failed validation')

  const { error } = await admin.from('reading_articles').insert({
    article_date: date,
    category,
    title: news.title,
    source_name: news.source,
    source_url: news.link,
    source_published_at: new Date(news.publishedAt).toISOString(),
    ...explained,
  } as never)

  if (error) {
    // 同時有人觸發生成：以先寫入的那篇為準
    if (error.code === '23505') {
      const winner = await fetchExisting()
      if (winner) return winner
    }
    throw new Error(`article insert failed: ${error.message}`)
  }

  const created = await fetchExisting()
  if (!created) throw new Error('article missing after insert')
  return created
}
