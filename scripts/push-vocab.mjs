// 把 enrich-vocab.mjs 產出的 migration 直接 upsert 到 Supabase
// 執行: node --env-file=.env.local scripts/push-vocab.mjs [migration_file.sql]

import { createClient } from '@supabase/supabase-js'
import fs from 'node:fs/promises'
import path from 'node:path'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !serviceKey) {
  console.error('缺少 NEXT_PUBLIC_SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const sqlArg = process.argv[2]
let sqlFile = sqlArg
if (!sqlFile) {
  // 找最新的 business_200_words 檔
  const dir = 'supabase/migrations'
  const files = (await fs.readdir(dir))
    .filter((f) => f.includes('business_200_words'))
    .sort()
  sqlFile = files.length > 0 ? path.join(dir, files[files.length - 1]) : null
}
if (!sqlFile) {
  console.error('找不到 migration 檔，請先跑 enrich-vocab.mjs')
  process.exit(1)
}

console.log(`讀取: ${sqlFile}`)
const sql = await fs.readFile(sqlFile, 'utf8')

// 解析每一列 VALUES(...)。格式固定,直接 regex 一次抓出來
const rowRegex = /\(\s*'([^']*(?:''[^']*)*)'\s*,\s*'([^']+)'\s*,\s*(\d+)\s*,\s*ARRAY\[([^\]]+)\]\s*,\s*'([^']*(?:''[^']*)*)'\s*,\s*'([^']*(?:''[^']*)*)'\s*,\s*'([^']*(?:''[^']*)*)'\s*\)/g

const rows = []
let m
while ((m = rowRegex.exec(sql)) !== null) {
  const [, word, pos, diff, tagsRaw, defEn, defZh, ex] = m
  const tags = [...tagsRaw.matchAll(/'([^']+)'/g)].map((x) => x[1])
  const unescape = (s) => s.replace(/''/g, "'")
  rows.push({
    word: unescape(word),
    part_of_speech: pos,
    difficulty: Number(diff),
    scenario_tags: tags,
    definition_en: unescape(defEn),
    definition_zh: unescape(defZh),
    example_sentence: unescape(ex),
  })
}

console.log(`解析到 ${rows.length} 列`)

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

// 先看目前有幾個字
const { count: before } = await supabase
  .from('vocabulary')
  .select('*', { count: 'exact', head: true })
console.log(`匯入前 vocabulary 總數: ${before}`)

// 分批 upsert(避免單一 payload 太大),onConflict=word,ignoreDuplicates=true → 已存在就跳過
const BATCH = 50
let inserted = 0
for (let i = 0; i < rows.length; i += BATCH) {
  const chunk = rows.slice(i, i + BATCH)
  const { data, error } = await supabase
    .from('vocabulary')
    .upsert(chunk, { onConflict: 'word', ignoreDuplicates: true })
    .select('id')
  if (error) {
    console.error(`✗ batch ${i}: ${error.message}`)
    process.exit(1)
  }
  inserted += data?.length ?? 0
  console.log(`  batch ${i / BATCH + 1}: 新增 ${data?.length ?? 0} 筆`)
}

const { count: after } = await supabase
  .from('vocabulary')
  .select('*', { count: 'exact', head: true })

console.log(`\n✓ 完成`)
console.log(`匯入後 vocabulary 總數: ${after}`)
console.log(`實際新增: ${after - before} 筆(重複的 ${rows.length - (after - before)} 筆已略過)`)
