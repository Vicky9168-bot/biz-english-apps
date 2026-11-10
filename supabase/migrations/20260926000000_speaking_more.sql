-- =====================================================
-- Part 3: 追加場景 (每個框架至少 4 題)
-- Created: 2026-09-26
-- =====================================================

-- Add unique constraint to allow idempotent seeding by title
do $$ begin
  alter table public.speaking_scenarios
    add constraint speaking_scenarios_title_unique unique (title_zh);
exception when duplicate_object then null;
end $$;

insert into public.speaking_scenarios (title_zh, prompt_en, context_zh, framework, framework_hint_zh, difficulty, tags) values

-- STAR: 再加 2 題
('面試官請你 60 秒自我介紹',
 'Let''s start with a quick intro — walk me through your background and why you''re excited about this role.',
 '面試開場 60 秒自介。用 STAR 講一個代表性成就，不要念履歷。',
 'STAR',
 'S: 你所在的環境/角色 · T: 你當時的挑戰或目標 · A: 你做了什麼(選 1 個亮點) · R: 具體結果 + 為什麼這個經驗連結到這個 role',
 2, array['interview', 'self-intro']),

('專案沒達標，主管請你檢討',
 'The launch didn''t hit the numbers we hoped. Talk me through what went wrong and what you''d do differently.',
 '主管請你自我檢討。誠實但有結構，重點在學到什麼。',
 'STAR',
 'S: 專案背景 + 原本目標 · T: 你負責哪部分 · A: 事後你採取哪些補救/複盤動作 · R: 實際結果 + 你會怎麼調整下一次',
 3, array['retrospective', 'ownership']),

-- PREP: 再加 2 題
('主管問你怎麼看團隊加班文化',
 'I''ve noticed the team stays late a lot. What''s your take — is this a problem?',
 '主管想聽你觀察。用 PREP 給有立場但不情緒化的回答。',
 'PREP',
 'P: 你的判斷 (是/不是問題) · R: 為什麼 · E: 你觀察到的具體現象/影響 · P: 建議下一步',
 3, array['opinion', 'culture']),

('要不要讓 junior 主導客戶專案',
 'Should we let Alex, one of our juniors, lead the next customer project? What do you think?',
 '主管徵詢你意見。用 PREP 給結構化建議。',
 'PREP',
 'P: 支持/反對/有條件支持 · R: 主要理由 · E: 舉一個 Alex 的具體表現或類似案例 · P: 重申立場 + 你會怎麼配套 (mentor / 分工)',
 3, array['management', 'decision']),

-- SCQA: 再加 2 題
('說服 CTO 加聘兩位資深工程師',
 'You have 5 minutes with the CTO. Convince him we need to hire two more senior engineers next quarter.',
 '面對重視 ROI 的技術長。用 SCQA 建立急迫感再提解法。',
 'SCQA',
 'S: 目前工程團隊產出/結構現況 · C: 遇到什麼瓶頸 (交付延遲/技術債) · Q: 是不是該加人 · A: 是，加 2 位 senior + 為什麼是 senior 不是 junior',
 4, array['pitch', 'hiring']),

('提案砍掉一個舊產品線',
 'You want to propose sunsetting our legacy product line. Sales will push back. Make your case to leadership.',
 '面對會反對的 sales team。用 SCQA 建立共識再給方案。',
 'SCQA',
 'S: 該產品線目前的位置 (營收/用戶) · C: 面臨什麼 (維護成本/機會成本/客戶流失) · Q: 是不是該止血 · A: sunset + 遷移計畫 + 你會怎麼緩解 sales 顧慮',
 4, array['strategy', 'tough-decision'])

on conflict (title_zh) do nothing;
