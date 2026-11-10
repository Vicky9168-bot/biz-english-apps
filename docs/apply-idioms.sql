-- =====================================================
-- 貼到 Supabase Dashboard → SQL Editor → Run
-- Part 4: 商務俚語練習 (100 常見會議/商用 idioms)
-- Idempotent，重複執行不會壞資料
-- Created: 2026-09-28
-- =====================================================

create table if not exists public.business_idioms (
  id uuid primary key default gen_random_uuid(),
  idiom text not null unique,
  meaning_zh text not null,
  meaning_en text not null,
  formal_alt text,
  example_en text not null,
  example_zh text not null,
  category text not null check (category in ('meeting','negotiation','strategy','feedback','urgency','interpersonal','general')),
  difficulty int not null default 2 check (difficulty between 1 and 5),
  tags text[] default array[]::text[],
  created_at timestamptz not null default now()
);

create table if not exists public.idiom_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  idiom_id uuid not null references public.business_idioms(id) on delete cascade,
  is_correct boolean not null,
  attempted_at timestamptz not null default now()
);

create index if not exists idx_idiom_attempts_user_time on public.idiom_attempts(user_id, attempted_at desc);
create index if not exists idx_idiom_attempts_user_idiom on public.idiom_attempts(user_id, idiom_id);

-- RLS
alter table public.business_idioms enable row level security;
drop policy if exists "auth_read_idioms" on public.business_idioms;
create policy "auth_read_idioms" on public.business_idioms
  for select to authenticated using (true);

alter table public.idiom_attempts enable row level security;
drop policy if exists "own_read_attempts" on public.idiom_attempts;
create policy "own_read_attempts" on public.idiom_attempts
  for select to authenticated using (auth.uid() = user_id);
drop policy if exists "own_insert_attempts" on public.idiom_attempts;
create policy "own_insert_attempts" on public.idiom_attempts
  for insert to authenticated with check (auth.uid() = user_id);

-- =====================================================
-- 100 商務俚語種子資料
-- =====================================================
insert into public.business_idioms (idiom, meaning_zh, meaning_en, formal_alt, example_en, example_zh, category, difficulty, tags) values

-- meeting (15)
('touch base', '簡短碰面對一下狀況', 'to briefly connect to update each other', 'check in', 'Let''s touch base next Tuesday to align on the Q4 roadmap.', '下週二我們碰個面，對一下 Q4 路線圖。', 'meeting', 1, array['sync']),
('circle back', '稍後回頭再討論', 'to return to a topic later', 'revisit', 'Good point — let''s circle back on pricing after we hear from legal.', '好問題，我們等法務回覆後再回頭討論定價。', 'meeting', 1, array['defer']),
('take it offline', '會後私下再討論', 'to discuss privately after the meeting', 'discuss separately', 'This is getting deep — can we take it offline and not derail the agenda?', '這個太深入了，我們會後再私下討論，別偏離議程。', 'meeting', 2, array['defer']),
('loop in', '把某人加進討論', 'to include someone in the conversation', 'include', 'Let me loop in Sarah — she owns the vendor relationship.', '我把 Sarah 加進來，她負責這個供應商窗口。', 'meeting', 1, array['include']),
('ping someone', '快速聯繫某人一下', 'to send a quick message', 'contact briefly', 'I''ll ping the design team on Slack to see if they can join.', '我在 Slack 上敲一下設計團隊，看他們能不能加入。', 'meeting', 1, array['contact']),
('drill down', '深入探討細節', 'to examine something in detail', 'examine closely', 'Let''s drill down into why the churn rate spiked in March.', '我們深入看一下 3 月流失率為什麼暴衝。', 'meeting', 2, array['analysis']),
('table something', '暫緩討論某議題', 'to postpone discussion of an item', 'postpone', 'Let''s table the rebrand discussion until we have budget clarity.', '品牌重塑的討論先擱著，等預算釐清再說。', 'meeting', 3, array['defer']),
('park an idea', '先把想法擱一邊', 'to set aside an idea for later', 'set aside', 'Great idea — let''s park it for the next planning cycle.', '好點子，我們先擱到下一輪 planning 再談。', 'meeting', 2, array['defer']),
('get on the same page', '讓大家達成共識', 'to reach shared understanding', 'align', 'Before we ship, let''s get everyone on the same page about scope.', '出貨前，先讓大家對 scope 達成共識。', 'meeting', 1, array['alignment']),
('run it up the flagpole', '上呈徵詢意見', 'to propose to leadership for approval', 'seek approval', 'I like the plan — let me run it up the flagpole and get back to you.', '我喜歡這個計畫，我先上呈徵詢意見再回你。', 'meeting', 3, array['approval']),
('wrap up', '收尾/結束', 'to conclude or finish', 'conclude', 'We have 5 minutes left — let''s wrap up with action items.', '剩 5 分鐘，我們用行動項目收尾。', 'meeting', 1, array['close']),
('keep it high-level', '維持在宏觀層面，不進細節', 'to stay at a broad overview', 'stay strategic', 'For the board deck, keep it high-level — no engineering weeds.', '給董事會的簡報維持宏觀，不要進工程細節。', 'meeting', 2, array['scope']),
('call it a day', '今天就到這裡', 'to stop working for the day', 'end for today', 'We''ve been at this for 3 hours — let''s call it a day.', '我們已經開 3 小時了，今天就到這裡。', 'meeting', 1, array['close']),
('take a step back', '退一步看全局', 'to pause and reconsider from a broader view', 'reconsider broadly', 'Let''s take a step back — are we even solving the right problem?', '我們退一步看，這是我們真正該解的問題嗎？', 'meeting', 2, array['reflection']),
('get the ball rolling', '啟動/開始行動', 'to start something moving', 'initiate', 'To get the ball rolling, I''ll draft the RFP by Friday.', '為了先啟動，我週五前先擬 RFP 草稿。', 'meeting', 1, array['start']),

