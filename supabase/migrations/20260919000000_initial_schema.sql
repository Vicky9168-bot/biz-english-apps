-- =====================================================
-- 商務英語學習網站 - 初始 Schema
-- Created: 2026-09-19
-- 對應設計文件: docs/plans/2026-09-15-english-biz-learning-app-design.md
-- =====================================================

-- 啟用 UUID 擴充
create extension if not exists "uuid-ossp";

-- =====================================================
-- 通用 updated_at trigger
-- =====================================================
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$ language plpgsql;

-- =====================================================
-- 1. user_profiles：使用者背景（Onboarding）
-- =====================================================
create table public.user_profiles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid unique not null references auth.users(id) on delete cascade,
  job_title text,
  industry text,
  seniority_level text,
  english_challenges text[] default '{}',
  target_scenarios text[] default '{}',
  proficiency_level int check (proficiency_level between 1 and 5),
  onboarding_completed boolean default false,
  is_admin boolean default false,
  created_at timestamptz default timezone('utc', now()),
  updated_at timestamptz default timezone('utc', now())
);

create trigger user_profiles_updated_at
  before update on public.user_profiles
  for each row execute function public.set_updated_at();

-- 新用戶註冊時自動建立 profile
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.user_profiles (user_id) values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =====================================================
-- 2. vocabulary：Part 1 單字題庫
-- =====================================================
create table public.vocabulary (
  id uuid primary key default uuid_generate_v4(),
  word text unique not null,
  part_of_speech text check (part_of_speech in ('noun', 'verb', 'adjective', 'adverb', 'phrase')),
  difficulty int check (difficulty between 1 and 5) default 3,
  scenario_tags text[] default '{}',
  definition_en text,
  definition_zh text,
  example_sentence text,
  audio_url text,
  created_at timestamptz default timezone('utc', now())
);

create index vocabulary_difficulty_idx on public.vocabulary(difficulty);
create index vocabulary_scenario_tags_idx on public.vocabulary using gin(scenario_tags);

-- =====================================================
-- 3. charades_sessions：Part 1 練習紀錄
-- =====================================================
create table public.charades_sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_date date not null default (timezone('utc', now()))::date,
  mode text check (mode in ('user_describes', 'ai_describes')) not null,
  word_id uuid references public.vocabulary(id) on delete set null,
  attempts int default 0,
  guessed_correctly boolean default false,
  transcript jsonb default '[]',
  grammar_feedback jsonb,
  stars int check (stars between 0 and 3) default 0,
  created_at timestamptz default timezone('utc', now())
);

create index charades_user_date_idx on public.charades_sessions(user_id, session_date);
create index charades_user_word_idx on public.charades_sessions(user_id, word_id);

-- =====================================================
-- 4. listening_sessions：Part 2 聽力練習
-- =====================================================
create table public.listening_sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  scenario text not null,
  script jsonb not null,
  audio_url text,
  question_types text[] not null,
  questions jsonb not null,
  user_answers jsonb,
  score int check (score between 0 and 100),
  feedback jsonb,
  created_at timestamptz default timezone('utc', now())
);

create index listening_user_created_idx on public.listening_sessions(user_id, created_at desc);

-- =====================================================
-- 5. scenario_videos：Part 3 策展影片庫
-- =====================================================
create table public.scenario_videos (
  id uuid primary key default uuid_generate_v4(),
  youtube_url text unique not null,
  youtube_video_id text unique not null,
  title text not null,
  scenario_type text not null,
  duration_seconds int,
  recommended_frameworks text[] default '{}',
  difficulty text check (difficulty in ('beginner', 'intermediate', 'advanced')) default 'intermediate',
  transcript text,
  thumbnail_url text,
  published boolean default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default timezone('utc', now()),
  updated_at timestamptz default timezone('utc', now())
);

create trigger scenario_videos_updated_at
  before update on public.scenario_videos
  for each row execute function public.set_updated_at();

create index scenario_videos_published_idx on public.scenario_videos(published) where published = true;
create index scenario_videos_type_idx on public.scenario_videos(scenario_type);

-- =====================================================
-- 6. scenario_questions：Part 3 影片配題
-- =====================================================
create table public.scenario_questions (
  id uuid primary key default uuid_generate_v4(),
  video_id uuid not null references public.scenario_videos(id) on delete cascade,
  question_text text not null,
  target_framework text not null,
  reference_answer text,
  evaluation_rubric jsonb,
  order_index int default 0,
  created_at timestamptz default timezone('utc', now())
);

