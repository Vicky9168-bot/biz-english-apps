-- =====================================================
-- Part 3: 新增兩個商業場景框架
--   DIA (Data → Insight → Action): 數據分析簡報
--   VTC (Value → Trade → Close):   業務談判
-- Created: 2026-11-21
-- 可重複執行：CHECK 先刪再建；題目用 title_zh 判斷是否已存在，不會重複寫入。
-- =====================================================

alter table public.speaking_scenarios
  drop constraint if exists speaking_scenarios_framework_check;
alter table public.speaking_scenarios
  add constraint speaking_scenarios_framework_check
  check (framework in ('STAR', 'PREP', 'SCQA', 'PYRAMID', 'DIA', 'VTC'));

insert into public.speaking_scenarios (title_zh, prompt_en, context_zh, framework, framework_hint_zh, difficulty, tags)
select v.title_zh, v.prompt_en, v.context_zh, v.framework, v.framework_hint_zh, v.difficulty, v.tags
from (values

-- DIA: 數據分析簡報
('向主管說明這季流失率分析',
 'Walk me through what the numbers say about customer churn last quarter. What did you find, and what should we do?',
 '主管想聽你的分析結論，不想看你把圖表念一遍。用 DIA 從數據講到建議。',
 'DIA',
 'D: 你看了哪個指標、哪段期間、跟誰比 · I: 最重要的 1–2 個發現與原因（從 X 到 Y） · A: 建議做什麼、誰負責、何時看到成效',
 3, array['analytics', 'kpi']),

('解釋為什麼流量成長但業績沒成長',
 'Website traffic is up 30% this quarter, but sales are flat. Can you explain what the data shows?',
 '客戶或主管對一組矛盾的數字提出疑問。用 DIA 說明你看了什麼、發現什麼、建議怎麼做。',
 'DIA',
 'D: 比較了哪些指標與期間（流量 vs 成交，依管道拆開） · I: 差距出在哪個環節、可能原因 · A: 要調整哪個預算或流程，多久後再檢視',
 3, array['analytics', 'marketing']),

('向產品團隊報告 A/B 測試結果',
 'You ran an A/B test on the checkout page. Present the results to the product team and tell us what to do next.',
 '測試結束，要對產品團隊報告結果。用 DIA 講清楚數據、結論和下一步。',
 'DIA',
 'D: 測了什麼、樣本數、測試多久 · I: 哪一組贏、差多少、統計上可不可信 · A: 要不要全面上線、還要追蹤什麼',
 2, array['analytics', 'product']),

('解釋 dashboard 上的異常波動',
 'Our dashboard shows an unusual spike in refund requests last week. What happened, and what should we do about it?',
 '主管看到 dashboard 上的異常數字來問你。用 DIA 說明你查了什麼、原因、建議的處理。',
 'DIA',
 'D: 看了哪段時間、哪些資料來源，跟平常差多少 · I: 異常集中在哪裡、最可能的原因 · A: 立即處理 + 後續防止再發生的做法',
 4, array['analytics', 'operations'])

, -- VTC: 業務談判
('客戶要求跟競爭對手同價',
 'Your price is 15% higher than your competitor''s. Can you match it?',
 '客戶拿競爭對手的報價來殺價。用 VTC 先守住價值，再用條件交換讓步。',
 'VTC',
 'V: 先重申對客戶的價值（用客戶在乎的結果與數字），不急著談價格 · T: 用「If you..., then I can...」條件交換，每個讓步都換回承諾 · C: 複述談好的條件，確認下一步與期限',
 3, array['sales', 'pricing']),

('客戶預算被砍，要求續約減半',
 'We love the product, but our budget got cut this year. Can you cut the renewal fee in half?',
 '老客戶續約時預算吃緊。用 VTC 守住價值、換到更長的承諾或其他回報。',
 'VTC',
 'V: 回顧這一年帶來的具體成果 · T: 不直接減半，用「如果你改年繳／當案例客戶，我可以...」交換 · C: 複述條件並約定簽約期限',
 4, array['sales', 'renewal']),

('客戶要求把付款期限延到 90 天',
 'We need 90-day payment terms instead of 30. Is that something you can do?',
 '客戶要求延長付款條件。用 VTC 不直接答應，把讓步換成對你有利的條件。',
 'VTC',
 'V: 先確認雙方合作的價值與信任 · T: 「If you can..., then I can...」例如縮短到 60 天換較大的訂單量或預付一部分 · C: 複述新的付款條件，確認誰來發文件、何時完成',
 3, array['sales', 'payment-terms']),

('客戶簽約前要求加送服務',
 'We are ready to sign, but we would like you to throw in free onboarding and premium support. Can you do that?',
 '成交前最後一刻客戶多要條件。用 VTC 避免白送，並把成交時間確定下來。',
 'VTC',
 'V: 說明這些服務的實際價值，不是免費附贈 · T: 「If you sign this week, then I can include...」用簽約時間或合約期換取讓步 · C: 複述包含的項目，約定簽約日期',
 2, array['sales', 'closing'])

) as v(title_zh, prompt_en, context_zh, framework, framework_hint_zh, difficulty, tags)
where not exists (
  select 1 from public.speaking_scenarios s where s.title_zh = v.title_zh
);
