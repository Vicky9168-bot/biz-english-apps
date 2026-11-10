import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getOpenAI } from '@/lib/openai'

export const runtime = 'nodejs'
export const maxDuration = 20

interface TTSRequest {
  text: string
  voice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer'
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = (await request.json()) as TTSRequest
  const { text, voice = 'nova' } = body

  if (!text || text.length > 1000) {
    return NextResponse.json({ error: 'invalid text' }, { status: 400 })
  }

  try {
    const openai = getOpenAI()
    const speech = await openai.audio.speech.create({
      model: 'tts-1',
      voice,
      input: text,
      response_format: 'mp3',
      speed: 0.95,
    })

    const buffer = Buffer.from(await speech.arrayBuffer())
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'private, max-age=3600',
      },
    })
  } catch (err) {
    console.error('tts error:', err)
    return NextResponse.json({ error: 'tts failed' }, { status: 500 })
  }
}
