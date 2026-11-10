// 匯入 YouTube 影片到 listening_dialogues,並補齊帶時間點的雙語逐字稿 + 題庫
//
// Run:
//   node scripts/seed-youtube-videos.mjs                      匯入 VIDEOS 裡還沒有的影片(逐字稿 + 題庫一併產生)
//   node scripts/seed-youtube-videos.mjs transcripts          補齊所有 YouTube 影片缺的逐字稿(英文時間點 + 中文翻譯)
//   node scripts/seed-youtube-videos.mjs bank --out=FILE      為缺題庫的影片生成題庫,只寫成 JSON 檔供抽查,不動資料庫
//   node scripts/seed-youtube-videos.mjs bank --apply=FILE    把抽查過的題庫 JSON 檔寫進資料庫
import { createClient } from '@supabase/supabase-js'
import { YoutubeTranscript } from 'youtube-transcript'
import OpenAI from 'openai'
import fs from 'node:fs'

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

const BANK_SIZE = 12
const TRANSLATE_BATCH = 30
const TRANSLATE_RETRIES = 2
const MAX_PROMPT_CHARS = 40000
const SUMMARY_MODEL = 'gpt-4o'
const TRANSLATE_MODEL = 'gpt-4o-mini'

function parseYoutubeUrl(url) {
  const m = url.match(/[?&]v=([A-Za-z0-9_-]{11})/)
  if (!m) throw new Error(`bad youtube url: ${url}`)
  const t = url.match(/[?&]t=(\d+)/)
  return { videoId: m[1], startSeconds: t ? parseInt(t[1], 10) : 0 }
}

// ---------- 逐字稿 ----------

// 字幕組署名(例如 TED 開頭的 "Transcriber: ... Reviewer: ...")不是影片內容
const CREDIT_LINE = /^(transcriber|reviewer|translator)\s*:/i

async function fetchSegments(videoId) {
  return YoutubeTranscript.fetchTranscript(videoId, { lang: 'en' }).catch(() =>
    YoutubeTranscript.fetchTranscript(videoId)
  )
}

// youtube-transcript 的 offset / duration 單位是毫秒 → 轉成秒
function toTranscript(segments) {
  return segments
    .map((s) => ({
      start: Math.round(s.offset) / 1000,
      end: Math.round(s.offset + s.duration) / 1000,
      en: s.text.replace(/\s+/g, ' ').trim(),
    }))
    .filter((s) => s.en && !CREDIT_LINE.test(s.en))
}

// 每句帶編號,依編號對應回譯文(模型常把相鄰短句合併,不能靠順序/數量對齊)
async function translateBatch(items) {
  const completion = await openai.chat.completions.create({
    model: TRANSLATE_MODEL,
    messages: [
      {
        role: 'system',
        content:
          'Translate each English subtitle line into natural Traditional Chinese (Taiwan usage). ' +
          'Keep proper nouns and brand names in English. Lines are consecutive pieces of one talk, so use context, ' +
          'but translate EVERY line separately — never merge lines or skip any, even if a line is a sentence fragment. ' +
          'Return strict JSON: {"translations":[{"i":<id>,"zh":"..."}]} with one entry per input id.',
      },
      { role: 'user', content: JSON.stringify({ lines: items }) },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.2,
  })
  const list = JSON.parse(completion.choices[0].message.content).translations
  const result = new Map()
  if (!Array.isArray(list)) return result
  for (const t of list) {
    if (Number.isInteger(t?.i) && typeof t.zh === 'string' && t.zh.trim()) {
      result.set(t.i, t.zh.trim())
    }
  }
  return result
}

// 只翻還沒有 zh 的句子;每輪只重試缺的。最後仍缺的 zh 維持 null,前端顯示中文時會退回英文
async function addChinese(transcript) {
  const out = transcript.map((s) => ({ ...s, zh: s.zh ?? null }))
  for (let attempt = 0; attempt <= TRANSLATE_RETRIES; attempt++) {
    const pending = out.map((s, i) => (s.zh ? -1 : i)).filter((i) => i >= 0)
    if (pending.length === 0) break
    if (attempt > 0) console.warn(`  第 ${attempt + 1} 輪補翻 ${pending.length} 句`)
    for (let i = 0; i < pending.length; i += TRANSLATE_BATCH) {
      const ids = pending.slice(i, i + TRANSLATE_BATCH)
      try {
        const zh = await translateBatch(ids.map((id) => ({ i: id, en: out[id].en })))
        for (const id of ids) out[id].zh = zh.get(id) ?? null
      } catch (e) {
        console.warn(`  翻譯批次失敗: ${e.message}`)
      }
    }
  }
  const missing = out.filter((s) => !s.zh).length
  if (missing > 0) console.warn(`  ⚠ ${missing} 句沒有中文翻譯`)
  return out
}

async function buildTranscript(videoId) {
  const segments = await fetchSegments(videoId)
  const transcript = toTranscript(segments)
  console.log(`  字幕 ${transcript.length} 句,翻譯中...`)
  return addChinese(transcript)
}

function transcriptToText(transcript) {
  return transcript.map((s) => s.en).join(' ')
}

// ---------- 題目 ----------

const QUESTION_RULES = `Question types to mix: main point / core message, specific detail (name, number, example mentioned), inference or speaker's opinion, vocabulary or phrase meaning in context, speaker's purpose or attitude.
Rules:
- Each question has exactly 4 options and exactly ONE correct answer; distractors must be plausible but clearly wrong according to the transcript.
- Vary the position of the correct answer (answer_idx) across questions.
- Base ALL questions strictly on what is in the transcript — no outside knowledge.
- explanation_zh: 1-2 sentences in Traditional Chinese explaining why that answer is correct.`

function truncateForPrompt(text) {
  return text.length > MAX_PROMPT_CHARS ? text.slice(0, MAX_PROMPT_CHARS) + ' ... [truncated]' : text
}

function validQuestion(q) {
  return (
    q &&
    typeof q.q === 'string' &&
    Array.isArray(q.options) &&
    q.options.length === 4 &&
    Number.isInteger(q.answer_idx) &&
    q.answer_idx >= 0 &&
    q.answer_idx < 4 &&
    typeof q.explanation_zh === 'string'
  )
}

function withIds(questions) {
  return questions.map((q, i) => ({ ...q, id: q.id ?? `q${String(i + 1).padStart(2, '0')}` }))
}

// GPT 出的正解位置會嚴重偏向某個選項,打散選項順序並同步 answer_idx
function shuffleOptions(q) {
  const order = q.options.map((_, i) => i)
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[order[i], order[j]] = [order[j], order[i]]
  }
  return { ...q, options: order.map((i) => q.options[i]), answer_idx: order.indexOf(q.answer_idx) }
}

