import React from 'react'
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'
import { C, HL, fade } from '../theme'

const ITEMS = ['讀 1 篇文章', '存 3–5 個不熟的字', '練 1 輪：生字本或比手畫腳']

export const OutroScene: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  return (
    <AbsoluteFill style={{ padding: '140px 260px' }}>
      <h1
        style={{
          margin: 0,
          fontSize: 112,
          fontWeight: 800,
          color: C.ink,
          opacity: fade(frame, 4, 14),
        }}
      >
        每天 <HL>10 分鐘</HL> 就夠了
      </h1>

      <div style={{ marginTop: 70 }}>
        {ITEMS.map((t, i) => {
          const start = 28 + i * 24
          const pop = spring({ frame: frame - start, fps, config: { damping: 200 } })
          return (
            <div
              key={t}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 30,
                padding: '20px 0',
                opacity: pop,
                transform: `translateX(${interpolate(pop, [0, 1], [-40, 0])}px)`,
              }}
            >
              <svg width="64" height="64" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="11" fill={C.mark} />
                <path
                  d="M6.5 12.5 L10.5 16.5 L17.5 8.5"
                  fill="none"
                  stroke={C.ink}
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span style={{ fontSize: 58, fontWeight: 700, color: C.ink }}>{t}</span>
            </div>
          )
        })}
      </div>

      <div
        style={{
          position: 'absolute',
          left: 260,
          right: 260,
          bottom: 120,
          borderTop: `2px solid ${C.line}`,
          paddingTop: 30,
          fontSize: 44,
          color: C.sub,
          opacity: fade(frame, 110, 16),
        }}
      >
        不知道從哪開始？ 首頁 → <b style={{ color: C.ink }}>每日商業閱讀</b>
      </div>
    </AbsoluteFill>
  )
}
