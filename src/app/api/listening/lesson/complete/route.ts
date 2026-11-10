import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function POST() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { error } = await supabase
    .from('user_profiles')
    .update({ content_words_lesson_completed_at: new Date().toISOString() })
    .eq('user_id', user.id)

  if (error) {
    console.error('lesson complete failed:', error)
    return NextResponse.json({ error: 'update failed' }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
