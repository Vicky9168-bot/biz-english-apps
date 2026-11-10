export type LeadershipPrinciple = {
  id: string
  name_en: string
  name_zh: string
  description: string
  example_question?: string
}

export type ValueFramework = {
  slug: string
  company: string
  title: string
  subtitle: string
  intro: string
  principles: LeadershipPrinciple[]
  source_url: string
}

export const AMAZON_LEADERSHIP_PRINCIPLES: ValueFramework = {
  slug: 'amazon',
  company: 'Amazon',
  title: 'Amazon 16 條領導原則',
  subtitle: 'Leadership Principles',
  intro:
    'Amazon 面試每一題行為題背後都對應到這 16 條原則，面試官會拿著 rubric 幫你打分。準備行為題時，先看你的故事對應到哪一條，講的時候刻意把關鍵字帶出來。',
  source_url: 'https://www.amazon.jobs/content/en/our-workplace/leadership-principles',
  principles: [
    {
      id: 'customer-obsession',
      name_en: 'Customer Obsession',
      name_zh: '顧客至上',
      description:
        '從顧客出發往回推，努力贏得並維持顧客信任。雖然會關注競爭對手，但永遠以顧客為優先。',
      example_question: 'Tell me about a time you went above and beyond for a customer.',
    },
    {
      id: 'ownership',
      name_en: 'Ownership',
      name_zh: '主人翁精神',
      description:
        '從長期出發思考，不會為了短期結果犧牲長期價值。「這不是我的工作」不會出現在你的字典裡。',
      example_question:
        'Describe a time you took ownership of a project outside your job scope.',
    },
    {
      id: 'invent-and-simplify',
      name_en: 'Invent and Simplify',
      name_zh: '創新與簡化',
      description:
        '期待團隊創新和發明，並找到簡化流程的方法。對外保持關注，四處尋找新的想法。',
      example_question: 'Give an example of a process you invented or radically simplified.',
    },
    {
      id: 'are-right-a-lot',
      name_en: 'Are Right, A Lot',
      name_zh: '判斷準確',
      description:
        '判斷力強，直覺敏銳。會主動尋找不同觀點，並樂於挑戰自己的想法。',
      example_question: 'Tell me about a time your judgment was proven right despite pushback.',
    },
    {
      id: 'learn-and-be-curious',
      name_en: 'Learn and Be Curious',
      name_zh: '好奇求知',
      description:
        '永不停止學習，總是設法提升自己。對各種可能性充滿好奇並付諸行動探索。',
      example_question: 'Tell me about a time you learned something new to solve a problem.',
    },
    {
      id: 'hire-and-develop',
      name_en: 'Hire and Develop the Best',
      name_zh: '選賢育能',
      description:
        '每次招聘和晉升都要提高標準。認可傑出人才，願意讓他們在組織內流動發展。',
      example_question: 'Describe how you developed a direct report or teammate.',
    },
    {
      id: 'highest-standards',
      name_en: 'Insist on the Highest Standards',
      name_zh: '堅持最高標準',
      description:
        '不斷提高標準，帶動團隊交付高品質產品與服務。不允許問題擴散，會從根本上解決。',
      example_question: 'Tell me about a time you refused to accept subpar work.',
    },
    {
      id: 'think-big',
      name_en: 'Think Big',
      name_zh: '大格局思考',
      description:
        '小格局思考會自我設限。要大膽制定並傳達願景，以激發成果。思考不同的方式，從各個角度為顧客服務。',
      example_question: 'Describe a time you proposed a bold, long-term idea.',
    },
    {
      id: 'bias-for-action',
      name_en: 'Bias for Action',
      name_zh: '崇尚行動',
      description:
        '商業世界重視速度。許多決策和行動是可逆的，不需要過多研究。我們重視經過計算的冒險。',
      example_question: 'Tell me about a time you had to make a decision with incomplete data.',
    },
    {
      id: 'frugality',
      name_en: 'Frugality',
      name_zh: '勤儉節約',
      description:
        '用更少做更多。限制會催生靈活、自立與創造。人員、預算或固定支出增加並不會加分。',
      example_question: 'Give an example of achieving more with fewer resources.',
    },
    {
      id: 'earn-trust',
      name_en: 'Earn Trust',
      name_zh: '贏得信任',
      description:
        '認真傾聽，坦誠表達，尊重待人。即便可能難堪也要勇於自我批評。不會假設自己或團隊的味道總是清新的。',
      example_question: 'Tell me about a time you had to rebuild trust with a colleague.',
    },
    {
      id: 'dive-deep',
      name_en: 'Dive Deep',
      name_zh: '追根究底',
      description:
        '各層級的領導者都要親力親為，時常查核細節，遇到指標和實際狀況不符時會發出質疑。沒有任何任務不值得他們動手。',
      example_question: 'Describe a time you uncovered a root cause others missed.',
    },
    {
      id: 'have-backbone',
      name_en: 'Have Backbone; Disagree and Commit',
      name_zh: '敢於諫言，服從大局',
      description:
        '面對不認同的決策必須恭敬地提出異議，即使這樣做並不容易。一旦決定就全力執行。',
      example_question: 'Tell me about a time you disagreed with your manager.',
    },
    {
      id: 'deliver-results',
      name_en: 'Deliver Results',
      name_zh: '達成業績',
      description:
        '聚焦於業務關鍵指標，以正確的品質與及時的方式交付。遇到挫折時奮起面對，絕不妥協。',
      example_question: 'Give an example of a project where you delivered results under pressure.',
    },
    {
      id: 'strive-to-be-best-employer',
      name_en: "Strive to be Earth's Best Employer",
      name_zh: '成為地球上最好的雇主',
      description:
        '致力於營造更安全、更有生產力、更多元、更公平的職場。用同理心領導，讓每一位員工都能發揮潛能。',
      example_question: 'Describe how you built or improved team culture.',
    },
    {
      id: 'broad-responsibility',
      name_en: 'Success and Scale Bring Broad Responsibility',
      name_zh: '規模愈大，責任愈大',
      description:
        '每一項決策和行動都要顧及對社會、顧客、員工與地球的影響。要對後果謙卑並負責。',
      example_question: 'Tell me about a decision where you had to consider broader impact.',
    },
  ],
}

