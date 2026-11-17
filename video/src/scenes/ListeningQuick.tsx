import React from 'react'
import { AbsoluteFill, useCurrentFrame } from 'remotion'
import { BrowserFrame, C, Cursor, HL, StepHeader, at, fade } from '../theme'
import { Closing, Hook } from './TitleScenes'

// 聽力訓練新手短片（約 30 秒）：Content Words 小課 → 選場景、聽音檔 → 答 3 題看解說
// 流程依 src/app/listening 的實際畫面；跟讀（Shadowing）只出現在 YouTube 影片練習，所以這裡不演。

const TOTAL = 3

export const ListeningHook: React.FC = () => (
  <Hook
    kicker="聽力訓練"
    title="第一次練？"
    highlight="3 個步驟"
    rest="，先學一招再開聽"
    chips={['小課', '聽音檔', '答 3 題']}
  />
)

export const ListeningOutro: React.FC = () => (
  <Closing
    title={
      <>
        現在就<HL>開始</HL>
      </>
    }
    line="「聽力訓練」→「開始今日聽力訓練」"
    note="每題約 3–5 分鐘，聽不懂的地方下次會更好"
  />
)

// ---------- 步驟 1：Content Words 小課 ----------
const SENTENCE: { w: string; content: boolean }[] = [
  { w: 'Could', content: false },
  { w: 'you', content: false },
  { w: 'send', content: true },
  { w: 'me', content: false },
  { w: 'the', content: false },
  { w: 'report', content: true },
  { w: 'by', content: false },
  { w: 'Friday?', content: true },
]

const Card: React.FC<{
  x: number
  title: string
  items: string[]
  muted?: boolean
  opacity: number
}> = ({ x, title, items, muted, opacity }) => (
  <div
    style={{
      position: 'absolute',
      left: x,
      top: 104,
      width: 660,
      height: 196,
      boxSizing: 'border-box',
      border: `2px solid ${C.line}`,
      borderLeft: `6px solid ${muted ? C.line : C.mark}`,
      padding: '18px 28px',
      opacity,
    }}
  >
    <div style={{ fontSize: 30, fontWeight: 800, color: muted ? C.sub : C.ink }}>{title}</div>
    <ul style={{ margin: '10px 0 0', paddingLeft: 26, fontSize: 25, lineHeight: 1.6, color: muted ? C.sub : C.ink }}>
      {items.map((i) => (
        <li key={i}>{i}</li>
      ))}
    </ul>
  </div>
)

export const LessonScene: React.FC = () => {
  const frame = useCurrentFrame()
  const hlStart = [92, 108, 124]
  let contentIdx = -1

  return (
    <AbsoluteFill>
      <StepHeader n={1} total={TOTAL} title="先上一堂小課" />
      <BrowserFrame url="bizenglish.app / listening / lesson">
        <div style={{ position: 'absolute', left: 60, top: 30, fontSize: 40, fontWeight: 800 }}>
          Content Words：只抓實詞
        </div>

        <Card
          x={60}
          title="實詞：要抓"
          items={['名詞：report, deadline', '主要動詞：send, schedule', '形容詞、副詞、數字…']}
          opacity={fade(frame, 8, 16)}
        />
        <Card
          x={780}
          title="虛詞：可放掉"
          items={['冠詞、代名詞：a, the, I, you', '介係詞：of, in, on, to', '助動詞、be 動詞、連接詞']}
          muted
          opacity={fade(frame, 20, 16)}
        />

        <div style={{ position: 'absolute', left: 60, top: 338, fontSize: 24, color: C.sub, opacity: fade(frame, 60, 14) }}>
          對照示範　<span style={{ fontWeight: 700, color: C.ink }}>螢光 = 實詞</span>　淺色 = 虛詞
        </div>

        <div style={{ position: 'absolute', left: 60, top: 386, fontSize: 52, fontWeight: 600, opacity: fade(frame, 56, 14) }}>
          {SENTENCE.map((t) => {
            if (t.content) contentIdx += 1
            const on = t.content && frame >= hlStart[contentIdx]
            const dim = !t.content && frame >= 84
            return (
              <span key={t.w} style={{ marginRight: 16, color: dim ? 'rgba(26,36,48,0.35)' : C.ink }}>
                <HL on={on}>{t.w}</HL>
              </span>
            )
          })}
        </div>

        <div style={{ position: 'absolute', left: 60, top: 500, fontSize: 36, opacity: fade(frame, 146, 14) }}>
          <span style={{ color: C.sub, fontSize: 26 }}>聽起來像：</span>
          <b>send　report　Friday</b>
        </div>
      </BrowserFrame>

    </AbsoluteFill>
  )
}