-- negotiation (15)
('ballpark figure', '大概的數字', 'a rough estimate', 'rough estimate', 'Can you give me a ballpark figure before we brief the client?', '在跟客戶簡報前，可以給我一個大概數字嗎？', 'negotiation', 2, array['estimate']),
('move the goalposts', '中途改變標準/目標', 'to change requirements after work has started', 'change criteria mid-way', 'Every time we hit a milestone, the client moves the goalposts.', '每次我們達成一個里程碑，客戶就把目標改一次。', 'negotiation', 3, array['scope-change']),
('deal breaker', '破局關鍵條件', 'an issue that would kill the agreement', 'critical objection', 'A one-year lock-in is a deal breaker for our finance team.', '一年綁約對我們財務團隊來說是絕對破局條件。', 'negotiation', 2, array['objection']),
('bottom line', '底線/最終結論', 'the final result or non-negotiable minimum', 'final position', 'Bottom line: we can''t go below $50k for this scope.', '底線是，這個 scope 我們無法低於 5 萬美金。', 'negotiation', 2, array['position']),
('red flag', '警訊/問題徵兆', 'a warning sign of a problem', 'warning sign', 'The vendor missing two demos is a red flag we shouldn''t ignore.', '這個供應商連兩次沒到 demo，這是不能忽略的警訊。', 'negotiation', 2, array['risk']),
('green light', '獲得核准/放行', 'to give or receive approval', 'authorization', 'Legal just gave us the green light to sign the MSA.', '法務剛核准我們簽這份 MSA。', 'negotiation', 2, array['approval']),
('push back', '反對/表達異議', 'to resist or object to a proposal', 'object', 'The sales team pushed back hard on the new commission structure.', '業務團隊對新的獎金結構反彈很大。', 'negotiation', 2, array['objection']),
('cave in', '屈服/讓步', 'to give in under pressure', 'concede', 'Don''t cave in on payment terms — those are non-negotiable.', '付款條件別讓步，那是不能談的。', 'negotiation', 3, array['concession']),
('win-win', '雙贏', 'mutually beneficial', 'mutually beneficial', 'Extending their contract for a discount is a win-win.', '延長合約換折扣，這對雙方都是雙贏。', 'negotiation', 1, array['outcome']),
('cut to the chase', '直接切入重點', 'to get to the point', 'get to the point', 'Let me cut to the chase — we need a decision by Thursday.', '我直說了，我們週四前需要一個決定。', 'negotiation', 2, array['directness']),
('hash out', '把細節談清楚', 'to discuss thoroughly to reach agreement', 'work out details', 'The two teams hashed out the SLA over a two-hour call.', '兩邊團隊花了 2 小時把 SLA 細節談清楚。', 'negotiation', 3, array['detail']),
('iron out', '解決分歧/處理小問題', 'to resolve remaining issues', 'resolve', 'We''re close — just need to iron out a few contract clauses.', '快談定了，只剩幾個合約條款要解決。', 'negotiation', 2, array['resolve']),
('give the nod', '點頭同意', 'to give approval', 'approve', 'Once the CFO gives the nod, procurement can move ahead.', '只要 CFO 點頭，採購就可以往下走。', 'negotiation', 3, array['approval']),
('play hardball', '強硬談判', 'to negotiate aggressively', 'take a firm stance', 'They played hardball on price, so we walked away.', '他們在價格上非常強硬，所以我們就退出了。', 'negotiation', 3, array['tactics']),
('meet in the middle', '各退一步', 'to compromise', 'compromise', 'They wanted 60 days, we wanted 30 — we met in the middle at 45.', '他們要 60 天，我們要 30，最後各退一步定在 45 天。', 'negotiation', 2, array['compromise']),

