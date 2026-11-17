import React from 'react'
import { Storyboard, buildScenes, totalFrames } from './Storyboard'
import {
  AnswerScene,
  LessonScene,
  ListenScene,
  ListeningHook,
  ListeningOutro,
} from './scenes/ListeningQuick'

// 聽力訓練新手短片（約 30 秒）
const SCENES = buildScenes('listening', {
  hook: ListeningHook,
  lesson: LessonScene,
  listen: ListenScene,
  answer: AnswerScene,
  outro: ListeningOutro,
})

export const LISTENING_GUIDE_FRAMES = totalFrames(SCENES)

export const ListeningGuide: React.FC = () => <Storyboard scenes={SCENES} />
