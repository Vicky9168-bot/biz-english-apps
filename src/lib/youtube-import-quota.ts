import type { SupabaseClient } from '@supabase/supabase-js'

// 每人每天最多匯入幾部(env 可調)
export function getDailyImportLimit(): number {
  const n = parseInt(process.env.YOUTUBE_IMPORT_DAILY_LIMIT ?? '', 10)
  return Number.isFinite(n) && n > 0 ? n : 3
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