create index scenario_questions_video_idx on public.scenario_questions(video_id, order_index);

-- =====================================================
-- 7. scenario_responses：Part 3 學員回答
-- =====================================================
create table public.scenario_responses (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id uuid not null references public.scenario_questions(id) on delete cascade,
  framework_used text not null,
  audio_url text,
  transcript text,
  ai_evaluation jsonb,
  score_breakdown jsonb,
  overall_score int check (overall_score between 0 and 100),
  created_at timestamptz default timezone('utc', now())
);

create index scenario_responses_user_idx on public.scenario_responses(user_id, created_at desc);

-- =====================================================
-- 8. Leaderboard View（Part 1 週榜 / 月榜）
-- =====================================================
create or replace view public.leaderboard_weekly as
select
  cs.user_id,
  up.job_title,
  up.industry,
  sum(cs.stars) as total_stars,
  count(distinct cs.session_date) as active_days,
  count(*) as total_sessions,
  (sum(cs.stars) * 10 + count(distinct cs.session_date) * 5) as score
from public.charades_sessions cs
left join public.user_profiles up on up.user_id = cs.user_id
where cs.session_date >= (timezone('utc', now()))::date - interval '7 days'
group by cs.user_id, up.job_title, up.industry
order by score desc;

create or replace view public.leaderboard_monthly as
select
  cs.user_id,
  up.job_title,
  up.industry,
  sum(cs.stars) as total_stars,
  count(distinct cs.session_date) as active_days,
  count(*) as total_sessions,
  (sum(cs.stars) * 10 + count(distinct cs.session_date) * 5) as score
from public.charades_sessions cs
left join public.user_profiles up on up.user_id = cs.user_id
where cs.session_date >= (timezone('utc', now()))::date - interval '30 days'
group by cs.user_id, up.job_title, up.industry
order by score desc;

-- =====================================================
-- Row Level Security (RLS)
-- =====================================================
alter table public.user_profiles enable row level security;
alter table public.vocabulary enable row level security;
alter table public.charades_sessions enable row level security;
alter table public.listening_sessions enable row level security;
alter table public.scenario_videos enable row level security;
alter table public.scenario_questions enable row level security;
alter table public.scenario_responses enable row level security;

-- user_profiles: 自己讀寫自己
create policy "users read own profile"
  on public.user_profiles for select using (auth.uid() = user_id);
create policy "users update own profile"
  on public.user_profiles for update using (auth.uid() = user_id);

-- vocabulary: 全部登入者可讀，只有 admin 可寫（先簡化：service_role 才可寫）
create policy "authenticated read vocabulary"
  on public.vocabulary for select using (auth.role() = 'authenticated');

-- charades_sessions: 自己讀寫自己
create policy "users read own charades"
  on public.charades_sessions for select using (auth.uid() = user_id);
create policy "users insert own charades"
  on public.charades_sessions for insert with check (auth.uid() = user_id);
create policy "users update own charades"
  on public.charades_sessions for update using (auth.uid() = user_id);

-- listening_sessions: 自己讀寫自己
create policy "users read own listening"
  on public.listening_sessions for select using (auth.uid() = user_id);
create policy "users insert own listening"
  on public.listening_sessions for insert with check (auth.uid() = user_id);
create policy "users update own listening"
  on public.listening_sessions for update using (auth.uid() = user_id);

-- scenario_videos: 全部登入者可讀「已發佈」的，admin 可寫
create policy "authenticated read published videos"
  on public.scenario_videos for select
  using (auth.role() = 'authenticated' and published = true);
create policy "admin manage videos"
  on public.scenario_videos for all
  using (exists (
    select 1 from public.user_profiles
    where user_id = auth.uid() and is_admin = true
  ));

-- scenario_questions: 讀取跟隨影片，admin 可寫
create policy "authenticated read questions"
  on public.scenario_questions for select
  using (
    auth.role() = 'authenticated'
    and exists (
      select 1 from public.scenario_videos v
      where v.id = video_id and v.published = true
    )
  );
create policy "admin manage questions"
  on public.scenario_questions for all
  using (exists (
    select 1 from public.user_profiles
    where user_id = auth.uid() and is_admin = true
  ));

-- scenario_responses: 自己讀寫自己
create policy "users read own responses"
  on public.scenario_responses for select using (auth.uid() = user_id);
create policy "users insert own responses"
  on public.scenario_responses for insert with check (auth.uid() = user_id);
