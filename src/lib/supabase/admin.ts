import { createClient } from '@supabase/supabase-js'

let _client: ReturnType<typeof createClient> | null = null

// service-role client:繞過 RLS,只在 API route 用(絕不能給 browser)
export function getSupabaseAdmin() {
  if (!_client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY or URL not set')
    }
    _client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  }
  return _client
}
