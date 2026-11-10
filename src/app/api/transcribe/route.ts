import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getOpenAI, MODELS } from '@/lib/openai'

export const runtime = 'nodejs'
export const maxDuration = 30

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get('audio') as File | null

  if (!file) {
    return NextResponse.json({ error: 'audio file required' }, { status: 400 })
  }

  if (file.size > 20 * 1024 * 1024) {
    return NextResponse.json({ error: 'audio too large (max 20MB)' }, { status: 400 })
  }

  try {
    const openai = getOpenAI()
    const transcription = await openai.audio.transcriptions.create({
      file,
      model: MODELS.transcribe,
      language: 'en',
      response_format: 'json',
    })

    return NextResponse.json({ text: transcription.text })
  } catch (error) {
    console.error('Whisper error:', error)
    return NextResponse.json(
      { error: 'transcription failed' },
      { status: 500 }
    )
  }
}
