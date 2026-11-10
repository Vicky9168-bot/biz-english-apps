import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { StartButton } from './start-button'
import { AppNav } from '../site-nav'

export default async function ListeningHome() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('onboarding_completed, content_words_lesson_completed_at')
    .eq('user_id', user.id)
    .single()

  if (!profile?.onboarding_completed) redirect('/onboarding')

  if (!profile.content_words_lesson_completed_at) {
    redirect('/listening/lesson/content-words')
  }

  // 最近 7 天的聽力紀錄
  // eslint-disable-next-line react-hooks/purity
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10)

  const { data: recentSessions } = await supabase
    .from('listening_sessions')
    .select('id, dialogue_id, score, total, session_date, created_at')
    .eq('user_id', user.id)
    .gte('session_date', sevenDaysAgo)
    .order('created_at', { ascending: false })
    .limit(5)

  // YouTube 影片練習題庫
  const { data: youtubeVideos } = await supabase
    .from('listening_dialogues')
    .select('id, title, summary_zh, youtube_video_id, scenario_tags')
    .eq('source_type', 'youtube')
    .order('created_at', { ascending: true })

  return (
    <main className="flex-1 bg-slate-100 min-h-screen">
      <AppNav />

      <div className="mx-auto max-w-3xl px-6 py-10">
        <header className="mb-8">
          <div className="font-mono text-xs tracking-[0.2em] uppercase text-stone-500 mb-2">
            [Part 2]
          </div>
          <h1 className="text-3xl font-bold text-slate-900 text-pretty">
            聽力訓練
          </h1>
          <p className="text-slate-600 mt-2 max-w-xl">
            AI 現場生成 60–90 秒商務對話，每題 3 道題目測抓實詞、細節、推論。
          </p>
        </header>

        <section className="rounded-xl border border-slate-200 bg-white p-8 mb-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-1">
            今天要練哪個場景？
          </h2>
          <p className="text-sm text-slate-600 mb-6">
            隨機抽或自己選一個，GPT-4o 現場生對話 + 3 道題，大約 3–5 分鐘。
          </p>
          <StartButton />
        </section>

        {/* YouTube 影片練習 */}
        {youtubeVideos && youtubeVideos.length > 0 && (
          <section className="mb-6">
            <div className="flex items-baseline justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
                從影片練習
              </h2>
              <span className="text-xs text-slate-400">
                {youtubeVideos.length} 部
              </span>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {youtubeVideos.map((v) => (
                <li key={v.id}>
                  <Link
                    href={`/listening/session/${v.id}`}
                    className="block rounded-xl border border-slate-200 bg-white overflow-hidden hover:border-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 motion-safe:transition group"
                  >
                    {v.youtube_video_id && (
                      <div className="aspect-video bg-slate-100 relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`https://i.ytimg.com/vi/${v.youtube_video_id}/hqdefault.jpg`}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 motion-safe:transition bg-black/30">
                          <span className="text-white text-2xl">▶</span>
                        </div>
                      </div>
                    )}
                    <div className="p-4">
                      <div className="text-sm font-semibold text-slate-900 line-clamp-2 mb-1">
                        {v.title}
                      </div>
                      {v.summary_zh && (
                        <p className="text-xs text-slate-600 line-clamp-2">
                          {v.summary_zh}
                        </p>
                      )}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
              最近 7 天
            </h2>
            <Link
              href="/listening/lesson/content-words?review=1"
              className="text-xs text-slate-500 hover:text-slate-900"
            >
              複習 Content Words →
            </Link>
          </div>
          {!recentSessions || recentSessions.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
              還沒有紀錄。開始第一題吧
            </div>
          ) : (
            <ul className="space-y-2">
              {recentSessions.map((s) => (
                <li
                  key={s.id}
                  className="rounded-lg border border-slate-200 bg-white p-4 flex items-center justify-between"
                >
                  <div>
                    <div className="text-sm font-medium text-slate-900">
                      {s.score} / {s.total} 題正確
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {s.session_date}
                    </div>
                  </div>
                  <Link
                    href={`/listening/session/${s.dialogue_id}?review=1`}
                    className="text-xs text-slate-600 hover:text-slate-900"
                  >
                    再聽一次 →
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  )
}
