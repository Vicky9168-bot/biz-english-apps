import Link from 'next/link'
import { BackButton } from './back-button'
import { BrandLogo } from './brand-logo'

export type NavUser = {
  email: string | null
  profileTag: string
  proficiencyLevel: number | null
}

export function SiteNav({ user }: { user: NavUser | null }) {
  return (
    <nav className="border-b border-ink/10 bg-paper text-ink">
      <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
        <Link
          href="/"
          aria-label="BizVoice 首頁"
          className="-ml-3 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40"
        >
          <BrandLogo />
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/guide"
            data-tour="nav-guide"
            className="rounded-sm text-sm text-ink/70 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40"
          >
            新手指南
          </Link>
          <Link
            href="/pricing"
            className="rounded-sm text-sm text-ink/70 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40"
          >
            方案
          </Link>
          {user ? (
            <>
              {user.profileTag && (
                <span
                  className="hidden sm:inline text-xs text-ink/65 border border-ink/15 rounded-full px-2.5 py-1"
                  title={user.email ?? undefined}
                >
                  {user.profileTag}
                  {user.proficiencyLevel && (
                    <span className="ml-1.5 text-ink/50">
                      · Lv.{user.proficiencyLevel}
                    </span>
                  )}
                </span>
              )}
              <form action="/auth/logout" method="POST">
                <button
                  type="submit"
                  className="rounded-sm text-sm text-ink/70 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40"
                >
                  登出
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-sm text-sm text-ink/70 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40"
              >
                登入
              </Link>
              <Link
                href="/signup"
                className="rounded-md bg-ink px-4 py-2 text-sm font-semibold text-paper hover:bg-ink/85 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40 focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
              >
                免費開始
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}

// 功能頁共用導覽列：品牌 + 返回連結
export function AppNav({ backHref = '/' }: { backHref?: string }) {
  return (
    <nav className="border-b border-ink/10 bg-paper text-ink">
      <div className="mx-auto max-w-6xl px-6 h-16 flex items-center gap-4">
        <BackButton href={backHref} />
        <Link
          href="/"
          aria-label="BizVoice 首頁"
          className="rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40"
        >
          <BrandLogo className="h-9 w-auto" />
        </Link>
      </div>
    </nav>
  )
}
