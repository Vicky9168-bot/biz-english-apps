import Link from 'next/link'
import type { ReactNode } from 'react'

// 練習區共用的版面元件：與首頁同一套「校稿」語言
// - 頁首：大標 + 一條細線
// - 列表：細線分隔的編號列（不用卡片格）
// - 答錯：紅筆劃掉（<Pen>）；重點：螢光黃（<Mark>）

export function PageHeader({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: ReactNode
  children?: ReactNode
}) {
  return (
    <header className="mb-10 border-b border-ink/15 pb-8">
      <h1 className="text-balance text-3xl font-bold leading-[1.15] md:text-4xl">
        {title}
      </h1>
      {subtitle && (
        <p className="mt-3 max-w-xl text-base leading-relaxed text-ink/70">
          {subtitle}
        </p>
      )}
      {children}
    </header>
  )
}

export function SectionTitle({
  title,
  hint,
}: {
  title: string
  hint?: ReactNode
}) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-4">
      <h2 className="text-xl font-bold">{title}</h2>
      {hint && <span className="text-sm text-ink/65">{hint}</span>}
    </div>
  )
}

export function IndexList({ children }: { children: ReactNode }) {
  return <div className="border-b border-ink/15">{children}</div>
}

// 一列：左邊編號或標籤、中間標題與說明、右邊補充（圖示、數字或動作）
export function IndexRow({
  href,
  tag,
  title,
  desc,
  aside,
  disabled = false,
  external = false,
  translateTitle = true,
}: {
  href?: string
  tag?: ReactNode
  title: ReactNode
  desc?: ReactNode
  aside?: ReactNode
  disabled?: boolean
  external?: boolean
  translateTitle?: boolean
}) {
  const grid = tag
    ? 'grid-cols-[3.5rem_1fr_auto] sm:grid-cols-[4.5rem_1fr_auto]'
    : 'grid-cols-[1fr_auto]'
  const body = (
    <>
      {tag && (
        <span className="pt-0.5 font-display text-sm font-semibold tabular-nums text-ink/65">
          {tag}
        </span>
      )}
      <span className="min-w-0">
        <span
          className="block text-lg font-semibold leading-snug"
          translate={translateTitle ? undefined : 'no'}
        >
          <span className="mark-hover">{title}</span>
        </span>
        {desc && (
          <span className="mt-1 block max-w-xl text-sm leading-relaxed text-ink/70">
            {desc}
          </span>
        )}
      </span>
      {aside ? (
        <span className="pt-0.5 text-sm text-ink/65 transition-colors group-hover:text-ink">
          {aside}
        </span>
      ) : (
        <span />
      )}
    </>
  )
  const base = `group grid ${grid} items-start gap-x-4 border-t border-ink/15 px-2 py-5 sm:gap-x-6`
  if (!href || disabled) {
    return <div className={`${base} ${disabled ? 'opacity-60' : ''}`}>{body}</div>
  }
  const linkClass = `${base} transition-colors hover:bg-white/70 focus-visible:bg-white/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ink/40`
  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={linkClass}
      >
        {body}
      </a>
    )
  }
  return (
    <Link href={href} className={linkClass}>
      {body}
    </Link>
  )
}

// 數字列：用細線分隔，不放卡片
export function StatStrip({
  items,
}: {
  items: { label: string; value: ReactNode; hint?: ReactNode }[]
}) {
  return (
    <dl
      className={`mb-10 grid border-y border-ink/15 ${
        items.length >= 4
          ? 'grid-cols-2 lg:grid-cols-4'
          : items.length === 3
            ? 'grid-cols-3'
            : 'grid-cols-2'
      }`}
    >
      {items.map((s) => (
        <div
          key={s.label}
          className="border-ink/15 px-4 py-5 first:pl-0 [&:not(:first-child)]:border-l"
        >
          <dt className="text-sm text-ink/65">{s.label}</dt>
          <dd className="mt-1 font-display text-3xl font-bold tabular-nums">
            {s.value}
          </dd>
          {s.hint && <p className="mt-1 text-sm text-ink/65">{s.hint}</p>}
        </div>
      ))}
    </dl>
  )
}

// 重點提醒：螢光黃的直線 + 內文
export function Callout({
  title,
  children,
}: {
  title?: string
  children: ReactNode
}) {
  return (
    <aside className="mb-10 border-l-4 border-mark pl-5">
      {title && <h2 className="text-lg font-bold">{title}</h2>}
      <div
        className={`text-sm leading-relaxed text-ink/75 ${title ? 'mt-2' : ''}`}
      >
        {children}
      </div>
    </aside>
  )
}

export function EmptyNote({ children }: { children: ReactNode }) {
  return (
    <p className="border-y border-dashed border-ink/25 py-8 text-center text-sm text-ink/65">
      {children}
    </p>
  )
}

// 紅筆劃掉（答錯、要修改的原句）
export function Pen({ children }: { children: ReactNode }) {
  return <del className="strike-pen no-underline">{children}</del>
}

// 螢光筆標出（答對、重點、修改後）
export function Mark({ children }: { children: ReactNode }) {
  return <ins className="hl-mark no-underline">{children}</ins>
}
