-- =====================================================
-- Part 2 聽力訓練 - Schema
-- Created: 2026-09-22
-- listening_dialogues: GPT 生成的商務對話+題目,可跨使用者重用
-- listening_sessions: 每日答題紀錄
-- =====================================================

create table public.listening_dialogues (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  scenario text not null check (scenario in ('meeting', 'client_call', 'presentation_qa', 'small_talk', 'negotiation')),
  difficulty int check (difficulty between 1 and 5) default 3,
  script jsonb not null,          -- [{"speaker":"Alice","text":"..."}, ...]
  questions jsonb not null,       -- [{"q":"...","options":["A","B","C","D"],"answer_idx":2,"explanation_zh":"..."}]
  audio_url text,                 -- 首次播放時 lazy 生 TTS,存 supabase storage URL
  scenario_tags text[] default '{}',
  created_at timestamptz default timezone('utc', now())
);

create index listening_dialogues_scenario_idx on public.listening_dialogues(scenario);
create index listening_dialogues_difficulty_idx on public.listening_dialogues(difficulty);

-- 對話內容公開讀(所有登入使用者共用題庫),寫由 service role 處理
alter table public.listening_dialogues enable row level security;
create policy "dialogues_readable_authenticated"
  on public.listening_dialogues for select
  to authenticated
  using (true);

-- =====================================================
-- listening_sessions
-- =====================================================
create table public.listening_sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  dialogue_id uuid not null references public.listening_dialogues(id) on delete cascade,
  session_date date not null default current_date,
  answers jsonb not null,         -- [{"q_idx":0,"chosen_idx":2,"correct":true}, ...]
  score int not null,
  total int not null,
  created_at timestamptz default timezone('utc', now())
);

create index listening_sessions_user_date_idx
  on public.listening_sessions(user_id, session_date);

alter table public.listening_sessions enable row level security;

create policy "listening_sessions_own_read"
  on public.listening_sessions for select
  to authenticated
  using (user_id = auth.uid());

create policy "listening_sessions_own_insert"
  on public.listening_sessions for insert
  to authenticated
  with check (user_id = auth.uid());
