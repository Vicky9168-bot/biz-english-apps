import React from 'react'
import { AbsoluteFill, useCurrentFrame } from 'remotion'
import { BrowserFrame, C, Cursor, HL, StepHeader, at, fade } from '../theme'
import { Closing, Hook } from './TitleScenes'

// 商業場景練習新手短片（約 30 秒）：選場景 → 思考 30 秒、錄音 → 看四大面向回饋
// 流程與文字依 src/app/speaking；題目取自 supabase/migrations/20260925000000_speaking.sql

const TOTAL = 3

export const SpeakingHook: React.FC = () => (
  <Hook
    kicker="商業場景練習"
    title="不知道怎麼答？"
    highlight="3 個步驟"
    rest="，開口回答，AI 幫你改"
    chips={['選場景', '錄音', '看回饋']}
  />
)

export const SpeakingOutro: React.FC = () => (
  <Closing
    title={
      <>
        沒有你要的<HL>場景</HL>？
      </>
    }
    line="按「自訂」，用中文寫真實情境"
    note="AI 幫你挑框架、寫英文提問，直接錄音練習"
  />
)

// ---------- 步驟 1：選場景 ----------
const PICK_CLICK = 130

const FRAMEWORKS = ['STAR 過去經驗', 'PREP 表達意見', 'SCQA 說服提案', 'PYRAMID 答案先行']

const ROWS = [
  {
    title: '跟老闆報告本季 KPI 落後',
    desc: '直屬主管請你解釋本季業績為何未達標。用 STAR 完整說明情境、任務、行動、結果。',
    tags: 'management · accountability',
  },
  {
    title: '面試官問你怎麼處理跨部門衝突',
    desc: '面試常見題。用 STAR 說一個實際例子，不要空泛。',
    tags: 'interview · conflict',
  },
]

export const PickScene: React.FC = () => {
  const frame = useCurrentFrame()
  const picked = frame >= 118

  return (
    <AbsoluteFill>
      <StepHeader n={1} total={TOTAL} title="選一個場景" />
      <BrowserFrame url="bizenglish.app / speaking">
        <div style={{ position: 'absolute', left: 60, top: 26, fontSize: 44, fontWeight: 800 }}>
          商業場景練習
        </div>
        <div style={{ position: 'absolute', left: 60, top: 88, fontSize: 23, color: C.sub }}>
          用 STAR / PREP / SCQA / Pyramid 框架回答面試、主管、高層問題
        </div>

        <div style={{ position: 'absolute', left: 60, top: 134, display: 'flex', gap: 18, opacity: fade(frame, 6, 14) }}>
          {FRAMEWORKS.map((f) => (
            <span
              key={f}
              style={{
                border: `2px solid ${C.line}`,
                borderRadius: 999,
                padding: '6px 24px',
                fontSize: 23,
                fontWeight: 600,
              }}
            >
              {f}
            </span>
          ))}
        </div>

        <div style={{ position: 'absolute', left: 60, top: 204, fontSize: 32, fontWeight: 800 }}>STAR</div>
        <div style={{ position: 'absolute', right: 60, top: 214, fontSize: 22, color: C.sub }}>
          過去經驗 · 行為題（Situation-Task-Action-Result）
        </div>

        {ROWS.map((r, i) => (
          <div
            key={r.title}
            style={{
              position: 'absolute',
              left: 60,
              right: 60,
              top: 262 + i * 112,
              height: 112,
              borderTop: `2px solid ${C.line}`,
              borderBottom: i === 1 ? `2px solid ${C.line}` : 'none',
              background: i === 0 && picked ? 'rgba(255,255,255,0.9)' : 'transparent',
              opacity: fade(frame, 14 + i * 10, 14),
            }}
          >
            <div style={{ position: 'absolute', left: 8, top: 22, fontSize: 22, fontWeight: 700, color: C.sub }}>
              Lv.3
            </div>
            <div style={{ position: 'absolute', left: 100, top: 14, fontSize: 34, fontWeight: 700 }}>
              {i === 0 && picked ? <HL>{r.title}</HL> : r.title}
            </div>
            <div style={{ position: 'absolute', left: 100, top: 64, fontSize: 23, color: C.sub }}>{r.desc}</div>
            <div style={{ position: 'absolute', right: 8, top: 24, fontSize: 21, color: C.sub }}>{r.tags}</div>
          </div>
        ))}

        <div
          style={{
            position: 'absolute',
            left: 60,
            right: 60,
            top: 508,
            height: 100,
            borderTop: `2px solid ${C.line}`,
            opacity: fade(frame, 40, 14),
          }}
        >
          <div style={{ position: 'absolute', left: 8, top: 16, fontSize: 30, fontWeight: 700 }}>
            沒有你要的場景？自訂一個
          </div>
          <div style={{ position: 'absolute', left: 8, top: 62, fontSize: 22, color: C.sub }}>
            用中文寫真實情境，AI 幫你挑框架、寫英文提問、直接錄音練習
          </div>
          <div style={{ position: 'absolute', right: 8, top: 22, fontSize: 24, fontWeight: 700 }}>自訂</div>
        </div>
      </BrowserFrame>

      <Cursor
        clicks={[PICK_CLICK]}
        path={[
          { f: 14, ...at(1300, 560) },
          { f: 112, ...at(1100, 322) },
          { f: 210, ...at(1100, 322) },
        ]}
      />
    </AbsoluteFill>
  )
}

