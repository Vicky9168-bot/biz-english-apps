import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  answerQuestionId,
  pickQuestions,
  questionsFromAnswers,
  type ListeningQuestion,
  type SavedAnswer,
} from '@/lib/listening-questions'
import { ListeningSession } from './session-client'
import type { TranscriptLine } from './video-transcript'
import { AppNav } from '../../../site-nav'

type ScriptLine = { speaker: string; text: string }

export default async function ListeningSessionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ review?: string }>
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { id } = await params
  const { review } = await searchParams

  const { data: dialogue, error } = await supabase
    .from('listening_dialogues')
    .select(
      'id, title, scenario, difficulty, script, questions, question_bank, transcript, scenario_tags, source_type, youtube_video_id, youtube_start_seconds, summary_zh, shadowing_text, shadowing_start_seconds'
    )
    .eq('id', id)
    .single()

  if (error || !dialogue) notFound()

  // 有題庫就每次抽題（優先沒答過的）；複習模式還原上次作答的題目
  const defaultQuestions = dialogue.questions as ListeningQuestion[]
  const bank = (dialogue.question_bank as ListeningQuestion[] | null) ?? []
  let questions = defaultQuestions
  if (bank.length > 0) {
    const { data: sessions } = await supabase
      .from('listening_sessions')
      .select('answers')
      .eq('user_id', user.id)
      .eq('dialogue_id', id)
      .order('created_at', { ascending: false })
    const history = (sessions ?? []).map(
      (s) => (s.answers as SavedAnswer[] | null) ?? []
    )

    if (review === '1') {
      const last = questionsFromAnswers(bank, history[0] ?? [])
      if (last.length > 0) questions = last
    } else {
      const seen = new Set(history.flat().map(answerQuestionId))
      questions = pickQuestions(bank, seen)
    }
  }

  return (
    <main className="flex-1 bg-slate-100 min-h-screen">
      <AppNav backHref="/listening" />

      <div className="mx-auto max-w-6xl px-6 py-8">
        <ListeningSession
          dialogueId={dialogue.id}
          title={dialogue.title}
          scenario={dialogue.scenario}
          script={(dialogue.script as ScriptLine[] | null) ?? []}
          questions={questions}
          transcript={(dialogue.transcript as TranscriptLine[] | null) ?? null}
          isReview={review === '1'}
          sourceType={(dialogue.source_type as 'ai_dialogue' | 'youtube') ?? 'ai_dialogue'}
          youtubeVideoId={dialogue.youtube_video_id as string | null}
          youtubeStartSeconds={
            (dialogue.youtube_start_seconds as number | null) ?? 0
          }
          summaryZh={dialogue.summary_zh as string | null}
          shadowingText={dialogue.shadowing_text as string | null}
          shadowingStartSeconds={
            (dialogue.shadowing_start_seconds as number | null) ??
            ((dialogue.youtube_start_seconds as number | null) ?? 0)
          }
        />
      </div>
    </main>
  )
}
