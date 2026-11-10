-- =====================================================
-- Part 1 單字題庫 Seed - 100 個高頻商用單字
-- Created: 2026-09-19
-- =====================================================

insert into public.vocabulary (word, part_of_speech, difficulty, scenario_tags, definition_en, definition_zh, example_sentence) values

-- 會議 / Meetings (難度 2-3)
('agenda', 'noun', 2, ARRAY['meeting'], 'A list of items to be discussed in a meeting', '會議議程', 'Let''s stick to the agenda and finish on time.'),
('minutes', 'noun', 3, ARRAY['meeting'], 'A written record of what was discussed and decided in a meeting', '會議紀錄', 'Sarah will take the minutes for today''s meeting.'),
('action item', 'noun', 3, ARRAY['meeting'], 'A specific task assigned to someone during a meeting', '待辦事項', 'Each action item should have a clear owner and deadline.'),
('follow up', 'phrase', 2, ARRAY['meeting', 'email'], 'To take additional action after a previous conversation', '後續追蹤', 'I''ll follow up with the client next week.'),
('table', 'verb', 4, ARRAY['meeting'], 'To postpone discussion of a topic', '暫緩討論', 'Let''s table this discussion until we have more data.'),
('sync', 'verb', 2, ARRAY['meeting'], 'A short meeting to align on progress', '同步會議', 'Can we sync tomorrow morning on the launch plan?'),
('align', 'verb', 3, ARRAY['meeting'], 'To reach mutual agreement or understanding', '達成共識', 'We need to align on the project priorities.'),
('recap', 'verb', 3, ARRAY['meeting'], 'To briefly summarize key points', '重點回顧', 'Let me quickly recap what we agreed on.'),
('kick off', 'phrase', 2, ARRAY['meeting'], 'To officially start a project or event', '啟動', 'We''re kicking off the Q4 campaign next Monday.'),
('offline', 'adjective', 3, ARRAY['meeting'], 'To discuss privately outside of a meeting', '會後私下討論', 'Let''s take this offline and discuss it after the meeting.'),

-- 銷售 / Sales
('prospect', 'noun', 3, ARRAY['cold_call', 'sales'], 'A potential customer', '潛在客戶', 'We have three new prospects in the pipeline.'),
('pipeline', 'noun', 3, ARRAY['sales'], 'Deals in various stages of the sales process', '銷售管道', 'Our Q4 pipeline looks stronger than expected.'),
('close', 'verb', 2, ARRAY['sales', 'negotiation'], 'To successfully complete a sale', '成交', 'We closed the deal after three rounds of negotiation.'),
('lead', 'noun', 2, ARRAY['sales'], 'A person or company that shows interest in your product', '銷售線索', 'Marketing generated 200 new leads this month.'),
('quota', 'noun', 3, ARRAY['sales'], 'A sales target one must meet', '業績配額', 'She hit her quarterly quota by the end of November.'),
('upsell', 'verb', 3, ARRAY['sales'], 'To persuade a customer to buy a more expensive version', '升級銷售', 'We should upsell them to the enterprise plan.'),
('churn', 'noun', 4, ARRAY['sales'], 'The rate at which customers stop using a service', '客戶流失', 'Our monthly churn dropped to 2% after the redesign.'),
('touchpoint', 'noun', 4, ARRAY['sales', 'marketing'], 'Any interaction between a customer and a brand', '接觸點', 'Every touchpoint shapes the customer experience.'),

-- 談判 / Negotiation
('negotiate', 'verb', 3, ARRAY['negotiation'], 'To discuss terms in order to reach agreement', '談判', 'Let''s negotiate the payment terms before signing.'),
('leverage', 'noun', 4, ARRAY['negotiation'], 'Something used to gain an advantage', '籌碼', 'Our unique tech gives us leverage in this deal.'),
('concession', 'noun', 4, ARRAY['negotiation'], 'Something you agree to give up during negotiation', '讓步', 'We made a small concession on delivery time.'),
('bottom line', 'phrase', 3, ARRAY['negotiation', 'meeting'], 'The final result or minimum acceptable outcome', '底線 / 最終結論', 'The bottom line is we can''t go below 50k.'),
('walk away', 'phrase', 3, ARRAY['negotiation'], 'To leave a deal without agreement', '走人 / 放棄交易', 'Be ready to walk away if the terms don''t work.'),
('deal breaker', 'noun', 3, ARRAY['negotiation'], 'A condition that would prevent an agreement', '破局關鍵', 'The exclusivity clause is a deal breaker for us.'),
('ballpark', 'adjective', 3, ARRAY['negotiation', 'sales'], 'Approximate figure or estimate', '大略估計', 'Can you give me a ballpark figure for the budget?'),
('haggle', 'verb', 4, ARRAY['negotiation'], 'To argue over the price of something', '討價還價', 'We haggled for hours over the licensing fee.'),
('counter offer', 'noun', 3, ARRAY['negotiation'], 'A response with a different set of terms', '還價', 'They made a counter offer that we can''t ignore.'),

