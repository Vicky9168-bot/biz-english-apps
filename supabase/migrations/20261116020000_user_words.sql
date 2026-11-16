-- =====================================================
-- 我的單字本：把 reading_saved_words 改成各來源共用的 user_words
--
-- 概念：
--   user_words          每人每個字一筆（閱讀、影片、比手畫腳…存的字都在這）
--   user_word_contexts  這個字在各處出現的原句；同一個字可累積多個語境
--
-- 前置條件：20261116000000_reading.sql 已執行。
-- 執行順序（程式碼與資料庫）請看部署說明；此檔可重複執行。
-- Created: 2026-11-16
-- =====================================================

begin;

-- 1. 改名（已改過就略過；原本的表不存在代表前置 migration 沒執行）
do $$
begin
  if to_regclass('public.user_words') is null then
    if to_regclass('public.reading_saved_words') is null then
      raise exception 'reading_saved_words 不存在，請先執行 20261116000000_reading.sql';
    end if;
    alter table public.reading_saved_words rename to user_words;
  end if;
end $$;

alter index if exists public.idx_reading_saved_words_user rename to idx_user_words_user;

-- 2. 來源：這個字「最早」是從哪裡存進來的。
--    之後在別處又遇到同一個字，不會改這裡，而是在 user_word_contexts 多一筆語境。
--    先給既有資料預設 'reading'（它們都來自閱讀），再拿掉預設值，
--    之後新增資料一定要明確指定來源，避免漏填被誤標成閱讀。
alter table public.user_words
  add column if not exists source_type text not null default 'reading'
    check (source_type in ('reading', 'video', 'charades', 'manual')),
  add column if not exists source_id uuid;

alter table public.user_words alter column source_type drop default;

comment on column public.user_words.source_type is '最早存入的來源：reading / video / charades / manual';
comment on column public.user_words.source_id is '來源物件的 id（文章、影片…）；不加外鍵，因為會指向不同的表，手動新增則為 null';

create index if not exists idx_user_words_user_source
  on public.user_words(user_id, source_type);

-- 3. 語境表
create table if not exists public.user_word_contexts (
  id uuid primary key default gen_random_uuid(),
  user_word_id uuid not null references public.user_words(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  source_type text not null check (source_type in ('reading', 'video', 'charades', 'manual')),
  source_id uuid,
  sentence text not null,
  surface_form text,                    -- 句子裡實際出現的樣子（有變化形時，挖空要用它）
  created_at timestamptz not null default now(),
  unique (user_word_id, sentence)
);

create index if not exists idx_user_word_contexts_word on public.user_word_contexts(user_word_id);
create index if not exists idx_user_word_contexts_user on public.user_word_contexts(user_id);

-- 4. 搬舊資料：原句與出現形態移進語境表，文章 id 變成 source_id；
--    搬完才刪舊欄位，所以整段包在同一個交易裡，失敗會整個還原。
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'user_words' and column_name = 'article_id'
  ) then
    update public.user_words set source_id = article_id where source_id is null;

    insert into public.user_word_contexts
      (user_word_id, user_id, source_type, source_id, sentence, surface_form)
    select id, user_id, 'reading', article_id, trim(context_sentence), surface_form
    from public.user_words
    where context_sentence is not null and trim(context_sentence) <> ''
    on conflict (user_word_id, sentence) do nothing;

    alter table public.user_words
      drop column article_id,
      drop column context_sentence,
      drop column surface_form;
  end if;
end $$;

-- 5. RLS：政策隨表改名而保留，這裡換成通用的名稱
alter table public.user_words enable row level security;
drop policy if exists "own_read_saved_words" on public.user_words;
drop policy if exists "own_insert_saved_words" on public.user_words;
drop policy if exists "own_update_saved_words" on public.user_words;
drop policy if exists "own_delete_saved_words" on public.user_words;
drop policy if exists "own_read_user_words" on public.user_words;
drop policy if exists "own_insert_user_words" on public.user_words;
drop policy if exists "own_update_user_words" on public.user_words;
drop policy if exists "own_delete_user_words" on public.user_words;
create policy "own_read_user_words" on public.user_words
  for select to authenticated using (auth.uid() = user_id);
create policy "own_insert_user_words" on public.user_words
  for insert to authenticated with check (auth.uid() = user_id);
create policy "own_update_user_words" on public.user_words
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own_delete_user_words" on public.user_words
  for delete to authenticated using (auth.uid() = user_id);

alter table public.user_word_contexts enable row level security;
drop policy if exists "own_read_user_word_contexts" on public.user_word_contexts;
drop policy if exists "own_insert_user_word_contexts" on public.user_word_contexts;
drop policy if exists "own_update_user_word_contexts" on public.user_word_contexts;
drop policy if exists "own_delete_user_word_contexts" on public.user_word_contexts;
create policy "own_read_user_word_contexts" on public.user_word_contexts
  for select to authenticated using (auth.uid() = user_id);
-- 新增語境時，所屬的單字也必須是自己的，避免把語境掛到別人的字底下
create policy "own_insert_user_word_contexts" on public.user_word_contexts
  for insert to authenticated with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.user_words w
      where w.id = user_word_id and w.user_id = auth.uid()
    )
  );
create policy "own_update_user_word_contexts" on public.user_word_contexts
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own_delete_user_word_contexts" on public.user_word_contexts
  for delete to authenticated using (auth.uid() = user_id);

-- 通知 Supabase API 重新讀取資料表結構，新表與關聯才能馬上用在查詢裡
notify pgrst, 'reload schema';

commit;
