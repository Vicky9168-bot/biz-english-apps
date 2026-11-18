import React from 'react'
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'
import { BrowserFrame, C, Cursor, HL, StepHeader, at, fade } from '../theme'
import { MicButton, SessionTop } from './parts'
import { Closing, Hook } from './TitleScenes'

// 比手畫腳新手短片（約 25 秒）：選模式 → 允許麥克風並用英文描述 → AI 猜、拿星星

const TOTAL = 3

// ---------- 開場 ----------
export const QuickHook: React.FC = () => (
  <Hook
    kicker="比手畫腳單字"
    title="第一次玩？"
    highlight="3 個動作"
    rest="，馬上上手"
    chips={['選模式', '說英文', '看結果']}
  />
)

// ---------- 步驟 1：選模式 ----------
const MODE_CLICK = 120

export const QuickMode: React.FC = () => {
  const frame = useCurrentFrame()
  const picked = frame >= 100

  const rows = [
    { t: '我來描述', d: 'AI 給你一個字，你用英文描述，讓 AI 猜', aside: '開始 5 題' },
    { t: 'AI 來描述', d: 'AI 描述一個字，你用英文猜出來', aside: '開始 5 題' },
  ]

  return (
    <AbsoluteFill>
      <StepHeader n={1} total={TOTAL} title="選一個模式" />
      <BrowserFrame url="bizvoice.app / charades">
        <div style={{ position: 'absolute', left: 60, top: 34, fontSize: 44, fontWeight: 800 }}>
          比手畫腳單字
        </div>
        <div style={{ position: 'absolute', left: 60, top: 130, fontSize: 34, fontWeight: 700 }}>
          選擇今天的練習模式
        </div>
        {rows.map((r, i) => (
          <div
            key={r.t}
            style={{
              position: 'absolute',
              left: 60,
              right: 60,
              top: 190 + i * 130,
              height: 130,
              borderTop: `2px solid ${C.line}`,
              borderBottom: i === 1 ? `2px solid ${C.line}` : 'none',
              background: i === 0 && picked ? 'rgba(255,255,255,0.85)' : 'transparent',
              opacity: fade(frame, 8 + i * 8, 14),
            }}
          >
            <div style={{ paddingTop: 24, fontSize: 38, fontWeight: 700 }}>
              {i === 0 && picked ? <HL>{r.t}</HL> : r.t}
            </div>
            <div style={{ marginTop: 8, fontSize: 26, color: C.sub }}>{r.d}</div>
            <div style={{ position: 'absolute', right: 8, top: 30, fontSize: 28, fontWeight: 700 }}>
              {i === 0 && picked ? <HL>{r.aside}</HL> : r.aside}
            </div>
            {i === 0 && (
              <div
                style={{
                  position: 'absolute',
                  right: 8,
                  top: 78,
                  background: C.mark,
                  borderRadius: 999,
                  padding: '2px 18px',
                  fontSize: 22,
                  fontWeight: 700,
                  opacity: fade(frame, 60, 14),
                }}
              >
                新手建議
              </div>
            )}
          </div>
        ))}
        <div
          style={{
            position: 'absolute',
            left: 60,
            top: 478,
            fontSize: 24,
            color: C.sub,
            opacity: fade(frame, 30, 14),
          }}
        >
          需要允許瀏覽器使用麥克風
        </div>
      </BrowserFrame>

      <Cursor
        clicks={[MODE_CLICK]}
        path={[
          { f: 14, ...at(1300, 540) },
          { f: 90, ...at(1000, 250) },
          { f: 180, ...at(1000, 250) },
        ]}
      />
    </AbsoluteFill>
  )
}

// ---------- 步驟 2：允許麥克風、用英文描述 ----------
const PERMIT_CLICK = 62
const MIC_CLICK = 120
const REC_END = 190
const TRANSCRIPT = "It's the date when you must finish your work."

