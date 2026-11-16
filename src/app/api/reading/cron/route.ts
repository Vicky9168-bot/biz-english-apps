import { timingSafeEqual } from 'node:crypto'
import { NextResponse } from 'next/server'
import { READING_CATEGORIES, getOrCreateTodayArticle, todayInTaipei } from '@/lib/reading'

export const runtime = 'nodejs'
// Hobby 方案上限 60 秒；五個類別平行生成，各約 20–40 秒
export const maxDuration = 60

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET
  // 沒設定密鑰就一律拒絕，避免任何人都能觸發 AI 生成
  if (!secret) return false
  const given = request.headers.get('authorization') ?? ''
  const expected = `Bearer ${secret}`
  const a = Buffer.from(given)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}

// Vercel Cron 每天台北時間 00:05 呼叫（vercel.json），預先生成五個類別當天的文章。
// 已經存在的類別會直接略過，所以重複呼叫是安全的。
export async function GET(request: Request) {
  if (!process.env.CRON_SECRET) {
    console.error('reading cron: CRON_SECRET is not set')
    return NextResponse.json({ error: 'cron not configured' }, { status: 500 })
  }
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results = await Promise.allSettled(
    READING_CATEGORIES.map((c) => getOrCreateTodayArticle(c.key))
  )

  const report = READING_CATEGORIES.map((c, i) => {
    const r = results[i]
    if (r.status === 'fulfilled') return { category: c.key, ok: true, title: r.value.title }
    console.error(`reading cron failed for ${c.key}:`, r.reason)
    return {
      category: c.key,
      ok: false,
      error: r.reason instanceof Error ? r.reason.message : String(r.reason),
    }
  })

  const failed = report.filter((r) => !r.ok).length
  // 有失敗就回 500，Vercel 的 cron 紀錄才看得出來；讀者開頁時仍會即時補生成
  return NextResponse.json(
    { date: todayInTaipei(), failed, report },
    { status: failed > 0 ? 500 : 200 }
  )
}
