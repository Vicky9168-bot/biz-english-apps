import React from 'react'
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'
import { BrowserFrame, C, Captions, Cursor, HL, StepHeader, at, fade } from '../theme'
import { MicButton, SessionTop } from './parts'

const CLICK_ROW = 110
const SWAP = 140
const CLICK_MIC = 215
const REC_END = 285
const TRANSCRIPT =
  "It's a force that makes it harder for a company to grow, like wind blowing against you."

// 步驟 3：比手畫腳首頁 →「用我的生字玩」→ 錄音描述 → AI 猜中
export const CharadesScene: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const homeOpacity = 1 - fade(frame, SWAP - 12, 12)
  const sessionOpacity = fade(frame, SWAP - 4, 14)
  const typed = Math.max(0, Math.floor((frame - REC_END) * 1.6))
  const guessed = frame >= 360
  const stars = spring({ frame: frame - 372, fps, config: { damping: 12 } })

  return (
    <AbsoluteFill>
      <StepHeader n={3} title="用你的生字玩比手畫腳" />

      <BrowserFrame url="bizenglish.app / charades">
        {/* 首頁 */}
        <div style={{ position: 'absolute', inset: 0, opacity: homeOpacity }}>
          <div style={{ position: 'absolute', left: 60, top: 34, fontSize: 44, fontWeight: 800 }}>
            比手畫腳單字
          </div>
          <div style={{ position: 'absolute', left: 60, top: 130, fontSize: 34, fontWeight: 700 }}>
            用我的生字玩
          </div>
          <div style={{ position: 'absolute', right: 60, top: 140, fontSize: 24, color: C.sub }}>
            不計入排行榜
          </div>
          {[
            { t: '我來描述（我的生字）', d: '從單字本的 4 個字抽 5 題，優先出你常答錯的', go: true },
            { t: 'AI 來描述（我的生字）', d: 'AI 描述你單字本裡的字，你用英文猜', go: false },
          ].map((r, i) => (
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
                background: frame >= 90 && i === 0 && frame < SWAP ? 'rgba(255,255,255,0.85)' : 'transparent',
              }}
            >
              <div style={{ paddingTop: 24, fontSize: 38, fontWeight: 700 }}>
                {i === 0 && frame >= 90 ? <HL>{r.t}</HL> : r.t}
              </div>
              <div style={{ marginTop: 8, fontSize: 26, color: C.sub }}>{r.d}</div>
              <div
                style={{
                  position: 'absolute',
                  right: 8,
                  top: 30,
                  fontSize: 28,
                  fontWeight: 700,
                }}
              >
                {r.go ? <HL>開始</HL> : '開始'}
              </div>
            </div>
          ))}
        </div>

        {/* 練習 */}
        <div style={{ position: 'absolute', inset: 0, opacity: sessionOpacity }}>
          <SessionTop word="headwind" />
          <MicButton frame={frame} clickAt={CLICK_MIC} endAt={REC_END} />

          {/* 逐字稿 */}
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

          {/* AI 猜測 */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: 530,
              textAlign: 'center',
              fontSize: 40,
              fontWeight: 700,
              opacity: guessed ? 1 : 0,
            }}
          >
            AI 猜：<HL>headwind</HL> ✓ 猜中！
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
        </div>
      </BrowserFrame>

      <Captions
        items={[
          { from: 0, to: 134, text: '點「用我的生字玩」，從單字本抽題' },
          { from: 142, to: 300, text: '看到單字後，用英文描述它，不能直接說出這個字' },
          { from: 300, to: 450, text: 'AI 猜中就拿星星；猜不中最多再試 3 次' },
        ]}
      />

      <Cursor
        clicks={[CLICK_ROW, CLICK_MIC]}
        path={[
          { f: 20, ...at(1350, 540) },
          { f: 100, ...at(1000, 250) },
          { f: 150, ...at(1000, 250) },
          { f: 205, ...at(750, 332) },
          { f: 450, ...at(750, 332) },
        ]}
      />
    </AbsoluteFill>
  )
}