-- 簡報 / Presentation
('pitch', 'verb', 3, ARRAY['presentation', 'sales'], 'To present a product or idea persuasively', '推銷簡報', 'She pitched the new product to a room of investors.'),
('walkthrough', 'noun', 3, ARRAY['presentation'], 'A step-by-step demonstration', '逐步演示', 'Let me give you a quick walkthrough of the dashboard.'),
('deck', 'noun', 2, ARRAY['presentation'], 'A slide presentation', '簡報投影片', 'Send me the deck before the meeting.'),
('key takeaway', 'noun', 3, ARRAY['presentation', 'meeting'], 'The most important point to remember', '關鍵重點', 'The key takeaway is that we need more data.'),
('deep dive', 'noun', 3, ARRAY['presentation', 'meeting'], 'A detailed exploration of a topic', '深入探討', 'Let''s do a deep dive on user retention next week.'),
('drill down', 'phrase', 3, ARRAY['presentation'], 'To examine something in detail', '深入分析', 'Can we drill down into the churn numbers?'),
('high level', 'adjective', 2, ARRAY['presentation', 'meeting'], 'General overview without details', '高層次概述', 'Just give me the high level summary.'),

-- 財務 / Finance
('budget', 'noun', 2, ARRAY['finance'], 'A plan for spending money', '預算', 'We''re over budget for this quarter.'),
('forecast', 'verb', 3, ARRAY['finance'], 'To predict future performance', '預測', 'Sales forecast shows 15% growth next quarter.'),
('revenue', 'noun', 2, ARRAY['finance'], 'Total income from business activities', '營收', 'Q3 revenue exceeded our target by 8%.'),
('margin', 'noun', 3, ARRAY['finance'], 'Profit as a percentage of revenue', '利潤率', 'Our margin dropped due to higher shipping costs.'),
('runway', 'noun', 4, ARRAY['finance'], 'Time until a company runs out of money', '現金跑道', 'The startup has 18 months of runway left.'),
('burn rate', 'noun', 4, ARRAY['finance'], 'Rate at which a company spends money', '燒錢速度', 'We need to reduce our burn rate this quarter.'),

-- 產品 / Product / Strategy
('roadmap', 'noun', 2, ARRAY['meeting', 'presentation'], 'A plan showing goals over time', '路線圖', 'Here''s the product roadmap for the next six months.'),
('milestone', 'noun', 2, ARRAY['meeting'], 'An important stage in progress', '里程碑', 'Launching the beta is our next milestone.'),
('KPI', 'noun', 3, ARRAY['meeting', 'presentation'], 'Key Performance Indicator', '關鍵績效指標', 'Retention is the KPI we care about most.'),
('pivot', 'verb', 3, ARRAY['meeting', 'presentation'], 'To fundamentally change strategy', '策略轉向', 'We pivoted from B2C to B2B after the market shift.'),
('iterate', 'verb', 3, ARRAY['meeting'], 'To make small improvements repeatedly', '迭代改進', 'Let''s iterate on the design based on user feedback.'),
('MVP', 'noun', 3, ARRAY['meeting', 'presentation'], 'Minimum Viable Product', '最小可行產品', 'The MVP should launch in six weeks.'),
('scope', 'noun', 3, ARRAY['meeting'], 'The extent of a project''s work', '專案範疇', 'Adding that feature is out of scope.'),
('scope creep', 'noun', 4, ARRAY['meeting'], 'Uncontrolled expansion of project scope', '範疇蔓延', 'We need to prevent scope creep in this sprint.'),
('backlog', 'noun', 3, ARRAY['meeting'], 'List of pending work items', '待辦事項清單', 'The backlog is getting too long to manage.'),
('sprint', 'noun', 3, ARRAY['meeting'], 'A short development cycle', '衝刺週期', 'This sprint focuses on onboarding improvements.'),
('bandwidth', 'noun', 3, ARRAY['meeting'], 'Available time or resources', '時間 / 精力', 'I don''t have the bandwidth to take that on.'),

