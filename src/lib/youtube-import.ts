// YouTube 影片匯入:抓字幕 → 翻譯 → GPT 出題 → 存進 listening_dialogues
//
// 同時給 API route(使用者貼連結)和 scripts/seed-youtube-videos.mjs 使用,
// 所以不 import '@/...' 別名,也只用 Node 能直接執行的 TypeScript 語法(不用 enum / 參數屬性)。
// supabase / openai client 由呼叫端傳入。
import { YoutubeTranscript } from 'youtube-transcript'
import type OpenAI from 'openai'
import type { SupabaseClient } from '@supabase/supabase-js'

export const BANK_SIZE = 12
const TRANSLATE_BATCH = 30
const TRANSLATE_CONCURRENCY = 4
const TRANSLATE_RETRIES = 2
const MAX_PROMPT_CHARS = 40000
// 約 1 小時的影片;再長的翻譯成本太高,直接拒絕
const MAX_SEGMENTS = 1500
const SUMMARY_MODEL = 'gpt-4o'
const TRANSLATE_MODEL = 'gpt-4o-mini'

export type ImportErrorCode = 'bad_url' | 'no_captions' | 'not_english' | 'too_long' | 'ai_failed' | 'save_failed'

export class YoutubeImportError extends Error {
  code: ImportErrorCode
  constructor(code: ImportErrorCode, message: string) {
    super(message)
    this.code = code
  }
}

export interface TranscriptLine {
  start: number
  end: number
  en: string
  zh: string | null
}

export interface Question {
  id?: string
  q: string
  options: string[]
  answer_idx: number
  explanation_zh: string
}

type Log = (message: string) => void
const noLog: Log = () => {}

// ---------- 網址 ----------

const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/

// 支援 watch?v= / youtu.be/ / shorts/ / embed/ / live/;t=90 或 t=90s 當作起始秒數
export function parseYoutubeUrl(input: string): { videoId: string; startSeconds: number } {
  let url: URL
  try {
    url = new URL(input.trim())
  } catch {
    throw new YoutubeImportError('bad_url', `不是有效的網址: ${input}`)
  }
  const host = url.hostname.replace(/^(www|m)\./, '')
  let videoId: string | null = null
  if (host === 'youtu.be') {
    videoId = url.pathname.split('/')[1] ?? null
  } else if (host === 'youtube.com' || host === 'music.youtube.com') {
    const parts = url.pathname.split('/').filter(Boolean)
    videoId =
      parts[0] === 'watch'
        ? url.searchParams.get('v')
        : ['shorts', 'embed', 'live'].includes(parts[0])
          ? (parts[1] ?? null)
          : null
  }
  if (!videoId || !VIDEO_ID.test(videoId)) {
    throw new YoutubeImportError('bad_url', '找不到 YouTube 影片 ID,請貼完整的影片連結')
  }
  const t = url.searchParams.get('t')?.match(/^(\d+)s?$/)
  return { videoId, startSeconds: t ? parseInt(t[1], 10) : 0 }
}

// ---------- 逐字稿 ----------

// 字幕組署名(例如 TED 開頭的 "Transcriber: ... Reviewer: ...")不是影片內容
const CREDIT_LINE = /^(transcriber|reviewer|translator)\s*:/i

async function fetchSegments(videoId: string) {
  return YoutubeTranscript.fetchTranscript(videoId, { lang: 'en' }).catch(() =>
    YoutubeTranscript.fetchTranscript(videoId)
  )
}

// youtube-transcript 的 offset / duration 單位是毫秒 → 轉成秒
function toTranscript(segments: Array<{ text: string; offset: number; duration: number }>): TranscriptLine[] {
  return segments
    .map((s) => ({
      start: Math.round(s.offset) / 1000,
      end: Math.round(s.offset + s.duration) / 1000,
      en: s.text.replace(/\s+/g, ' ').trim(),
      zh: null,
    }))
    .filter((s) => s.en && !CREDIT_LINE.test(s.en))
}

// 沒有英文字幕時 fetchSegments 會退回其他語言;字幕裡英文字母太少就當作非英文
function looksEnglish(transcript: TranscriptLine[]): boolean {
  const text = transcript.map((s) => s.en).join(' ')
  const letters = text.replace(/[^\p{L}]/gu, '')
  if (letters.length === 0) return false
  const latin = letters.replace(/[^A-Za-z]/g, '').length
  return latin / letters.length > 0.8
}

