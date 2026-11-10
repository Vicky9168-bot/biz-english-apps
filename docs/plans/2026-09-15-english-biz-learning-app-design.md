# 商務英語學習網站 — 設計文件

> **建立日期**：2026-09-15
> **狀態**：Design Approved，Ready for Implementation
> **專案定位**：Phase B（個人網站，10-50 人使用）→ 預留 Phase C（正式產品）擴充空間

---

## 1. 專案概要

### 1.1 目標使用者
商務人士（PM / Sales / Engineer / Founder …），需要在真實商業場景中使用英語進行**談判、溝通、簡報**。

### 1.2 三大核心功能

| Part | 功能 | 核心價值 |
|------|------|---------|
| **Part 1** | 比手畫腳單字練習 | 建立高頻商用單字的**主動使用**能力（口說輸出 + 聽力辨識） |
| **Part 2** | 聽力訓練 | 培養不同商業情境下的**聽力理解與精聽**能力 |
| **Part 3** | 場景框架練習 | 用 STAR/PREP/SCQA 等 **13 種商務溝通框架**回應真實場景 |

### 1.3 客製化基礎
所有功能都依 `user_profile`（職位、產業、英文挑戰、程度）動態生成內容。

---

## 2. 技術棧

```
Frontend + Backend : Next.js 14 (App Router) + TypeScript
UI                 : Tailwind CSS + shadcn/ui
Database + Auth    : Supabase (PostgreSQL + Row Level Security + Auth)
AI                 : OpenAI SDK
  - GPT-4o-mini    → 單字猜測、題目生成（成本敏感任務）
  - GPT-4o         → 文法修正、框架評分（品質敏感任務）
  - Whisper-1      → 語音轉文字（學員說話）
  - TTS-1-HD       → 語音生成（聽力素材、AI 對話）
Storage            : Supabase Storage（音檔快取）
Deployment         : Vercel（Web + API）+ Supabase Cloud
```

### 2.1 成本估算（50 活躍使用者／月）
| 項目 | 費用 |
|------|------|
| Vercel Hobby | $0 |
| Supabase Free | $0 |
| OpenAI API | ~$40-60 |
| **總計** | **< $60/月** |

---

## 3. 資料模型（Supabase / PostgreSQL）

### 3.1 核心資料表

```sql
-- 使用者背景（Onboarding 一次填寫）
user_profiles (
  id, user_id (FK auth.users), job_title, industry,
  seniority_level, english_challenges TEXT[],
  target_scenarios TEXT[], proficiency_level INT,
  created_at, updated_at
)

-- Part 1：單字題庫
vocabulary (
  id, word, part_of_speech, difficulty INT (1-5),
  scenario_tags TEXT[], definition_en, definition_zh,
  example_sentence, audio_url
)

-- Part 1：每日練習紀錄
charades_sessions (
  id, user_id, date, mode ('user_describes'|'ai_describes'),
  word_id, attempts, guessed_correctly BOOL,
  transcript JSONB, grammar_feedback JSONB,
  stars INT (0-3), created_at
)

-- Part 2：聽力練習紀錄
listening_sessions (
  id, user_id, scenario, script JSONB, audio_url,
  question_types TEXT[] (multiple),
  questions JSONB, user_answers JSONB,
  score INT, feedback JSONB, created_at
)

-- Part 3：策展影片庫（Admin 上架）
scenario_videos (
  id, youtube_url, youtube_video_id, title,
  scenario_type, duration_seconds,
  recommended_frameworks TEXT[], difficulty,
  transcript TEXT, thumbnail_url,
  published BOOL, created_by, created_at
)

-- Part 3：影片配題（Admin 審核後上架）
scenario_questions (
  id, video_id (FK), question_text,
  target_framework, reference_answer,
  evaluation_rubric JSONB, order_index
)

-- Part 3：學員回答
scenario_responses (
  id, user_id, question_id (FK), framework_used,
  audio_url, transcript, ai_evaluation JSONB,
  score_breakdown JSONB, overall_score INT, created_at
)

-- 排行榜（Part 1 週榜/月榜）
leaderboard_view (VIEW)
  依 SUM(charades_sessions.stars) + streak_days 排序
```

