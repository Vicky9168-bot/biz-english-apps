import React from 'react'
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'
import { C, fade } from '../theme'

const STEPS = [
  { n: 1, t: '讀文章，存下不熟的單字' },
  { n: 2, t: '到生字本，用原句挖空練習' },
  { n: 3, t: '用你的生字玩比手畫腳' },
  { n: 4, t: '沒猜中的字，一鍵加回單字本' },
]

export const IntroScene: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  return (
    <AbsoluteFill style={{ padding: '120px 260px' }}>
      <div style={{ opacity: fade(frame, 4, 14) }}>
        <div style={{ fontSize: 40, color: C.sub, fontWeight: 600 }}>BizVoice</div>
        <h1 style={{ margin: '14px 0 0', fontSize: 112, fontWeight: 800, color: C.ink }}>
          單字學習 4 步驟
        </h1>
        <p style={{ margin: '18px 0 0', fontSize: 42, color: C.sub }}>
          約 1 分鐘，看懂單字該怎麼練
        </p>
      </div>

      <div style={{ marginTop: 70, borderBottom: `2px solid ${C.line}` }}>
        {STEPS.map((s, i) => {
          const start = 36 + i * 18
          const pop = spring({ frame: frame - start, fps, config: { damping: 200 } })
          return (
            <div
              key={s.n}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 36,
                padding: '24px 8px',
                borderTop: `2px solid ${C.line}`,
                opacity: pop,
                transform: `translateY(${interpolate(pop, [0, 1], [24, 0])}px)`,
              }}
            >
              <span
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  background: C.ink,
                  color: C.paper,
                  fontSize: 38,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {s.n}
              </span>
              <span style={{ fontSize: 52, fontWeight: 700, color: C.ink }}>{s.t}</span>
            </div>
          )
        })}
      </div>
    </AbsoluteFill>
  )
}