// ---------- 步驟 2：思考 30 秒、錄音 ----------
const PREP_CLICK = 62
const REC_CLICK = 150
const STOP_CLICK = 250

const btn = (primary: boolean, red = false): React.CSSProperties => ({
  height: 56,
  boxSizing: 'border-box',
  borderRadius: 8,
  border: `2px solid ${primary ? (red ? C.red : C.ink) : C.line}`,
  background: primary ? (red ? C.red : C.ink) : 'transparent',
  color: primary ? C.paper : C.ink,
  fontSize: 25,
  fontWeight: 700,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'absolute',
  top: 470,
})

export const RecordScene: React.FC = () => {
  const frame = useCurrentFrame()
  const state =
    frame >= STOP_CLICK ? 'analyzing' : frame >= REC_CLICK ? 'recording' : frame >= PREP_CLICK ? 'prep' : 'idle'
  const prepLeft = Math.max(0, 30 - Math.floor(((frame - PREP_CLICK) * 30) / 68))
  const elapsed = Math.max(0, Math.floor((frame - REC_CLICK) * 0.52))

  const header =
    state === 'idle'
      ? '先花 30 秒思考，再按錄音'
      : state === 'prep'
        ? prepLeft > 0
          ? '思考中...'
          : '準備好了，按開始錄音'
        : state === 'recording'
          ? '錄音中...'
          : 'AI 分析中'

  return (
    <AbsoluteFill>
      <StepHeader n={2} total={TOTAL} title="思考 30 秒，再錄音" />
      <BrowserFrame url="bizenglish.app / speaking / kpi">
        <div style={{ position: 'absolute', left: 60, top: 20, fontSize: 23, color: C.sub }}>
          <b style={{ color: C.ink, fontSize: 26, marginRight: 14 }}>STAR</b>
          Lv.3　management · accountability
        </div>
        <div style={{ position: 'absolute', left: 60, top: 54, fontSize: 38, fontWeight: 800 }}>
          跟老闆報告本季 KPI 落後
        </div>

        <div
          style={{
            position: 'absolute',
            left: 60,
            top: 118,
            width: 1380,
            borderLeft: `4px solid ${C.line}`,
            paddingLeft: 22,
            boxSizing: 'border-box',
            opacity: fade(frame, 6, 14),
          }}
        >
          <div style={{ fontSize: 21, color: C.sub }}>對方問你</div>
          <div style={{ fontSize: 26, lineHeight: 1.45 }}>
            “Your quarterly revenue target was 20% off. In our 1-on-1 today, walk me through what
            happened and what you did about it.”
          </div>
        </div>

        <div
          style={{
            position: 'absolute',
            left: 60,
            top: 252,
            width: 1380,
            borderLeft: `4px solid ${C.mark}`,
            paddingLeft: 22,
            boxSizing: 'border-box',
            opacity: fade(frame, 16, 14),
          }}
        >
          <div style={{ fontSize: 24, fontWeight: 800 }}>STAR 應用提示</div>
          <div style={{ fontSize: 22, lineHeight: 1.5, color: C.sub }}>
            S: 這一季的市場/團隊狀況 · T: 你負責什麼、目標多少 · A: 你採取哪 2–3 個具體行動 · R:
            最後結果(數字)+ 學到什麼
          </div>
        </div>

        <div style={{ position: 'absolute', left: 60, top: 374, fontSize: 21, color: C.sub }}>
          回答，建議 30–90 秒
        </div>
        <div style={{ position: 'absolute', left: 60, top: 402, fontSize: 34, fontWeight: 800 }}>{header}</div>

        {state === 'idle' && (
          <>
            <div style={{ ...btn(true), left: 60, width: 240 }}>開始 30 秒思考</div>
            <div style={{ ...btn(false), left: 316, width: 160 }}>直接錄音</div>
          </>
        )}

        {state === 'prep' && (
          <>
            <div
              style={{
                position: 'absolute',
                left: 60,
                top: 462,
                width: 120,
                fontSize: 52,
                fontWeight: 800,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {prepLeft}s
            </div>
            <div style={{ ...btn(true, true), left: 200, width: 170 }}>開始錄音</div>
            {prepLeft > 0 && (
              <div style={{ position: 'absolute', left: 392, top: 486, fontSize: 22, color: C.sub, textDecoration: 'underline' }}>
                跳過倒數
              </div>
            )}
          </>
        )}

        {state === 'recording' && (
          <>
            <div style={{ ...btn(true), left: 60, width: 230 }}>⏹ 結束錄音</div>
            <div style={{ position: 'absolute', left: 312, top: 486, fontSize: 24, color: C.sub }}>
              <span
                style={{
                  display: 'inline-block',
                  width: 14,
                  height: 14,
                  borderRadius: 7,
                  background: C.red,
                  marginRight: 12,
                  opacity: 0.5 + 0.5 * Math.abs(Math.sin(frame / 8)),
                }}
              />
              {elapsed}s / 90s
            </div>
          </>
        )}

        {state === 'analyzing' && (
          <div style={{ position: 'absolute', left: 60, top: 480, fontSize: 25, color: C.sub }}>
            Whisper 轉文字 + GPT 逐點評分中（約 15–30 秒）
          </div>
        )}
      </BrowserFrame>

      <Cursor
        clicks={[PREP_CLICK, REC_CLICK, STOP_CLICK]}
        path={[
          { f: 8, ...at(1300, 560) },
          { f: 52, ...at(180, 498) },
          { f: 66, ...at(180, 498) },
          { f: 138, ...at(285, 498) },
          { f: 156, ...at(285, 498) },
          { f: 240, ...at(175, 498) },
          { f: 270, ...at(175, 498) },
        ]}
      />
    </AbsoluteFill>
  )
}

// ---------- 步驟 3：四大面向回饋 ----------
const RETRY_CLICK = 222
const SCORES = [
  { label: 'STAR 框架', value: 82 },
  { label: '商務用詞', value: 74 },
  { label: '文法', value: 80 },
  { label: '流暢度', value: 76 },
]

export const FeedbackScene: React.FC = () => {
  const frame = useCurrentFrame()
  const analyzing = frame < 40
  const feedback = fade(frame, 38, 12)

  return (
    <AbsoluteFill>
      <StepHeader n={3} total={TOTAL} title="看四大面向回饋" />
      <BrowserFrame url="bizenglish.app / speaking / kpi">
        <div style={{ position: 'absolute', inset: 0, opacity: 1 - fade(frame, 28, 12) }}>
          <div style={{ position: 'absolute', left: 60, top: 60, fontSize: 38, fontWeight: 800 }}>AI 分析中</div>
          <div style={{ position: 'absolute', left: 60, top: 124, fontSize: 26, color: C.sub }}>
            Whisper 轉文字 + GPT 逐點評分中（約 15–30 秒）
          </div>
        </div>

        {!analyzing && (
          <div style={{ position: 'absolute', inset: 0, opacity: feedback }}>
            <div style={{ position: 'absolute', left: 60, top: 22, fontSize: 38, fontWeight: 800 }}>四大面向分數</div>
            <div style={{ position: 'absolute', right: 60, top: 34, fontSize: 25, color: C.sub }}>平均 78</div>

            {SCORES.map((s, i) => (
              <div
                key={s.label}
                style={{
                  position: 'absolute',
                  left: 60 + i * 345,
                  top: 82,
                  width: 345,
                  height: 92,
                  borderLeft: i === 0 ? 'none' : `2px solid ${C.line}`,
                  paddingLeft: i === 0 ? 0 : 24,
                  boxSizing: 'border-box',
                  opacity: fade(frame, 44 + i * 6, 12),
                }}
              >
                <div style={{ fontSize: 22, color: C.sub }}>{s.label}</div>
                <div style={{ fontSize: 52, fontWeight: 800, lineHeight: 1.15 }}>{s.value}</div>
              </div>
            ))}

            <div style={{ position: 'absolute', left: 60, top: 196, width: 1380, opacity: fade(frame, 92, 14) }}>
              <div style={{ fontSize: 28, fontWeight: 800 }}>逐句改寫建議</div>
              <div style={{ marginTop: 8, fontSize: 20, color: C.sub }}>原句</div>
              <div
                style={{
                  fontSize: 27,
                  color: C.sub,
                  textDecoration: 'line-through',
                  textDecorationColor: C.red,
                }}
              >
                We lost the target because market is bad.
              </div>
              <div style={{ marginTop: 6, fontSize: 20, color: C.sub }}>改寫</div>
              <div style={{ fontSize: 27, fontWeight: 700 }}>
                <HL>We missed the target mainly because market demand softened.</HL>
              </div>
            </div>

            <div style={{ position: 'absolute', left: 60, top: 396, width: 1380, opacity: fade(frame, 140, 14) }}>
              <div style={{ fontSize: 28, fontWeight: 800 }}>STAR 模範答案</div>
              <div style={{ marginTop: 6, fontSize: 22, lineHeight: 1.5, color: C.sub }}>
                Situation: Last quarter, revenue came in 20% below target after a key client paused its
                renewal. Task: I owned the number, so I needed a recovery plan within two weeks…
              </div>
            </div>

            <div style={{ position: 'absolute', left: 60, top: 530, opacity: fade(frame, 190, 14) }}>
              <div style={{ ...btn(true), top: 0, left: 0, width: 240, position: 'absolute' }}>這題再試一次</div>
              <div style={{ ...btn(false), top: 0, left: 256, width: 140, position: 'absolute' }}>換一題</div>
            </div>
          </div>
        )}
      </BrowserFrame>

      <Cursor
        clicks={[RETRY_CLICK]}
        path={[
          { f: 150, ...at(900, 400) },
          { f: 214, ...at(180, 558) },
          { f: 240, ...at(180, 558) },
        ]}
      />
    </AbsoluteFill>
  )
}
