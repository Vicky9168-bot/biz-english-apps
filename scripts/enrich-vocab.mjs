// 讀取 100 nouns + 100 verbs → 用 OpenAI 補齊每個字的商用中文/例句/難度/場景 → 產出 supabase migration SQL
// 執行: node --env-file=.env.local scripts/enrich-vocab.mjs

import OpenAI from 'openai'
import fs from 'node:fs/promises'
import path from 'node:path'

const NOUNS = `advantage advertise advice agenda apology authorization bill brand budget change commission comparison competition competitor confirmation costs creditor customer deadline debt debtor decision decrease deficit delivery department description difference disadvantage distribution employee employer enquiry environment equipment estimate experience explanation facilities factory fall feedback goal goods growth guarantee improvement increase industry instructions interest inventory invoice knowledge limit loss margin market message mistake objective offer opinion option order output payment penalty permission possibility preparation price product production profit promotion purchase reduction refund reminder repairs report responsibility result retailer rise risk salary sales schedule share signature stock success suggestion supply support target transport turnover`

const VERBS = `accept add admit advertise advise afford approve authorize avoid borrow break build buy calculate call cancel change charge for check choose complain complete confirm consider convince count decide decrease deliver develop dismiss dispatch distribute divide drop employ encourage establish estimate exchange extend fall fix fund get worse improve increase inform install invest invoice join lend lengthen lower maintain manage measure mention obtain order organise owe own pack participate pay plan present prevent process produce promise promote provide purchase raise reach receive recruit reduce refuse reject remind remove reply resign respond return rise sell send separate shorten split structure succeed suggest write vary`

// 允許的 scenario tags（跟現有 seed 對齊）
const SCENARIO_TAGS = [
  'meeting', 'email', 'negotiation', 'sales', 'cold_call',
  'presentation', 'marketing', 'small_talk', 'complaint_handling', 'finance',
]

function tokenize(list) {
  // "charge for" / "get worse" 是片語，要保留空格 → 用單一空白 split 會誤拆
  // 手動處理已知片語
  const raw = list.trim().split(/\s+/)
  const merged = []
  const PHRASES = new Set(['charge for', 'get worse'])
  for (let i = 0; i < raw.length; i++) {
    const two = `${raw[i]} ${raw[i + 1] ?? ''}`
    if (PHRASES.has(two)) {
      merged.push(two)
      i++
    } else {
      merged.push(raw[i])
    }
  }
  return merged
}

const nouns = tokenize(NOUNS).map((w) => ({ word: w, pos: 'noun' }))
const verbs = tokenize(VERBS).map((w) => ({
  word: w,
  pos: w.includes(' ') ? 'phrase' : 'verb',
}))

// 去除 list 內部重複（不同詞性同拼寫如 change/order/estimate 保留兩者可能會撞 unique index）
// 策略:同拼寫優先保留 noun,verb 版本以 "_v" 後綴避開,或直接跳過(用 ON CONFLICT DO NOTHING)
// 這裡採「不加後綴,靠 DB unique + ON CONFLICT 處理」的最簡策略,同拼寫只會 insert 到第一次
const seen = new Set()
const all = []
for (const item of [...nouns, ...verbs]) {
  const key = item.word.toLowerCase()
  if (seen.has(key)) continue
  seen.add(key)
  all.push(item)
}

console.log(`總計 ${all.length} 個唯一字待處理 (nouns=${nouns.length}, verbs=${verbs.length})`)

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const SYSTEM_PROMPT = `You are a business English vocabulary curator. For each input word, return a JSON object with:
{
  "difficulty": 1-5 (1=elementary, 3=intermediate, 5=advanced business jargon),
  "scenario_tags": array of 1-3 tags chosen ONLY from: ["meeting", "email", "negotiation", "sales", "cold_call", "presentation", "marketing", "small_talk", "complaint_handling", "finance"],
  "definition_en": "One-line English definition in business context (max 80 chars)",
  "definition_zh": "繁體中文商用翻譯（15字內）",
  "example_sentence": "One natural business English sentence using the word (max 100 chars)"
}

Rules:
- Focus on BUSINESS usage, not general meaning
- Example sentence must sound like real workplace English (meetings, emails, sales calls)
- Chinese must be Traditional Chinese, business register`

async function enrich(word, pos) {
  const res = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: `Word: "${word}" (part of speech: ${pos})` },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.4,
  })
  const raw = res.choices[0].message.content
  if (!raw) throw new Error(`empty response for ${word}`)
  const parsed = JSON.parse(raw)
  // 保底：tags 過濾成允許集合
  const tags = (parsed.scenario_tags ?? []).filter((t) => SCENARIO_TAGS.includes(t))
  return {
    word,
    part_of_speech: pos,
    difficulty: Math.min(5, Math.max(1, Number(parsed.difficulty) || 3)),
    scenario_tags: tags.length > 0 ? tags : ['meeting'],
    definition_en: String(parsed.definition_en || '').slice(0, 200),
    definition_zh: String(parsed.definition_zh || '').slice(0, 60),
    example_sentence: String(parsed.example_sentence || '').slice(0, 200),
  }
}

// 並發 10 個 batch
async function batchEnrich(items, size = 10) {
  const results = []
  for (let i = 0; i < items.length; i += size) {
    const chunk = items.slice(i, i + size)
    const done = await Promise.all(
      chunk.map(({ word, pos }) =>
        enrich(word, pos).catch((err) => {
          console.error(`✗ ${word}: ${err.message}`)
          return null
        })
      )
    )
    results.push(...done.filter(Boolean))
    console.log(`  進度 ${Math.min(i + size, items.length)}/${items.length}`)
  }
  return results
}

function sqlEscape(s) {
  return String(s).replace(/'/g, "''")
}

function toValuesRow(row) {
  const tags = row.scenario_tags.map((t) => `'${sqlEscape(t)}'`).join(', ')
  return `('${sqlEscape(row.word)}', '${row.part_of_speech}', ${row.difficulty}, ARRAY[${tags}], '${sqlEscape(row.definition_en)}', '${sqlEscape(row.definition_zh)}', '${sqlEscape(row.example_sentence)}')`
}

function buildSql(rows) {
  const header = `-- =====================================================
-- Part 1 單字題庫擴充 - 100 Business Nouns + 100 Business Verbs
-- 來源: 使用者提供的 200 個 essential business words
-- Created: ${new Date().toISOString().slice(0, 10)}
-- 對已存在的 word (unique) 略過,不覆蓋現有 curated seed
-- =====================================================

insert into public.vocabulary (word, part_of_speech, difficulty, scenario_tags, definition_en, definition_zh, example_sentence) values
`
  const body = rows.map(toValuesRow).join(',\n')
  const footer = `\non conflict (word) do nothing;\n`
  return header + body + footer
}

const enriched = await batchEnrich(all, 10)
console.log(`\n✓ 成功處理 ${enriched.length}/${all.length}`)

const sql = buildSql(enriched)
const stamp = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14)
const outPath = path.join('supabase/migrations', `${stamp}_business_200_words.sql`)
await fs.writeFile(outPath, sql, 'utf8')
console.log(`\n寫入: ${outPath} (${sql.length} bytes)`)
