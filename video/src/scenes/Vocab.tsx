import React from 'react'
import { AbsoluteFill, useCurrentFrame } from 'remotion'
import { BrowserFrame, C, Cursor, HL, StepHeader, at, fade } from '../theme'

const CLICK_START = 110
const SWAP = 130
const CLICK_OPTION = 280

const WORDS = [
  { w: 'headwind', zh: '逆風；阻力', src: '閱讀' },
  { w: 'leverage', zh: '利用；借力', src: '閱讀' },
  { w: 'bottom line', zh: '底線；重點', src: '比手畫腳' },
  { w: 'synergy', zh: '綜效；協同作用', src: '比手畫腳' },
]

const OPTIONS = [
  { zh: '逆風；阻力', x: 60, y: 300 },
  { zh: '利潤；收益', x: 770, y: 300 },
  { zh: '預算；經費', x: 60, y: 400 },
  { zh: '合約；契約', x: 770, y: 400 },
]

// 步驟 2：生字本列表 → 開始練習 → 挖空選擇題
export const VocabScene: React.FC = () => {
  const frame = useCurrentFrame()
  const listOpacity = 1 - fade(frame, SWAP - 12, 12)
  const quizOpacity = fade(frame, SWAP - 4, 14)
  const answered = frame >= CLICK_OPTION

  return (
    <AbsoluteFill>
      <StepHeader n={2} title="到生字本，用原句練習" />

      <BrowserFrame url="bizvoice.app / reading / vocab">
        {/* 列表 */}
        <div style={{ position: 'absolute', inset: 0, opacity: listOpacity }}>
          <div style={{ position: 'absolute', left: 60, top: 30, fontSize: 44, fontWeight: 800 }}>
            我的生字本
          </div>
          <div style={{ position: 'absolute', left: 60, top: 96, fontSize: 26, color: C.sub }}>
            共 4 個單字，練習過 1 個
          </div>
          <div
            style={{
              position: 'absolute',
              left: 1060,
              top: 44,
              width: 380,
              height: 68,
              borderRadius: 8,
              background: C.ink,
              color: C.paper,
              fontSize: 28,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            開始練習（最多 10 題）
          </div>
          {WORDS.map((r, i) => (
            <div
              key={r.w}
              style={{
                position: 'absolute',
                left: 60,
                right: 60,
                top: 164 + i * 112,
                height: 112,
                borderTop: `2px solid ${C.line}`,
                opacity: fade(frame, 10 + i * 8, 12),
              }}
            >
              <div style={{ paddingTop: 10, fontSize: 36, fontWeight: 700 }}>
                {r.w}
                <span
                  style={{
                    marginLeft: 18,
                    border: `2px solid ${C.line}`,
                    borderRadius: 999,
                    padding: '2px 16px',
                    fontSize: 22,
                    fontWeight: 500,
                    color: C.sub,
                  }}
                >
                  {r.src}
                </span>
              </div>
              <div style={{ marginTop: 6, fontSize: 28 }}>{r.zh}</div>
            </div>
          ))}
        </div>

        {/* 練習題 */}
        <div style={{ position: 'absolute', inset: 0, opacity: quizOpacity }}>
          <div style={{ position: 'absolute', left: 60, top: 34, fontSize: 26, color: C.sub }}>
            第 1 / 10 題
          </div>
          <div style={{ position: 'absolute', right: 60, top: 34, fontSize: 26, color: C.sub }}>
            離開練習
          </div>
          <div style={{ position: 'absolute', left: 60, top: 110, fontSize: 30, color: C.sub }}>
            空格處的單字是什麼意思？
          </div>
          <div
            style={{
              position: 'absolute',
              left: 60,
              top: 165,
              fontSize: 40,
              fontWeight: 600,
              whiteSpace: 'nowrap',
            }}
          >
            Many firms now face strong{' '}
            <span
              style={{
                display: 'inline-block',
                width: 150,
                margin: '0 16px',
                borderBottom: `4px solid ${C.ink}`,
              }}
            />
            as they rethink AI spending.
          </div>

          {OPTIONS.map((o, i) => {
            const correct = i === 0
            const dim = answered && !correct
            return (
              <div
                key={o.zh}
                style={{
                  position: 'absolute',
                  left: o.x,
                  top: o.y,
                  width: 670,
                  height: 80,
                  boxSizing: 'border-box',
                  borderRadius: 8,
                  border: `2px solid ${answered && correct ? C.ink : C.line}`,
                  background: answered && correct ? C.white : 'rgba(242,243,239,0.7)',
                  display: 'flex',
                  alignItems: 'center',
                  paddingLeft: 28,
                  fontSize: 30,
                  fontWeight: answered && correct ? 700 : 500,
                  opacity: dim ? 0.45 : 1,
                }}
              >
                {answered && correct ? <HL>{o.zh}</HL> : o.zh}
              </div>
            )
          })}

          <div
            style={{
              position: 'absolute',
              left: 60,
              top: 510,
              opacity: fade(frame, CLICK_OPTION + 12, 12),
              fontSize: 28,
              color: C.ink,
            }}
          >
            <b>headwind</b>（noun）：逆風；阻力
            <span
              style={{
                marginLeft: 40,
                display: 'inline-block',
                borderRadius: 8,
                background: C.ink,
                color: C.paper,
                padding: '10px 28px',
                fontWeight: 700,
              }}
            >
              下一題
            </span>
          </div>
        </div>
      </BrowserFrame>


      <Cursor
        clicks={[CLICK_START, CLICK_OPTION]}
        path={[
          { f: 20, ...at(1350, 520) },
          { f: 100, ...at(1250, 80) },
          { f: 140, ...at(1250, 80) },
          { f: 270, ...at(395, 342) },
          { f: 390, ...at(395, 342) },
        ]}
      />
    </AbsoluteFill>
  )
}
