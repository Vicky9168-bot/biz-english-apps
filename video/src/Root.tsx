import React from 'react'
import { Composition } from 'remotion'
import { FPS, WORD_GUIDE_FRAMES, WordGuide } from './WordGuide'
import { CHARADES_GUIDE_FRAMES, CharadesGuide } from './CharadesGuide'

export const Root: React.FC = () => (
  <>
    <Composition
      id="WordGuide"
      component={WordGuide}
      durationInFrames={WORD_GUIDE_FRAMES}
      fps={FPS}
      width={1920}
      height={1080}
    />
    <Composition
      id="CharadesGuide"
      component={CharadesGuide}
      durationInFrames={CHARADES_GUIDE_FRAMES}
      fps={FPS}
      width={1920}
      height={1080}
    />
  </>
)