-- strategy (15)
('big picture', '大方向/全局', 'the overall situation or long-term view', 'overall view', 'Zoom out — what does this mean for the big picture?', '拉高一點看，這對大方向有什麼意義？', 'strategy', 1, array['perspective']),
('moving parts', '涉及的多個環節', 'multiple interconnected components', 'complex dependencies', 'This launch has a lot of moving parts — we need a single owner.', '這個上線案環節很多，需要單一負責人。', 'strategy', 2, array['complexity']),
('going forward', '未來/往後', 'from now on', 'from now on', 'Going forward, all vendor contracts need legal review.', '未來所有供應商合約都要經過法務審核。', 'strategy', 1, array['future']),
('down the line', '未來某個時間點', 'at some future point', 'in the future', 'This tech debt will hurt us down the line if we don''t address it.', '這個技術債如果不處理，未來某個時間點會反噬。', 'strategy', 2, array['future']),
('long game', '長期策略', 'a strategy focused on long-term results', 'long-term strategy', 'Investing in brand is a long game — don''t expect Q1 returns.', '投資品牌是長期戰，別期待第一季就看到回報。', 'strategy', 3, array['patience']),
('pivot', '策略轉向', 'to change direction strategically', 'change direction', 'After 6 months of flat growth, we pivoted from SMB to enterprise.', '成長停滯 6 個月後，我們從中小企業轉向大企業客戶。', 'strategy', 2, array['change']),
('double down', '加倍投入', 'to increase commitment to a strategy', 'commit further', 'The API business is working — let''s double down next quarter.', 'API 業務走出來了，下一季我們加倍投入。', 'strategy', 2, array['commitment']),
('skin in the game', '有切身利害', 'to have personal stake in the outcome', 'personal stake', 'Founders with skin in the game make better long-term decisions.', '創辦人有切身利害才會做出好的長期決策。', 'strategy', 3, array['ownership']),
('north star', '核心指標/終極目標', 'the guiding overall goal', 'guiding metric', 'Our north star this year is net revenue retention above 120%.', '我們今年的北極星指標是淨營收留存超過 120%。', 'strategy', 3, array['goal']),
('paradigm shift', '思維翻轉', 'a fundamental change in approach', 'fundamental shift', 'AI copilots are a paradigm shift for how we build software.', 'AI copilot 對軟體開發是一次思維翻轉。', 'strategy', 4, array['transformation']),
('sea change', '巨大轉變', 'a major transformation', 'major transformation', 'Remote-first was a sea change in how enterprise SaaS gets sold.', 'Remote-first 徹底翻轉了企業級 SaaS 的銷售方式。', 'strategy', 4, array['transformation']),
('blue ocean', '藍海市場/無競爭市場', 'an uncontested market space', 'uncontested market', 'We found a blue ocean serving mid-market compliance teams.', '我們找到一個中型市場合規團隊的藍海。', 'strategy', 3, array['market']),
('raise the bar', '提高標準', 'to set a higher standard', 'set higher standards', 'The new hire really raised the bar on design quality.', '這位新人把設計品質的標準拉高了。', 'strategy', 2, array['quality']),
('quick win', '短期速效', 'an easy, fast improvement', 'easy short-term gain', 'Let''s ship a quick win this sprint to build momentum.', '這個 sprint 做一個 quick win 建立動能。', 'strategy', 2, array['momentum']),
('low-hanging fruit', '容易達成的目標', 'the easiest opportunities to capture', 'easy opportunity', 'Onboarding email tweaks are low-hanging fruit for activation.', '調整 onboarding email 是提升啟用率的容易目標。', 'strategy', 2, array['prioritization']),

