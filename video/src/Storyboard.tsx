import React from 'react'
import { AbsoluteFill, Sequence } from 'remotion'
import { C, FONT, SceneFade } from './theme'

export type Scene = { id: string; frames: number; Component: React.FC }

export const totalFrames = (scenes: readonly Scene[]) =>
  scenes.reduce((sum, s) => sum + s.frames, 0)

// 依序播放各場景，每個場景自帶淡入淡出
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
