-- =====================================================
-- 每日商業閱讀：每天每個類別一篇文章 + 使用者生字本
-- Created: 2026-11-16
-- =====================================================

-- 文章由後端（service role）生成後寫入，使用者只能讀
create table if not exists public.reading_articles (
  id uuid primary key default gen_random_uuid(),
  article_date date not null,
  category text not null check (category in ('finance','marketing','ai','tech','world')),
  title text not null,
  paragraphs jsonb not null,            -- [{ "en": "...", "zh": "..." }]
  summary_zh text not null,
  takeaways_zh text[] not null default array[]::text[],
  key_words jsonb not null,             -- [{ word, pos, meaning_zh, meaning_en, example_en }]
  created_at timestamptz not null default now(),
  unique (article_date, category)
);

create index if not exists idx_reading_articles_date on public.reading_articles(article_date desc);

-- 使用者存下來的單字（同一個字每人只存一筆）
create table if not exists public.reading_saved_words (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  word text not null,                   -- 小寫原形
  surface_form text,                    -- 文章裡實際出現的樣子，練習挖空用
  pos text,
  meaning_zh text not null,
  meaning_en text,
  example_en text,
  context_sentence text,
  article_id uuid references public.reading_articles(id) on delete set null,
  correct_count int not null default 0,
  wrong_count int not null default 0,
  last_practiced_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, word)
);

create index if not exists idx_reading_saved_words_user on public.reading_saved_words(user_id, created_at desc);

-- RLS
alter table public.reading_articles enable row level security;
drop policy if exists "auth_read_reading_articles" on public.reading_articles;
create policy "auth_read_reading_articles" on public.reading_articles
  for select to authenticated using (true);

alter table public.reading_saved_words enable row level security;
drop policy if exists "own_read_saved_words" on public.reading_saved_words;
create policy "own_read_saved_words" on public.reading_saved_words
  for select to authenticated using (auth.uid() = user_id);
drop policy if exists "own_insert_saved_words" on public.reading_saved_words;
create policy "own_insert_saved_words" on public.reading_saved_words
  for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "own_update_saved_words" on public.reading_saved_words;
create policy "own_update_saved_words" on public.reading_saved_words
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "own_delete_saved_words" on public.reading_saved_words;
create policy "own_delete_saved_words" on public.reading_saved_words
  for delete to authenticated using (auth.uid() = user_id);
