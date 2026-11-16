import React from 'react'
import { Storyboard, totalFrames, type Scene } from './Storyboard'
import { QuickDescribe, QuickHook, QuickMode, QuickOutro, QuickResult } from './scenes/CharadesQuick'

// 比手畫腳新手短片（約 25 秒）
const SCENES: readonly Scene[] = [
  { id: 'hook', frames: 90, Component: QuickHook },
  { id: 'mode', frames: 180, Component: QuickMode },
  { id: 'describe', frames: 240, Component: QuickDescribe },
  { id: 'result', frames: 150, Component: QuickResult },
  { id: 'outro', frames: 90, Component: QuickOutro },
]

export const CHARADES_GUIDE_FRAMES = totalFrames(SCENES)

export const CharadesGuide: React.FC = () => <Storyboard scenes={SCENES} />
