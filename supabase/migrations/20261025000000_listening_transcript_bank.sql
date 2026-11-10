-- =====================================================
-- listening_dialogues: 帶時間點的雙語逐字稿 + 題庫
-- Created: 2026-10-25
-- =====================================================

-- transcript: [{"start":22.7,"end":24.3,"en":"...","zh":"..."}, ...]（秒）
-- question_bank: [{"id":"q01","q":"...","options":["A","B","C","D"],"answer_idx":0,"explanation_zh":"..."}, ...]
alter table public.listening_dialogues
  add column if not exists transcript jsonb,
  add column if not exists question_bank jsonb;
