-- =====================================================
-- Part 2: 加 3 部 TED 演講作觀點延伸 (純觀看模式，無題目)
-- Created: 2026-09-29
-- =====================================================

insert into public.listening_dialogues (
  title, scenario, difficulty, script, questions,
  source_type, youtube_video_id, youtube_start_seconds, summary_zh, scenario_tags
) values
(
  'Adam Grant · The surprising habits of original thinkers',
  'video', 3, null, '[]'::jsonb,
  'youtube', 'fxbCHn6gE3U', 30,
  'TED · 華頓商學院教授 Adam Grant 拆解「原創思考者」的行為模式，為什麼適度拖延反而能讓創意變好、多失敗不代表產出差。適合練習聽論點型英文 + 抓 supporting evidence。',
  array['TED','creativity','innovation','mindset']
),
(
  'Angela Duckworth · Grit: The Power of Passion and Perseverance',
  'video', 3, null, '[]'::jsonb,
  'youtube', 'H14bBuluwB8', 68,
  'TED 經典 · Angela Duckworth 解釋為什麼「恆毅力(Grit)」比 IQ 或天賦更能預測長期成就。語速中等、論點清晰，適合練習抓 thesis + example 對照。',
  array['TED','grit','perseverance','mindset']
),
(
  'Mustafa Suleyman · What Is an AI Anyway?',
  'video', 4, null, '[]'::jsonb,
  'youtube', 'KKNCiRWd_j0', 0,
  'DeepMind 共同創辦人 Mustafa Suleyman 在 TED 用日常語言解釋「AI 到底是什麼」以及對未來工作的影響。適合 AI 時代商務人士掌握 tech + business 交叉語彙。',
  array['TED','AI','future-of-work','tech']
)
on conflict (youtube_video_id) where youtube_video_id is not null do nothing;
