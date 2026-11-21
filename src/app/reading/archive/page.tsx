import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { READING_CATEGORIES, getReadingCategory, isReadingCategory, type ReadingCategory } from '@/lib/reading'
import { AppNav } from '../../site-nav'
import { EmptyNote, IndexList, IndexRow, PageHeader, SectionTitle } from '../../page-kit'

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

  let query = supabase
    .from('reading_articles')
    .select('article_date, category, title, source_name')
    .order('article_date', { ascending: false })
    .limit(LIMIT)
  if (category) query = query.eq('category', category)
  const { data } = await query
  const articles = data ?? []

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
          title="往期文章"
          subtitle="每天讀過的商業新聞解說都會保留在這裡，隨時回來複習。"
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
          <EmptyNote>還沒有文章。每天第一次打開某個類別，就會自動準備當天的文章。</EmptyNote>
        ) : category ? (
          <ArticleList articles={articles} />
        ) : (
          // 選「全部」時依類別分組，每組內新到舊
          READING_CATEGORIES.map((c) => {
            const group = articles.filter((a) => a.category === c.key)
            if (group.length === 0) return null
            return (
              <section key={c.key} className="mb-10">
                <SectionTitle
                  title={c.label}
                  hint={
                    <Link
                      href={`/reading/archive?category=${c.key}`}
                      className="rounded-sm underline decoration-ink/30 underline-offset-4 hover:text-ink hover:decoration-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40"
                    >
                      {group.length} 篇
                    </Link>
                  }
                />
                <ArticleList articles={group} />
              </section>
            )
          })
        )}
      </div>
    </main>
  )
}

type ArchiveArticle = {
  article_date: string
  category: ReadingCategory
  title: string
  source_name: string | null
}

function ArticleList({ articles }: { articles: ArchiveArticle[] }) {
  return (
    <IndexList>
      {articles.map((a) => (
        <IndexRow
          key={`${a.article_date}-${a.category}`}
          href={`/reading/${a.category}?date=${a.article_date}`}
          tag={a.article_date.slice(5).replace('-', '/')}
          title={a.title}
          translateTitle={false}
          desc={`${getReadingCategory(a.category).label}${a.source_name ? ` · ${a.source_name}` : ''}`}
          aside="閱讀"
        />
      ))}
    </IndexList>
  )
}
