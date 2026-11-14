import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Vocabulary } from '@/lib/supabase/types'
import { AppNav } from '../../site-nav'
import {
  EmptyNote,
  IndexList,
  IndexRow,
  Mark,
  PageHeader,
  SectionTitle,
} from '@/app/page-kit'

export default async function CharadesReviewPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('onboarding_completed')
    .eq('user_id', user.id)
    .single()

  if (!profile?.onboarding_completed) redirect('/onboarding')

  // 過去 60 天所有練習紀錄,取每個字最新一筆
  // eslint-disable-next-line react-hooks/purity
  const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10)

  const { data: history } = await supabase
    .from('charades_sessions')
    .select('word_id, guessed_correctly, session_date, created_at')
    .eq('user_id', user.id)
    .gte('session_date', sixtyDaysAgo)
    .order('created_at', { ascending: false })

  // 每個字最新結果:若最新 = 錯,就加入複習池
  const latest = new Map<
    string,
    { correct: boolean; date: string; ts: string }
  >()
  ;(history ?? []).forEach((r) => {
    if (!r.word_id) return
    const prev = latest.get(r.word_id)
    if (!prev || r.created_at > prev.ts) {
      latest.set(r.word_id, {
        correct: r.guessed_correctly,
        date: r.session_date,
        ts: r.created_at,
      })
    }
  })

  const wrongIds: string[] = []
  latest.forEach((v, id) => {
    if (!v.correct) wrongIds.push(id)
  })

  let words: Array<Vocabulary & { last_seen: string }> = []
  if (wrongIds.length > 0) {
    const { data: rows } = await supabase
      .from('vocabulary')
      .select('*')
      .in('id', wrongIds)
    words = ((rows ?? []) as Vocabulary[])
      .map((w) => ({
        ...w,
        last_seen: latest.get(w.id)?.date ?? '',
      }))
      .sort((a, b) => (a.last_seen < b.last_seen ? 1 : -1))
  }

  return (
    <main className="flex-1 bg-paper min-h-screen">
      <AppNav backHref="/charades" />

      <div className="mx-auto max-w-4xl px-6 py-10">
        <PageHeader
          title="錯題複習"
          subtitle={<>這些字你曾經答錯，還沒重新掌握，快速看一遍，下次遇到就記起來了。</>}
        />

        {words.length === 0 ? (
          <div>
            <EmptyNote>
              目前沒有需要複習的字。過去 60 天內每個練習過的字都掌握了，繼續保持！
            </EmptyNote>
            <Link
              href="/charades"
              className="mt-6 inline-block rounded-md bg-ink px-5 py-2.5 text-sm font-semibold text-paper hover:bg-ink/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40 focus-visible:ring-offset-2 transition"
            >
              開始今天的練習
            </Link>
          </div>
        ) : (
          <>
            <SectionTitle title={`${words.length} 個字待複習`} />
            <IndexList>
              {words.map((w, i) => (
                <IndexRow
                  key={w.id}
                  tag={String(i + 1).padStart(2, '0')}
                  title={w.word}
                  translateTitle={false}
                  desc={
                    <>
                      {w.definition_zh && <Mark>{w.definition_zh}</Mark>}
                      {w.example_sentence && (
                        <span
                          className="mt-2 block border-l-2 border-ink/25 pl-3 italic text-ink/80"
                          translate="no"
                        >
                          &ldquo;{w.example_sentence}&rdquo;
                        </span>
                      )}
                      {w.scenario_tags.length > 0 && (
                        <span className="mt-2 block text-ink/65">
                          {w.scenario_tags.join(' · ')}
                        </span>
                      )}
                    </>
                  }
                  aside={<span className="tabular-nums">上次 {w.last_seen}</span>}
                />
              ))}
            </IndexList>
          </>
        )}
      </div>
    </main>
  )
}
