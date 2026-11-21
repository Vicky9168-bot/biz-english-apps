import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// 收藏 / 取消收藏一篇文章(靠 RLS 保證只能動自己的收藏)
export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const articleId = typeof body?.article_id === 'string' ? body.article_id : ''
  if (!UUID_RE.test(articleId) || typeof body?.saved !== 'boolean') {
    return NextResponse.json({ error: 'invalid body' }, { status: 400 })
  }

  const { error } = body.saved
    ? await supabase
        .from('reading_saved_articles')
        .upsert({ user_id: user.id, article_id: articleId }, { onConflict: 'user_id,article_id', ignoreDuplicates: true })
    : await supabase
        .from('reading_saved_articles')
        .delete()
        .eq('user_id', user.id)
        .eq('article_id', articleId)

  if (error) {
    console.error('reading save-article error:', error)
    return NextResponse.json({ error: 'save failed' }, { status: 500 })
  }
  return NextResponse.json({ saved: body.saved })
}
