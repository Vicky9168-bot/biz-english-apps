import React from 'react'
import { AbsoluteFill, Sequence } from 'remotion'
import timeline from './timeline.json'
import { C, FONT, SceneFade } from './theme'

// 每支影片各場景的長度與字幕都在 timeline.json（字幕檔由 scripts/build-captions.mjs 從同一份資料產生）
export type VideoId = keyof typeof timeline.videos
export const FPS = timeline.fps

export type Scene = { id: string; frames: number; Component: React.FC }

// 依 timeline.json 的順序與長度，配上各場景的畫面元件
export const buildScenes = (video: VideoId, components: Record<string, React.FC>): Scene[] =>
  timeline.videos[video].scenes.map(({ id, frames }) => {
    const Component = components[id]
    if (!Component) throw new Error(`timeline.json 的場景 "${id}" 沒有對應的畫面元件（${video}）`)
    return { id, frames, Component }
  })

export const totalFrames = (scenes: readonly Scene[]) =>
  scenes.reduce((sum, s) => sum + s.frames, 0)

// 依序播放各場景，每個場景自帶淡入淡出。字幕不畫在畫面上，改用網頁上的 WebVTT 字幕軌
export const Storyboard: React.FC<{ scenes: readonly Scene[] }> = ({ scenes }) => {
  let from = 0
  return (
    <AbsoluteFill style={{ background: C.paper, fontFamily: FONT, color: C.ink }}>
      {scenes.map(({ id, frames, Component }) => {
        const start = from
        from += frames
        return (
          <Sequence key={id} from={start} durationInFrames={frames}>
            <SceneFade duration={frames}>
              <Component />
            </SceneFade>
          </Sequence>
        )
      })}
    </AbsoluteFill>
  )
}
