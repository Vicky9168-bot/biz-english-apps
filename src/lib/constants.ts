// ============================================
// 商務英語學習網站 - 共用常數
// ============================================

export const JOB_TITLES = [
  'PM',
  'Engineer',
  'Sales',
  'Marketing',
  'Finance',
  'HR',
  'Founder',
  'Consultant',
  'Designer',
  'Other',
] as const

export const INDUSTRIES = [
  '科技 / 軟體',
  '金融 / 投資',
  '電商 / 零售',
  '製造業',
  '醫療 / 生技',
  '顧問服務',
  '教育',
  '媒體 / 廣告',
  '其他',
] as const

export const ENGLISH_CHALLENGES = [
  { value: 'negotiation', label: '談判 (Negotiation)' },
  { value: 'presentation', label: '簡報 (Presentation)' },
  { value: 'meeting', label: '會議發言 (Meeting)' },
  { value: 'email', label: 'Email 溝通' },
  { value: 'interview', label: '面試 (Interview)' },
  { value: 'small_talk', label: 'Small Talk / 社交' },
  { value: 'cold_call', label: 'Cold Call / 電話溝通' },
] as const

export const PROFICIENCY_LEVELS = [
  { value: 1, label: 'Beginner (A1-A2)', description: '基礎溝通、簡單日常對話' },
  { value: 2, label: 'Elementary (A2-B1)', description: '能處理常見情境' },
  { value: 3, label: 'Intermediate (B1-B2)', description: '能參與大部分商務對話' },
  { value: 4, label: 'Upper-Intermediate (B2-C1)', description: '能流利表達複雜想法' },
  { value: 5, label: 'Advanced (C1-C2)', description: '接近母語程度' },
] as const

// Part 3：13 個商務溝通框架
export const FRAMEWORKS = {
  STAR: {
    name: 'STAR',
    fullName: 'Situation → Task → Action → Result',
    category: 'narrative',
    description: '面試、專案回顧、經驗分享',
    structure: [
      { key: 'S', label: 'Situation', hint: '當時的情境' },
      { key: 'T', label: 'Task', hint: '面對的任務或目標' },
      { key: 'A', label: 'Action', hint: '採取的行動' },
      { key: 'R', label: 'Result', hint: '結果（量化最好）' },
    ],
  },
  CAR: {
    name: 'CAR',
    fullName: 'Context → Action → Result',
    category: 'narrative',
    description: '簡化版 STAR，快速分享',
    structure: [
      { key: 'C', label: 'Context', hint: '背景' },
      { key: 'A', label: 'Action', hint: '行動' },
      { key: 'R', label: 'Result', hint: '結果' },
    ],
  },
  PPF: {
    name: 'PPF',
    fullName: 'Past → Present → Future',
    category: 'narrative',
    description: '職涯故事、公司介紹',
    structure: [
      { key: 'P1', label: 'Past', hint: '過去' },
      { key: 'P2', label: 'Present', hint: '現在' },
      { key: 'F', label: 'Future', hint: '未來' },
    ],
  },
  PREP: {
    name: 'PREP',
    fullName: 'Point → Reason → Example → Point',
    category: 'expression',
    description: '會議發言、電梯簡報',
    structure: [
      { key: 'P1', label: 'Point', hint: '結論' },
      { key: 'R', label: 'Reason', hint: '理由' },
      { key: 'E', label: 'Example', hint: '例子' },
      { key: 'P2', label: 'Point', hint: '重申結論' },
    ],
  },
  BLUF: {
    name: 'BLUF',
    fullName: 'Bottom Line Up Front',
    category: 'expression',
    description: 'Email、直接匯報',
    structure: [
      { key: 'B', label: 'Bottom Line', hint: '結論先講' },
      { key: 'C', label: 'Context', hint: '背景說明' },
      { key: 'D', label: 'Details', hint: '細節' },
    ],
  },
  PYRAMID: {
    name: 'Pyramid',
    fullName: 'Pyramid Principle',
    category: 'expression',
    description: '高階簡報、麥肯錫式溝通',
    structure: [
      { key: 'A', label: 'Answer', hint: '核心結論' },
      { key: 'S', label: 'Sub-arguments', hint: '3 個支持論點' },
      { key: 'D', label: 'Data', hint: '證據 / 數據' },
    ],
  },
  RULE_OF_3: {
    name: 'Rule of 3',
    fullName: '3 個重點法則',
    category: 'expression',
    description: '演講、記憶點強化',
    structure: [
      { key: '1', label: 'Point 1', hint: '第一個重點' },
      { key: '2', label: 'Point 2', hint: '第二個重點' },
      { key: '3', label: 'Point 3', hint: '第三個重點' },
    ],
  },
  SCQA: {
    name: 'SCQA',
    fullName: 'Situation → Complication → Question → Answer',
    category: 'story',
    description: '提案、寫作、開場破冰',
    structure: [
      { key: 'S', label: 'Situation', hint: '穩定情境' },
      { key: 'C', label: 'Complication', hint: '出現變化' },
      { key: 'Q', label: 'Question', hint: '關鍵問題' },
      { key: 'A', label: 'Answer', hint: '你的答案' },
    ],
  },
  PSB: {
    name: 'Problem-Solution-Benefit',
    fullName: 'Problem → Solution → Benefit',
    category: 'story',
    description: '內部提案、產品簡報',
    structure: [
      { key: 'P', label: 'Problem', hint: '問題' },
      { key: 'S', label: 'Solution', hint: '解方' },
      { key: 'B', label: 'Benefit', hint: '效益' },
    ],
  },
  AIDA: {
    name: 'AIDA',
    fullName: 'Attention → Interest → Desire → Action',
    category: 'sales',
    description: 'Cold Call、行銷、Pitch',
    structure: [
      { key: 'A', label: 'Attention', hint: '吸引注意' },
      { key: 'I', label: 'Interest', hint: '引起興趣' },
      { key: 'D', label: 'Desire', hint: '創造渴望' },
      { key: 'A2', label: 'Action', hint: '行動呼籲' },
    ],
  },
  FAB: {
    name: 'FAB',
    fullName: 'Feature → Advantage → Benefit',
    category: 'sales',
    description: '產品介紹、Demo',
    structure: [
      { key: 'F', label: 'Feature', hint: '功能' },
      { key: 'A', label: 'Advantage', hint: '優勢' },
      { key: 'B', label: 'Benefit', hint: '對客戶的好處' },
    ],
  },
  SPIN: {
    name: 'SPIN',
    fullName: 'Situation → Problem → Implication → Need-payoff',
    category: 'sales',
    description: 'B2B 銷售、需求探詢',
    structure: [
      { key: 'S', label: 'Situation', hint: '現況問題' },
      { key: 'P', label: 'Problem', hint: '困難問題' },
      { key: 'I', label: 'Implication', hint: '影響問題' },
      { key: 'N', label: 'Need-payoff', hint: '需求回報問題' },
    ],
  },
  FEEL: {
    name: 'FEEL',
    fullName: 'Feel → Felt → Found',
    category: 'negotiation',
    description: '客戶抱怨、反對處理',
    structure: [
      { key: 'F1', label: 'Feel', hint: '我了解你的感受' },
      { key: 'F2', label: 'Felt', hint: '其他人也曾這樣感受' },
      { key: 'F3', label: 'Found', hint: '他們後來發現...' },
    ],
  },
  YES_AND: {
    name: 'Yes, And...',
    fullName: 'Yes, And 接受並延伸',
    category: 'negotiation',
    description: '談判、腦力激盪、合作',
    structure: [
      { key: 'Y', label: 'Yes', hint: '接受對方觀點' },
      { key: 'A', label: 'And', hint: '延伸或補充' },
    ],
  },
} as const

