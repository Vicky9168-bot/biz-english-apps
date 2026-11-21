import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  ARTICLE_COLUMNS,
  getReadingCategory,
  isReadingCategory,
  isValidDateString,
  todayInTaipei,
  type ReadingArticle,
} from '@/lib/reading'
import { AppNav } from '../../site-nav'
import { GenerateClient } from './generate-client'
import { ReaderClient } from './reader-client'

export default async function ReadingArticlePage({
  params,
  searchParams,
}: {
  params: Promise<{ category: string }>
  searchParams: Promise<{ date?: string }>
}) {
  const { category } = await params
  const { date: dateParam } = await searchParams
  if (!isReadingCategory(category)) notFound()

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const meta = getReadingCategory(category)
  const today = todayInTaipei()
  const date = dateParam && isValidDateString(dateParam) ? dateParam : today
  const isToday = date === today

  const { data } = await supabase
    .from('reading_articles')
    .select(ARTICLE_COLUMNS)
    .eq('article_date', date)
    .eq('category', category)
    .maybeSingle()
  const article = (data as ReadingArticle | null) ?? null

  if (!article) {
    // 往期沒有就是沒有；只有「今天」才會自動去抓新聞生成
    if (!isToday) notFound()
    return (
      <main className="flex-1 bg-paper text-ink min-h-screen">
        <AppNav backHref="/reading" />
        <div className="mx-auto max-w-2xl px-6 py-16">
          <GenerateClient category={category} label={meta.label} />
        </div>
      </main>
    )
  }

  const { data: saved } = await supabase
    .from('user_words')
    .select('word')
    .eq('user_id', user.id)

  const { data: savedArticle } = await supabase
    .from('reading_saved_articles')
    .select('article_id')
    .eq('user_id', user.id)
    .eq('article_id', article.id)
    .maybeSingle()

  return (
    <main className="flex-1 bg-paper text-ink min-h-screen">
      <AppNav backHref={isToday ? '/reading' : `/reading/archive?category=${category}`} />
      <div className="mx-auto max-w-6xl px-6 py-10">
        <ReaderClient
          article={article}
          categoryLabel={meta.label}
          categoryEn={meta.en}
          savedWords={(saved ?? []).map((w) => w.word as string)}
          initiallySaved={!!savedArticle}
        />
      </div>
    </main>
  )
}