export const QuickDescribe: React.FC = () => {
  const frame = useCurrentFrame()
  const promptOpacity = fade(frame, 10, 10) * (1 - fade(frame, 70, 8))
  const typed = Math.max(0, Math.floor((frame - REC_END) * 1.4))

  return (
    <AbsoluteFill>
      <StepHeader n={2} total={TOTAL} title="看到單字，用英文說" />
      <BrowserFrame url="bizvoice.app / charades / session">
        <SessionTop word="deadline" />
        <MicButton frame={frame} clickAt={MIC_CLICK} endAt={REC_END} />

        <div
          style={{
            position: 'absolute',
            left: 100,
            right: 100,
            top: 440,
            height: 62,
            boxSizing: 'border-box',
            border: `2px solid ${C.line}`,
            borderRadius: 8,
            padding: '0 22px',
            display: 'flex',
            alignItems: 'center',
            fontSize: 25,
            whiteSpace: 'nowrap',
            opacity: frame >= REC_END ? 1 : 0,
          }}
        >
          {TRANSCRIPT.slice(0, typed)}
        </div>

        {/* 瀏覽器的麥克風權限提示 */}
        <div
          style={{
            position: 'absolute',
            left: 30,
            top: 10,
            width: 540,
            height: 200,
            boxSizing: 'border-box',
            padding: 24,
            background: C.white,
            border: `2px solid ${C.line}`,
            borderRadius: 12,
            boxShadow: '0 16px 40px rgba(26,36,48,0.22)',
            opacity: promptOpacity,
          }}
        >
          <div style={{ fontSize: 26, fontWeight: 600 }}>bizvoice.app 想要使用你的麥克風</div>
          <div style={{ position: 'absolute', left: 24, top: 120, display: 'flex', gap: 16 }}>
            {[
              { t: '允許', primary: true },
              { t: '封鎖', primary: false },
            ].map((b) => (
              <div
                key={b.t}
                style={{
                  width: 200,
                  height: 56,
                  borderRadius: 8,
                  boxSizing: 'border-box',
                  background: b.primary ? C.ink : C.white,
                  color: b.primary ? C.paper : C.ink,
                  border: `2px solid ${b.primary ? C.ink : C.line}`,
                  fontSize: 26,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {b.t}
              </div>
            ))}
          </div>
        </div>
      </BrowserFrame>

      <Cursor
        clicks={[PERMIT_CLICK, MIC_CLICK]}
        path={[
          { f: 8, ...at(1300, 540) },
          { f: 54, ...at(154, 158) },
          { f: 76, ...at(154, 158) },
          { f: 112, ...at(750, 332) },
          { f: 240, ...at(750, 332) },
        ]}
      />
    </AbsoluteFill>
  )
}

// ---------- 步驟 3：AI 猜、星星 ----------
export const QuickResult: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const stars = spring({ frame: frame - 32, fps, config: { damping: 12 } })

  return (
    <AbsoluteFill>
      <StepHeader n={3} total={TOTAL} title="AI 來猜，最多 3 次" />
      <BrowserFrame url="bizvoice.app / charades / session">
        <SessionTop word="deadline" />
        <MicButton frame={frame} clickAt={-100} endAt={-50} />

        <div
          style={{
            position: 'absolute',
            left: 100,
            right: 100,
            top: 440,
            height: 62,
            boxSizing: 'border-box',
            border: `2px solid ${C.line}`,
            borderRadius: 8,
            padding: '0 22px',
            display: 'flex',
            alignItems: 'center',
            fontSize: 25,
            whiteSpace: 'nowrap',
          }}
        >
          {TRANSCRIPT}
        </div>

        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 506,
            textAlign: 'center',
            fontSize: 40,
            fontWeight: 700,
            opacity: fade(frame, 20, 12),
          }}
        >
          AI 猜：<HL>deadline</HL> ✓ 猜中！
          <span
            style={{
              display: 'inline-block',
              marginLeft: 28,
              color: '#d9a400',
              transform: `scale(${interpolate(stars, [0, 1], [0.2, 1])})`,
            }}
          >
            ★★★
          </span>
        </div>

        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 568,
            textAlign: 'center',
            fontSize: 24,
            color: C.sub,
            opacity: fade(frame, 70, 14),
          }}
        >
          第 1 次猜中 ★★★　·　第 2 次 ★★　·　第 3 次 ★
        </div>
      </BrowserFrame>

    </AbsoluteFill>
  )
}

// ---------- 結尾 ----------
export const QuickOutro: React.FC = () => (
  <Closing
    title={
      <>
        現在就<HL>開始</HL>
      </>
    }
    line="「比手畫腳」→「我來描述」"
    note="每輪 5 題，說錯也沒關係，多說就會進步"
  />
)
