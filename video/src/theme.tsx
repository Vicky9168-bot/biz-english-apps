import React from 'react'
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion'

// 與網站相同的「紙張、墨水、螢光筆」色票（見 src/app/globals.css）
export const C = {
  paper: '#f2f3ef',
  ink: '#1a2430',
  mark: '#f5d368',
  white: '#ffffff',
  line: 'rgba(26,36,48,0.15)',
  sub: 'rgba(26,36,48,0.65)',
  red: '#b3392b',
} as const

export const FONT = '"PingFang TC", "Noto Sans TC", "Microsoft JhengHei", sans-serif'

// 瀏覽器視窗內容區的原點與大小（畫布座標）；各場景用 at() 把內容座標轉成畫布座標給游標用
export const BX = 210
export const BY = 246
export const BW = 1500
export const BH = 634
export const at = (x: number, y: number) => ({ x: BX + x, y: BY + y })

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const

export const fade = (frame: number, start: number, dur = 12) =>
  interpolate(frame, [start, start + dur], [0, 1], clamp)

// 場景淡入淡出
export const SceneFade: React.FC<{ duration: number; children: React.ReactNode }> = ({
  duration,
  children,
}) => {
  const frame = useCurrentFrame()
  const opacity = interpolate(frame, [0, 12, duration - 12, duration], [0, 1, 1, 0], clamp)
  return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>
}

export const StepHeader: React.FC<{ n: number; title: string; total?: number }> = ({
  n,
  title,
  total = 4,
}) => (
  <div
    style={{
      position: 'absolute',
      left: BX,
      top: 64,
      display: 'flex',
      alignItems: 'center',
      gap: 24,
    }}
  >
    <span
      style={{
        background: C.ink,
        color: C.paper,
        borderRadius: 999,
        padding: '8px 26px',
        fontSize: 34,
        fontWeight: 700,
      }}
    >
      步驟 {n} / {total}
    </span>
    <span style={{ fontSize: 56, fontWeight: 800, color: C.ink }}>{title}</span>
  </div>
)

export const BrowserFrame: React.FC<{ url: string; children: React.ReactNode }> = ({
  url,
  children,
}) => (
  <div
    style={{
      position: 'absolute',
      left: BX,
      top: BY - 56,
      width: BW,
      height: BH + 56,
      background: C.white,
      borderRadius: 16,
      border: `2px solid ${C.line}`,
      boxShadow: '0 24px 60px rgba(26,36,48,0.18)',
      overflow: 'hidden',
    }}
  >
    <div
      style={{
        height: 56,
        background: '#e8e9e4',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '0 22px',
      }}
    >
      {['#d9cfc9', '#d9d6c0', '#c7d6c4'].map((c) => (
        <i key={c} style={{ width: 16, height: 16, borderRadius: 8, background: c }} />
      ))}
      <span
        style={{
          marginLeft: 18,
          background: C.white,
          borderRadius: 999,
          padding: '4px 22px',
          fontSize: 22,
          color: C.sub,
        }}
      >
        {url}
      </span>
    </div>
    <div style={{ position: 'relative', width: BW, height: BH }}>{children}</div>
  </div>
)

type PathPoint = { f: number; x: number; y: number }

// 滑鼠游標：依關鍵影格移動，clicks 內的影格會出現按下與擴散效果
export const Cursor: React.FC<{ path: PathPoint[]; clicks?: number[] }> = ({
  path,
  clicks = [],
}) => {
  const frame = useCurrentFrame()
  const frames = path.map((p) => p.f)
  const opts = {
    easing: Easing.inOut(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  } as const
  const x = interpolate(frame, frames, path.map((p) => p.x), opts)
  const y = interpolate(frame, frames, path.map((p) => p.y), opts)
  const opacity = interpolate(frame, [frames[0], frames[0] + 10], [0, 1], clamp)

  const lastClick = clicks.filter((c) => c <= frame).pop()
  const t = lastClick === undefined ? 999 : frame - lastClick
  const press = t < 8 ? interpolate(t, [0, 4, 8], [1, 0.82, 1]) : 1
  const rippleScale = interpolate(t, [0, 18], [0.3, 1.7], clamp)
  const rippleOpacity = t < 18 ? interpolate(t, [0, 18], [0.55, 0], clamp) : 0

  return (
    <>
      <div
        style={{
          position: 'absolute',
          left: x - 40,
          top: y - 40,
          width: 80,
          height: 80,
          borderRadius: 40,
          border: `4px solid ${C.mark}`,
          background: 'rgba(245,211,104,0.35)',
          opacity: rippleOpacity,
          transform: `scale(${rippleScale})`,
        }}
      />
      <svg
        width="56"
        height="56"
        viewBox="0 0 24 24"
        style={{
          position: 'absolute',
          left: x - 6,
          top: y - 4,
          opacity,
          transform: `scale(${press})`,
          transformOrigin: '6px 4px',
          filter: 'drop-shadow(0 3px 4px rgba(0,0,0,0.3))',
        }}
      >
        <path
          d="M5 3 L5 19 L9.2 15.2 L12 21 L14.6 19.8 L11.8 14.2 L17.5 14 Z"
          fill={C.ink}
          stroke="#fff"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
      </svg>
    </>
  )
}

// 內文的螢光筆效果
export const HL: React.FC<{ on?: boolean; children: React.ReactNode }> = ({
  on = true,
  children,
}) => (
  <span
    style={{
      background: on ? `linear-gradient(${C.mark}, ${C.mark}) 0 85% / 100% 45% no-repeat` : 'none',
    }}
  >
    {children}
  </span>
)
