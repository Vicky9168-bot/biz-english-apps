// 抓 3 支 YouTube 影片 start→start+30s 的字幕,填 shadowing_text
// Run: node scripts/backfill-shadowing.mjs
import { createClient } from '@supabase/supabase-js'
import { YoutubeTranscript } from 'youtube-transcript'
import fs from 'node:fs'

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  const env = fs.readFileSync('.env.local', 'utf8')
  for (const line of env.split('\n')) {
    const m = line.match(/^([A-Z_]+)=(.*)$/)
    if (m) process.env[m[1]] = m[2].trim()
  }
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
)

const SHADOWING_SECONDS = 30

async function main() {
  const { data: videos, error } = await supabase
    .from('listening_dialogues')
    .select('id, title, youtube_video_id, youtube_start_seconds, shadowing_text, shadowing_start_seconds')
    .eq('source_type', 'youtube')

  if (error) throw error
  if (!videos?.length) {
    console.log('沒有 YouTube 影片')
    return
  }

  for (const v of videos) {
    if (v.shadowing_text && v.shadowing_start_seconds != null) {
      console.log(`✓ 已有 shadowing: ${v.title}`)
      continue
    }
    const requestedStartMs = (v.youtube_start_seconds ?? 0) * 1000
    console.log(`→ 抓 ${v.youtube_video_id} (start=${requestedStartMs}ms)`)

    const segments = await YoutubeTranscript.fetchTranscript(v.youtube_video_id, {
      lang: 'en',
    }).catch(() => YoutubeTranscript.fetchTranscript(v.youtube_video_id))

    // youtube-transcript 的 offset/duration 單位為毫秒
    // 找第一段 offset >= 使用者指定起點的字幕,從那裡起算 30 秒
    const firstIdx = segments.findIndex((s) => s.offset >= requestedStartMs)
    const anchor = firstIdx >= 0 ? segments[firstIdx].offset : segments[0]?.offset ?? 0
    const endMs = anchor + SHADOWING_SECONDS * 1000
    console.log(`  實際起點 ${anchor}ms → ${endMs}ms`)

    const slice = segments.filter((s) => s.offset >= anchor && s.offset < endMs)
    const text = slice
      .map((s) => s.text)
      .join(' ')
      .replace(/\s+/g, ' ')
      .replace(/&amp;#39;/g, "'")
      .replace(/&amp;quot;/g, '"')
      .replace(/\n/g, ' ')
      .trim()

    if (!text) {
      console.log(`  ⚠ 該區段沒抓到字幕,跳過`)
      continue
    }

    const shadowingStartSec = Math.floor(anchor / 1000)
    const { error: upErr } = await supabase
      .from('listening_dialogues')
      .update({ shadowing_text: text, shadowing_start_seconds: shadowingStartSec })
      .eq('id', v.id)
    if (upErr) throw upErr
    console.log(`  ✓ ${text.length} chars, start=${shadowingStartSec}s`)
  }

  console.log('done')
}

main().catch((e) => {
  console.error('✗', e)
  process.exit(1)
})
