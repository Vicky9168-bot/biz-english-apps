-- =====================================================
-- 每日商業閱讀:使用者自己收藏的文章(原本「往期文章」列出所有日期的文章)
-- 文章本身仍是全站共用;這張表只記每個人收藏了哪幾篇。
-- Created: 2026-11-21
-- =====================================================

create table if not exists public.reading_saved_articles (
  user_id uuid not null references auth.users(id) on delete cascade,
  article_id uuid not null references public.reading_articles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, article_id)
);

create index if not exists idx_reading_saved_articles_user
  on public.reading_saved_articles(user_id, created_at desc);

alter table public.reading_saved_articles enable row level security;
drop policy if exists "own_read_saved_articles" on public.reading_saved_articles;
create policy "own_read_saved_articles" on public.reading_saved_articles
  for select to authenticated using (auth.uid() = user_id);
drop policy if exists "own_insert_saved_articles" on public.reading_saved_articles;
create policy "own_insert_saved_articles" on public.reading_saved_articles
  for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "own_delete_saved_articles" on public.reading_saved_articles;
create policy "own_delete_saved_articles" on public.reading_saved_articles
  for delete to authenticated using (auth.uid() = user_id);
