import React from 'react'
import { Composition } from 'remotion'
import { FPS } from './Storyboard'
import { WORD_GUIDE_FRAMES, WordGuide } from './WordGuide'
import { CHARADES_GUIDE_FRAMES, CharadesGuide } from './CharadesGuide'
import { LISTENING_GUIDE_FRAMES, ListeningGuide } from './ListeningGuide'
import { SPEAKING_GUIDE_FRAMES, SpeakingGuide } from './SpeakingGuide'

// 每支影片一個 Composition；都是 1080p、30fps、無聲；字幕不燒進畫面，由 scripts/build-captions.mjs 產生 WebVTT
const VIDEOS = [
  { id: 'WordGuide', component: WordGuide, frames: WORD_GUIDE_FRAMES },
  { id: 'CharadesGuide', component: CharadesGuide, frames: CHARADES_GUIDE_FRAMES },
  { id: 'ListeningGuide', component: ListeningGuide, frames: LISTENING_GUIDE_FRAMES },
  { id: 'SpeakingGuide', component: SpeakingGuide, frames: SPEAKING_GUIDE_FRAMES },
]

export const Root: React.FC = () => (
  <>
    {VIDEOS.map((v) => (
      <Composition
        key={v.id}
        id={v.id}
        component={v.component}
        durationInFrames={v.frames}
        fps={FPS}
        width={1920}
        height={1080}
      />
    ))}
  </>
)
