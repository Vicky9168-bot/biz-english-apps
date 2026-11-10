-- 口說練習紀錄：計入打卡、本月學習分鐘與成就頁
create table public.speaking_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  scenario_id uuid references public.speaking_scenarios(id) on delete set null,
  session_date date not null default current_date,
  title_zh text not null,
  framework text not null,
  transcript text not null,
  framework_score int,
  vocab_score int,
  grammar_score int,
  fluency_score int,
  avg_score int,
  feedback jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index speaking_sessions_user_date_idx
  on public.speaking_sessions(user_id, session_date);

alter table public.speaking_sessions enable row level security;

create policy "speaking_sessions_own_read"
  on public.speaking_sessions for select
  to authenticated
  using (user_id = auth.uid());

create policy "speaking_sessions_own_insert"
  on public.speaking_sessions for insert
  to authenticated
  with check (user_id = auth.uid());
