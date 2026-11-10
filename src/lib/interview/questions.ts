export type QuestionCategory = 'basic' | 'behavioral' | 'salary' | 'ask-back'

export type ExternalResource = {
  title: string
  url: string
  note?: string
}

export type PracticeQuestion = {
  id: string
  category: QuestionCategory
  question_en: string
  question_zh: string
  framework?: 'STAR' | 'BAR+L' | null
  focus?: string
  why_asked: string[]
  what_they_expect: string[]
  how_to_answer: string[]
  what_to_avoid?: string[]
  answer_outline?: string[]
  external_resources: ExternalResource[]
}

const COMMON_INTERVIEW_RESOURCES: ExternalResource[] = [
  {
    title: 'Google Interview Warmup',
    url: 'https://grow.google/certificates/interview-warmup/',
    note: 'Google 免費 AI 面試練習工具',
  },
  {
    title: 'Harvard Business Review · Interviewing',
    url: 'https://hbr.org/topic/interviewing',
    note: 'HBR 面試主題精選文章',
  },
]

const BEHAVIORAL_RESOURCES: ExternalResource[] = [
  {
    title: 'Amazon Leadership Principles',
    url: 'https://www.amazon.jobs/content/en/our-workplace/leadership-principles',
    note: 'Amazon 16 條領導原則，行為題必讀',
  },
  {
    title: 'Google xYz formula',
    url: 'https://www.inc.com/bill-murphy-jr/google-recruiters-say-these-5-resume-tips-including-x-y-z-formula-will-improve-your-odds-of-getting-hired-at-google.html',
    note: '「Accomplished X, as measured by Y, by doing Z」量化公式',
  },
  {
    title: 'STAR method guide (Indeed)',
    url: 'https://www.indeed.com/career-advice/interviewing/how-to-use-the-star-interview-response-technique',
    note: 'STAR 框架完整教學',
  },
]