-- 溝通 / Communication
('circle back', 'phrase', 3, ARRAY['meeting', 'email'], 'To return to a topic later', '稍後回頭討論', 'Let me research this and circle back tomorrow.'),
('loop in', 'phrase', 3, ARRAY['email'], 'To include someone in a communication', '把某人加進來', 'Let me loop in Marketing on this thread.'),
('ping', 'verb', 2, ARRAY['email'], 'To send a quick message', '簡訊 / 訊息聯絡', 'Ping me when you''re back at your desk.'),
('touch base', 'phrase', 3, ARRAY['meeting'], 'To briefly connect or check in', '簡短聯繫', 'Let''s touch base on Friday to review progress.'),
('bring up', 'phrase', 2, ARRAY['meeting'], 'To introduce a topic', '提出', 'Can you bring up the budget issue in the meeting?'),
('run by', 'phrase', 3, ARRAY['meeting', 'email'], 'To review or discuss for feedback', '請人過目', 'Let me run this proposal by legal first.'),
('reach out', 'phrase', 2, ARRAY['email', 'cold_call'], 'To make contact with someone', '主動聯繫', 'I''ll reach out to the vendor this afternoon.'),
('flag', 'verb', 3, ARRAY['email', 'meeting'], 'To highlight something important', '標記 / 提醒', 'I want to flag a potential risk with the timeline.'),

-- 領導 / Leadership
('delegate', 'verb', 3, ARRAY['meeting'], 'To assign responsibility to someone else', '授權', 'Good leaders know when to delegate.'),
('empower', 'verb', 3, ARRAY['meeting', 'presentation'], 'To give someone authority to act', '賦能', 'We want to empower teams to make decisions.'),
('escalate', 'verb', 4, ARRAY['meeting', 'email'], 'To raise an issue to a higher level', '升級處理', 'This bug needs to be escalated to engineering leads.'),
('accountability', 'noun', 4, ARRAY['meeting'], 'Responsibility for outcomes', '當責 / 問責', 'We need clearer accountability on this project.'),
('stakeholder', 'noun', 3, ARRAY['meeting', 'presentation'], 'A person with interest in a project', '利害關係人', 'Let''s get stakeholder buy-in before we proceed.'),
('buy-in', 'noun', 3, ARRAY['meeting'], 'Support or commitment from someone', '認同 / 支持', 'Getting executive buy-in is critical.'),
('mentor', 'verb', 2, ARRAY['meeting'], 'To advise and guide someone', '指導', 'She mentors three junior engineers on the team.'),
('onboard', 'verb', 3, ARRAY['meeting'], 'To integrate a new employee or customer', '新人 / 客戶導入', 'We onboarded five new engineers this quarter.'),

-- HR
('headcount', 'noun', 3, ARRAY['meeting'], 'Number of employees', '人力編制', 'HR approved two new headcounts for our team.'),
('attrition', 'noun', 4, ARRAY['meeting'], 'Rate at which employees leave', '員工流失率', 'Attrition spiked after the reorg.'),
('performance review', 'noun', 3, ARRAY['meeting'], 'Formal evaluation of an employee', '績效考核', 'Performance reviews are due by end of month.'),

-- 行銷 / Marketing
('campaign', 'noun', 2, ARRAY['marketing'], 'A coordinated marketing effort', '行銷活動', 'Our latest campaign drove 30% more sign-ups.'),
('funnel', 'noun', 3, ARRAY['marketing', 'sales'], 'The stages a customer goes through', '轉換漏斗', 'We''re optimizing the top of the funnel.'),
('conversion', 'noun', 3, ARRAY['marketing', 'sales'], 'When a visitor takes a desired action', '轉換', 'Our conversion rate improved by 12%.'),
('impressions', 'noun', 3, ARRAY['marketing'], 'Number of times content is displayed', '曝光數', 'The ad got 2 million impressions last week.'),
('reach', 'noun', 3, ARRAY['marketing'], 'Number of unique people who see content', '觸及人數', 'This post had a reach of 50,000 users.'),

