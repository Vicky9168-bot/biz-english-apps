import { redirect } from 'next/navigation'

// 首頁與 dashboard 已合併，保留舊網址導向首頁
export default function DashboardPage() {
  redirect('/')
}