-- feedback (15)
('drop the ball', '出包/沒接住責任', 'to fail to handle a responsibility', 'fail to deliver', 'We dropped the ball on the vendor renewal and lost the discount.', '供應商續約這件事我們沒接住，折扣就沒了。', 'feedback', 2, array['mistake']),
('up to speed', '進入狀況/掌握狀況', 'informed and current on a topic', 'fully informed', 'Are you up to speed on the Acme account situation?', '你對 Acme 這個客戶的狀況掌握了嗎？', 'feedback', 1, array['knowledge']),
('get up to speed', '追上進度/進入狀況', 'to catch up on information', 'catch up', 'Give the new PM a week to get up to speed before assigning owners.', '給新的 PM 一週時間進入狀況再指派負責人。', 'feedback', 1, array['onboarding']),
('asleep at the wheel', '失職/沒盯', 'not paying attention when responsible', 'negligent', 'Compliance was asleep at the wheel — that''s why we got fined.', '合規團隊沒盯緊，才會被罰。', 'feedback', 3, array['negligence']),
('pull one''s weight', '盡到本分', 'to do one''s fair share of work', 'contribute fairly', 'Everyone on the pod needs to pull their weight during crunch.', '衝刺期間 pod 裡每個人都要盡本分。', 'feedback', 2, array['accountability']),
('step up', '挺身而出/扛起責任', 'to take on more responsibility', 'take initiative', 'When our lead left, Jamie stepped up and ran the launch.', '團隊 lead 離開後，Jamie 挺身而出扛起上線。', 'feedback', 2, array['leadership']),
('take ownership', '承擔責任', 'to be personally accountable', 'be accountable', 'I need someone to take ownership of the migration end-to-end.', '我需要有人從頭到尾把這個 migration 扛起來。', 'feedback', 2, array['ownership']),
('above and beyond', '超乎預期的付出', 'exceeding what is expected', 'exceeding expectations', 'She went above and beyond to save the client relationship.', '她付出遠超預期，把這個客戶關係救回來。', 'feedback', 2, array['praise']),
('knock it out of the park', '表現超棒', 'to perform exceptionally well', 'excel', 'The demo team knocked it out of the park with the CFO.', 'demo 團隊在 CFO 面前表現超棒。', 'feedback', 2, array['praise']),
('crush it', '表現極佳', 'to succeed impressively', 'perform excellently', 'Sales crushed it this quarter — 140% of target.', '業務這一季表現極佳，達成率 140%。', 'feedback', 2, array['praise']),
('nail it', '精準做到位', 'to do something perfectly', 'execute perfectly', 'You nailed the positioning — that''s exactly the message.', '你把定位講到位了，就是這個 message。', 'feedback', 2, array['praise']),
('move the needle', '產生實質影響', 'to make a noticeable impact', 'have material impact', 'A blog post won''t move the needle on pipeline — we need paid.', '一篇部落格文不會實質影響 pipeline，我們需要付費投放。', 'feedback', 3, array['impact']),
('fall short', '未達標', 'to fail to reach a standard', 'underperform', 'We fell short of the quarterly goal by about 8%.', '這一季目標我們差了大約 8%。', 'feedback', 2, array['performance']),
('miss the mark', '沒打中要點', 'to fail to meet expectations', 'miss the point', 'The campaign creative missed the mark with our ICP.', '這個 campaign 的創意沒打中我們的目標客群。', 'feedback', 3, array['critique']),
('spot on', '完全正確/精準', 'exactly right', 'exactly correct', 'Your read on their motivation was spot on.', '你對他們動機的判讀完全正確。', 'feedback', 2, array['praise']),

