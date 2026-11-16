import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { FEATURES } from '@/lib/constants'
import { FEATURE_ICONS } from '@/lib/feature-icons'
import { FAQ, FEATURE_GUIDE, WORD_FLOW } from '@/lib/guide'
import { SiteNav } from '../site-nav'
import { GuideVideo } from '../guide-video'
import { IndexList, IndexRow, PageHeader, SectionTitle } from '../page-kit'

export const metadata = {
  title: '新手指南 · BizEnglish',
  description: '第一次來？1 分鐘教學影片、單字學習 4 步驟，以及每個功能該從哪裡開始。',
}

const linkClass =
  'rounded-sm font-semibold text-ink underline decoration-ink/30 underline-offset-4 hover:decoration-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40'

export default async function GuidePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 沒登入的人點任何功能都導向註冊
  const to = (href: string) => (user ? href : '/signup')

  return (
    <main className="flex-1 bg-paper text-ink min-h-screen">
      <SiteNav
        user={
          user ? { email: user.email ?? null, profileTag: '', proficiencyLevel: null } : null
        }
      />

      <div className="mx-auto max-w-4xl px-6 py-10">
        <PageHeader
          title="新手指南"
          subtitle="第一次來？先看 1 分鐘影片，再照步驟開始。"
        >
          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
            <Link
              href={to('/reading')}
              className="rounded-md bg-ink px-6 py-3 text-sm font-semibold text-paper transition hover:bg-ink/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40 focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
            >
              {user ? '開始：去讀今天的文章' : '免費開始學習'}
            </Link>
            {user && (
              <Link href="/?tour=1" className={`text-sm ${linkClass}`}>
                重新開始網站導覽
              </Link>
            )}
          </div>
        </PageHeader>

        <section className="mb-12">
          <GuideVideo variant="inline" />
          <p className="mt-3 text-sm text-ink/70">
            影片沒有聲音，字幕在畫面內。下面有同樣內容的文字版。
          </p>
        </section>

        <section className="mb-12">
          <SectionTitle title="單字學習 4 步驟" hint="照順序做，就是一條完整的學習路線" />
          <IndexList>
            {WORD_FLOW.map((s) => (
              <IndexRow
                key={s.n}
                href={to(s.href)}
                tag={String(s.n)}
                title={s.title}
                desc={s.desc}
                aside={s.cta}
              />
            ))}
          </IndexList>
          <p className="mt-4 text-sm text-ink/70">
            每天 10 分鐘就夠：讀 1 篇文章、存 3–5 個不熟的字、練 1 輪生字本或比手畫腳。
          </p>
        </section>

        <section className="mb-12">
          <SectionTitle title="各功能怎麼開始" />
          <div className="border-b border-ink/15">
            {FEATURES.map((f) => {
              const Icon = FEATURE_ICONS[f.key]
              const guide = FEATURE_GUIDE[f.key]
              return (
                <article
                  key={f.key}
                  id={f.key}
                  className="grid gap-x-6 gap-y-2 border-t border-ink/15 px-2 py-6 sm:grid-cols-[4.5rem_1fr]"
                >
                  <span className="pt-1 font-display text-sm font-semibold text-ink/65">
                    {f.tag}
                  </span>
                  <div>
                    <h3 className="flex items-center gap-2 text-lg font-semibold">
                      <Icon className="h-5 w-5 text-ink/60" strokeWidth={1.5} aria-hidden="true" />
                      {f.title}
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-ink/80">{guide.start}</p>
                    <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm leading-relaxed text-ink/75">
                      {guide.steps.map((step) => (
                        <li key={step}>{step}</li>
                      ))}
                    </ol>
                    {f.key === 'charades' && (
                      <div className="mt-4 max-w-xl">
                        <GuideVideo variant="inline" video="charades" />
                        <p className="mt-2 text-sm text-ink/70">
                          25 秒看懂怎麼開始，沒有聲音，字幕在畫面內。
                        </p>
                      </div>
                    )}
                    <Link href={to(f.href)} className={`mt-4 inline-block text-sm ${linkClass}`}>
                      前往{f.title}
                    </Link>
                  </div>
                </article>
              )
            })}
          </div>
        </section>

        <section>
          <SectionTitle title="常見問題" />
          <div className="border-b border-ink/15">
            {FAQ.map((item) => (
              <details key={item.q} className="group border-t border-ink/15">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-2 py-4 font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ink/40 [&::-webkit-details-marker]:hidden">
                  {item.q}
                  <span aria-hidden="true" className="text-ink/50 group-open:hidden">
                    ＋
                  </span>
                  <span aria-hidden="true" className="hidden text-ink/50 group-open:inline">
                    －
                  </span>
                </summary>
                <p className="px-2 pb-5 text-sm leading-relaxed text-ink/75">{item.a}</p>
              </details>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
