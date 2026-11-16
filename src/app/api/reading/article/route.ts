import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getOrCreateTodayArticle, isReadingCategory } from '@/lib/reading'

export const runtime = 'nodejs'
export const maxDuration = 60

// 今天這類文章還沒生成時由閱讀頁呼叫；已存在就直接回傳，不會重複生成
export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const category = typeof body?.category === 'string' ? body.category : ''
  if (!isReadingCategory(category)) {
    return NextResponse.json({ error: 'invalid category' }, { status: 400 })
  }

  try {
    const article = await getOrCreateTodayArticle(category)
    return NextResponse.json({ id: article.id })
  } catch (err) {
    console.error('reading article error:', err)
    return NextResponse.json({ error: 'generate failed' }, { status: 500 })
  }
}
