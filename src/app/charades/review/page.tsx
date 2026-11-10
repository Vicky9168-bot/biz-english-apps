import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Vocabulary } from '@/lib/supabase/types'
import { AppNav } from '../../site-nav'
import { Trophy } from 'lucide-react'
import { IconTile } from '../../icon-tile'

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
    <main className="flex-1 bg-slate-100 min-h-screen">
      <AppNav backHref="/" backLabel="← 回比手畫腳" />

      <div className="mx-auto max-w-4xl px-6 py-10">
        <header className="mb-8">
          <div className="font-mono text-xs tracking-[0.2em] uppercase text-stone-500 mb-2">
            [Review]
          </div>
          <h1 className="text-3xl font-bold text-slate-900 text-pretty">
            錯題複習
          </h1>
          <p className="text-slate-600 mt-2 max-w-xl">
            這些字你曾經答錯，還沒重新掌握，快速看一遍，下次遇到就記起來了。
          </p>
        </header>

        {words.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
            <IconTile icon={Trophy} size="lg" className="mb-3" />
            <h2 className="text-lg font-semibold text-slate-900 mb-1">
              目前沒有需要複習的字
            </h2>
            <p className="text-sm text-slate-500">
              過去 60 天內每個練習過的字都掌握了，繼續保持！
            </p>
            <Link
              href="/charades"
              className="mt-6 inline-block rounded-md bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/30 transition"
            >
              開始今天的練習
            </Link>
          </div>
        ) : (
          <>
            <div className="text-sm text-slate-600 mb-4">
              <span className="font-semibold text-slate-900 tabular-nums">
                {words.length}
              </span>{' '}
              個字待複習
            </div>
            <ul className="space-y-3">
              {words.map((w) => (
                <li
                  key={w.id}
                  className="rounded-xl border border-slate-200 bg-white p-5"
                >
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div>
                      <div
                        className="text-xl font-bold text-slate-900"
                        translate="no"
                      >
                        {w.word}
                      </div>
                      {w.definition_zh && (
                        <div className="text-sm text-slate-600 mt-0.5">
                          {w.definition_zh}
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-slate-400 tabular-nums shrink-0">
                      上次 {w.last_seen}
                    </span>
                  </div>

                  {w.example_sentence && (
                    <p className="text-sm text-slate-700 italic border-l-2 border-slate-200 pl-3 mt-3">
                      &ldquo;{w.example_sentence}&rdquo;
                    </p>
                  )}

                  {w.scenario_tags.length > 0 && (
                    <div className="mt-3 flex gap-1.5 flex-wrap">
                      {w.scenario_tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </main>
  )
}