// ---------- 步驟 2：選場景、聽音檔 ----------
const SCENARIOS = ['隨機抽一個', '內部會議', '客戶電話', '簡報 Q&A', '商務閒聊', '商務談判']
const SELECT_CLICK = 40
const PICK_CLICK = 64
const START_CLICK = 100
const SWAP = 128
const PLAY_CLICK = 150
const SPEED_CLICK = 205

export const ListenScene: React.FC = () => {
  const frame = useCurrentFrame()
  const listOpen = frame >= SELECT_CLICK && frame < PICK_CLICK
  const chosen = frame >= PICK_CLICK ? '客戶電話' : '隨機抽一個'
  const loading = frame >= START_CLICK
  const playing = frame >= PLAY_CLICK
  const slow = frame >= SPEED_CLICK

  const viewA = 1 - fade(frame, SWAP - 12, 12)
  const viewB = fade(frame, SWAP - 4, 14)

  return (
    <AbsoluteFill>
      <StepHeader n={2} total={TOTAL} title="選場景，聽音檔" />
      <BrowserFrame url="bizenglish.app / listening">
        {/* 聽力首頁 */}
        <div style={{ position: 'absolute', inset: 0, opacity: viewA }}>
          <div style={{ position: 'absolute', left: 60, top: 28, fontSize: 44, fontWeight: 800 }}>聽力訓練</div>
          <div style={{ position: 'absolute', left: 60, top: 90, fontSize: 23, color: C.sub }}>
            AI 現場生成 60–90 秒商務對話，每題 3 道題目測抓實詞、細節、推論。
          </div>
          <div style={{ position: 'absolute', left: 60, top: 128, fontSize: 32, fontWeight: 800 }}>
            今天要練哪個場景？
          </div>
          <div style={{ position: 'absolute', left: 60, top: 172, fontSize: 20, color: C.sub }}>場景</div>
          <div
            style={{
              position: 'absolute',
              left: 60,
              top: 200,
              width: 620,
              height: 56,
              boxSizing: 'border-box',
              border: `2px solid ${C.line}`,
              borderRadius: 8,
              padding: '0 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: 26,
            }}
          >
            {chosen}
            <span style={{ color: C.sub, fontSize: 20 }}>▾</span>
          </div>
          <div
            style={{
              position: 'absolute',
              left: 60,
              top: 308,
              width: 620,
              height: 64,
              borderRadius: 8,
              background: C.ink,
              color: C.paper,
              fontSize: 26,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? 'AI 正在寫劇本... (約 10 秒)' : '開始今日聽力訓練'}
          </div>

          {listOpen && (
            <div
              style={{
                position: 'absolute',
                left: 60,
                top: 262,
                width: 620,
                background: C.white,
                border: `2px solid ${C.line}`,
                borderRadius: 8,
                boxShadow: '0 16px 36px rgba(26,36,48,0.2)',
                zIndex: 5,
              }}
            >
              {SCENARIOS.map((s, i) => (
                <div
                  key={s}
                  style={{
                    height: 46,
                    padding: '0 18px',
                    display: 'flex',
                    alignItems: 'center',
                    fontSize: 24,
                    background: i === 2 && frame >= 54 ? C.mark : 'transparent',
                  }}
                >
                  {s}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 音檔播放 */}
        <div style={{ position: 'absolute', inset: 0, opacity: viewB }}>
          <div style={{ position: 'absolute', left: 60, top: 30, fontSize: 24, color: C.sub }}>客戶電話 · AI 對話</div>
          <div style={{ position: 'absolute', left: 60, right: 60, top: 100, height: 300, borderTop: `2px solid ${C.line}`, borderBottom: `2px solid ${C.line}` }} />

          <div
            style={{
              position: 'absolute',
              left: 689 - 56,
              top: 190 - 56,
              width: 112,
              height: 112,
              borderRadius: 56,
              background: C.ink,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {playing ? (
              <svg width="48" height="48" viewBox="0 0 24 24" fill={C.paper}>
                <rect x="6" y="5" width="4" height="14" rx="1" />
                <rect x="14" y="5" width="4" height="14" rx="1" />
              </svg>
            ) : (
              <svg width="48" height="48" viewBox="0 0 24 24" fill={C.paper}>
                <path d="M8 5 L19 12 L8 19 Z" />
              </svg>
            )}
          </div>
          <div
            style={{
              position: 'absolute',
              left: 760,
              top: 190 - 24,
              width: 120,
              height: 48,
              boxSizing: 'border-box',
              border: `2px solid ${C.line}`,
              borderRadius: 8,
              fontSize: 24,
              color: C.sub,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ↻ 從頭
          </div>

          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: 330 - 20,
              height: 40,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 14,
              fontSize: 22,
            }}
          >
            <span style={{ color: C.sub, marginRight: 10 }}>速度</span>
            {['0.75x', '1x', '1.25x'].map((s) => {
              const active = (s === '0.75x' && slow) || (s === '1x' && !slow)
              return (
                <span
                  key={s}
                  style={{
                    width: 70,
                    height: 40,
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: active ? C.ink : 'rgba(26,36,48,0.06)',
                    color: active ? C.paper : C.ink,
                  }}
                >
                  {s}
                </span>
              )
            })}
          </div>

          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: 428,
              textAlign: 'center',
              fontSize: 24,
              color: C.sub,
              textDecoration: 'underline',
              textUnderlineOffset: 6,
            }}
          >
            聽不清楚？顯示原文
          </div>
        </div>
      </BrowserFrame>

      <Cursor
        clicks={[SELECT_CLICK, PICK_CLICK, START_CLICK, PLAY_CLICK, SPEED_CLICK]}
        path={[
          { f: 10, ...at(1300, 540) },
          { f: 34, ...at(370, 228) },
          { f: 46, ...at(370, 228) },
          { f: 62, ...at(370, 371) },
          { f: 70, ...at(370, 371) },
          { f: 92, ...at(370, 340) },
          { f: 132, ...at(370, 340) },
          { f: 144, ...at(689, 192) },
          { f: 156, ...at(689, 192) },
          { f: 198, ...at(710, 332) },
          { f: 240, ...at(710, 332) },
        ]}
      />
    </AbsoluteFill>
  )
}

// ---------- 步驟 3：答 3 題，看正解與解說 ----------
const QUESTIONS = [
  {
    q: 'What is the main purpose of the call?',
    opts: ['To cancel an order', 'To confirm a delivery date', 'To ask for a discount', 'To introduce a new product'],
    answer: 1,
    pick: 1,
    pickAt: 45,
  },
  {
    q: 'When will the order arrive?',
    opts: ['Monday', 'Wednesday', 'Friday', 'Next month'],
    answer: 2,
    pick: 2,
    pickAt: 80,
  },
  {
    q: 'Why does the client sound worried?',
    opts: ['The price went up', 'The delivery might be late', 'The product is damaged', 'The contract expired'],
    answer: 1,
    pick: 0,
    pickAt: 115,
  },
] as const

const SUBMIT = 150
const Q_TOP = [18, 164, 310]
const OPT_X = [60, 770]
const optPos = (q: number, o: number) => ({
  left: OPT_X[o % 2],
  top: Q_TOP[q] + 44 + Math.floor(o / 2) * 48,
})

export const AnswerScene: React.FC = () => {
  const frame = useCurrentFrame()
  const answered = QUESTIONS.filter((q) => frame >= q.pickAt).length
  const submitted = frame >= SUBMIT
  const correctCount = QUESTIONS.filter((q) => q.pick === q.answer).length

  return (
    <AbsoluteFill>
      <StepHeader n={3} total={TOTAL} title="答 3 題，看解說" />
      <BrowserFrame url="bizenglish.app / listening / session">
        {QUESTIONS.map((q, qi) => (
          <React.Fragment key={q.q}>
            <div
              style={{
                position: 'absolute',
                left: 60,
                top: Q_TOP[qi],
                fontSize: 26,
                fontWeight: 700,
                opacity: fade(frame, 4 + qi * 6, 12),
              }}
            >
              <span style={{ color: C.sub, marginRight: 14, fontSize: 22 }}>Q{qi + 1}</span>
              {q.q}
            </div>
            {q.opts.map((o, oi) => {
              const chosen = frame >= q.pickAt && q.pick === oi
              const isAnswer = oi === q.answer
              const showRight = submitted && isAnswer
              const showWrong = submitted && chosen && !isAnswer
              const pos = optPos(qi, oi)
              return (
                <div
                  key={o}
                  style={{
                    position: 'absolute',
                    ...pos,
                    width: 670,
                    height: 40,
                    boxSizing: 'border-box',
                    borderTop: `2px solid ${C.line}`,
                    padding: '0 8px',
                    display: 'flex',
                    alignItems: 'center',
                    fontSize: 23,
                    fontWeight: chosen && !submitted ? 700 : 400,
                    background: chosen && !submitted ? 'rgba(26,36,48,0.06)' : 'transparent',
                    opacity: submitted && !showRight && !showWrong ? 0.55 : fade(frame, 8 + qi * 6, 12),
                  }}
                >
                  <span style={{ color: C.sub, marginRight: 14, fontWeight: 700 }}>{String.fromCharCode(65 + oi)}</span>
                  {showRight ? (
                    <HL>{o}</HL>
                  ) : showWrong ? (
                    <span style={{ textDecoration: 'line-through', textDecorationColor: C.red, color: C.sub }}>{o}</span>
                  ) : (
                    o
                  )}
                  {showRight && <b style={{ marginLeft: 14 }}>正解</b>}
                  {showWrong && <b style={{ marginLeft: 14, color: C.red }}>你選的</b>}
                </div>
              )
            })}
          </React.Fragment>
        ))}

        {submitted && (
          <div
            style={{
              position: 'absolute',
              left: 60,
              top: Q_TOP[2] + 142,
              borderLeft: `3px solid ${C.line}`,
              paddingLeft: 14,
              fontSize: 22,
              color: C.sub,
              opacity: fade(frame, SUBMIT + 14, 12),
            }}
          >
            <b style={{ color: C.ink }}>解說：</b>客戶提到上次延遲，擔心這次也會晚到，所以選 B。
          </div>
        )}

        {!submitted ? (
          <div
            style={{
              position: 'absolute',
              left: 60,
              right: 60,
              top: 500,
              height: 70,
              borderTop: `2px solid ${C.line}`,
              borderBottom: `2px solid ${C.line}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: 24,
              color: C.sub,
            }}
          >
            已回答 {answered} / 3
            <span
              style={{
                width: 200,
                height: 52,
                borderRadius: 8,
                background: C.ink,
                color: C.paper,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: answered === 3 ? 1 : 0.4,
              }}
            >
              送出答案
            </span>
          </div>
        ) : (
          <div
            style={{
              position: 'absolute',
              left: 60,
              top: 500,
              borderLeft: `6px solid ${C.mark}`,
              paddingLeft: 26,
              opacity: fade(frame, SUBMIT + 6, 12),
            }}
          >
            <div style={{ fontSize: 44, fontWeight: 800 }}>
              {correctCount} / 3
              <span style={{ marginLeft: 12, fontSize: 24, fontWeight: 400, color: C.sub }}>答對</span>
            </div>
            <div style={{ marginTop: 4, fontSize: 24, color: C.sub }}>大部分抓到重點，再多聽兩題會更穩</div>
          </div>
        )}
      </BrowserFrame>

      <Cursor
        clicks={[45, 80, 115, SUBMIT]}
        path={[
          { f: 8, ...at(1300, 560) },
          { f: 40, ...at(1105, 82) },
          { f: 48, ...at(1105, 82) },
          { f: 75, ...at(395, 276) },
          { f: 83, ...at(395, 276) },
          { f: 110, ...at(395, 374) },
          { f: 118, ...at(395, 374) },
          { f: 144, ...at(1340, 535) },
          { f: 240, ...at(1340, 535) },
        ]}
      />
    </AbsoluteFill>
  )
}
