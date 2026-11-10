-- =====================================================
-- 追加欄位:紀錄使用者是否完成 Content Words 預備課
-- Created: 2026-09-22
-- =====================================================

alter table public.user_profiles
  add column if not exists content_words_lesson_completed_at timestamptz;
