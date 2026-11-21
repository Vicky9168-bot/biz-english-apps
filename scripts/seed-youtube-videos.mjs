// 匯入 YouTube 影片到 listening_dialogues,並補齊帶時間點的雙語逐字稿 + 題庫
//
// Run:
//   node scripts/seed-youtube-videos.mjs                      匯入 VIDEOS 裡還沒有的影片(逐字稿 + 題庫一併產生)
//   node scripts/seed-youtube-videos.mjs transcripts          補齊所有 YouTube 影片缺的逐字稿(英文時間點 + 中文翻譯)
//   node scripts/seed-youtube-videos.mjs bank --out=FILE      為缺題庫的影片生成題庫,只寫成 JSON 檔供抽查,不動資料庫
//   node scripts/seed-youtube-videos.mjs bank --apply=FILE    把抽查過的題庫 JSON 檔寫進資料庫
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'
import fs from 'node:fs'
// 匯入邏輯與網頁的「貼連結匯入」共用同一份(需要 Node 22.18+ 才能直接執行 .ts)
import { addChinese, buildTranscript, generateBank, importYoutubeVideo } from '../src/lib/youtube-import.ts'

if (!process.env.OPENAI_API_KEY) {
  const env = fs.readFileSync('.env.local', 'utf8')
  for (const line of env.split('\n')) {
    const m = line.match(/^([A-Z_]+)=(.*)$/)
    if (m) process.env[m[1]] = m[2].trim()
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const OPENAI_KEY = process.env.OPENAI_API_KEY

if (!SUPABASE_URL || !SERVICE_KEY || !OPENAI_KEY) {
  console.error('missing env: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / OPENAI_API_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})
const openai = new OpenAI({ apiKey: OPENAI_KEY })

const VIDEOS = [
  { url: 'http://youtube.com/watch?v=Ge7c7otG2mk&t=13s' },
  { url: 'https://www.youtube.com/watch?v=d0yGdNEWdn0&t=219s' },
  { url: 'https://www.youtube.com/watch?v=qp0HIF3SfI4' },
]

async function importVideo(url) {
  const result = await importYoutubeVideo({ supabase, openai, url, log: console.log })
  if (!result.created) console.log(`✓ 已存在: ${result.title}`)
}

async function listYoutubeRows(columns) {
  const { data, error } = await supabase
    .from('listening_dialogues')
    .select(columns)
    .eq('source_type', 'youtube')
    .order('created_at', { ascending: true })
  if (error) throw error
  return data
}

async function backfillTranscripts() {
  const rows = await listYoutubeRows('id, title, youtube_video_id, transcript')
  for (const row of rows) {
    const hasTranscript = Array.isArray(row.transcript) && row.transcript.length > 0
    if (hasTranscript && row.transcript.every((s) => s.zh)) {
      console.log(`✓ 逐字稿完整: ${row.title}`)
      continue
    }
    try {
      console.log(`→ ${row.title} (${row.youtube_video_id})`)
      // 已有英文逐字稿就只補缺的中文,不重抓字幕
      const transcript = hasTranscript
        ? await addChinese(openai, row.transcript, console.log)
        : await buildTranscript(openai, row.youtube_video_id, console.log)
      const { error } = await supabase
        .from('listening_dialogues')
        .update({ transcript })
        .eq('id', row.id)
      if (error) throw error
      console.log(`✓ 逐字稿已存`)
    } catch (e) {
      console.error(`✗ 失敗 ${row.title}:`, e.message)
    }
  }
}

async function bankGenerate(outFile) {
  const rows = await listYoutubeRows('id, title, youtube_video_id, transcript, questions, question_bank')
  const result = {}
  for (const row of rows) {
    if (Array.isArray(row.question_bank) && row.question_bank.length > 0) {
      console.log(`✓ 已有題庫: ${row.title}`)
      continue
    }
    if (!Array.isArray(row.transcript) || row.transcript.length === 0) {
      console.error(`✗ ${row.title}: 沒有逐字稿,請先跑 transcripts`)
      continue
    }
    try {
      console.log(`→ 生成題庫: ${row.title}`)
      const existing = Array.isArray(row.questions) ? row.questions : []
      result[row.id] = {
        title: row.title,
        bank: await generateBank(openai, row.title, row.transcript, existing),
      }
    } catch (e) {
      console.error(`✗ 失敗 ${row.title}:`, e.message)
    }
  }
  fs.writeFileSync(outFile, JSON.stringify(result, null, 2))
  console.log(`已輸出 ${Object.keys(result).length} 支影片的題庫 → ${outFile}(尚未寫入資料庫)`)
}

async function bankApply(file) {
  const data = JSON.parse(fs.readFileSync(file, 'utf8'))
  for (const [id, { title, bank }] of Object.entries(data)) {
    const { error } = await supabase.from('listening_dialogues').update({ question_bank: bank }).eq('id', id)
    if (error) console.error(`✗ ${title}:`, error.message)
    else console.log(`✓ ${title}: ${bank.length} 題已寫入`)
  }
}

function getFlag(name) {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`))
  return hit ? hit.slice(name.length + 3) : null
}

async function main() {
  const cmd = process.argv[2]
  if (cmd === 'transcripts') return backfillTranscripts()
  if (cmd === 'bank') {
    const apply = getFlag('apply')
    const out = getFlag('out')
    if (apply) return bankApply(apply)
    if (out) return bankGenerate(out)
    throw new Error('bank 需要 --out=FILE 或 --apply=FILE')
  }
  for (const { url } of VIDEOS) {
    try {
      await importVideo(url)
    } catch (e) {
      console.error(`✗ 失敗 ${url}:`, e.message)
    }
  }
}

main().catch((e) => {
  console.error(e.message)
  process.exit(1)
})