// 每句帶編號,依編號對應回譯文(模型常把相鄰短句合併,不能靠順序/數量對齊)
async function translateBatch(openai: OpenAI, items: Array<{ i: number; en: string }>) {
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
  const list = JSON.parse(completion.choices[0].message.content ?? '{}').translations
  const result = new Map<number, string>()
  if (!Array.isArray(list)) return result
  for (const t of list) {
    if (Number.isInteger(t?.i) && typeof t.zh === 'string' && t.zh.trim()) {
      result.set(t.i, t.zh.trim())
    }
  }
  return result
}

// 只翻還沒有 zh 的句子;每輪只重試缺的。最後仍缺的 zh 維持 null,前端顯示中文時會退回英文
export async function addChinese(
  openai: OpenAI,
  transcript: Array<Omit<TranscriptLine, 'zh'> & { zh?: string | null }>,
  log: Log = noLog
): Promise<TranscriptLine[]> {
  const out: TranscriptLine[] = transcript.map((s) => ({ ...s, zh: s.zh ?? null }))
  for (let attempt = 0; attempt <= TRANSLATE_RETRIES; attempt++) {
    const pending = out.map((s, i) => (s.zh ? -1 : i)).filter((i) => i >= 0)
    if (pending.length === 0) break
    if (attempt > 0) log(`  第 ${attempt + 1} 輪補翻 ${pending.length} 句`)

    const batches: number[][] = []
    for (let i = 0; i < pending.length; i += TRANSLATE_BATCH) batches.push(pending.slice(i, i + TRANSLATE_BATCH))

    // 同時送幾批,比逐批等快很多(使用者在網頁上等結果)
    for (let i = 0; i < batches.length; i += TRANSLATE_CONCURRENCY) {
      await Promise.all(
        batches.slice(i, i + TRANSLATE_CONCURRENCY).map(async (ids) => {
          try {
            const zh = await translateBatch(openai, ids.map((id) => ({ i: id, en: out[id].en })))
            for (const id of ids) out[id].zh = zh.get(id) ?? null
          } catch (e) {
            log(`  翻譯批次失敗: ${e instanceof Error ? e.message : e}`)
          }
        })
      )
    }
  }
  const missing = out.filter((s) => !s.zh).length
  if (missing > 0) log(`  ⚠ ${missing} 句沒有中文翻譯`)
  return out
}

export async function buildTranscript(openai: OpenAI, videoId: string, log: Log = noLog): Promise<TranscriptLine[]> {
  let segments
  try {
    segments = await fetchSegments(videoId)
  } catch (e) {
    throw new YoutubeImportError('no_captions', `抓不到字幕(這支影片可能沒開字幕): ${e instanceof Error ? e.message : e}`)
  }
  const transcript = toTranscript(segments)
  if (transcript.length === 0) throw new YoutubeImportError('no_captions', '這支影片沒有可用的字幕')
  if (!looksEnglish(transcript)) throw new YoutubeImportError('not_english', '這支影片的字幕不是英文')
  if (transcript.length > MAX_SEGMENTS) {
    throw new YoutubeImportError('too_long', `影片太長(${transcript.length} 句字幕),請選 1 小時以內的影片`)
  }
  log(`  字幕 ${transcript.length} 句,翻譯中...`)
  return addChinese(openai, transcript, log)
}

export function transcriptToText(transcript: Array<{ en: string }>): string {
  return transcript.map((s) => s.en).join(' ')
}

// ---------- 題目 ----------

const QUESTION_RULES = `Question types to mix: main point / core message, specific detail (name, number, example mentioned), inference or speaker's opinion, vocabulary or phrase meaning in context, speaker's purpose or attitude.
Rules:
- Each question has exactly 4 options and exactly ONE correct answer; distractors must be plausible but clearly wrong according to the transcript.
- Vary the position of the correct answer (answer_idx) across questions.
- Base ALL questions strictly on what is in the transcript — no outside knowledge.
- explanation_zh: 1-2 sentences in Traditional Chinese explaining why that answer is correct.`