### 3.2 RLS Policy 原則
- 使用者只能 SELECT/UPDATE 自己的資料（`user_id = auth.uid()`）
- `scenario_videos` / `vocabulary` / `scenario_questions` 已 published 才對一般使用者可見
- Admin role 才能寫入 `scenario_videos` 與 `scenario_questions`

---

## 4. 頁面結構（Next.js App Router）

```
/                       首頁（介紹 + 登入 CTA）
/onboarding             首次背景收集（4 題問卷）
/dashboard              總覽（今日進度、連續打卡、快速入口）

/charades               Part 1 比手畫腳
  /charades/session       當日 5 題練習
  /charades/history       歷史紀錄 + 錯題複習
  /charades/leaderboard   週榜 / 月榜

/listening              Part 2 聽力訓練
  /listening/new          選題型 + 場景後開始
  /listening/[id]         單次 session 結果頁
  /listening/history      歷史紀錄

/scenarios              Part 3 場景練習
  /scenarios/[videoId]    影片 + 練習介面
  /scenarios/history      歷史紀錄 + 框架雷達圖

/settings               使用者設定（可改 profile）

/admin                  管理後台
  /admin/videos           影片上下架
  /admin/videos/new       新增影片（+ AI 生成題目）
  /admin/vocabulary       單字管理
  /admin/users            使用者數據
```

## 5. API 路由

```
POST /api/charades/next-word          取下一題（依 profile + 難度）
POST /api/charades/guess              AI 即時猜詞
POST /api/charades/reveal             公布答案 + 例句
POST /api/charades/feedback           結束後文法回饋

POST /api/listening/generate          AI 生成腳本 + TTS
POST /api/listening/score             聽力題目評分（含 shadowing）

POST /api/scenarios/generate-questions  AI 為新影片生成建議題目（Admin）
POST /api/scenarios/evaluate          框架評分（STAR/PREP/...）

POST /api/transcribe                  Whisper 語音轉文字
POST /api/tts                         TTS 生成（含快取邏輯）

GET  /api/leaderboard                 排行榜資料
```

---

## 6. Part 1：比手畫腳詳細設計

### 6.1 Onboarding 4 題問卷
| # | 問題 | 形式 | 用途 |
|---|------|------|------|
| 1 | 你的職位？ | 下拉：PM / Engineer / Sales / Marketing / Finance / HR / Founder / 其他 | 題目場景客製化 |
| 2 | 你的產業？ | 下拉：科技 / 金融 / 電商 / 製造 / 醫療 / 顧問 / 其他 | 單字領域選擇 |
| 3 | 過往英文最常遇到的挑戰？（多選）| Checkbox：談判 / 簡報 / 會議 / Email / 面試 / Small Talk / Cold Call | 決定推題方向 |
| 4 | 自評英文程度 | 單選：Beginner / Intermediate / Advanced（附 CEFR 對照） | 決定初始難度 |

### 6.2 每日流程
```
Dashboard → 點「今日單字」
  → 系統依 profile 選 5 個字（難度 ±1、tag 對應、過去 7 天答對排除）
  → 模式選擇：[🎤 我描述] [👂 AI 描述] [🎲 系統穿插]
  → 進入 session（5 題）
  → 成績卡 + 連續打卡 + 排行榜更新
```

### 6.3 模式 A：學員描述 → AI 猜
- 學員按住麥克風 → Whisper streaming
- 每 3-5 秒累積文字送 GPT-4o-mini 猜測
- 3 次猜錯公布答案

### 6.4 模式 B：AI 描述 → 學員猜
- GPT-4o-mini 生成 3 種難度描述（模糊 → 具體）
- OpenAI TTS 轉語音，固定 voice 快取
- 學員可語音或打字回答

