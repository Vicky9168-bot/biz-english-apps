import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getOpenAI, MODELS } from '@/lib/openai'

export const runtime = 'nodejs'
export const maxDuration = 30

const WORD_RE = /^[A-Za-z][A-Za-z'’-]{0,39}$/

// 閱讀時點到不熟的字：依該句語境解釋
export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const word = typeof body?.word === 'string' ? body.word.trim() : ''
  const sentence = typeof body?.sentence === 'string' ? body.sentence.trim().slice(0, 400) : ''
  if (!WORD_RE.test(word)) {
    return NextResponse.json({ error: 'invalid word' }, { status: 400 })
  }

  const system = `You are an English tutor for Taiwanese business professionals.
Explain the target word as it is used in the given sentence.

Return strict JSON:
{
  "word": "base form (lemma) of the target word, lowercase",
  "pos": "noun | verb | adjective | adverb | other",
  "meaning_zh": "Traditional Chinese meaning in THIS context, short",
  "meaning_en": "short English definition",
  "example_en": "a NEW business sentence using the word (not the given sentence)"
}`

  try {
    const completion = await getOpenAI().chat.completions.create({
      model: MODELS.cheap,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: `Target word: ${word}\nSentence: ${sentence || '(none)'}` },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    })

    const raw = completion.choices[0].message.content
    if (!raw) throw new Error('no response')
    const parsed = JSON.parse(raw) as Record<string, unknown>

    const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '')
    const meaningZh = str(parsed.meaning_zh)
    if (!meaningZh) return NextResponse.json({ error: 'invalid lookup' }, { status: 502 })

    return NextResponse.json({
      word: str(parsed.word).toLowerCase() || word.toLowerCase(),
      pos: str(parsed.pos),
      meaning_zh: meaningZh,
      meaning_en: str(parsed.meaning_en),
      example_en: str(parsed.example_en),
    })
  } catch (err) {
    console.error('reading lookup error:', err)
    return NextResponse.json({ error: 'lookup failed' }, { status: 500 })
  }
}
