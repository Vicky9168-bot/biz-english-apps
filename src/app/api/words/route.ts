import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isWordSourceType } from '@/lib/words'

export const runtime = 'nodejs'

// 單字或片語（可含空格、連字號、撇號），例如 leverage、bottom line、state-of-the-art
const WORD_RE = /^[A-Za-z][A-Za-z'’ -]{0,59}$/
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const clean = (v: unknown, max: number) =>
  typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null

async function requireUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return { supabase, user }
}

// 存單字到「我的單字本」。任何來源（閱讀、影片…）都用這支：
// - 字還不在單字本：新增，並記下最早的來源
// - 字已經在：不動原本的資料，只把這次的原句加進語境，同一個字就能累積多個出現場合
export async function POST(request: Request) {
  const { supabase, user } = await requireUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const word = clean(body?.word, 60)?.toLowerCase().replace(/\s+/g, ' ')
  const meaningZh = clean(body?.meaning_zh, 200)
  if (!word || !WORD_RE.test(word) || !meaningZh) {
    return NextResponse.json({ error: 'invalid word' }, { status: 400 })
  }
  if (!isWordSourceType(body?.source_type)) {
    return NextResponse.json({ error: 'invalid source_type' }, { status: 400 })
  }
  const sourceType = body.source_type
  const sourceId =
    typeof body?.source_id === 'string' && UUID_RE.test(body.source_id) ? body.source_id : null

  const findId = async () => {
    const { data } = await supabase
      .from('user_words')
      .select('id')
      .eq('user_id', user.id)
      .eq('word', word)
      .maybeSingle()
    return (data?.id as string | undefined) ?? null
  }

  let wordId = await findId()
  const created = !wordId
  if (!wordId) {
    const { data: inserted, error } = await supabase
      .from('user_words')
      .insert({
        user_id: user.id,
        word,
        pos: clean(body?.pos, 20),
        meaning_zh: meaningZh,
        meaning_en: clean(body?.meaning_en, 300),
        example_en: clean(body?.example_en, 400),
        source_type: sourceType,
        source_id: sourceId,
      })
      .select('id')
      .single()

    if (error) {
      // 兩個請求同時存同一個字：以先寫入的那筆為準
      wordId = error.code === '23505' ? await findId() : null
      if (!wordId) {
        return NextResponse.json({ error: 'save failed', debug: error.message }, { status: 500 })
      }
    } else {
      wordId = inserted.id as string
    }
  }

  const sentence = clean(body?.sentence, 500)
  if (sentence) {
    const surface = clean(body?.surface_form, 60)
    const { error } = await supabase.from('user_word_contexts').upsert(
      {
        user_word_id: wordId,
        user_id: user.id,
        source_type: sourceType,
        source_id: sourceId,
        sentence,
        surface_form: surface && WORD_RE.test(surface) ? surface : null,
      },
      { onConflict: 'user_word_id,sentence', ignoreDuplicates: true }
    )
    if (error) {
      return NextResponse.json({ error: 'save failed', debug: error.message }, { status: 500 })
    }
  }

  return NextResponse.json({ ok: true, id: wordId, created })
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
    .from('user_words')
    .select('correct_count, wrong_count')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()
  if (!row) return NextResponse.json({ error: 'not found' }, { status: 404 })

  const { error } = await supabase
    .from('user_words')
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

// 刪掉單字，它的語境會一起刪除（資料庫 on delete cascade）
export async function DELETE(request: Request) {
  const { supabase, user } = await requireUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = new URL(request.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'missing id' }, { status: 400 })

  const { error } = await supabase
    .from('user_words')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: 'delete failed', debug: error.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
