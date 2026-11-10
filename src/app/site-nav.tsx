import Link from 'next/link'

export type NavUser = {
  email: string | null
  profileTag: string
  proficiencyLevel: number | null
}

export function SiteNav({ user }: { user: NavUser | null }) {
  return (
    <nav className="border-b border-stone-200 bg-white">
      <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
        <Link
          href="/"
          className="text-xl font-bold text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900/20 rounded-sm"
          translate="no"
        >
          BizEnglish
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/pricing"
            className="text-sm text-stone-600 hover:text-stone-900"
          >
            方案
          </Link>
          {user ? (
            <>
              {user.profileTag && (
                <span
                  className="hidden sm:inline text-xs text-stone-500 border border-stone-200 rounded-full px-2.5 py-1"
                  title={user.email ?? undefined}
                >
                  {user.profileTag}
                  {user.proficiencyLevel && (
                    <span className="ml-1.5 text-stone-400">
                      · Lv.{user.proficiencyLevel}
                    </span>
                  )}
                </span>
              )}
              <form action="/auth/logout" method="POST">
                <button
                  type="submit"
                  className="text-sm text-stone-600 hover:text-stone-900"
                >
                  登出
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm text-stone-600 hover:text-stone-900"
              >
                登入
              </Link>
              <Link
                href="/signup"
                className="rounded-md bg-stone-800 px-4 py-2 text-sm font-semibold text-[#F5D368] hover:bg-stone-700 transition"
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
export function AppNav({
  backHref = '/',
  backLabel = '← 回首頁',
}: {
  backHref?: string
  backLabel?: string
}) {
  return (
    <nav className="border-b border-stone-200 bg-white">
      <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
        <Link
          href="/"
          className="text-xl font-bold text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900/20 rounded-sm"
          translate="no"
        >
          BizEnglish
        </Link>
        <Link
          href={backHref}
          className="text-sm text-stone-600 hover:text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 rounded-sm px-1"
        >
          {backLabel}
        </Link>
      </div>
    </nav>
  )
}