-- 客服 / Customer Success
('escalation', 'noun', 4, ARRAY['complaint_handling'], 'A situation requiring higher-level attention', '升級案件', 'This escalation needs a response within 4 hours.'),
('ticket', 'noun', 2, ARRAY['complaint_handling'], 'A customer support request', '客服工單', 'Please open a ticket for the billing issue.'),
('resolve', 'verb', 3, ARRAY['complaint_handling'], 'To settle or fix a problem', '解決問題', 'We resolved 95% of tickets within 24 hours.'),
('workaround', 'noun', 3, ARRAY['complaint_handling'], 'A temporary solution', '暫時解決方案', 'Here''s a workaround while we fix the bug.'),
('root cause', 'noun', 3, ARRAY['complaint_handling'], 'The fundamental reason for a problem', '根本原因', 'Let''s find the root cause before deploying a fix.'),

-- 通用商業動詞
('streamline', 'verb', 4, ARRAY['meeting'], 'To make more efficient', '簡化流程', 'We need to streamline the approval process.'),
('optimize', 'verb', 3, ARRAY['meeting', 'presentation'], 'To make as efficient as possible', '最佳化', 'The team is optimizing the checkout flow.'),
('scale', 'verb', 3, ARRAY['meeting', 'presentation'], 'To grow efficiently', '擴展規模', 'How do we scale this to 10x users?'),
('facilitate', 'verb', 4, ARRAY['meeting'], 'To make a process easier', '促成 / 引導', 'She''ll facilitate the workshop tomorrow.'),
('leverage synergies', 'phrase', 5, ARRAY['presentation'], 'To combine strengths for greater effect', '發揮綜效', 'The merger will leverage synergies across teams.'),

-- 時間 / 節奏
('deadline', 'noun', 1, ARRAY['meeting', 'email'], 'A time by which something must be done', '截止日期', 'The deadline is next Friday.'),
('turnaround', 'noun', 3, ARRAY['meeting', 'email'], 'Time to complete a task', '週轉時間', 'What''s the typical turnaround for legal review?'),
('ETA', 'noun', 2, ARRAY['meeting'], 'Estimated Time of Arrival', '預計時間', 'What''s the ETA on the design mockups?'),
('crunch time', 'noun', 3, ARRAY['meeting'], 'Period of intense work before a deadline', '衝刺期', 'It''s crunch time before the product launch.'),

-- 風險 / 決策
('mitigate', 'verb', 4, ARRAY['meeting', 'presentation'], 'To reduce the severity of a risk', '緩解風險', 'How can we mitigate the security risk?'),
('trade off', 'noun', 3, ARRAY['meeting'], 'A balance between two conflicting things', '取捨', 'There''s always a trade off between speed and quality.'),
('due diligence', 'noun', 4, ARRAY['negotiation', 'meeting'], 'Careful investigation before an important decision', '盡職調查', 'We need to do due diligence before signing.'),
('game plan', 'noun', 3, ARRAY['meeting', 'presentation'], 'A strategy for achieving a goal', '作戰計畫', 'What''s our game plan for the client meeting?'),
('game changer', 'noun', 3, ARRAY['presentation'], 'Something that significantly alters the situation', '改變遊戲規則的事', 'This feature could be a game changer for us.'),

-- 產業 / 市場
('vertical', 'noun', 4, ARRAY['sales', 'marketing'], 'A specific industry segment', '垂直產業', 'We''re expanding into the healthcare vertical.'),
('market share', 'noun', 3, ARRAY['meeting', 'presentation'], 'Portion of total sales in a market', '市場佔有率', 'We gained 5% market share this year.'),
('go to market', 'phrase', 4, ARRAY['presentation'], 'Strategy to bring a product to customers', '進入市場策略', 'Our go to market strategy focuses on SMBs.'),
('competitive edge', 'noun', 3, ARRAY['presentation', 'meeting'], 'An advantage over competitors', '競爭優勢', 'Our AI gives us a competitive edge.'),

-- 客戶關係
('rapport', 'noun', 4, ARRAY['sales', 'small_talk'], 'A friendly, harmonious relationship', '融洽關係', 'She builds great rapport with clients quickly.'),
('retention', 'noun', 3, ARRAY['sales', 'marketing'], 'Keeping existing customers', '客戶留存', 'Retention is more valuable than acquisition.'),
('churn rate', 'noun', 4, ARRAY['sales'], 'Percentage of customers lost', '流失率', 'Enterprise churn rate is under 3%.')

on conflict (word) do nothing;
