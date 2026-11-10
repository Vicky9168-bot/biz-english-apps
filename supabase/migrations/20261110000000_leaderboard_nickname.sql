-- 1) 暱稱欄位：1–20 字，不分大小寫不可重複，可為空
alter table public.user_profiles add column if not exists nickname text;

alter table public.user_profiles
  add constraint user_profiles_nickname_len
  check (nickname is null or char_length(btrim(nickname)) between 1 and 20);

create unique index if not exists user_profiles_nickname_unique
  on public.user_profiles (lower(btrim(nickname)))
  where nickname is not null;

-- 2) 排行榜：不輸出 user_id，只顯示暱稱（未設定者顯示 Learner #xxxx）
--    create or replace view 無法移除欄位，所以先刪再建
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
  group by cs.user_id, up.nickname
) t;

-- 3) 未登入（anon）不可讀，已登入可讀
revoke all on public.leaderboard_weekly  from anon;
revoke all on public.leaderboard_monthly from anon;
grant select on public.leaderboard_weekly  to authenticated;
grant select on public.leaderboard_monthly to authenticated;
