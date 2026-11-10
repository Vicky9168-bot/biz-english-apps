import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

// 取今日 5 個字：
// 1. 依 profile 的 target_scenarios 過濾（有匹配 tag 優先）
// 2. 難度 = proficiency_level ± 1
// 3. 排除過去 14 天所有練過的字（不論對錯，避免重複）
export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('proficiency_level, english_challenges, target_scenarios')
    .eq('user_id', user.id)
    .single()

  const level = profile?.proficiency_level ?? 3
  const minDiff = Math.max(1, level - 1)
  const maxDiff = Math.min(5, level + 1)
  const scenarios: string[] =
    profile?.english_challenges ?? profile?.target_scenarios ?? []

  // 取過去 14 天內練過（不論對錯）的 word_ids 排除，避免重複刷同幾個字
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10)

  const { data: recent } = await supabase
    .from('charades_sessions')
    .select('word_id')
    .eq('user_id', user.id)
    .gte('session_date', fourteenDaysAgo)

  const excludeIds = Array.from(
    new Set(
      (recent ?? [])
        .map((r) => r.word_id)
        .filter((id): id is string => !!id)
    )
  )

  // 主要查詢：符合難度區間 + 排除近期練過的字
  let query = supabase
    .from('vocabulary')
    .select('*')
    .gte('difficulty', minDiff)
    .lte('difficulty', maxDiff)

  if (excludeIds.length > 0) {
    query = query.not('id', 'in', `(${excludeIds.join(',')})`)
  }

  let { data: candidates, error } = await query.limit(80)

  // Fallback：若近期把難度區間內的字幾乎練完，放寬難度重新撈
  if (!error && (!candidates || candidates.length < 5)) {
    let fallback = supabase.from('vocabulary').select('*')
    if (excludeIds.length > 0) {
      fallback = fallback.not('id', 'in', `(${excludeIds.join(',')})`)
    }
    const res = await fallback.limit(80)
    if (!res.error && res.data) {
      candidates = res.data
    }
  }

  if (error || !candidates) {
    return NextResponse.json({ error: error?.message ?? 'no words' }, { status: 500 })
  }

  // 優先挑符合 scenario_tags 的字
  const scored = candidates.map((w) => {
    const overlap = (w.scenario_tags ?? []).filter((t: string) =>
      scenarios.includes(t)
    ).length
    return { word: w, score: overlap }
  })

  // 有符合場景的先排，同分隨機
  const sorted = scored.sort((a, b) => b.score - a.score || Math.random() - 0.5)
  const picked = sorted.slice(0, 5).map((s) => s.word)

  // 不足 5 個時，補上其他難度範圍內的字
  if (picked.length < 5) {
    return NextResponse.json({ words: picked })
  }

  return NextResponse.json({ words: picked })
}
