-- =====================================================
-- listening_dialogues: 加入 shadowing 練習欄位
-- 存前 30 秒 (從 youtube_start_seconds 起算) 的逐字稿
-- Created: 2026-09-24
-- =====================================================

alter table public.listening_dialogues
  add column if not exists shadowing_text text;
