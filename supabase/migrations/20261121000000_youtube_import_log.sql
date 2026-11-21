-- =====================================================
-- 使用者自己貼 YouTube 連結匯入影片:每人每天次數限制用的紀錄
-- 只記「真的花了 token 的匯入」;題庫已有的影片不記。
-- 寫入一律走 service role(API route),使用者只能讀自己的紀錄(顯示剩餘次數)。
-- Created: 2026-11-21
-- =====================================================

create table if not exists public.youtube_import_log (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  youtube_video_id text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists youtube_import_log_user_created_idx
  on public.youtube_import_log(user_id, created_at desc);

alter table public.youtube_import_log enable row level security;
create policy "youtube_import_log_select_own"
  on public.youtube_import_log for select
  to authenticated
  using (auth.uid() = user_id);
