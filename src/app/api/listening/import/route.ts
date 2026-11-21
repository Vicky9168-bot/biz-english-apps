import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { getOpenAI } from '@/lib/openai'
import {
  findExistingVideo,
  importYoutubeVideo,
  parseYoutubeUrl,
  YoutubeImportError,
} from '@/lib/youtube-import'
import { getDailyImportLimit, reserveImport } from '@/lib/youtube-import-quota'

export const runtime = 'nodejs'
// 抓字幕 + 翻譯整支影片 + 出 12 題,長影片可能超過 30 秒
export const maxDuration = 300

const STATUS_BY_CODE = {
  bad_url: 400,
  no_captions: 422,
  not_english: 422,
  too_long: 422,
  ai_failed: 502,
  save_failed: 500,
} as const

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = (await request.json().catch(() => ({}))) as { url?: unknown }
  if (typeof body.url !== 'string' || body.url.length > 300) {
    return NextResponse.json({ error: '請貼 YouTube 影片連結' }, { status: 400 })
  }

  const admin = getSupabaseAdmin()
  let release: (() => Promise<void>) | null = null

  try {
    const { videoId } = parseYoutubeUrl(body.url)

    // 題庫已有這支影片:直接帶去練習,不花 token 也不扣額度
    const existing = await findExistingVideo(admin, videoId)
    if (existing) return NextResponse.json({ id: existing.id, created: false })

    release = await reserveImport(admin, user.id, videoId)
    if (!release) {
      return NextResponse.json(
        { error: `今天已經匯入 ${getDailyImportLimit()} 部了,明天再來(台灣時間 00:00 重置)` },
        { status: 429 }
      )
    }

    const result = await importYoutubeVideo({ supabase: admin, openai: getOpenAI(), url: body.url })
    // 競爭下別人先匯入同一支影片:沒花到 token,把額度還回去
    if (!result.created) await release()
    return NextResponse.json({ id: result.id, created: result.created })
  } catch (err) {
    await release?.().catch(() => {})
    if (err instanceof YoutubeImportError) {
      return NextResponse.json({ error: err.message }, { status: STATUS_BY_CODE[err.code] })
    }
    console.error('youtube import error:', err)
    return NextResponse.json({ error: '匯入失敗,請稍後再試' }, { status: 500 })
  }
}
