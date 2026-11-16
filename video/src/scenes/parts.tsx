import React from 'react'
import { C } from '../theme'

// 比手畫腳練習畫面的共用零件（單字學習影片與比手畫腳短片都會用到）。
// 座標都是瀏覽器內容區內的位置（寬 1500、高 634）。

// 題目上方：題號、進度條、提示、要描述的單字
export const SessionTop: React.FC<{ word: string; index?: number; total?: number }> = ({
  word,
  index = 1,
  total = 5,
}) => (
  <>
    <div style={{ position: 'absolute', left: 60, top: 30, fontSize: 26, color: C.sub }}>
      第 {index} / {total} 題
    </div>
    <div
      style={{ position: 'absolute', left: 60, top: 76, width: 1380, height: 8, background: C.line }}
    >
      <div style={{ width: `${(index / total) * 100}%`, height: '100%', background: C.ink }} />
    </div>
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: 104,
        textAlign: 'center',
        fontSize: 28,
        color: C.sub,
      }}
    >
      用英文描述這個字，不能直接說出它
    </div>
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: 140,
        textAlign: 'center',
        fontSize: 84,
        fontWeight: 800,
      }}
    >
      {word}
    </div>
  </>
)

// 麥克風按鈕：在 clickAt 按下開始錄音、endAt 停止；錄音中有脈動、聲波與計時
export const MicButton: React.FC<{
  frame: number
  clickAt: number
  endAt: number
  cx?: number
  cy?: number
}> = ({ frame, clickAt, endAt, cx = 750, cy = 330 }) => {
  const recording = frame >= clickAt && frame < endAt
  const pulse = 1 + 0.12 * Math.sin(((frame - clickAt) / 6) * Math.PI)
  const bar = (side: number, b: number) =>
    18 + 14 * Math.abs(Math.sin(frame / 4 + b * 1.3 + (side > 0 ? 1 : 0)))

  return (
    <>
      <div
        style={{
          position: 'absolute',
          left: cx - 56,
          top: cy - 56,
          width: 112,
          height: 112,
          borderRadius: 56,
          background: recording ? C.red : C.ink,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transform: recording ? `scale(${pulse})` : 'none',
          boxShadow: recording ? '0 0 0 14px rgba(179,57,43,0.18)' : 'none',
        }}
      >
        <svg
          width="52"
          height="52"
          viewBox="0 0 24 24"
          fill="none"
          stroke={C.paper}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="9" y="3" width="6" height="11" rx="3" fill={C.paper} />
          <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
        </svg>
      </div>

      {recording &&
        [-1, 1].map((side) =>
          [0, 1, 2, 3, 4].map((b) => (
            <div
              key={`${side}-${b}`}
              style={{
                position: 'absolute',
                left: cx + side * (110 + b * 26) - 6,
                top: cy - bar(side, b),
                width: 12,
                height: 2 * bar(side, b),
                borderRadius: 6,
                background: C.red,
              }}
            />
          ))
        )}

      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: cy + 80,
          textAlign: 'center',
          fontSize: 24,
          color: recording ? C.red : C.sub,
          fontWeight: recording ? 700 : 400,
        }}
      >
        {recording
          ? `錄音中 0:0${Math.min(9, Math.floor((frame - clickAt) / 30))}`
          : frame < clickAt
            ? '按一下麥克風，開始說'
            : ''}
      </div>
    </>
  )
}
