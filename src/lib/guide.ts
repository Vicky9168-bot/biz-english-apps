import type { FeatureKey } from '@/lib/constants'

// 新手指南與首頁導覽的文案（單一來源）。功能名稱、說明與連結本身仍以 constants.ts 的 FEATURES 為準。

export const WORD_FLOW = [
  {
    n: 1,
    title: '讀文章，存下不熟的單字',
    desc: '到「每日商業閱讀」讀一篇文章，點不熟的單字看它在這句話的意思，再按「存到生字本」。',
    href: '/reading',
    cta: '去讀今天的文章',
  },
  {
    n: 2,
    title: '到生字本，用原句挖空練習',
    desc: '「我的生字本」會用你存字時的原句挖空，讓你選出正確的意思；答錯越多的字，越早出現。',
    href: '/reading/vocab',
    cta: '開啟生字本',
  },
  {
    n: 3,
    title: '用你的生字玩比手畫腳',
    desc: '在比手畫腳選「用我的生字玩」，看到單字後用英文描述，讓 AI 來猜。',
    href: '/charades',
    cta: '去玩比手畫腳',
  },
  {
    n: 4,
    title: '沒猜中的字，一鍵加回單字本',
    desc: '用一般模式練習時，沒猜中的字會列在結算畫面，按「加入單字本」就能放進生字本。',
    href: '/charades',
    cta: '前往比手畫腳',
  },
] as const

export const FEATURE_GUIDE: Record<FeatureKey, { start: string; steps: string[] }> = {
  reading: {
    start: '每天從這裡開始：讀一篇商業新聞的英文解說。',
    steps: [
      '選一個類別：財金、行銷、AI 趨勢、科技、國際社會。',
      '點任何單字查它在這句話的意思，按「存到生字本」；可以開關中文翻譯。',
      '當天文章還沒準備好時會自動產生，需要稍等一下。',
      '到「往期文章」可以回頭複習之前讀過的。',
    ],
  },
  charades: {
    start: '用英文描述單字，讓 AI 猜出來；需要允許瀏覽器使用麥克風。',
    steps: [
      '「我來描述」：AI 給你一個字，你用英文描述它，不能直接說出這個字。',
      '「AI 來描述」：AI 描述一個字，你用英文猜。',
      '每個字最多 3 次機會，越快猜中，星星越多。',
      '「用我的生字玩」會從你的單字本抽題，不計入排行榜。',
    ],
  },
  listening: {
    start: '先學抓重點單字的策略，再進商務對話練習。',
    steps: [
      '第一次進聽力，會先上一堂 Content Words 小課，學會只抓實詞；之後可從「複習 Content Words」重看。',
      '選一個場景（或隨機抽），按「開始今日聽力訓練」，AI 現場生成約 60–90 秒的對話。',
      '播放音檔；聽不清楚可以調速度、從頭再聽，或顯示原文。',
      '答 3 題（實詞、細節、推論），送出後馬上看正解和解說。',
      '另有「從影片練習」：答完題目後可接著跟讀（Shadowing），AI 檢查發音與流暢度。',
    ],
  },
  speaking: {
    start: '用框架回答商業場景題，錄音後由 AI 評分。',
    steps: [
      '依框架（STAR、PREP、SCQA、Pyramid、數據簡報 DIA、業務談判 VTC）挑一個場景；沒有想練的可以自訂。',
      '看「對方問你」和框架應用提示，可以先花 30 秒思考，再按錄音；需要允許瀏覽器使用麥克風。',
      '用英文回答，建議 30–90 秒，錄滿 90 秒會自動結束。',
      'AI 給 4 大面向評分（框架、商務用詞、文法、流暢度）、逐句改寫和模範答案。',
    ],
  },
  idioms: {
    start: '用情境例句練會議、談判常用的英文俚語。',
    steps: [
      '每天最多 10 題新題，達標後可以改做複習。',
      '看情境例句，選出俚語的中文意思。',
      '答錯的會進入複習，優先抽出來再練。',
    ],
  },
  resume: {
    start: '把「做過什麼」改寫成「影響是什麼」的英文履歷。',
    steps: [
      '依序練 Professional Summary、Work Experience、Cover Letter。',
      'Resume Health Check：貼上職缺描述和你的英文履歷，AI 打分並改寫。',
    ],
  },
  interview: {
    start: '從自我介紹到反問老闆，練習英文面試的常見題。',
    steps: [
      '共 20 題實戰題：自我介紹、行為題、談薪水、反問老闆。',
      '回答後給你思考建議、答題大綱與外部資源。',
      '可用 STAR 框架檢視自己的回答。',
    ],
  },
}

export const FAQ = [
  {
    q: '每日商業閱讀的文章什麼時候換新？',
    a: '台北時間每天 00:00 換新，每個類別每天一篇，過去的文章都會保留在「往期文章」。',
  },
  {
    q: '文章是真的新聞嗎？',
    a: '它是 AI 依 BBC、CNBC、TechCrunch 等媒體當日新聞的標題與摘要寫成的英文學習解說，並附上原文連結；不是原文全文或翻譯，細節與數據請以原文報導為準。',
  },
  {
    q: '我存的單字會放在哪裡？',
    a: '都在「我的生字本」。不管是從閱讀或比手畫腳存的，來源都會標在單字旁邊；同一個字在不同地方出現，原句會累積在一起。',
  },
  {
    q: '用我的生字玩，會算進排行榜嗎？',
    a: '不會。字是你自己選的，難度不一，所以不計入排行榜；但仍會算進你的今日進度與連續打卡。',
  },
  {
    q: '麥克風不能用怎麼辦？',
    a: '點瀏覽器網址列左邊的鎖頭或設定圖示，把麥克風設為「允許」，再重新整理頁面。',
  },
] as const

export type TourStep = {
  // 對應頁面上 data-tour 屬性；沒有 target 的步驟會置中顯示
  target?: string
  title: string
  description: string
  side?: 'top' | 'bottom' | 'left' | 'right'
  // 預設靠左對齊；橫跨整個畫面寬度的區塊用 center，說明框才不會貼在最左邊
  align?: 'start' | 'center' | 'end'
}

export const TOUR_STEPS: TourStep[] = [
  {
    title: '歡迎來到 BizVoice',
    description: '花 1 分鐘認識該從哪裡開始。想跳過隨時按 Esc 或右上角的 ✕。',
  },
  {
    target: 'stats',
    title: '這裡是你的學習紀錄',
    description: '連續打卡天數和本月學習分鐘數。每天練一點，就會一天天累積。',
    side: 'bottom',
    align: 'center',
  },
  {
    target: 'feature-reading',
    title: '每天從清單的第一個開始',
    description:
      '每天一篇商業新聞的英文解說。讀的時候點不熟的單字，就能存進生字本；其他功能都在這份清單裡。',
    side: 'top',
  },
  {
    target: 'feature-charades',
    title: '接著，把存下來的字拿來玩',
    description:
      '比手畫腳可以選「用我的生字玩」，用英文描述單字讓 AI 猜；沒猜中的字也能一鍵加回單字本。',
    side: 'bottom',
  },
  {
    target: 'group-career',
    title: '還有求職英文',
    description: '英文履歷和模擬面試在這一區，換工作的時候再來也不遲。',
    side: 'top',
  },
  {
    target: 'nav-guide',
    title: '忘記怎麼用？來這裡',
    description: '新手指南有 1 分鐘教學影片和每個功能的使用方式，也可以從這裡重新開始導覽。',
    side: 'bottom',
    align: 'end',
  },
]