### 6.5 結束回饋（GPT-4o）
```json
{
  "grammar_errors": [{"original", "corrected", "explanation_zh"}],
  "better_expressions": [{"你說的", "更道地", "為什麼"}],
  "business_tip": "一句實戰建議"
}
```

### 6.6 遊戲化元素
- 🔥 連續打卡天數
- ⭐ 每題 0-3 星（1 次中=3⭐、2 次=2⭐、3 次=1⭐、放棄=0⭐）
- 📈 難度自動調整（連續 3 天 ≥ 2.5⭐ 難度 +1）
- 🗂️ 錯題本（7 天後再出）
- 🏆 **排行榜**（週榜 + 月榜，依總星數 + 打卡天數）

---

## 7. Part 2：聽力訓練詳細設計

### 7.1 使用者流程
```
Dashboard → 點「聽力訓練」
  → 選主題（3 選 1，依 profile 推薦）：產業會議 / 客戶通話 / 簡報現場
  → 學員自選題型（可複選 1-N 種）
  → AI 即時生成 30-60 秒腳本 + TTS
  → 進入練習
  → 完成 → AI 評分 + 逐字稿對照 + 學習重點
```

### 7.2 AI 腳本生成
- **音檔長度**：30-60 秒（~80-150 字）
- **角色**：2-3 個 speaker，各綁定固定 voice
  | Voice | 角色特性 |
  |-------|---------|
  | alloy | 中性、專業（主管） |
  | nova | 年輕女聲（PM/Sales） |
  | onyx | 沉穩男聲（資深） |
  | echo | 清脆男聲（工程師） |
- 內容包含近期學過的單字（連動 Part 1）

### 7.3 六種題型（學員自選）

| # | 題型 | 說明 |
|---|------|------|
| ① | 填空 (Cloze) | 挖 3-5 個關鍵字 |
| ② | 選擇 (MCQ) | 3-5 題，distractor 合理 |
| ③ | 聽寫 (Dictation) | 逐句 5-10 秒，diff 對照 |
| ④ | 口說摘要 | 30-60 秒英文摘要，可用 BLUF / Rule of 3 |
| ⑤ | 開放問答 | 3 面向評分：邏輯 / 語言 / 商業適切性 |
| ⑥ | **Shadowing 跟讀** | 邊聽邊跟讀，AI 評發音 / 節奏 / 語調 |

### 7.4 音檔快取策略
- 檔名：`{script_hash}.mp3`，存 Supabase Storage
- 相同 script + voice 直接讀快取
- Public URL 直接播放（不透過 API）
- 30 天沒讀自動清理

### 7.5 難度自動調整
- 連續 3 次同題型 ≥ 85 → 難度 +1
- 連續 2 次 < 60 → 難度 -1
- 影響 prompt 的語速 / 詞彙難度 / 句長

---

## 8. Part 3：商業場景 + 框架練習詳細設計

### 8.1 內建 13 個溝通框架

| 分類 | 框架 | 全名 | 適用場景 |
|------|------|------|---------|
| 敘述 | **STAR** | Situation → Task → Action → Result | 面試、專案回顧 |
| 敘述 | CAR | Context → Action → Result | 簡化版 STAR |
| 敘述 | PPF | Past → Present → Future | 職涯故事、公司介紹 |
| 表達 | **PREP** | Point → Reason → Example → Point | 會議發言、電梯簡報 |
| 表達 | BLUF | Bottom Line Up Front | Email、直接匯報 |
| 表達 | Pyramid | 金字塔原則（結論先行） | 高階簡報 |
| 表達 | Rule of 3 | 3 個重點法則 | 演講、記憶點強化 |
| 故事 | **SCQA** | Situation → Complication → Question → Answer | 提案、開場破冰 |
| 故事 | Problem-Solution-Benefit | 問題→解方→效益 | 內部提案 |
| 銷售 | AIDA | Attention → Interest → Desire → Action | Cold Call、Pitch |
| 銷售 | FAB | Feature → Advantage → Benefit | 產品 Demo |
| 銷售 | SPIN | Situation → Problem → Implication → Need-payoff | B2B 銷售 |
| 談判 | FEEL | Feel → Felt → Found | 客戶抱怨處理 |
| 談判 | Yes, And... | 接受並延伸 | 談判、腦力激盪 |

