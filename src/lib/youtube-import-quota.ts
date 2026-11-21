import type { SupabaseClient } from '@supabase/supabase-js'

// 每人每天最多匯入幾部(env 可調)
export function getDailyImportLimit(): number {
  const n = parseInt(process.env.YOUTUBE_IMPORT_DAILY_LIMIT ?? '', 10)
  return Number.isFinite(n) && n > 0 ? n : 1
}

// 「每天」以台灣時間 00:00 為界
export function startOfTodayTaipei(now = Date.now()): string {
  const offset = 8 * 60 * 60 * 1000
  const day = 24 * 60 * 60 * 1000
  return new Date(Math.floor((now + offset) / day) * day - offset).toISOString()
}

export async function countTodayImports(supabase: SupabaseClient, userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('youtube_import_log')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', startOfTodayTaipei())
  if (error) throw error
  return count ?? 0
}

// 先寫一筆再數:同時送出多個請求時,超過上限的會被退回,不會漏算。
// 成功回傳 release(匯入失敗時呼叫,把這次額度還給使用者);超過上限回傳 null。
export async function reserveImport(
  admin: SupabaseClient,
  userId: string,
  videoId: string
): Promise<(() => Promise<void>) | null> {
  const { data, error } = await admin
    .from('youtube_import_log')
    .insert({ user_id: userId, youtube_video_id: videoId } as never)
    .select('id')
    .single()
  if (error || !data) throw error ?? new Error('quota insert failed')
  const id = (data as { id: string }).id

  const release = async () => {
    await admin.from('youtube_import_log').delete().eq('id', id)
  }

  if ((await countTodayImports(admin, userId)) > getDailyImportLimit()) {
    await release()
    return null
  }
  return release
}

export interface ImportGate {
  // 站內原有的影片數(不含使用者自己匯入的)
  total: number
  // 其中這位使用者已經練完(有答題紀錄)的數量
  done: number
  unlocked: boolean
  // 使用者練過的所有 YouTube 影片(含自己匯入的),列表顯示「已完成」用
  completedIds: Set<string>
}

// 要先把站內原有的影片都練過,才能自己貼連結匯入。
// 「原有」= 不在 youtube_import_log 的影片;因為要看到所有人的匯入紀錄,必須傳 service role client。
export async function getImportGate(admin: SupabaseClient, userId: string): Promise<ImportGate> {
  const [videos, logged, sessions] = await Promise.all([
    admin.from('listening_dialogues').select('id, youtube_video_id').eq('source_type', 'youtube'),
    admin.from('youtube_import_log').select('youtube_video_id'),
    admin.from('listening_sessions').select('dialogue_id').eq('user_id', userId),
  ])
  if (videos.error) throw videos.error
  if (logged.error) throw logged.error
  if (sessions.error) throw sessions.error

  const importedVideoIds = new Set((logged.data ?? []).map((r) => r.youtube_video_id as string))
  const practiced = new Set((sessions.data ?? []).map((r) => r.dialogue_id as string))
  const rows = (videos.data ?? []) as Array<{ id: string; youtube_video_id: string | null }>

  const completedIds = new Set(rows.filter((v) => practiced.has(v.id)).map((v) => v.id))
  const original = rows.filter((v) => !v.youtube_video_id || !importedVideoIds.has(v.youtube_video_id))
  const done = original.filter((v) => completedIds.has(v.id)).length
  return { total: original.length, done, unlocked: done >= original.length, completedIds }
}