function truncateForPrompt(text: string): string {
  return text.length > MAX_PROMPT_CHARS ? text.slice(0, MAX_PROMPT_CHARS) + ' ... [truncated]' : text
}

function validQuestion(q: Question): boolean {
  return (
    !!q &&
    typeof q.q === 'string' &&
    Array.isArray(q.options) &&
    q.options.length === 4 &&
    Number.isInteger(q.answer_idx) &&
    q.answer_idx >= 0 &&
    q.answer_idx < 4 &&
    typeof q.explanation_zh === 'string'
  )
}

function withIds(questions: Question[]): Question[] {
  return questions.map((q, i) => ({ ...q, id: q.id ?? `q${String(i + 1).padStart(2, '0')}` }))
}

// GPT 出的正解位置會嚴重偏向某個選項,打散選項順序並同步 answer_idx
function shuffleOptions(q: Question): Question {
  const order = q.options.map((_, i) => i)
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[order[i], order[j]] = [order[j], order[i]]
  }
  return { ...q, options: order.map((i) => q.options[i]), answer_idx: order.indexOf(q.answer_idx) }
}

// 為既有影片補題庫:保留原本的 3 題,再生成其餘題目(避免重複)
export async function generateBank(
  openai: OpenAI,
  title: string,
  transcript: Array<{ en: string }>,
  existingQuestions: Question[] = []
): Promise<Question[]> {
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
  const generated = JSON.parse(completion.choices[0].message.content ?? '{}').questions
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

// ---------- 匯入 ----------

export interface ImportedVideo {
  id: string
  title: string
  // false = 題庫裡本來就有這支影片,沒花任何 token
  created: boolean
}

export async function findExistingVideo(supabase: SupabaseClient, videoId: string) {
  const { data } = await supabase
    .from('listening_dialogues')
    .select('id, title')
    .eq('youtube_video_id', videoId)
    .maybeSingle()
  return (data as { id: string; title: string } | null) ?? null
}

export async function importYoutubeVideo(params: {
  supabase: SupabaseClient
  openai: OpenAI
  url: string
  log?: Log
}): Promise<ImportedVideo> {
  const { supabase, openai, url, log = noLog } = params
  const { videoId, startSeconds } = parseYoutubeUrl(url)

  const existing = await findExistingVideo(supabase, videoId)
  if (existing) return { ...existing, created: false }

  log(`→ 抓字幕: ${videoId}`)
  const transcript = await buildTranscript(openai, videoId, log)

  log('→ GPT 分析...')
  let parsed
  try {
    const completion = await openai.chat.completions.create({
      model: SUMMARY_MODEL,
      messages: [
        { role: 'system', content: IMPORT_PROMPT },
        { role: 'user', content: `Video transcript:\n\n${truncateForPrompt(transcriptToText(transcript))}` },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.5,
    })
    parsed = JSON.parse(completion.choices[0].message.content ?? '{}')
  } catch (e) {
    throw new YoutubeImportError('ai_failed', `GPT 分析失敗: ${e instanceof Error ? e.message : e}`)
  }

  if (
    typeof parsed.title !== 'string' ||
    !Array.isArray(parsed.questions) ||
    parsed.questions.length !== BANK_SIZE ||
    !parsed.questions.every(validQuestion)
  ) {
    throw new YoutubeImportError('ai_failed', `GPT 沒回 ${BANK_SIZE} 題: ${JSON.stringify(parsed).slice(0, 200)}`)
  }
  const bank = withIds((parsed.questions as Question[]).map(shuffleOptions))

  log('→ 存 DB...')
  const { data: inserted, error } = await supabase
    .from('listening_dialogues')
    .insert({
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
    } as never)
    .select('id')
    .single()

  if (error || !inserted) {
    // 23505:同時有人匯入同一支影片(youtube_video_id 有 unique index),直接用對方那筆
    if (error?.code === '23505') {
      const winner = await findExistingVideo(supabase, videoId)
      if (winner) return { ...winner, created: false }
    }
    throw new YoutubeImportError('save_failed', `存檔失敗: ${error?.message ?? 'no row returned'}`)
  }

  log(`✓ 完成: ${parsed.title}`)
  return { id: (inserted as { id: string }).id, title: parsed.title, created: true }
}
