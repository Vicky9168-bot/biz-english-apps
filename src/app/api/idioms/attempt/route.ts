import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const idiomId = typeof body?.idiomId === 'string' ? body.idiomId : ''
  const isCorrect = body?.isCorrect === true

  if (!idiomId) {
    return NextResponse.json({ error: 'missing idiomId' }, { status: 400 })
  }

  const { error } = await supabase.from('idiom_attempts').insert({
    user_id: user.id,
    idiom_id: idiomId,
    is_correct: isCorrect,
  })

  if (error) {
    return NextResponse.json(
      { error: 'save failed', debug: error.message },
      { status: 500 }
    )
  }

  return NextResponse.json({ ok: true })
}
