// 對應 supabase/migrations/20260919000000_initial_schema.sql
// 之後可用 `supabase gen types typescript` 自動產出，先手寫核心表

export interface UserProfile {
  id: string
  user_id: string
  job_title: string | null
  industry: string | null
  seniority_level: string | null
  english_challenges: string[]
  target_scenarios: string[]
  proficiency_level: number | null
  onboarding_completed: boolean
  is_admin: boolean
  created_at: string
  updated_at: string
}

export interface Vocabulary {
  id: string
  word: string
  part_of_speech: 'noun' | 'verb' | 'adjective' | 'adverb' | 'phrase' | null
  difficulty: number
  scenario_tags: string[]
  definition_en: string | null
  definition_zh: string | null
  example_sentence: string | null
  audio_url: string | null
}

export interface CharadesSession {
  id: string
  user_id: string
  session_date: string
  mode: 'user_describes' | 'ai_describes'
  word_id: string | null
  attempts: number
  guessed_correctly: boolean
  transcript: Array<{ role: string; content: string }>
  grammar_feedback: unknown
  stars: number
  created_at: string
}

export interface ScenarioVideo {
  id: string
  youtube_url: string
  youtube_video_id: string
  title: string
  scenario_type: string
  duration_seconds: number | null
  recommended_frameworks: string[]
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  transcript: string | null
  thumbnail_url: string | null
  published: boolean
}