每個框架有內建說明卡（結構、範例句型、常見錯誤）。

### 8.2 Admin 上架流程 (`/admin/videos/new`)
1. 貼 YouTube URL → 自動抓標題、時長、縮圖、字幕
2. 標記場景類型、難度、推薦框架（可多選）
3. 點「AI 生成建議題目」→ 3-5 題 + 示範答案（可編輯）
4. 儲存草稿 或 發佈上架

### 8.3 學員練習流程
```
/scenarios → 篩選（難度 / 場景）
  → 選影片 → 看影片（YouTube 嵌入，支援暫停/字幕）
  → 開始練習 → Q1: AI 出題（含框架提示卡）
  → 學員選框架 → 語音回答（30-90 秒）
  → AI 評分（框架完整度 + 語言品質 + 高分示範）
  → 下一題
```

### 8.4 AI 評分維度
```json
{
  "framework_scores": {
    "S": {"score": 85, "feedback": "..."},
    "T": {"score": 65, "feedback": "..."},
    "A": {"score": 92, "feedback": "..."},
    "R": {"score": 35, "feedback": "沒量化結果"}
  },
  "language_scores": {
    "grammar": 92, "vocabulary": 85, "fluency": 78
  },
  "improvements": [{"original", "suggested", "why"}],
  "overall_score": 78
}
```

### 8.5 學習路徑（Progressive）
- **新手模式**（前 5 支影片）：系統指定框架
- **標準模式**：從推薦框架挑選
- **挑戰模式**：可用任意框架（訓練靈活切換）

### 8.6 進度追蹤
- Dashboard 顯示已完成場景數 / 框架數
- **雷達圖**呈現 13 個框架的平均得分
- 弱項框架 → 首頁推薦相關影片

---

## 9. 開發階段規劃（建議 6-8 週）

| 週次 | 里程碑 | 交付物 |
|------|--------|--------|
| **W1** | 專案骨架 | Next.js + Supabase + Auth + Onboarding + Dashboard |
| **W2** | Part 1 MVP | 單字表、語音互動（模式 A）、每日 5 題、遊戲化 |
| **W3** | Part 1 完成 + Part 2 開始 | 模式 B、排行榜、聽力生成 + 題型 ①② |
| **W4** | Part 2 完成 | 題型 ③④⑤⑥、音檔快取、難度自動調整 |
| **W5** | Part 3 Admin | 影片上架系統 + AI 生成題目 + 審核介面 |
| **W6** | Part 3 學員端 | 影片播放 + 框架練習 + AI 評分 |
| **W7** | 打磨 & 上線 | UI 優化、Bug 修復、部署 Vercel、小規模測試 |
| **W8** | Buffer / 迭代 | 依測試回饋調整、種子內容準備 |

---

## 10. 未決議題（實作中再決定）

- [ ] 排行榜是否顯示所有使用者？還是只顯示同產業/職位？（隱私考量）
- [ ] Part 2 Shadowing 的發音評分閾值？（Whisper 有邊界，可能誤判非母語者發音）
- [ ] Part 3 影片版權：只嵌入公開 YouTube 影片，不下載字幕保存？
- [ ] 是否支援手機 App（PWA vs React Native）？（先做 RWD Web，之後評估）
- [ ] Admin 權限：SQL 手動設 role='admin' 就好？還是需要邀請碼系統？

---

## 11. 未來 Phase C 擴充預留

架構已為以下功能預留空間，MVP 不做但可平滑升級：
- **金流**：Stripe（Subscription plan → 免費 vs Pro）
- **內容管理**：Admin 後台可擴充課程包裝、學習路徑
- **企業版**：Team account、Admin dashboard、SSO
- **Email 通知**：每日提醒、週報、成就通知（Resend）
- **AI 個人教練**：長期學習分析 + 個人化建議
- **Multi-tenant**：白牌方案給企業客戶
