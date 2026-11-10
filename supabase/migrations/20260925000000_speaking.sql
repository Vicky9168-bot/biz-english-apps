-- =====================================================
-- Part 3: 商務場景練習 (Speaking with STAR/PREP/SCQA)
-- Created: 2026-09-25
-- =====================================================

-- 場景題庫 (共用資料，無 user 綁定)
create table if not exists public.speaking_scenarios (
  id uuid primary key default gen_random_uuid(),
  title_zh text not null,
  prompt_en text not null,        -- 情境敘述 (英文，面對面模擬)
  context_zh text,                -- 中文背景說明
  framework text not null check (framework in ('STAR', 'PREP', 'SCQA')),
  framework_hint_zh text not null, -- 框架應用提示 (該情境如何套用)
  difficulty int not null default 2 check (difficulty between 1 and 5),
  tags text[] default array[]::text[],
  created_at timestamptz not null default now()
);

-- RLS: 所有登入者可讀
alter table public.speaking_scenarios enable row level security;
drop policy if exists "auth_read_scenarios" on public.speaking_scenarios;
create policy "auth_read_scenarios" on public.speaking_scenarios
  for select
  to authenticated
  using (true);

-- 種子資料 (2 per framework)
insert into public.speaking_scenarios (title_zh, prompt_en, context_zh, framework, framework_hint_zh, difficulty, tags) values

-- STAR: 過去經驗、行為題
('跟老闆報告本季 KPI 落後',
 'Your quarterly revenue target was 20% off. In our 1-on-1 today, walk me through what happened and what you did about it.',
 '直屬主管請你解釋本季業績為何未達標。用 STAR 完整說明情境、任務、行動、結果。',
 'STAR',
 'S: 這一季的市場/團隊狀況 · T: 你負責什麼、目標多少 · A: 你採取哪 2–3 個具體行動 · R: 最後結果(數字)+ 學到什麼',
 3, array['management', 'accountability']),

('面試官問你怎麼處理跨部門衝突',
 'Tell me about a time when you disagreed with another department on priorities. How did you handle it?',
 '面試常見題。用 STAR 說一個實際例子，不要空泛。',
 'STAR',
 'S: 是哪個部門、什麼專案 · T: 你要達成什麼、對方為何反對 · A: 你怎麼溝通、找到共識 · R: 最後結果 + 你學到的溝通原則',
 3, array['interview', 'conflict']),

-- PREP: 意見表達、pitch
('說服團隊採用新工具',
 'I noticed our team is still tracking tasks in three different tools. What do you think about consolidating everything into one platform?',
 '同事問你對於整合工具鏈的看法。用 PREP 表達清楚立場。',
 'PREP',
 'P: 明確立場 (支持/反對整合) · R: 1–2 個核心理由 · E: 一個具體場景或數據 · P: 重申立場 + 建議下一步',
 2, array['opinion', 'tooling']),

('面試官問「你覺得什麼是好的 leader」',
 'Everyone defines leadership differently. What''s your definition of a great leader, and why?',
 '開放性問題。用 PREP 給結構化回答，不要流水帳。',
 'PREP',
 'P: 一句話定義好 leader · R: 為什麼是這個定義 · E: 舉一個你觀察過或親身經歷的例子 · P: 呼應開頭 + 你想成為這樣的 leader',
 2, array['interview', 'leadership']),

-- SCQA: 說服、提案
('跟高層 pitch 進軍東南亞市場',
 'You have 3 minutes with our CEO. Convince her that we should expand into Southeast Asia next year.',
 '有 3 分鐘的電梯時間。用 SCQA 讓 CEO 記住核心 insight。',
 'SCQA',
 'S: 我們目前在成熟市場的現況 · C: 遇到什麼瓶頸/威脅 · Q: 該怎麼解 · A: 東南亞是答案(給 1–2 個為什麼)',
 4, array['pitch', 'strategy']),

('提案改採 remote-first 工作模式',
 'You want to propose that our team goes remote-first. HR is skeptical. Make your case.',
 '面對懷疑的 HR。用 SCQA 建立共識再給方案。',
 'SCQA',
 'S: 目前團隊工作模式 · C: 遇到什麼問題 (招募/效率/成本) · Q: 該怎麼辦 · A: Remote-first + 你會怎麼緩解 HR 擔心的部分',
 4, array['proposal', 'workplace'])

on conflict do nothing;
