import type { LucideIcon } from 'lucide-react'

// 共用圖示底：白底細框 + 墨色線條，與首頁功能列的圖示一致
export function IconTile({
  icon: Icon,
  size = 'md',
  className = '',
}: {
  icon: LucideIcon
  size?: 'md' | 'lg'
  className?: string
}) {
  const box = size === 'lg' ? 'h-14 w-14 rounded-lg' : 'h-11 w-11 rounded-lg'
  const glyph = size === 'lg' ? 'h-6 w-6' : 'h-5 w-5'
  return (
    <span
      className={`inline-flex items-center justify-center border border-ink/20 bg-white text-ink ${box} ${className}`}
    >
      <Icon className={glyph} strokeWidth={1.5} aria-hidden="true" />
    </span>
  )
}