-- urgency (10)
('crunch time', '關鍵衝刺期', 'a critical period requiring intense effort', 'critical period', 'It''s crunch time — no meetings before launch on Friday.', '現在是關鍵衝刺期，週五上線前不排會。', 'urgency', 2, array['deadline']),
('down to the wire', '最後關頭', 'right up to the last moment', 'at the last moment', 'The deal came down to the wire, but we signed at 11 PM.', '這個 deal 拖到最後關頭，晚上 11 點才簽下。', 'urgency', 3, array['deadline']),
('under the gun', '壓力極大', 'under intense pressure or a tight deadline', 'under intense pressure', 'Marketing is under the gun to deliver leads before EOQ.', '行銷團隊面臨極大壓力，要在季底前交出 leads。', 'urgency', 2, array['pressure']),
('burn the midnight oil', '熬夜加班', 'to work late into the night', 'work overtime', 'The eng team burned the midnight oil to fix the P0 bug.', '工程團隊熬夜加班把 P0 bug 修掉。', 'urgency', 2, array['overtime']),
('fire drill', '突發緊急事件', 'an unexpected urgent issue', 'emergency situation', 'This exec ask turned into a full fire drill for the analytics team.', '這個高層的要求變成分析團隊一場緊急救火。', 'urgency', 3, array['emergency']),
('put out fires', '救火/處理危機', 'to handle urgent problems', 'address urgent issues', 'I spent all Monday putting out fires instead of shipping the feature.', '我週一整天都在救火，根本沒時間出 feature。', 'urgency', 2, array['emergency']),
('on the back burner', '暫緩處理', 'deprioritized for later', 'deprioritized', 'The redesign is on the back burner until we hit revenue targets.', '這個改版先擱著，等我們達成營收目標再說。', 'urgency', 2, array['prioritization']),
('on the front burner', '優先處理', 'top priority right now', 'top priority', 'Customer retention is on the front burner this quarter.', '客戶留存是這一季的優先事項。', 'urgency', 3, array['prioritization']),
('buy some time', '爭取時間', 'to delay in order to gain time', 'gain time', 'A phased rollout can buy us time to fix the onboarding flow.', '分階段上線可以幫我們爭取時間修 onboarding 流程。', 'urgency', 2, array['delay']),
('pushed for time', '時間很趕', 'having little time available', 'short on time', 'I''m pushed for time — can we do this in 15 minutes?', '我時間很趕，我們 15 分鐘搞定可以嗎？', 'urgency', 1, array['time']),

-- interpersonal (15)
('throw under the bus', '出賣同事推責任', 'to blame or betray a colleague', 'shift blame onto', 'Don''t throw engineering under the bus — the miss was on us too.', '別把工程團隊推出去擋，這次的失誤我們也有份。', 'interpersonal', 3, array['blame']),
('pass the buck', '推卸責任', 'to shift responsibility to someone else', 'shift responsibility', 'Stop passing the buck — you own this workstream.', '別再推卸責任，這條線是你負責的。', 'interpersonal', 2, array['accountability']),
('drink the Kool-Aid', '盲目跟從', 'to uncritically believe or embrace something', 'accept uncritically', 'Not everyone here has drunk the Kool-Aid on the new OKR system.', '不是每個人都盲目認同這套新的 OKR 系統。', 'interpersonal', 4, array['culture']),
('team player', '團隊型的人', 'someone who cooperates well with others', 'collaborative colleague', 'She''s a strong team player — always picks up the slack.', '她很有團隊精神，總是主動補位。', 'interpersonal', 1, array['praise']),
('lone wolf', '獨行俠/單打獨鬥', 'someone who works alone', 'solo operator', 'He''s a bit of a lone wolf — great work, low visibility.', '他有點獨行俠，產出很好但曝光度低。', 'interpersonal', 2, array['style']),
('rock the boat', '找麻煩/破壞現狀', 'to disturb the status quo', 'disturb the status quo', 'Nobody wants to rock the boat before the acquisition closes.', '併購案關門前沒人想找麻煩。', 'interpersonal', 3, array['conflict']),
('see eye to eye', '意見一致', 'to agree with someone', 'agree', 'Product and sales don''t always see eye to eye on roadmap.', '產品和業務對 roadmap 的看法不總是一致。', 'interpersonal', 2, array['alignment']),
('on the same wavelength', '想法對得上', 'thinking similarly', 'in sync', 'Our new PM and I are totally on the same wavelength.', '我跟新的 PM 想法完全對得上。', 'interpersonal', 2, array['alignment']),
('rub the wrong way', '讓某人不爽', 'to annoy or irritate', 'irritate', 'His tone in the review really rubbed the CFO the wrong way.', '他在 review 時的口氣讓 CFO 很不爽。', 'interpersonal', 3, array['friction']),
('bring to the table', '能貢獻什麼', 'the value someone contributes', 'contribute', 'What does this vendor bring to the table that we don''t have?', '這個供應商能提供什麼是我們沒有的？', 'interpersonal', 2, array['value']),
('wear many hats', '身兼多職', 'to handle multiple roles', 'handle multiple roles', 'At a Series A startup, everyone wears many hats.', 'A 輪新創裡每個人都要身兼多職。', 'interpersonal', 2, array['role']),
('stay in one''s lane', '守本分/別越權', 'to focus on one''s own responsibilities', 'focus on own scope', 'Marketing needs to stay in its lane and let product own the messaging.', '行銷該守本分，訊息定調讓產品團隊來。', 'interpersonal', 3, array['boundary']),
('give the cold shoulder', '冷處理/不理會', 'to deliberately ignore someone', 'ignore deliberately', 'Ever since the reorg, that team has given us the cold shoulder.', '組織重組後，那個團隊就一直冷處理我們。', 'interpersonal', 3, array['friction']),
('get on board', '接受/加入支持', 'to agree to support a plan', 'support', 'We need finance to get on board before we announce internally.', '對內公告前，我們需要財務先支持。', 'interpersonal', 2, array['alignment']),
('play devil''s advocate', '故意唱反調測試論點', 'to argue the opposite side to test an idea', 'challenge for stress-test', 'Let me play devil''s advocate — what if the market shifts next quarter?', '我故意唱個反調，如果下一季市場變了怎麼辦？', 'interpersonal', 3, array['discussion']),

