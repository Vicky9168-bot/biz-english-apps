-- =====================================================
-- 比手畫腳「用我的生字玩」：練習紀錄可以指向 user_words
--
-- charades_sessions.word_id 只能指向固定詞庫 vocabulary，
-- 所以另加 user_word_id 指向「我的單字本」；兩者最多只會有一個有值。
-- 用自己的字練習不計入排行榜（字是自己選的，難度不一，會失去公平），
-- 用 from_user_words 標記，即使之後把字從單字本刪掉，紀錄也不會變成計分。
--
-- 前置條件：20261116020000_user_words.sql 已執行。
-- Created: 2026-11-16
-- =====================================================

begin;

alter table public.charades_sessions
  add column if not exists user_word_id uuid references public.user_words(id) on delete set null,
  add column if not exists from_user_words boolean not null default false;

alter table public.charades_sessions drop constraint if exists charades_sessions_one_word_ref;
alter table public.charades_sessions
  add constraint charades_sessions_one_word_ref
  check (word_id is null or user_word_id is null);

create index if not exists charades_user_userword_idx
  on public.charades_sessions(user_id, user_word_id);

-- 排行榜：只算固定詞庫的練習（內容與 20261110000000_leaderboard_nickname.sql 相同，多一個條件）
drop view if exists public.leaderboard_weekly;
drop view if exists public.leaderboard_monthly;

create view public.leaderboard_weekly as
select
  row_number() over (order by score desc) as rank,
  display_name, total_stars, active_days, total_sessions, score
from (
  select
    coalesce(nullif(btrim(up.nickname), ''),
             'Learner #' || substr(md5(cs.user_id::text), 1, 4)) as display_name,
    sum(cs.stars) as total_stars,
    count(distinct cs.session_date) as active_days,
    count(*) as total_sessions,
    (sum(cs.stars) * 10 + count(distinct cs.session_date) * 5) as score
  from public.charades_sessions cs
  left join public.user_profiles up on up.user_id = cs.user_id
  where cs.session_date >= (timezone('utc', now()))::date - interval '7 days'
    and not cs.from_user_words
  group by cs.user_id, up.nickname
) t;

create view public.leaderboard_monthly as
select
  row_number() over (order by score desc) as rank,
  display_name, total_stars, active_days, total_sessions, score
from (
  select
    coalesce(nullif(btrim(up.nickname), ''),
             'Learner #' || substr(md5(cs.user_id::text), 1, 4)) as display_name,
    sum(cs.stars) as total_stars,
    count(distinct cs.session_date) as active_days,
    count(*) as total_sessions,
    (sum(cs.stars) * 10 + count(distinct cs.session_date) * 5) as score
  from public.charades_sessions cs
  left join public.user_profiles up on up.user_id = cs.user_id
  where cs.session_date >= (timezone('utc', now()))::date - interval '30 days'
    and not cs.from_user_words
  group by cs.user_id, up.nickname
) t;

revoke all on public.leaderboard_weekly  from anon;
revoke all on public.leaderboard_monthly from anon;
grant select on public.leaderboard_weekly  to authenticated;
grant select on public.leaderboard_monthly to authenticated;

notify pgrst, 'reload schema';

commit;