export type FrameworkKey = keyof typeof FRAMEWORKS

// 首頁功能清單（單一來源）：group 決定首頁分組，preview 供輪播卡片右側展示
export type FeatureKey =
  | 'charades'
  | 'listening'
  | 'speaking'
  | 'idioms'
  | 'reading'
  | 'resume'
  | 'interview'

export const FEATURE_GROUPS = [
  { key: 'business', title: '商用英文', subtitle: '日常職場即戰力，Part 1-4' },
  { key: 'career', title: '求職英文', subtitle: '換工作衝刺區，Part 5-6' },
] as const

export const FEATURES: readonly {
  key: FeatureKey
  href: string
  emoji: string
  title: string
  desc: string
  tag: string
  group: (typeof FEATURE_GROUPS)[number]['key']
  headline?: string
  preview?: { label: string; text: string }
}[] = [
  {
    key: 'charades',
    headline: 'guess the word',
    href: '/charades',
    emoji: '🎯',
    title: '比手畫腳單字',
    desc: '每天 5 題，語音互動 + AI 即時猜詞',
    tag: 'Part 1',
    group: 'business',
    preview: {
      label: '今日單字',
      text: 'leverage — 用英文描述它，讓 AI 猜出答案',
    },
  },
  {
    key: 'listening',
    href: '/listening',
    emoji: '🎧',
    title: '聽力訓練',
    desc: '先學 Content Words 策略，再進商務對話練習',
    tag: 'Part 2',
    group: 'business',
  },
  {
    key: 'speaking',
    headline: 'say it like a pro',
    href: '/speaking',
    emoji: '🎬',
    title: '商業場景練習',
    desc: 'STAR / PREP / SCQA 框架 · 錄音 + AI 四維評分',
    tag: 'Part 3',
    group: 'business',
    preview: {
      label: '場景題',
      text: 'Your client says the price is too high. How do you respond?',
    },
  },
  {
    key: 'idioms',
    href: '/idioms',
    emoji: '💬',
    title: '商務俚語練習',
    desc: '100 個會議、談判常用 idioms · 情境選擇題',
    tag: 'Part 4',
    group: 'business',
  },
  {
    key: 'reading',
    href: '/reading',
    emoji: '📰',
    title: '每日商業閱讀',
    desc: '國際媒體每日新聞解說 · 點字查詞 + 生字本練習',
    tag: '每日',
    group: 'business',
  },
  {
    key: 'resume',
    href: '/resume',
    emoji: '📄',
    title: '英文履歷',
    desc: 'Summary、Experience bullets、Cover letter，AI 幫你補動詞 + 加數據',
    tag: 'Part 5',
    group: 'career',
  },
  {
    key: 'interview',
    headline: 'ace the interview',
    href: '/interview',
    emoji: '🎤',
    title: '英文模擬面試',
    desc: 'Behavioral、HR 常見題、反問老闆，AI 用 STAR 框架評分',
    tag: 'Part 6',
    group: 'career',
    preview: {
      label: '面試題',
      text: 'Tell me about a time you led a project under a tight deadline.',
    },
  },
]