-- general (15)
('take with a grain of salt', '半信半疑', 'to view with skepticism', 'view skeptically', 'Take his revenue projections with a grain of salt — he''s optimistic.', '他的營收預測聽聽就好，他偏樂觀。', 'general', 3, array['skepticism']),
('cut corners', '偷工減料', 'to skip steps to save time or money', 'compromise on quality', 'We can''t cut corners on security — one breach undoes everything.', '資安不能偷工減料，一次外洩就前功盡棄。', 'general', 2, array['quality']),
('across the board', '全面/一律', 'affecting all cases uniformly', 'uniformly', 'We''re raising prices 10% across the board next quarter.', '下一季我們全面漲價 10%。', 'general', 2, array['scope']),
('from scratch', '從零開始', 'starting from nothing', 'from the beginning', 'We rebuilt the onboarding flow from scratch after the redesign.', '改版後我們從零重建 onboarding 流程。', 'general', 1, array['build']),
('back to the drawing board', '重新規劃', 'to start planning again', 'restart planning', 'The prototype flopped in user testing — back to the drawing board.', 'prototype 在使用者測試上翻車，重新規劃吧。', 'general', 2, array['restart']),
('reinvent the wheel', '重複造輪子', 'to redo work that already exists', 'duplicate existing work', 'Use the auth library — don''t reinvent the wheel.', '用現成的 auth 函式庫，別自己重複造輪子。', 'general', 2, array['efficiency']),
('moving target', '會變動的目標', 'requirements that keep changing', 'shifting requirements', 'The launch date is a moving target — hard to plan around.', '上線日一直在變，很難規劃。', 'general', 3, array['uncertainty']),
('elephant in the room', '大家都不敢談的問題', 'an obvious issue everyone avoids', 'the obvious unspoken issue', 'The elephant in the room is that we haven''t hit revenue in 3 quarters.', '大家不敢談的是，我們連 3 季沒達營收目標。', 'general', 3, array['avoidance']),
('read between the lines', '看出弦外之音', 'to understand the implicit meaning', 'infer implicit meaning', 'Read between the lines — the CEO is signaling a layoff.', '看弦外之音，CEO 在暗示要裁員。', 'general', 3, array['interpretation']),
('through the roof', '暴衝/飆漲', 'extremely high', 'extremely high', 'Support tickets went through the roof after the update.', '更新後 support ticket 數量直接暴衝。', 'general', 2, array['increase']),
('in the same boat', '同舟共濟/處境相同', 'in the same difficult situation', 'in the same situation', 'Every SaaS company is in the same boat with rising CAC.', 'CAC 上升這件事，每家 SaaS 公司都同舟共濟。', 'general', 2, array['solidarity']),
('by the book', '按規矩來', 'strictly following the rules', 'by the rules', 'For regulated industries, everything has to be done by the book.', '受監管的產業，所有事都得按規矩來。', 'general', 2, array['compliance']),
('bite the bullet', '硬著頭皮做', 'to do something unpleasant that must be done', 'do the hard thing', 'We had to bite the bullet and sunset the legacy product.', '我們只好硬著頭皮把舊產品線收掉。', 'general', 3, array['tough-decision']),
('rain check', '改期', 'to postpone an invitation', 'reschedule', 'Can I take a rain check on lunch? Something urgent came up.', '午餐可以改期嗎？突然有急事。', 'general', 2, array['reschedule']),
('touch and go', '情勢不明朗/危急', 'uncertain and risky', 'uncertain', 'The renewal was touch and go until the last week.', '續約案直到最後一週都情勢不明。', 'general', 3, array['uncertainty'])

on conflict (idiom) do nothing;
