import React from 'react'
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'
import { C, HL, fade } from '../theme'

// 各支短片共用的開場與結尾畫面

// 開場：功能名稱 → 大標 → 一句話 → 三個動作
export const Hook: React.FC<{
  kicker: string
  title: string
  highlight: string
  rest: string
  chips: string[]
}> = ({ kicker, title, highlight, rest, chips }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  return (
    <AbsoluteFill style={{ padding: '170px 260px' }}>
      <div style={{ opacity: fade(frame, 2, 12), fontSize: 44, color: C.sub, fontWeight: 600 }}>
        {kicker}
      </div>
      <h1 style={{ margin: '14px 0 0', fontSize: 150, fontWeight: 800, opacity: fade(frame, 6, 14) }}>
        {title}
      </h1>
      <p style={{ margin: '24px 0 0', fontSize: 62, fontWeight: 700, opacity: fade(frame, 16, 14) }}>
        <HL>{highlight}</HL>
        {rest}
      </p>
      <div style={{ marginTop: 70, display: 'flex', gap: 28 }}>
        {chips.map((c, i) => {
          const pop = spring({ frame: frame - (34 + i * 10), fps, config: { damping: 200 } })
          return (
            <span
              key={c}
              style={{
                opacity: pop,
                transform: `translateY(${interpolate(pop, [0, 1], [20, 0])}px)`,
                border: `3px solid ${C.ink}`,
                borderRadius: 999,
                padding: '10px 34px',
                fontSize: 44,
                fontWeight: 700,
              }}
            >
              {i + 1}　{c}
            </span>
          )
        })}
      </div>
    </AbsoluteFill>
  )
}

// 結尾：行動呼籲
export const Closing: React.FC<{ title: React.ReactNode; line: string; note: string }> = ({
  title,
  line,
  note,
}) => {
  const frame = useCurrentFrame()

  return (
    <AbsoluteFill style={{ padding: '200px 260px' }}>
      <h1 style={{ margin: 0, fontSize: 130, fontWeight: 800, opacity: fade(frame, 4, 14) }}>
        {title}
      </h1>
      <p style={{ margin: '36px 0 0', fontSize: 58, fontWeight: 700, opacity: fade(frame, 20, 14) }}>
        {line}
      </p>
      <p style={{ margin: '24px 0 0', fontSize: 44, color: C.sub, opacity: fade(frame, 34, 14) }}>
        {note}
      </p>
    </AbsoluteFill>
  )
}
