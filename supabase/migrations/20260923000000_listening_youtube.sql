-- =====================================================
-- listening_dialogues: 支援 YouTube 影片來源
-- Created: 2026-09-23
-- =====================================================

alter table public.listening_dialogues
  add column if not exists source_type text not null default 'ai_dialogue'
    check (source_type in ('ai_dialogue', 'youtube')),
  add column if not exists youtube_video_id text,
  add column if not exists youtube_start_seconds int default 0,
  add column if not exists summary_zh text;

-- 放寬 script(YouTube 來源不需要 script)
alter table public.listening_dialogues
  alter column script drop not null;

-- 放寬 scenario check 支援 'video'
alter table public.listening_dialogues
  drop constraint if exists listening_dialogues_scenario_check;
alter table public.listening_dialogues
  add constraint listening_dialogues_scenario_check
  check (scenario in ('meeting', 'client_call', 'presentation_qa', 'small_talk', 'negotiation', 'video'));

-- 避免同一支影片重複匯入
create unique index if not exists listening_dialogues_youtube_unique
  on public.listening_dialogues(youtube_video_id)
  where youtube_video_id is not null;
