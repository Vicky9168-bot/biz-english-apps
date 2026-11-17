import React from 'react'
import { AbsoluteFill, useCurrentFrame } from 'remotion'
import { BrowserFrame, C, Cursor, HL, StepHeader, at, fade } from '../theme'

const CLICK_ALL = 120

const MISSED = [
  { w: 'synergy', zh: '綜效；協同作用' },
  { w: 'bottom line', zh: '底線；重點' },
]

// 步驟 4：結算畫面，沒猜中的字一鍵加入單字本
export const AddBackScene: React.FC = () => {
  const frame = useCurrentFrame()

  return (
    <AbsoluteFill>
      <StepHeader n={4} title="沒猜中的字，加回單字本" />

      <BrowserFrame url="bizenglish.app / charades / session">
        <div style={{ position: 'absolute', left: 60, top: 30, fontSize: 44, fontWeight: 800 }}>
          練習完成
        </div>
        <div style={{ position: 'absolute', left: 60, top: 98, fontSize: 28, color: C.sub }}>
          猜中 3 / 5　·　星星 8 / 15
        </div>

        <div
          style={{
            position: 'absolute',
            left: 60,
            right: 60,
            top: 170,
            height: 44,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            fontSize: 28,
            color: C.sub,
            fontWeight: 600,
            opacity: fade(frame, 6, 14),
          }}
        >
          <span>沒猜中的字，加入單字本再練？</span>
          <span
            style={{
              color: C.ink,
              fontWeight: 700,
              textDecoration: 'underline',
              textUnderlineOffset: 6,
            }}
          >
            全部加入
          </span>
        </div>

        {MISSED.map((r, i) => {
          const done = frame >= CLICK_ALL + i * 12
          return (
            <div
              key={r.w}
              style={{
                position: 'absolute',
                left: 60,
                right: 60,
                top: 230 + i * 100,
                height: 100,
                borderTop: `2px solid ${C.line}`,
                borderBottom: i === MISSED.length - 1 ? `2px solid ${C.line}` : 'none',
                opacity: fade(frame, 14 + i * 8, 14),
              }}
            >
              <div style={{ position: 'absolute', left: 8, top: 26, fontSize: 36 }}>
                <b>{r.w}</b>
                <span style={{ marginLeft: 22, fontSize: 30, color: C.sub }}>{r.zh}</span>
              </div>
              <div
                style={{
                  position: 'absolute',
                  right: 8,
                  top: 22,
                  width: 260,
                  height: 56,
                  boxSizing: 'border-box',
                  borderRadius: 8,
                  border: `2px solid ${done ? C.line : C.ink}`,
                  background: done ? 'transparent' : C.white,
                  color: done ? C.sub : C.ink,
                  fontSize: 26,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {done ? '✓ 已加入' : '＋ 加入單字本'}
              </div>
            </div>
          )
        })}

        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 490,
            display: 'flex',
            justifyContent: 'center',
            opacity: fade(frame, 190, 14),
          }}
        >
          <div
            style={{
              borderLeft: `6px solid ${C.mark}`,
              background: C.white,
              boxShadow: '0 10px 30px rgba(26,36,48,0.14)',
              padding: '18px 34px',
              fontSize: 30,
            }}
          >
            已加到<HL>「我的生字本」</HL>，來源：比手畫腳
          </div>
        </div>
      </BrowserFrame>


      <Cursor
        clicks={[CLICK_ALL]}
        path={[
          { f: 20, ...at(1000, 560) },
          { f: 108, ...at(1365, 192) },
          { f: 330, ...at(1365, 192) },
        ]}
      />
    </AbsoluteFill>
  )
}
