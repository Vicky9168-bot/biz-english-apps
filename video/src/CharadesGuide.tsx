import React from 'react'
import { Storyboard, buildScenes, totalFrames } from './Storyboard'
import { QuickDescribe, QuickHook, QuickMode, QuickOutro, QuickResult } from './scenes/CharadesQuick'

// 比手畫腳新手短片（約 25 秒）
const SCENES = buildScenes('charades', {
  hook: QuickHook,
  mode: QuickMode,
  describe: QuickDescribe,
  result: QuickResult,
  outro: QuickOutro,
})

export const CHARADES_GUIDE_FRAMES = totalFrames(SCENES)

export const CharadesGuide: React.FC = () => <Storyboard scenes={SCENES} />
