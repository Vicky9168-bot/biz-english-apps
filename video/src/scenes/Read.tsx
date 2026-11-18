import React from 'react'
import { AbsoluteFill, useCurrentFrame } from 'remotion'
import { BrowserFrame, C, Cursor, HL, StepHeader, at, fade } from '../theme'

const CLICK_WORD = 110
const CLICK_SAVE = 250

const line = (top: number): React.CSSProperties => ({
  position: 'absolute',
  left: 60,
  top,
  height: 60,
  lineHeight: '60px',
  fontSize: 32,
  color: C.ink,
  whiteSpace: 'nowrap',
})

// 步驟 1：讀文章、點單字、存到生字本
export const ReadScene: React.FC = () => {
  const frame = useCurrentFrame()
  const picked = frame >= CLICK_WORD
  const saved = frame >= CLICK_SAVE
  const panel = fade(frame, CLICK_WORD + 4, 14)

  return (
    <AbsoluteFill>
      <StepHeader n={1} title="讀文章，存下不熟的字" />

      <BrowserFrame url="bizvoice.app / reading / ai">
        <div style={{ position: 'absolute', left: 60, top: 30, fontSize: 24, color: C.sub }}>
          AI 趨勢 · 2026-11-16
        </div>
        <div
          style={{
            position: 'absolute',
            right: 60,
            top: 30,
            fontSize: 24,
            fontWeight: 700,
            color: C.ink,
            textDecoration: 'underline',
            textUnderlineOffset: 6,
          }}
        >
          我的生字本（{saved ? 4 : 3}）
        </div>

        <div style={{ position: 'absolute', left: 60, top: 80, fontSize: 40, fontWeight: 800 }}>
          Firms brace for tighter AI budgets
        </div>

        <div style={line(170)}>Many firms now face strong</div>
        <div style={line(230)}>
          <span style={{ background: picked ? C.mark : 'transparent', borderRadius: 4 }}>
            headwinds
          </span>{' '}
          as they rethink AI spending.
        </div>
        <div style={line(290)}>
          Leaders must <HL>weigh</HL> costs against
        </div>
        <div style={line(350)}>uncertain returns.</div>

        <div
          style={{
            position: 'absolute',
            left: 60,
            top: 450,
            fontSize: 24,
            color: C.sub,
            opacity: fade(frame, 20, 14),
          }}
        >
          黃色螢光是今日重點單字，其他單字也都能點
        </div>

        {/* 右側：點到的單字 */}
        <div
          style={{
            position: 'absolute',
            left: 940,
            top: 100,
            width: 500,
            height: 440,
            background: C.white,
            border: `2px solid ${C.line}`,
            borderTop: `6px solid ${C.mark}`,
            padding: 30,
            boxSizing: 'border-box',
            opacity: panel,
            transform: `translateY(${(1 - panel) * 16}px)`,
          }}
        >
          <div style={{ fontSize: 54, fontWeight: 800 }}>headwind</div>
          <div style={{ fontSize: 24, color: C.sub }}>noun</div>
          <div style={{ marginTop: 14, fontSize: 38, fontWeight: 700 }}>逆風；阻力</div>
          <div style={{ marginTop: 8, fontSize: 24, color: C.sub }}>
            a force that slows progress
          </div>
          <div
            style={{
              position: 'absolute',
              left: 30,
              top: 330,
              width: 300,
              height: 64,
              borderRadius: 8,
              background: saved ? C.white : C.ink,
              color: saved ? C.ink : C.paper,
              border: `2px solid ${C.ink}`,
              fontSize: 28,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {saved ? '✓ 已在生字本' : '＋ 存到生字本'}
          </div>
        </div>
      </BrowserFrame>


      <Cursor
        clicks={[CLICK_WORD, CLICK_SAVE]}
        path={[
          { f: 20, ...at(1300, 560) },
          { f: 100, ...at(140, 262) },
          { f: 132, ...at(140, 262) },
          { f: 240, ...at(1120, 462) },
          { f: 360, ...at(1120, 462) },
        ]}
      />
    </AbsoluteFill>
  )
}
