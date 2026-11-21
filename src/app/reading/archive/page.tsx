import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { READING_CATEGORIES, getReadingCategory, isReadingCategory, type ReadingCategory } from '@/lib/reading'
import { AppNav } from '../../site-nav'
import { EmptyNote, IndexList, IndexRow, PageHeader } from '../../page-kit'

const LIMIT = 200

export default async function ReadingArchivePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}) {
  const { category: categoryParam } = await searchParams
  const category = categoryParam && isReadingCategory(categoryParam) ? categoryParam : null

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 只列使用者自己收藏的文章;依收藏時間新到舊
  let query = supabase
    .from('reading_saved_articles')
    .select('created_at, reading_articles!inner(article_date, category, title, source_name)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(LIMIT)
  if (category) query = query.eq('reading_articles.category', category)
  const { data } = await query
  type Row = { article_date: string; category: ReadingCategory; title: string; source_name: string | null }
  const articles = ((data ?? []) as unknown as Array<{ reading_articles: Row | Row[] }>).map((r) =>
    Array.isArray(r.reading_articles) ? r.reading_articles[0] : r.reading_articles
  )

  const filterClass = (active: boolean) =>
    `rounded-full border px-3.5 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40 ${
      active
        ? 'border-ink bg-ink font-semibold text-paper'
        : 'border-ink/20 text-ink/75 hover:bg-white/70'
    }`

  return (
    <main className="flex-1 bg-paper text-ink min-h-screen">
      <AppNav backHref="/reading" />

      <div className="mx-auto max-w-4xl px-6 py-10">
        <PageHeader
          title="收藏的文章"
          subtitle="在文章頁按「收藏這篇文章」，想回頭複習的就會留在這裡。"
        >
          <nav className="mt-6 flex flex-wrap gap-2" aria-label="文章類別">
            <Link href="/reading/archive" className={filterClass(!category)}>
              全部
            </Link>
            {READING_CATEGORIES.map((c) => (
              <Link
                key={c.key}
                href={`/reading/archive?category=${c.key}`}
                className={filterClass(category === c.key)}
              >
                {c.label}
              </Link>
            ))}
          </nav>
        </PageHeader>

        {articles.length === 0 ? (
          <EmptyNote>還沒有收藏的文章。讀文章時按「收藏這篇文章」，就會出現在這裡。</EmptyNote>
        ) : (
          <IndexList>
            {articles.map((a) => {
              const cat = getReadingCategory(a.category)
              return (
                <IndexRow
                  key={`${a.article_date}-${a.category}`}
                  href={`/reading/${a.category}?date=${a.article_date}`}
                  tag={a.article_date.slice(5).replace('-', '/')}
                  title={a.title}
                  translateTitle={false}
                  desc={`${cat.label}${a.source_name ? ` · ${a.source_name}` : ''}`}
                  aside="閱讀"
                />
              )
            })}
          </IndexList>
        )}
      </div>
    </main>
  )
}
