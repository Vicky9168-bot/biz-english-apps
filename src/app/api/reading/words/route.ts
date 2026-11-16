import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

const WORD_RE = /^[A-Za-z][A-Za-z'’-]{0,39}$/

const clean = (v: unknown, max: number) =>
  typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null

async function requireUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return { supabase, user }
}

// 存單字（同一個字重複存會被忽略）
export async function POST(request: Request) {
  const { supabase, user } = await requireUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const word = clean(body?.word, 40)?.toLowerCase()
  const meaningZh = clean(body?.meaning_zh, 200)
  if (!word || !WORD_RE.test(word) || !meaningZh) {
    return NextResponse.json({ error: 'invalid word' }, { status: 400 })
  }

  const surface = clean(body?.surface_form, 40)
  const { error } = await supabase.from('reading_saved_words').upsert(
    {
      user_id: user.id,
      word,
      surface_form: surface && WORD_RE.test(surface) ? surface : null,
      pos: clean(body?.pos, 20),
      meaning_zh: meaningZh,
      meaning_en: clean(body?.meaning_en, 300),
      example_en: clean(body?.example_en, 400),
      context_sentence: clean(body?.context_sentence, 500),
      article_id: typeof body?.article_id === 'string' ? body.article_id : null,
    },
    { onConflict: 'user_id,word', ignoreDuplicates: true }
  )

  if (error) {
    return NextResponse.json({ error: 'save failed', debug: error.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}

// 練習結果：累計答對／答錯次數
export async function PATCH(request: Request) {
  const { supabase, user } = await requireUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const id = typeof body?.id === 'string' ? body.id : ''
  if (!id || typeof body?.correct !== 'boolean') {
    return NextResponse.json({ error: 'invalid body' }, { status: 400 })
  }

  const { data: row } = await supabase
    .from('reading_saved_words')
    .select('correct_count, wrong_count')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()
  if (!row) return NextResponse.json({ error: 'not found' }, { status: 404 })

  const { error } = await supabase
    .from('reading_saved_words')
    .update({
      correct_count: row.correct_count + (body.correct ? 1 : 0),
      wrong_count: row.wrong_count + (body.correct ? 0 : 1),
      last_practiced_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: 'update failed', debug: error.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}

export async function DELETE(request: Request) {
  const { supabase, user } = await requireUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = new URL(request.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'missing id' }, { status: 400 })

  const { error } = await supabase
    .from('reading_saved_words')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: 'delete failed', debug: error.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
