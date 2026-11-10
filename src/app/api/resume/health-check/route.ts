import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getOpenAI, MODELS } from '@/lib/openai'

export const runtime = 'nodejs'
export const maxDuration = 60

const CATEGORIES = [
  'Summary',
  'Experience',
  'Skills',
  'Structure',
  'Keywords',
] as const
const PRIORITIES = ['high', 'medium', 'low'] as const

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const jd = typeof body?.jd === 'string' ? body.jd.trim() : ''
  const resume = typeof body?.resume === 'string' ? body.resume.trim() : ''

  if (jd.length < 50) {
    return NextResponse.json(
      { error: 'Job Description 太短，請至少貼 50 字' },
      { status: 400 }
    )
  }
  if (jd.length > 4000) {
    return NextResponse.json(
      { error: 'Job Description 太長，請壓在 4000 字內' },
      { status: 400 }
    )
  }
  if (resume.length < 100) {
    return NextResponse.json(
      { error: '履歷太短，請至少貼 100 字' },
      { status: 400 }
    )
  }
  if (resume.length > 6000) {
    return NextResponse.json(
      { error: '履歷太長，請壓在 6000 字內' },
      { status: 400 }
    )
  }

  const prompt = `你是資深商務英語履歷教練，專門幫求職者對照 Job Description 修履歷。

任務：收到 JD 和履歷，從以下幾個維度給出健檢報告。

Job Description:
"""
${jd}
"""

Resume:
"""
${resume}
"""

回傳嚴格 JSON：
{
  "match_score": 0-100 的整數，對這份履歷符合 JD 的程度打分,
  "score_reason_zh": "1-2 句中文，說明分數怎麼來的（哪裡強、哪裡弱）",
  "keyword_match": {
    "matched": ["列出 5-10 個 JD 有且履歷也有的關鍵字或技能（英文原字）"],
    "missing": ["列出 5-10 個 JD 有但履歷沒提到的關鍵字或技能（英文原字）"]
  },
  "bullet_rewrites": [
    {
      "original": "從履歷中挑一條需要改進的 bullet（英文原文，完整一句）",
      "improved": "改寫後的 bullet：動詞開頭 + 具體策略 + 量化成果（英文，對齊 JD 關鍵字）",
      "why_zh": "1 句中文說明為什麼變好"
    }
  ]（挑 3-5 條最需要改的，如果履歷太薄弱可以少於 3 條）,
  "suggestions": [
    {
      "category": "Summary" 或 "Experience" 或 "Skills" 或 "Structure" 或 "Keywords" 其中之一,
      "priority": "high" 或 "medium" 或 "low"（high = 現在就改，medium = 面試前搞定，low = 有空優化）,
      "tip_zh": "1-2 句中文，具體到「怎麼做」而不是「應該做」"
    }
  ]（3-5 個）
}

寫作原則：
- keyword_match 只列真正對得上 JD 的技能或工具，別列「communication」這種空詞
- bullet_rewrites 的 improved 版本一定要有數字或具體對象，不能空泛
- suggestions 要具體，例如「Summary 開頭加上『5 years of...』量化年資」比「加強 Summary」有用`

  try {
    const openai = getOpenAI()
    const t0 = Date.now()
    const completion = await openai.chat.completions.create({
      model: MODELS.quality,
      messages: [
        {
          role: 'system',
          content:
            'You are a senior resume coach who tailors resumes to job descriptions. Reply in strict JSON only.',
        },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    })
    console.log('[resume/health-check] ms', Date.now() - t0)

    const raw = JSON.parse(completion.choices[0].message.content ?? '{}')

    const score = Math.max(
      0,
      Math.min(100, Math.round(Number(raw.match_score) || 0))
    )
    const matched: string[] = Array.isArray(raw.keyword_match?.matched)
      ? raw.keyword_match.matched.filter((s: unknown) => typeof s === 'string')
      : []
    const missing: string[] = Array.isArray(raw.keyword_match?.missing)
      ? raw.keyword_match.missing.filter((s: unknown) => typeof s === 'string')
      : []
    const rewrites = Array.isArray(raw.bullet_rewrites)
      ? raw.bullet_rewrites
          .filter(
            (r: {
              original?: unknown
              improved?: unknown
              why_zh?: unknown
            }) =>
              typeof r.original === 'string' &&
              typeof r.improved === 'string' &&
              typeof r.why_zh === 'string'
          )
          .slice(0, 5)
      : []
    const suggestions = Array.isArray(raw.suggestions)
      ? raw.suggestions
          .filter(
            (s: {
              category?: unknown
              priority?: unknown
              tip_zh?: unknown
            }) =>
              typeof s.tip_zh === 'string' &&
              CATEGORIES.includes(s.category as (typeof CATEGORIES)[number]) &&
              PRIORITIES.includes(s.priority as (typeof PRIORITIES)[number])
          )
          .slice(0, 5)
      : []

    return NextResponse.json({
      match_score: score,
      score_reason_zh: String(raw.score_reason_zh ?? ''),
      keyword_match: { matched, missing },
      bullet_rewrites: rewrites,
      suggestions,
    })
  } catch (err) {
    console.error('[resume/health-check] error:', err)
    return NextResponse.json(
      {
        error: 'health check failed',
        debug: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    )
  }
}
