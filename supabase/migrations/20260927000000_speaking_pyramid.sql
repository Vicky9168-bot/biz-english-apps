-- =====================================================
-- Part 3: 新增 Pyramid Principle 框架 (McKinsey exec 溝通)
-- Created: 2026-09-27
-- =====================================================

-- 放寬 CHECK 讓 PYRAMID 也合法
alter table public.speaking_scenarios
  drop constraint if exists speaking_scenarios_framework_check;
alter table public.speaking_scenarios
  add constraint speaking_scenarios_framework_check
  check (framework in ('STAR', 'PREP', 'SCQA', 'PYRAMID'));

insert into public.speaking_scenarios (title_zh, prompt_en, context_zh, framework, framework_hint_zh, difficulty, tags) values

-- PYRAMID: 答案先行 · Exec 溝通
('CEO 電梯裡問 project status',
 'Quick update — how''s the platform migration going? Give me the headline.',
 'CEO 只有 30 秒。用 Pyramid: 結論先講，再 3 個支撐，細節放最後。',
 'PYRAMID',
 '結論一句話 (on track / at risk / delayed) · 3 個支撐 (時程 / 預算 / 風險) · 每個給 1 句數據佐證',
 3, array['exec-update', 'status']),

('週會開場報告本週最重要一件事',
 'You''re kicking off our weekly leadership sync. What''s the one thing we all need to know from your team this week?',
 '只有 60 秒開場。用 Pyramid 讓大家記住核心訊息。',
 'PYRAMID',
 '一句話 headline (最重要的那件事) · 3 個 why it matters · 每個給 1 個數據或 anecdote',
 3, array['standup', 'priority']),

('主管問你怎麼看上季預算超支',
 'We overshot budget by 18% last quarter. What''s your read on it?',
 '主管想聽你的判斷，不要流水帳。用 Pyramid 給答案先行的結構化 read。',
 'PYRAMID',
 '一句話結論 (可控/不可控/一次性) · 3 個主因 (排序:影響最大到最小) · 每個給 1 個數字或事件',
 4, array['exec-update', 'analysis']),

('客戶 CFO 問你為什麼該續約',
 'We''re deciding whether to renew our contract with you. In one minute — why should we?',
 '客戶 CFO 只想聽重點。用 Pyramid: 明確 recommendation 開場。',
 'PYRAMID',
 '一句話結論 (推薦續約 + 一句 why) · 3 個核心價值 (ROI / 風險降低 / 未來性) · 每個給 1 個具體證據 (數字或案例)',
 4, array['pitch', 'retention'])

on conflict (title_zh) do nothing;
