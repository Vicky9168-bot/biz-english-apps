'use client'

import Link from 'next/link'

// 所有頁面統一的「返回」按鈕：同樣的文字、位置（導覽列最左）與樣式
const LABEL = '← 返回'
const CLASS_NAME =
  'inline-flex items-center rounded-md border border-ink/25 px-4 py-2 text-sm font-semibold text-ink cursor-pointer transition hover:border-ink hover:bg-ink hover:text-paper active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40 focus-visible:ring-offset-2 focus-visible:ring-offset-paper'

// 一般頁面：連到上層頁面
export function BackButton({ href }: { href: string }) {
  return (
    <Link href={href} className={CLASS_NAME}>
      {LABEL}
    </Link>
  )
}

// 練習進行中：離開前要先做確認／清理，所以用 onClick
export function ExitButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={CLASS_NAME}>
      {LABEL}
    </button>
  )
}
