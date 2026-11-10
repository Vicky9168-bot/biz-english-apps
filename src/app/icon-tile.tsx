import type { LucideIcon } from 'lucide-react'

// 共用圖示底：深色方塊 + 金黃線條，與首頁功能卡一致
export function IconTile({
  icon: Icon,
  size = 'md',
  className = '',
}: {
  icon: LucideIcon
  size?: 'md' | 'lg'
  className?: string
}) {
  const box = size === 'lg' ? 'h-14 w-14 rounded-xl' : 'h-11 w-11 rounded-lg'
  const glyph = size === 'lg' ? 'h-6 w-6' : 'h-5 w-5'
  return (
    <span
      className={`inline-flex items-center justify-center bg-stone-900 text-[#F5D368] ${box} ${className}`}
    >
      <Icon className={glyph} strokeWidth={1.5} aria-hidden="true" />
    </span>
  )
}
