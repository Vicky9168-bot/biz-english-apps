import React from 'react'
import { Composition, Img, registerRoot, staticFile } from 'remotion'

// 只給 scripts/export-brand.mjs 用的入口：把 public/brand 裡的 SVG 以指定大小畫出來，截成透明背景的 PNG。
// 和教學影片的 Root 分開，Remotion Studio 裡不會多出無關的項目。
type Props = { file: string; width: number; height: number }

const BrandImage: React.FC<Props> = ({ file }) => (
  <Img src={staticFile(file)} style={{ display: 'block', width: '100%', height: '100%' }} />
)

registerRoot(() => (
  <Composition
    id="BrandImage"
    component={BrandImage}
    durationInFrames={1}
    fps={30}
    width={512}
    height={512}
    defaultProps={{ file: 'bizvoice-symbol.svg', width: 512, height: 512 }}
    calculateMetadata={({ props }) => ({ width: props.width, height: props.height })}
  />
))
