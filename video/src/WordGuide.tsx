import React from 'react'
import { Storyboard, buildScenes, totalFrames } from './Storyboard'
import { IntroScene } from './scenes/Intro'
import { ReadScene } from './scenes/Read'
import { VocabScene } from './scenes/Vocab'
import { CharadesScene } from './scenes/Charades'
import { AddBackScene } from './scenes/AddBack'
import { OutroScene } from './scenes/Outro'

// 單字學習 4 步驟（約 1 分鐘）
const SCENES = buildScenes('word', {
  intro: IntroScene,
  read: ReadScene,
  vocab: VocabScene,
  charades: CharadesScene,
  addback: AddBackScene,
  outro: OutroScene,
})

export const WORD_GUIDE_FRAMES = totalFrames(SCENES)

export const WordGuide: React.FC = () => <Storyboard scenes={SCENES} />
