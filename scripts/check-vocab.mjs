import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

console.log('URL:', url)

const { count } = await supabase
  .from('vocabulary')
  .select('*', { count: 'exact', head: true })
console.log('vocabulary 總數:', count)

// 抓最近新增的 5 筆
const { data: recent } = await supabase
  .from('vocabulary')
  .select('word, part_of_speech, created_at')
  .order('created_at', { ascending: false })
  .limit(5)
console.log('\n最近新增 5 筆:')
recent?.forEach((r) => console.log(`  ${r.word} (${r.part_of_speech}) - ${r.created_at}`))

// 檢查幾個明顯來自 200 words 的字
const samples = ['authorization', 'creditor', 'debtor', 'turnover', 'haggle']
const { data: check } = await supabase
  .from('vocabulary')
  .select('word')
  .in('word', samples)
console.log(`\n樣本檢查 (${samples.join(', ')}):`)
console.log('  找到:', check?.map((c) => c.word).join(', ') || '(無)')
