import React from 'react'
import { Storyboard, totalFrames, type Scene } from './Storyboard'
import { IntroScene } from './scenes/Intro'
import { ReadScene } from './scenes/Read'
import { VocabScene } from './scenes/Vocab'
import { CharadesScene } from './scenes/Charades'
import { AddBackScene } from './scenes/AddBack'
import { OutroScene } from './scenes/Outro'

export const FPS = 30

// 單字學習 4 步驟（約 1 分鐘）。各場景長度以影格計，總長是加總
const SCENES: readonly Scene[] = [
  { id: 'intro', frames: 150, Component: IntroScene },
  { id: 'read', frames: 360, Component: ReadScene },
  { id: 'vocab', frames: 390, Component: VocabScene },
  { id: 'charades', frames: 450, Component: CharadesScene },
  { id: 'addback', frames: 330, Component: AddBackScene },
  { id: 'outro', frames: 210, Component: OutroScene },
]

export const WORD_GUIDE_FRAMES = totalFrames(SCENES)

export const WordGuide: React.FC = () => <Storyboard scenes={SCENES} />