export const INTERVIEW_QUESTIONS: PracticeQuestion[] = [
  // ===== BASIC QUESTIONS =====
  {
    id: 'tell-me-about-yourself',
    category: 'basic',
    question_en: 'Tell me about yourself.',
    question_zh: '請自我介紹',
    focus: '開場定調 · 60/90 秒兩個版本',
    why_asked: [
      '在 60 秒內看你能不能把「你是誰、擅長什麼、為什麼來」講清楚',
      '測試你有沒有為這場面試做功課，還是背了一個通用版本',
    ],
    what_they_expect: [
      '不是講學經歷流水帳，而是「跟這份 JD 有關的自己」',
      '結尾能自然帶到「所以我來面試這個職位」',
    ],
    how_to_answer: [
      '公式：現在（角色 + 專長）→ 過去（1-2 個代表作 with 數據）→ 未來（為什麼是這家公司）',
      '60 秒版：3 句話講完，用於電話初面 / 快速自介',
      '90 秒版：多一段用 STAR 骨架的代表專案',
      '結尾一句話：「這也是我為什麼對貴公司的 XX 職位很感興趣」',
    ],
    what_to_avoid: [
      '從大學畢業講起的年代流水帳',
      '講家庭興趣、星座 MBTI',
      '重複履歷內容 word by word',
    ],
    answer_outline: [
      'I\'m currently a [role] at [company], focusing on [1-2 keywords tied to JD].',
      'Before this, I [1 sentence about background that\'s relevant].',
      'One project I\'m most proud of is [STAR mini-version with metric].',
      'That\'s why I\'m excited about this [role] at [company] — [specific reason].',
    ],
    external_resources: COMMON_INTERVIEW_RESOURCES,
  },
  {
    id: 'strengths-weaknesses',
    category: 'basic',
    question_en: 'What are your greatest strengths and weaknesses?',
    question_zh: '你的優點跟缺點是什麼？',
    focus: '必考題 · 硬實力 + 軟實力雙軸',
    why_asked: [
      '對照 JD 需要的關鍵能力',
      '看你有沒有自我反思能力、洞察力',
      '評估你能不能補足團隊缺口（HR 面試更明顯）',
    ],
    what_they_expect: [
      '優點：清楚說出強項、能怎麼提供價值',
      '缺點：誠實面對 + 提出改進方案 + 說明修正結果',
    ],
    how_to_answer: [
      '優點 · 硬實力：針對 JD 的 3 個核心工作圈圈，各挑 1 個成就 with 數據',
      '優點 · 軟實力：貼合 requirements（外商愛聽：即戰力、解決問題、善溝通、影響力、抗壓）',
      '缺點 · 硬實力：用產業/職務差異切入（例：新產業、新工具），提出補足計畫（線上課程、mentor）',
      '缺點 · 軟實力：避免跟 JD 衝突的（例：應徵 sales 說內向）；可以用優點反向講（過於理性、太專注細節）+ Learning',
    ],
    what_to_avoid: [
      '「我太完美主義」這種老套答案',
      '缺點講完沒有改進行動',
      '避重就輕、用優點包裝缺點',
    ],
    answer_outline: [
      'Strength: My core strength is [skill from JD]. In my last role, I [action] which resulted in [metric].',
      'On the soft side, I\'m known for [quality] — for example, [1-sentence proof].',
      'Weakness: I\'m still building my [skill gap tied to industry/role difference]. To close the gap, I\'ve been [action: course/mentor/side project], and I recently applied it to [small win].',
    ],
    external_resources: COMMON_INTERVIEW_RESOURCES,
  },
  {
    id: 'why-leave-previous',
    category: 'basic',
    question_en: 'Why did you leave your previous company?',
    question_zh: '為什麼離開上一家公司？',
    focus: '推力 + 拉力雙面論述',
    why_asked: [
      '看你是愛抱怨的人還是懂反思的人',
      '確認你清楚知道自己想要什麼',
    ],
    what_they_expect: [
      '清楚說明離開原因 + 反思',
      '對未來有具體願景、想獲得什麼',
    ],
    how_to_answer: [
      '推力（前公司限制）：成長受限、升遷卡關、學習曲線平掉',
      '拉力（新機會吸引）：產業趨勢、更大舞台、承擔 XX 專案、跨界挑戰',
      '若前公司裁員：可解釋景氣/編制問題，不用避諱',
      '主管/文化不合的話：講「嘗試過改善 + 什麼結果 + 學到什麼」，不要單純抱怨',
    ],
    what_to_avoid: [
      '罵老闆、罵同事、罵組織',
      '「薪水太低」當唯一原因',
      '講前公司缺點但沒說自己做過什麼嘗試',
    ],
    answer_outline: [
      'I really valued my time at [previous company] — especially [1 positive thing].',
      'After [X years], I felt I\'d hit the ceiling on [growth area], and I\'m looking for [specific next challenge].',
      'What draws me to this role is [industry trend / scale / specific project], which aligns with where I want to develop next.',
    ],
    external_resources: COMMON_INTERVIEW_RESOURCES,
  },
  {
    id: 'why-this-company',
    category: 'basic',
    question_en: 'Why do you want to work for our company?',
    question_zh: '為什麼想來我們公司？',
    focus: '功課有沒有做 · 三層次貢獻',
    why_asked: [
      '看你了不了解公司文化、價值觀',
      '看你懂不懂公司核心產品、發展方向',
      '確認你的過去經驗能產出什麼貢獻',
    ],
    what_they_expect: [
      '個人價值觀 × 公司文化的契合度',
      '對產品與業務的了解，能帶來什麼具體價值',
      '個人動機的層次：趨勢 / 成長 / 團隊',
    ],
    how_to_answer: [
      '個人價值觀綁定公司文化：講 1 個具體 value 對到你的經歷',
      '對產品做過分析：用你查到的最新新聞 / 財報 / 產品體驗切入',
      '用過去經驗說明具體貢獻度：「我在 A 公司做過 X，跟你們現在的 Y 挑戰高度相關」',
    ],
    what_to_avoid: [
      '「因為公司很有名 / 待遇好 / 我聽說 XX」',
      '講一堆讚美但沒具體事實支撐',
      '答案套到任何一家公司都能用',
    ],
    answer_outline: [
      'Three reasons drew me to [company]:',
      '1) Your [value/culture point] resonates with how I\'ve worked — for example, [personal story].',
      '2) I\'ve been following your [product/market move], and I think my experience in [X] can directly contribute to [Y].',
      '3) Long-term, I want to grow in [industry direction], and [company] is one of the best places to do that because [specific reason].',
    ],
    external_resources: [
      ...COMMON_INTERVIEW_RESOURCES,
      {
        title: 'How to Research a Company Before an Interview (The Muse)',
        url: 'https://www.themuse.com/advice/how-to-research-a-company-for-a-job-interview',
      },
    ],
  },
  {
    id: 'five-year-plan',
    category: 'basic',
    question_en: 'Where do you see yourself in 3–5 years?',
    question_zh: '你未來 3-5 年的規劃是什麼？',
    focus: '產業深耕 vs 職涯跳板',
    why_asked: [
      '看你有沒有清楚的規劃能力',
      '評估你的目標跟公司目標吻不吻合（影響留存率）',
      '判斷你是否值得公司花時間培養',
    ],
    what_they_expect: [
      '在特定產業/領域長期發展的意圖',
      '短中長期目標拆解（OKR 式）',
      '想接手更大專案 / 管理職 / mentor 他人',
    ],
    how_to_answer: [
      '短期（3 個月）：先熟悉團隊、產品、快速產出小成果',
      '中期（1-2 年）：獨立負責 XX 領域 / 專案，做出可量化成績',
      '長期（3-5 年）：深化產業專業、承擔更大 P&L、或 mentor / 帶團隊',
      '巧妙帶出「這個規劃跟貴公司的 XX 業務發展高度相關」',
    ],
    what_to_avoid: [
      '「想出國讀書」「想去 XX 產業」「想創業」— 公司會覺得培養你不值得',
      '答案完全跟這份工作無關的個人願景',
      '「我還沒想過」「順其自然」',
    ],
    answer_outline: [
      'In the first 3 months, I want to [ramp-up plan tied to role].',
      'In 1–2 years, I want to own [specific area/project] and deliver [measurable outcome].',
      'In 3–5 years, I see myself deepening my expertise in [industry/skill], ideally taking on [bigger scope: larger project / mentoring / cross-functional lead].',
      'This aligns well with [company\'s direction] because [specific reason].',
    ],
    external_resources: COMMON_INTERVIEW_RESOURCES,
  },
  {
    id: 'leadership-experience',
    category: 'basic',
    question_en: 'Tell me about your leadership experience.',
    question_zh: '談談你的領導經驗（P&G / Amazon 領導原則角度）',
    focus: '對照大廠 Leadership Principles',
    why_asked: [
      '看你能不能發揮影響力 — 不一定要有 title',
      '看你能不能洞見他人 / 團隊尚未被滿足的需求',
      '評估你跨部門推動策略的能力',
    ],
    what_they_expect: [
      '用數據支撐決策，不是憑感覺帶人',
      '主動發現問題，而不是等指派',
      '有換位思考、利益驅動的思維',
    ],
    how_to_answer: [
      '先看 JD 對照 P&G 5 values（Integrity / Leadership / Ownership / Passion for Winning / Trust）或 Amazon 16 LP，挑 2-3 條最相關的',
      '用 BAR+L 展開：Background → Action → Result → Learning',
      'Action 段要說「你怎麼影響他人」不是「你自己做了什麼」',
      '結尾點出對應的 leadership principle：「這體現了 Amazon 的 Ownership / Bias for Action」',
    ],
    what_to_avoid: [
      '「我當過班長 / 社長」這種學生時期例子（除非新鮮人）',
      '只講自己做了多少，沒講怎麼帶動別人',
      '沒有量化影響 impact',
    ],
    answer_outline: [
      'Context: I was [role], and we faced [challenge involving multiple people/teams].',
      'Action: Instead of [default approach], I [specific leadership move — influence, negotiate, coach, escalate].',
      'Result: [Metric — revenue, time saved, team NPS, adoption rate].',
      'Learning: This taught me [insight about leadership], which maps to [Amazon LP / P&G value].',
    ],
    external_resources: [
      {
        title: 'Amazon 16 Leadership Principles（本站整理）',
        url: '/interview/leadership/amazon',
      },
      ...BEHAVIORAL_RESOURCES,
    ],
  },
  {
    id: 'why-hire-you',
    category: 'basic',
    question_en: 'Why should we hire you?',
    question_zh: '為什麼我們應該錄取你？',
    focus: '收尾 · JD 對照 × 團隊缺口',
    why_asked: [
      '看你的說服力 — 一分鐘 pitch 能不能站得住',
      '確認你知道這份工作要產出什麼',
      '看你的答案跟前面內容邏輯是否一致',
    ],
    what_they_expect: [
      '過去核心技能能為公司帶來具體價值',
      '對公司需求的理解 + 願意跟團隊一起成長',
      '學習力、適應力、Resilience — 值得被投資',
    ],
    how_to_answer: [
      'JD matching：把 JD 前 3 大 requirements 對應到你 3 個具體經歷',
      '講出「你觀察到的團隊缺口」— 從面試中蒐集的線索',
      '結尾承諾未來能提供的具體價值：「進來 3/6/12 個月我能做到 XX」',
    ],
    what_to_avoid: [
      '「因為我很認真」這種抽象形容詞',
      '講一堆自己有多好但沒對到 JD',
      '硬背 pitch 沒有連接到剛才討論的內容',
    ],
    answer_outline: [
      'Based on what you shared, this role needs [top 3 requirements from JD/conversation].',
      'My background maps directly: [proof point 1], [proof point 2], [proof point 3].',
      'On top of the checklist, I noticed the team is dealing with [gap you observed] — that\'s where I\'ve done [specific past work], and I could contribute from day one.',
      'In the first 6 months, I\'d aim to [concrete deliverable].',
    ],
    external_resources: COMMON_INTERVIEW_RESOURCES,
  },

  // ===== BEHAVIORAL QUESTIONS =====
  {
    id: 'coping-with-pressure',
    category: 'behavioral',
    question_en: 'Describe a time when you were faced with problems or stresses that tested your coping skills.',
    question_zh: '描述一次高壓下處理問題的經驗',
    framework: 'BAR+L',
    focus: '抗壓 · 冷靜分析 · 復原力',
    why_asked: [
      '看抗壓性、能不能冷靜分析問題',
      '看積極性 / 創造性 / 解決問題能力',
      '看你有沒有跟相關人員好好溝通',
      '看你怎麼防止下次再發生',
    ],
    what_they_expect: [
      '清楚定義問題的方式',
      '解決方式（不是逃避）',
      '學習 + 事後復原力',
    ],
    how_to_answer: [
      'B - Background：時間點、專案、當時你的角色、壓力來自哪裡（時程？stakeholder？資源？）',
      'A - Action：先做了什麼優先級判斷？拉誰進來？做了哪些取捨？',
      'R - Result：量化影響（挽救了多少 revenue / 時程 / 客戶關係）',
      'L - Learning：下次會不會早一點做什麼？建立了什麼機制？',
    ],
    external_resources: BEHAVIORAL_RESOURCES,
  },
  {
    id: 'customer-expectations-miss',
    category: 'behavioral',
    question_en: 'Describe a situation when your work did not meet your customer\'s expectations.',
    question_zh: '一次工作沒達到客戶期待的經驗',
    framework: 'BAR+L',
    focus: '客戶思維 · 恢復信任',
    why_asked: [
      '看你怎麼定義「沒達到期待」— 是誰的鍋',
      '看你怎麼跟客戶溝通、恢復信任',
      '看你事後有沒有建立防護機制',
    ],
    what_they_expect: [
      '誠實面對，不推責任',
      '有具體的補救動作',
      '學到什麼讓下次不會再犯',
    ],
    how_to_answer: [
      'B：什麼客戶、什麼交付、期待跟實際的落差在哪',
      'A：第 1 步做了什麼止血？主動 vs 客戶反映後才做？',
      'R：客戶關係最終走向（保留 / 追加合作 / 學費付了但沒續約）',
      'L：後續建立什麼流程 / 文件 / 檢查點防止再犯',
    ],
    external_resources: BEHAVIORAL_RESOURCES,
  },
  {
    id: 'team-success-leadership',
    category: 'behavioral',
    question_en: 'Tell me about a time you were successful on a team or showed leadership.',
    question_zh: '一次團隊成功 / 展現領導力的經驗',
    framework: 'BAR+L',
    focus: '影響力 · 跨部門協作',
    why_asked: [
      '如何發揮影響力',
      '洞見他人 / 尚未被滿足的需求',
      '跨部門協作、推動策略',
    ],
    what_they_expect: [
      '用數據支撐決策',
      '主動發現問題、觀察現況',
      '換位思考、利益驅動',
    ],
    how_to_answer: [
      'B：多大的團隊、你的角色（不用是 title leader）、面對什麼共同目標',
      'A：你怎麼影響別人 — 溝通、談判、教練、對齊利益',
      'R：團隊產出 + 個人貢獻分開講',
      'L：對「領導力」的重新定義',
    ],
    external_resources: BEHAVIORAL_RESOURCES,
  },
  {
    id: 'failure-experience',
    category: 'behavioral',
    question_en: 'Tell me about a failure you were confronted with in your previous work. How did you handle it?',
    question_zh: '一次工作失敗經驗你怎麼處理',
    framework: 'BAR+L',
    focus: '責任感 · 學習成長',
    why_asked: [
      '看你抗壓性、是否能冷靜分析',
      '看你有沒有推責 vs 承擔',
      '看你怎麼從失敗中學習',
    ],
    what_they_expect: [
      '定義問題的方式',
      '具體解決方式（不只是 mindset）',
      '學習 + 事後復原能力',
    ],
    how_to_answer: [
      'B：真實失敗（不要用假失敗如「我太追求完美」），時間點、影響範圍',
      'A：發現當下 / 事後補救分兩段講',
      'R：損失控制到什麼程度，客戶 / 團隊反應',
      'L：真實學到什麼（具體到行為改變、流程建立）',
    ],
    what_to_avoid: [
      '「我最大的失敗是太完美主義」',
      '把責任推給隊友 / 主管 / 環境',
      '沒有具體行為改變的「反思」',
    ],
    external_resources: BEHAVIORAL_RESOURCES,
  },
  {
    id: 'cross-functional-communication',
    category: 'behavioral',
    question_en: 'Tell me about a time you worked effectively or communicated with people from different departments.',
    question_zh: '一次跨部門有效協作的經驗',
    framework: 'BAR+L',
    focus: '同理心 · 找共識',
    why_asked: [
      '具備同理心、傾聽、建立信任感',
      '能分辨不同 stakeholder 的需求',
      '找出權宜之計（什麼可以捨棄、什麼不能）',
    ],
    what_they_expect: [
      '理解對方觀點',
      '換位思考',
      '尋找共識的方法',
    ],
    how_to_answer: [
      'B：涉及哪些部門、雙方目標的衝突點在哪',
      'A：怎麼傾聽對方 → 找共同目標 → 提出交換條件',
      'R：達成什麼共識、雙方各得到什麼',
      'L：對「跨部門」溝通的洞察',
    ],
    external_resources: BEHAVIORAL_RESOURCES,
  },
  {
    id: 'high-pressure-project',
    category: 'behavioral',
    question_en: 'Tell me about a time you had to work under high pressure. Describe your most challenging project.',
    question_zh: '一個高壓 / 最有挑戰的專案',
    framework: 'BAR+L',
    focus: '挑戰 · 出包狀況',
    why_asked: [
      '抗壓性、冷靜分析能力',
      '積極性、創造性、解決問題',
      '相關人員溝通、如何快速止血',
      '如何防止下次發生',
    ],
    what_they_expect: [
      '定義問題方式',
      '解決方式',
      '學習 + 事後復原能力',
    ],
    how_to_answer: [
      'B：具體專案、規模、時程、你的角色',
      'A：拆解成小任務、找 leverage、與 stakeholder 對齊',
      'R：交付結果、影響數據',
      'L：專案結束後你對「高壓」的定義有沒有改變',
    ],
    external_resources: BEHAVIORAL_RESOURCES,
  },
  {
    id: 'identified-problem',
    category: 'behavioral',
    question_en: 'Tell us about a time you identified a problem, and how did you deal with the situation?',
    question_zh: '一次你主動發現問題並處理的經驗',
    framework: 'BAR+L',
    focus: '主動發現 · Ownership',
    why_asked: [
      '看你有沒有 ownership 心態',
      '看你怎麼定義問題（5W1H）',
      '看你的解法有沒有創造性',
    ],
    what_they_expect: [
      '不是「等指派」而是「主動發起」',
      '有結構化定義問題的能力',
      '解法有可行性、有 impact',
    ],
    how_to_answer: [
      'B：問題是別人沒看到的？還是大家知道但沒人動？',
      'A：怎麼定義問題 → 提案 → 找資源 → 執行',
      'R：解決了什麼、量化 impact',
      'L：這個經驗怎麼改變你看事情的方式',
    ],
    external_resources: BEHAVIORAL_RESOURCES,
  },
  {
    id: 'set-high-goal',
    category: 'behavioral',
    question_en: 'Tell me about a time you set a high goal and achieved it, or an innovative idea you\'re most proud of.',
    question_zh: '一次設定高目標並達成 / 最引以為傲的創新',
    framework: 'BAR+L',
    focus: '成就 · 創新',
    why_asked: [
      '你怎麼定義「成功」— 個人內在驅動力',
      '目標是否 align with company goal',
      '思考邏輯、是否跳脫框架',
      '跟應徵工作技能相關性',
    ],
    what_they_expect: [
      '創新的專案（不一定要顛覆，small innovation 也行）',
      '帶來什麼 impact',
      '有沒有感謝團隊、其他人的幫忙',
    ],
    how_to_answer: [
      'B：為什麼設這個高目標（外部逼？內部使命？）',
      'A：怎麼拆解、找資源、突破卡點',
      'R：量化成果 + 團隊貢獻分開講',
      'L：達成後對「高目標」的心態改變',
    ],
    external_resources: BEHAVIORAL_RESOURCES,
  },
  {
    id: 'simplify-process',
    category: 'behavioral',
    question_en: 'Have you ever found a better way to complete a task? Simplified the process to achieve the goal?',
    question_zh: '一次流程優化 / 找到更好做法的經驗',
    framework: 'BAR+L',
    focus: '效率 · 自動化',
    why_asked: [
      '時間管理技能',
      '找出優化之處的敏感度',
      '用最簡單方式獲得更好結果',
    ],
    what_they_expect: [
      '有沒有用自動化工具 / 建立 SOP',
      '省了多少錢、多少時間',
      '對企業帶來的長期效應',
    ],
    how_to_answer: [
      'B：原本流程長什麼樣、痛點在哪',
      'A：你觀察到什麼、怎麼提案、用了什麼工具',
      'R：優化後省了 X 小時 / X% 成本，影響多少人',
      'L：流程優化的思考框架',
    ],
    external_resources: BEHAVIORAL_RESOURCES,
  },
  {
    id: 'challenge-viewpoint',
    category: 'behavioral',
    question_en: 'Tell me about a time you challenged a colleague\'s or supervisor\'s point of view. Why did you challenge them and what was the outcome?',
    question_zh: '一次挑戰同事 / 主管觀點的經驗',
    framework: 'BAR+L',
    focus: '說服力 · Have Backbone',
    why_asked: [
      '你有沒有 backbone — 敢挑戰但不粗魯',
      '你是不是只挑戰、不 commit',
      '你有沒有能力用數據 / 邏輯說服',
    ],
    what_they_expect: [
      '理解對方觀點後才挑戰（不是為反對而反對）',
      '用結構化方式表達不同意',
      'Disagree and commit — 決策後全力執行',
    ],
    how_to_answer: [
      'B：分歧的議題、對方的立場、你的立場',
      'A：你怎麼準備 → 挑戰場合 → 說服邏輯',
      'R：最後採納誰的？後續怎麼合作？',
      'L：這件事教你什麼關於「有效挑戰」',
    ],
    external_resources: [
      ...BEHAVIORAL_RESOURCES,
      {
        title: 'Amazon LP: Have Backbone; Disagree and Commit',
        url: '/interview/leadership/amazon',
      },
    ],
  },

  // ===== SALARY =====
  {
    id: 'salary-expectation',
    category: 'salary',
    question_en: 'What is your salary range expectation?',
    question_zh: '你的期望薪資範圍是多少？',
    focus: '市場行情 + 個人價值',
    why_asked: [
      '確認你的期望是否超過預算',
      '如果給太高會不會破壞內部薪資平衡',
      '想給予你未來成長的空間',
    ],
    what_they_expect: [
      '你有做過功課，知道市場行情',
      '有底氣說出 range 而不是「開多少都可以」',
      '如果超出對方預算，能用邏輯解釋為什麼你值得',
    ],
    how_to_answer: [
      '策略 1：反問「What range did you have budgeted for this position?」— 把資訊差降低',
      '策略 2：報 range 不報單一數字，例如「Based on my research and X years of experience, I\'m looking at 1.2M–1.5M NTD」',
      '策略 3：把 total package 拆開講 — base、bonus、equity、簽約金分別討論',
      '準備刁難題：「你沒帶人經驗、年資不到、你轉職不符核心規則」，事先想好回應',
    ],
    what_to_avoid: [
      '「I don\'t know」「Up to the company」— 沒準備',
      '報比市場行情低太多 — 事後很難漲回來',
      '只講 base salary 忽略其他 package 組成',
    ],
    answer_outline: [
      'Before I share a number, may I ask what range you\'ve budgeted for this role?',
      '(If they insist you go first) Based on my research on [source: Levels.fyi, 104 salary survey], and given my [X years, specific skill], I\'m targeting [range: e.g. 1.2M–1.5M NTD annually].',
      'That said, I\'m open to discussing the whole package — base, bonus, equity, and growth opportunities.',
    ],
    external_resources: [
      {
        title: 'Levels.fyi（科技業薪資查詢）',
        url: 'https://www.levels.fyi/',
        note: 'FAANG + 台灣科技業，數據最全',
      },
      {
        title: '104 薪資情報',
        url: 'https://guide.104.com.tw/salary/',
        note: '台灣本地職缺薪資參考',
      },
      {
        title: 'Glassdoor Salaries',
        url: 'https://www.glassdoor.com/Salaries/',
        note: '國際市場薪資 + 面試回饋',
      },
      {
        title: 'Payscale Salary Report',
        url: 'https://www.payscale.com/',
      },
      {
        title: 'HBR: 15 Rules for Negotiating a Job Offer',
        url: 'https://hbr.org/2014/04/15-rules-for-negotiating-a-job-offer',
        note: 'Deepak Malhotra 談判經典文',
      },
    ],
  },

  // ===== ASK-BACK =====
  {
    id: 'ask-back-hr',
    category: 'ask-back',
    question_en: 'Do you have any questions for me? (interviewing with HR)',
    question_zh: '你對 HR / 招聘人員有什麼想問的？',
    focus: '結尾加分題 · 問對 HR 的問題',
    why_asked: [
      '看你有沒有為這場面試準備',
      '看你在意什麼 — 錢？成長？文化？',
      '看你有沒有能力問「非官網查得到」的問題',
    ],
    what_they_expect: [
      '準備 3-5 個問題，不是「沒問題了」',
      '問題有分層次：職缺、團隊、公司',
      '至少 1 個問題展現你有做功課（引用新聞 / 財報 / 產品）',
    ],
    how_to_answer: [
      '✅ 好問題（對 HR）：',
      '  · 公司薪資結構、調薪頻率、培訓資源（面試快結束時問）',
      '  · 這個職缺為什麼開？找多久了？',
      '  · 目前面試者的背景 / 年資大概是？',
      '  · 公司內部風氣、文化是怎樣',
      '  · 主管風格、團隊組成結構',
      '  · 下一關要跟誰面試？有什麼要注意的？',
      '  · 面試流程還有幾關？',
      '❌ 不建議：',
      '  · 官網 / LinkedIn 查得到的公司資訊',
      '  · 「薪水會開多少？」（太早）',
      '  · 跟職缺無關的問題',
      '  · 「沒有額外問題想問」',
    ],
    external_resources: [
      {
        title: 'HBR: 38 Smart Questions to Ask in an Interview',
        url: 'https://hbr.org/2022/05/38-smart-questions-to-ask-in-a-job-interview',
      },
    ],
  },
  {
    id: 'ask-back-manager',
    category: 'ask-back',
    question_en: 'Do you have any questions for me? (interviewing with hiring manager)',
    question_zh: '你對用人主管有什麼想問的？',
    focus: '結尾加分題 · 問對主管的問題',
    why_asked: [
      '看你關注職缺本身還是外圍',
      '看你有沒有 90 天思維',
      '看你能不能問出「主管在意的問題」',
    ],
    what_they_expect: [
      '職缺相關 > 團隊相關 > 公司相關',
      '問「未來」的問題比問「過去」有力',
      '至少 1 題引用你觀察到的產業 / 公司動態',
    ],
    how_to_answer: [
      '層次 1 · 職缺本身：',
      '  · 為什麼會開出這個職缺？',
      '  · 進來 3 個月你對這個位置的期待是什麼？',
      '  · 你怎麼衡量這個職缺的成功？',
      '  · 現在這個職缺面對什麼挑戰？',
      '  · 我期待 X 年可以獲得 XX 經驗，這裡有機會嗎？',
      '層次 2 · 產業 / 公司趨勢：',
      '  · 我看到公司最近 [新聞 / 財報]，這對團隊跟這個職缺會有什麼影響？',
      '層次 3 · 領導、組織、文化：',
      '  · 團隊多少人？大家專業跟分工是？',
      '  · 你怎麼定義團隊成功、個人成功？',
      '  · 部門之間怎麼協作？',
      '  · 你當初為什麼加入這家公司？',
    ],
    external_resources: [
      {
        title: 'HBR: 38 Smart Questions to Ask in an Interview',
        url: 'https://hbr.org/2022/05/38-smart-questions-to-ask-in-a-job-interview',
      },
      {
        title: 'First Round: Questions to Ask Your Future Manager',
        url: 'https://review.firstround.com/the-30-best-questions-to-ask-in-a-job-interview/',
      },
    ],
  },
]

export const CATEGORY_META: Record<
  QuestionCategory,
  { title: string; emoji: string; desc: string; order: number }
> = {
  basic: {
    title: '基本題',
    emoji: '🎯',
    desc: '7 題必考題，從自我介紹到「為何錄取你」的收尾',
    order: 1,
  },
  behavioral: {
    title: '行為題',
    emoji: '🧭',
    desc: '10 題 BAR+L 情境題，領導、失敗、跨部門、影響力全包',
    order: 2,
  },
  salary: {
    title: '談薪水',
    emoji: '💰',
    desc: 'Salary range 攻防 + 6 個實用談判技巧',
    order: 3,
  },
  'ask-back': {
    title: '反問老闆',
    emoji: '💬',
    desc: '面試最後那句「有沒有問題？」的加分題庫',
    order: 4,
  },
}

export function getQuestionsByCategory(cat: QuestionCategory): PracticeQuestion[] {
  return INTERVIEW_QUESTIONS.filter((q) => q.category === cat)
}

export function getQuestionById(id: string): PracticeQuestion | undefined {
  return INTERVIEW_QUESTIONS.find((q) => q.id === id)
}
