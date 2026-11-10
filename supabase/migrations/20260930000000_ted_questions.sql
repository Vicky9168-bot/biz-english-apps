-- =====================================================
-- 3 部 TED 演講加上題目（每支 3 題）
-- Created: 2026-09-30
-- =====================================================

-- 1. Adam Grant
update public.listening_dialogues
set questions = '[
  {
    "q": "What did Adam Grant find surprising about original thinkers?",
    "options": [
      "They are typically the fastest to act on new ideas",
      "They procrastinate more, which can boost creativity",
      "They are always the most confident in their ideas",
      "They tend to have fewer but higher-quality ideas"
    ],
    "answer_idx": 1,
    "explanation_zh": "Grant 提出反直覺結論：適度拖延讓大腦有時間發散、探索更多可能性，反而讓創意變好。"
  },
  {
    "q": "According to Grant, what strongly predicts having great ideas?",
    "options": [
      "A very high IQ",
      "Being the first to enter a market",
      "Producing a large quantity of ideas — including many bad ones",
      "Having formal creative training"
    ],
    "answer_idx": 2,
    "explanation_zh": "Grant 引用研究：最有名的原創者通常也是產出最多失敗作品的人，量是質的前提。"
  },
  {
    "q": "How do successful originals typically handle risk?",
    "options": [
      "They embrace risk aggressively in every area",
      "They avoid risk in nearly all situations",
      "They keep a safety net in one area so they can take risks in another",
      "They only take financial risks, never career risks"
    ],
    "answer_idx": 2,
    "explanation_zh": "Grant 用 Warby Parker 創辦人邊上學邊創業當例子：原創者不是無腦冒險，而是在某處求穩才敢在別處大膽。"
  }
]'::jsonb
where youtube_video_id = 'fxbCHn6gE3U';

-- 2. Angela Duckworth
update public.listening_dialogues
set questions = '[
  {
    "q": "Which quality did Duckworth find best predicts success across different fields?",
    "options": [
      "IQ",
      "Physical health",
      "Social intelligence",
      "Grit — passion and perseverance for long-term goals"
    ],
    "answer_idx": 3,
    "explanation_zh": "Duckworth 定義 grit = passion + perseverance for very long-term goals，跨西點軍校、拼字比賽、老師等場景都成立。"
  },
  {
    "q": "In Duckworth''s West Point study, what determined which cadets completed the tough training?",
    "options": [
      "Physical fitness test results",
      "SAT scores",
      "The cadets'' grit level",
      "Family military background"
    ],
    "answer_idx": 2,
    "explanation_zh": "體能、學測、領導力都比不上 grit 的預測力 — 硬撐下去的是恆毅力最高的人。"
  },
  {
    "q": "Which concept from Carol Dweck does Duckworth suggest as a way to build grit?",
    "options": [
      "Emotional intelligence",
      "Growth mindset — belief that ability can improve with effort",
      "Flow state",
      "Deliberate practice alone"
    ],
    "answer_idx": 1,
    "explanation_zh": "相信能力可以透過努力提升（growth mindset），會讓學生面對失敗時更願意堅持，正好餵養 grit。"
  }
]'::jsonb
where youtube_video_id = 'H14bBuluwB8';

-- 3. Mustafa Suleyman
update public.listening_dialogues
set questions = '[
  {
    "q": "How does Suleyman propose we should think about AI?",
    "options": [
      "Just a faster version of a search engine",
      "A new digital species — closer to a new kind of being than a traditional tool",
      "A short-term technology trend that will fade",
      "A direct replacement for human workers"
    ],
    "answer_idx": 1,
    "explanation_zh": "Suleyman 提出「新數位物種」的比喻 — AI 不只是工具，而是需要用「生物」的方式去理解、共處與塑造。"
  },
  {
    "q": "What makes today''s AI qualitatively different from previous computing?",
    "options": [
      "It runs on much faster chips",
      "It uses less energy than earlier computers",
      "It can converse, generate content, and take actions on its own",
      "It is much cheaper to build"
    ],
    "answer_idx": 2,
    "explanation_zh": "conversational + generative + actionable 三個能力疊在一起，讓 AI 從被動工具變成主動代理，這是質變不是量變。"
  },
  {
    "q": "What is Suleyman''s main call to action about AI?",
    "options": [
      "Immediately halt all AI development",
      "Let market forces decide what AI becomes",
      "Actively shape AI so its capabilities align with human values",
      "Focus only on narrow AI and abandon general AI"
    ],
    "answer_idx": 2,
    "explanation_zh": "Suleyman 沒有主張停下腳步，而是強調現在就要主動塑造 AI 的發展方向，讓能力對齊人類價值 — 責任在我們身上。"
  }
]'::jsonb
where youtube_video_id = 'KKNCiRWd_j0';