export const PG_VALUES: ValueFramework = {
  slug: 'pg',
  company: 'P&G',
  title: 'P&G 5 大價值觀',
  subtitle: 'Purpose, Values & Principles',
  intro:
    'P&G 面試（尤其是 assessment 與行為題）圍繞這 5 大價值觀。準備時把你的故事對應到「Leadership、Integrity、Ownership、Trust、Passion」其中一項，用具體案例佐證。',
  source_url:
    'https://us.pg.com/policies-and-practices/purpose-values-and-principles/',
  principles: [
    {
      id: 'leadership',
      name_en: 'Leadership',
      name_zh: '領導力',
      description:
        '在自己的責任範圍內成為領導者，為公司短期與長期成功發展願景。以清晰的優先順序帶動團隊，透過人才與能力打造競爭優勢。',
      example_question: 'Tell me about a time you led without formal authority.',
    },
    {
      id: 'ownership',
      name_en: 'Ownership',
      name_zh: '當責',
      description:
        '把公司當自己家，為公司資產、聲譽與長期成功負責。從股東角度思考，承擔個人責任。',
      example_question: 'Describe a time you took ownership beyond your role.',
    },
    {
      id: 'integrity',
      name_en: 'Integrity',
      name_zh: '正直',
      description:
        '永遠做正確的事，即使不容易。誠實且直接，遵守法律、公司政策與價值觀。',
      example_question: 'Tell me about a time you made a difficult ethical decision.',
    },
    {
      id: 'passion-for-winning',
      name_en: 'Passion for Winning',
      name_zh: '渴望致勝',
      description:
        '對持續改進充滿熱情，不接受平庸。在市場上與競爭者較勁時保有健康的不滿足感。',
      example_question: 'Describe a time you turned a losing situation into a win.',
    },
    {
      id: 'trust',
      name_en: 'Trust',
      name_zh: '信任',
      description:
        '尊重同事、顧客與消費者，並以同樣方式對待他們。相信別人的能力與意圖，開放坦誠地溝通。',
      example_question: 'Tell me about a time you had to build trust with a new team.',
    },
  ],
}

export const LEADERSHIP_FRAMEWORKS: ValueFramework[] = [
  AMAZON_LEADERSHIP_PRINCIPLES,
  PG_VALUES,
]

export function getFrameworkBySlug(slug: string): ValueFramework | undefined {
  return LEADERSHIP_FRAMEWORKS.find((f) => f.slug === slug)
}