// 首頁熱門輪播的順序（先手動精選，之後可改成依使用量排序的結果）
export const HOME_CAROUSEL_KEYS: readonly FeatureKey[] = [
  'charades',
  'speaking',
  'interview',
]

export const SCENARIO_TYPES = [
  { value: 'negotiation', label: '談判', frameworks: ['STAR', 'FEEL', 'YES_AND'] },
  { value: 'presentation', label: '簡報', frameworks: ['PREP', 'PYRAMID', 'RULE_OF_3', 'SCQA'] },
  { value: 'meeting', label: '會議', frameworks: ['PREP', 'BLUF', 'SCQA'] },
  { value: 'cold_call', label: 'Cold Call', frameworks: ['AIDA', 'SPIN'] },
  { value: 'interview', label: '面試', frameworks: ['STAR', 'CAR', 'PPF'] },
  { value: 'complaint_handling', label: '客訴處理', frameworks: ['FEEL', 'PSB'] },
  { value: 'small_talk', label: 'Small Talk', frameworks: ['PPF', 'YES_AND'] },
  { value: 'product_demo', label: '產品 Demo', frameworks: ['FAB', 'PSB'] },
] as const

// ============================================
// 方案與權限（價格為暫定，上線前再調整）
// ============================================

export const PLANS = {
  free: {
    name: 'Free',
    label: '免費體驗',
    price: 'NT$0',
    period: '永久免費',
    tagline: '先體驗學習方法，每天打卡練手感',
    cta: '免費開始',
  },
  pro: {
    name: 'Pro',
    label: '完整方案',
    price: 'NT$399',
    period: '/ 月',
    yearly: '年繳 NT$3,290，約 69 折',
    tagline: '無限 AI 評分，把求職與商務場合練到位',
    cta: '搶先加入 Pro',
  },
} as const

// 各功能在兩種方案下的額度；ai = 是否包含 AI 即時回饋（成本來源）
export const PLAN_ACCESS: readonly {
  key: FeatureKey
  free: string
  pro: string
  ai: boolean
}[] = [
  { key: 'charades', free: '每天 1 題', pro: '每天 5 題，不限複習', ai: true },
  {
    key: 'listening',
    free: 'Content Words 策略課 + 每週 1 組對話',
    pro: '全部商務對話，不限次數',
    ai: false,
  },
  {
    key: 'speaking',
    free: '框架教學 + 每週 1 次 AI 評分',
    pro: '無限錄音 + AI 四維評分',
    ai: true,
  },
  { key: 'idioms', free: '前 30 個俚語', pro: '全部 100 個 + 錯題複習', ai: false },
  {
    key: 'resume',
    free: '範例瀏覽 + Summary 體驗 1 次',
    pro: 'Summary、Experience、Cover letter 全套 AI 改寫',
    ai: true,
  },
  {
    key: 'interview',
    free: '3 題體驗',
    pro: '完整題庫 + STAR 框架 AI 評分',
    ai: true,
  },
]

export const PLAN_FREE_PERKS = ['連續打卡與學習統計', '完整成就紀錄', '依職位與產業客製化題目'] as const

export const PRICING_FAQ = [
  {
    q: '免費版有時間限制嗎？',
    a: '沒有。免費版永久可用，額度會每天或每週重置。',
  },
  {
    q: '什麼時候開放付費？',
    a: '付費功能還在準備中，現在加入的使用者可以優先收到通知。',
  },
  {
    q: '可以隨時取消嗎？',
    a: '可以。月繳方案隨時取消，當期結束前仍可使用完整功能。',
  },
] as const
