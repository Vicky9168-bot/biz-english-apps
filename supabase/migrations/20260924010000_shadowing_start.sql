-- =====================================================
-- listening_dialogues: shadowing 起點對齊
-- 因為影片可能開頭一段沒有語音,存實際第一段有語音的秒數
-- Created: 2026-09-24
-- =====================================================

alter table public.listening_dialogues
  add column if not exists shadowing_start_seconds int;
