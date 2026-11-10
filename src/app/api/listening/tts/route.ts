import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getOpenAI } from '@/lib/openai'

export const runtime = 'nodejs'
export const maxDuration = 30

interface TTSRequest {
  dialogueId: string
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { dialogueId } = (await request.json()) as TTSRequest
  if (!dialogueId) {
    return NextResponse.json({ error: 'missing dialogueId' }, { status: 400 })
  }

  const { data: dialogue, error } = await supabase
    .from('listening_dialogues')
    .select('script')
    .eq('id', dialogueId)
    .single()

  if (error || !dialogue) {
    return NextResponse.json({ error: 'dialogue not found' }, { status: 404 })
  }

  const script = dialogue.script as Array<{ speaker: string; text: string }>
  const totalChars = script.reduce((acc, l) => acc + l.text.length, 0)

  if (totalChars > 4000) {
    return NextResponse.json({ error: 'script too long' }, { status: 400 })
  }

  // 把 speaker 對應到兩個聲音:第一個出現的用 nova(女), 第二個用 onyx(男)
  const speakerOrder: string[] = []
  for (const line of script) {
    if (!speakerOrder.includes(line.speaker)) speakerOrder.push(line.speaker)
  }
  const voiceFor = (speaker: string): 'nova' | 'onyx' => {
    const idx = speakerOrder.indexOf(speaker)
    return idx % 2 === 0 ? 'nova' : 'onyx'
  }

  try {
    console.log('[listening tts] start', {
      dialogueId,
      lines: script.length,
      chars: totalChars,
    })
    const t0 = Date.now()
    const openai = getOpenAI()

    // 每句話並行合成
    const buffers = await Promise.all(
      script.map(async (line) => {
        const speech = await openai.audio.speech.create({
          model: 'tts-1',
          voice: voiceFor(line.speaker),
          input: line.text,
          response_format: 'mp3',
          speed: 1.0,
        })
        return Buffer.from(await speech.arrayBuffer())
      })
    )

    // MP3 frames 可直接串接
    const combined = Buffer.concat(buffers)
    console.log('[listening tts] done', {
      dialogueId,
      ms: Date.now() - t0,
      bytes: combined.length,
    })
    return new NextResponse(new Uint8Array(combined), {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'private, max-age=86400',
      },
    })
  } catch (err) {
    console.error('[listening tts] error:', err)
    return NextResponse.json(
      { error: 'tts failed', debug: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    )
  }
}
