import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { StartButton } from './start-button'
import { AppNav } from '../site-nav'
import { GuideVideo } from '../guide-video'
import {
  EmptyNote,
  IndexList,
  IndexRow,
  Mark,
  PageHeader,
  SectionTitle,
} from '../page-kit'

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
    <main className="flex-1 bg-paper text-ink min-h-screen">
      <AppNav />

      <div className="mx-auto max-w-3xl px-6 py-10">
        <PageHeader
          title="聽力訓練"
          subtitle="AI 現場生成 60–90 秒商務對話，每題 3 道題目測抓實詞、細節、推論。"
        />

        <GuideVideo variant="collapsible" video="listening" />

        <section className="mb-12">
          <SectionTitle title="今天要練哪個場景？" />
          <p className="mb-5 max-w-xl text-sm leading-relaxed text-ink/70">
            隨機抽或自己選一個，GPT-4o 現場生對話 + 3 道題，大約 3–5 分鐘。
          </p>
          <div className="max-w-md">
            <StartButton />
          </div>
        </section>

        {/* YouTube 影片練習：依題庫順序編號 */}
        {youtubeVideos && youtubeVideos.length > 0 && (
          <section className="mb-12">
            <SectionTitle
              title="從影片練習"
              hint={`${youtubeVideos.length} 部`}
            />
            <IndexList>
              {youtubeVideos.map((v, i) => (
                <Link
                  key={v.id}
                  href={`/listening/session/${v.id}`}
                  className="group grid grid-cols-[3.5rem_1fr] items-start gap-x-4 border-t border-ink/15 px-2 py-5 transition-colors hover:bg-white/70 focus-visible:bg-white/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ink/40 sm:grid-cols-[4.5rem_9rem_1fr] sm:gap-x-6"
                >
                  <span className="pt-0.5 font-display text-sm font-semibold tabular-nums text-ink/65">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  {v.youtube_video_id && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`https://i.ytimg.com/vi/${v.youtube_video_id}/hqdefault.jpg`}
                      alt=""
                      className="col-start-2 row-start-2 mt-3 aspect-video w-36 rounded-sm object-cover sm:col-start-2 sm:row-start-1 sm:mt-0"
                    />
                  )}
                  <span className="col-start-2 min-w-0 sm:col-start-3">
                    <span className="block text-lg font-semibold leading-snug line-clamp-2">
                      <span className="mark-hover">{v.title}</span>
                    </span>
                    {v.summary_zh && (
                      <span className="mt-1 block text-sm leading-relaxed text-ink/70 line-clamp-2">
                        {v.summary_zh}
                      </span>
                    )}
                  </span>
                </Link>
              ))}
            </IndexList>
          </section>
        )}

        <section>
          <SectionTitle
            title="最近 7 天"
            hint={
              <Link
                href="/listening/lesson/content-words?review=1"
                className="rounded-sm underline decoration-ink/30 underline-offset-4 hover:text-ink hover:decoration-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40"
              >
                複習 Content Words
              </Link>
            }
          />
          {!recentSessions || recentSessions.length === 0 ? (
            <EmptyNote>還沒有紀錄。開始第一題吧</EmptyNote>
          ) : (
            <IndexList>
              {recentSessions.map((s) => (
                <IndexRow
                  key={s.id}
                  href={`/listening/session/${s.dialogue_id}?review=1`}
                  tag={`${s.score}/${s.total}`}
                  title={
                    s.score === s.total ? (
                      <Mark>全部答對</Mark>
                    ) : (
                      `${s.score} / ${s.total} 題正確`
                    )
                  }
                  desc={s.session_date}
                  aside="再聽一次"
                />
              ))}
            </IndexList>
          )}
        </section>
      </div>
    </main>
  )
}
