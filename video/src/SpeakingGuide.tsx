import React from 'react'
import { Storyboard, buildScenes, totalFrames } from './Storyboard'
import {
  FeedbackScene,
  PickScene,
  RecordScene,
  SpeakingHook,
  SpeakingOutro,
} from './scenes/SpeakingQuick'

// 商業場景練習新手短片（約 30 秒）
const SCENES = buildScenes('speaking', {
  hook: SpeakingHook,
  pick: PickScene,
  record: RecordScene,
  feedback: FeedbackScene,
  outro: SpeakingOutro,
})

export const SPEAKING_GUIDE_FRAMES = totalFrames(SCENES)

export const SpeakingGuide: React.FC = () => <Storyboard scenes={SCENES} />