// 為既有影片補題庫:保留原本的 3 題,再生成其餘題目(避免重複)
async function generateBank(title, transcript, existingQuestions = []) {
  const need = BANK_SIZE - existingQuestions.length
  const completion = await openai.chat.completions.create({
    model: SUMMARY_MODEL,
    messages: [
      {
        role: 'system',
        content: `You create listening-comprehension questions for a Taiwanese business English learner from a video transcript.
Return strict JSON: {"questions":[{"q":"question in English","options":["A","B","C","D"],"answer_idx":0,"explanation_zh":"..."}]}
Create exactly ${need} NEW questions.
${existingQuestions.length > 0 ? `These questions already exist — do NOT repeat or paraphrase them:\n${existingQuestions.map((q) => `- ${q.q}`).join('\n')}\n` : ''}${QUESTION_RULES}`,
      },
      { role: 'user', content: `Video title: ${title}\n\nTranscript:\n${truncateForPrompt(transcriptToText(transcript))}` },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.6,
  })
  const generated = JSON.parse(completion.choices[0].message.content).questions
  if (!Array.isArray(generated) || generated.length !== need || !generated.every(validQuestion)) {
    throw new Error(`題庫格式不符: 預期 ${need} 題`)
  }
  return withIds([...existingQuestions, ...generated.map(shuffleOptions)])
}

const IMPORT_PROMPT = `You analyze a video transcript for a Taiwanese business English learner and create a listening comprehension exercise.

Return strict JSON:
{
  "title": "short English title (max 10 words) that reflects the video's actual content",
  "summary_zh": "2-3 sentence Traditional Chinese summary of what the video is about",
  "scenario_tags": ["1-3 English tags describing topics, e.g. 'negotiation', 'startup', 'leadership'"],
  "questions": [{"q":"question in English","options":["A","B","C","D"],"answer_idx":0,"explanation_zh":"..."}]
}

Create exactly ${BANK_SIZE} questions. The first three must be, in order: Q1 main point / core message, Q2 a specific detail, Q3 inference / speaker's opinion.
${QUESTION_RULES}`

// ---------- 流程 ----------

async function importVideo(url) {
  const { videoId, startSeconds } = parseYoutubeUrl(url)

  const { data: existing } = await supabase
    .from('listening_dialogues')
    .select('id, title')
    .eq('youtube_video_id', videoId)
    .maybeSingle()
  if (existing) {
    console.log(`✓ 已存在: ${videoId} (${existing.title})`)
    return
  }

  console.log(`→ 抓字幕: ${videoId}`)
  const transcript = await buildTranscript(videoId)

  console.log(`→ GPT 分析...`)
  const completion = await openai.chat.completions.create({
    model: SUMMARY_MODEL,
    messages: [
      { role: 'system', content: IMPORT_PROMPT },
      { role: 'user', content: `Video transcript:\n\n${truncateForPrompt(transcriptToText(transcript))}` },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.5,
  })
  const parsed = JSON.parse(completion.choices[0].message.content)

  if (!Array.isArray(parsed.questions) || parsed.questions.length !== BANK_SIZE || !parsed.questions.every(validQuestion)) {
    throw new Error(`GPT 沒回 ${BANK_SIZE} 題: ${JSON.stringify(parsed).slice(0, 200)}`)
  }
  const bank = withIds(parsed.questions.map(shuffleOptions))

  console.log(`→ 存 DB...`)
  const { error } = await supabase.from('listening_dialogues').insert({
    title: parsed.title,
    scenario: 'video',
    difficulty: 3,
    script: [{ speaker: 'Video', text: transcriptToText(transcript) }],
    questions: bank.slice(0, 3),
    question_bank: bank,
    transcript,
    scenario_tags: parsed.scenario_tags ?? [],
    source_type: 'youtube',
    youtube_video_id: videoId,
    youtube_start_seconds: startSeconds,
    summary_zh: parsed.summary_zh,
  })
  if (error) throw error

  console.log(`✓ 完成: ${parsed.title}`)
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
        ? await addChinese(row.transcript)
        : await buildTranscript(row.youtube_video_id)
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
        bank: await generateBank(row.title, row.transcript, existing),
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
