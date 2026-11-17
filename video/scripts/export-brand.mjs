// 把 public/brand/*.svg 輸出成 PNG（背景透明）並組出 favicon.ico。
// 先執行 tools/brand/make_logo.py 產生 SVG，再執行：  npm run brand
// favicon.ico 的 16／32／48 像素各自用向量原生渲染，不是縮圖。
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { bundle } from '@remotion/bundler'
import { renderStill, selectComposition } from '@remotion/renderer'

const here = dirname(fileURLToPath(import.meta.url))
const brandDir = join(here, '../../public/brand')
mkdirSync(brandDir, { recursive: true })

const JOBS = [
  // [來源 svg, 輸出 png, 寬度 px]
  ['bizvoice-logo.svg', 'bizvoice-logo.png', 1600],
  ['bizvoice-logo-dark.svg', 'bizvoice-logo-dark.png', 1600],
  ['bizvoice-logo-mono.svg', 'bizvoice-logo-mono.png', 1600],
  ['bizvoice-symbol.svg', 'bizvoice-symbol.png', 512],
  ['bizvoice-icon.svg', 'bizvoice-icon-512.png', 512],
  ['bizvoice-icon.svg', 'bizvoice-icon-192.png', 192],
  ['bizvoice-icon-dark.svg', 'bizvoice-icon-dark-512.png', 512],
  ['bizvoice-icon-square.svg', 'apple-touch-icon.png', 180],
  ['bizvoice-favicon.svg', 'favicon-16.png', 16],
  ['bizvoice-favicon.svg', 'favicon-32.png', 32],
  ['bizvoice-favicon.svg', 'favicon-48.png', 48],
]
const ICO_SIZES = [16, 32, 48]

// 從 <svg width="…" height="…"> 取得比例，依目標寬度算出高度
function ratio(file) {
  const head = readFileSync(join(brandDir, file), 'utf8').slice(0, 400)
  const w = Number(/\bwidth="([\d.]+)"/.exec(head)?.[1])
  const h = Number(/\bheight="([\d.]+)"/.exec(head)?.[1])
  if (!w || !h) throw new Error(`${file} 的 <svg> 沒有 width/height`)
  return h / w
}

// ICO 容器：每個尺寸直接內嵌 PNG（現代瀏覽器都支援）
function buildIco(pngs) {
  const header = Buffer.alloc(6)
  header.writeUInt16LE(1, 2) // type = icon
  header.writeUInt16LE(pngs.length, 4)
  let offset = 6 + 16 * pngs.length
  const entries = pngs.map(({ size, data }) => {
    const e = Buffer.alloc(16)
    e.writeUInt8(size % 256, 0)
    e.writeUInt8(size % 256, 1)
    e.writeUInt16LE(1, 4) // planes
    e.writeUInt16LE(32, 6) // bit depth
    e.writeUInt32LE(data.length, 8)
    e.writeUInt32LE(offset, 12)
    offset += data.length
    return e
  })
  return Buffer.concat([header, ...entries, ...pngs.map((p) => p.data)])
}

const serveUrl = await bundle({
  entryPoint: join(here, '../src/brand-entry.tsx'),
  publicDir: brandDir,
})

for (const [file, out, width] of JOBS) {
  const height = Math.round(width * ratio(file))
  const inputProps = { file, width, height }
  const composition = await selectComposition({ serveUrl, id: 'BrandImage', inputProps })
  await renderStill({
    composition,
    serveUrl,
    inputProps,
    output: join(brandDir, out),
    imageFormat: 'png',
  })
  console.log(`${out.padEnd(30)} ${width}x${height}`)
}

const ico = buildIco(
  ICO_SIZES.map((size) => ({ size, data: readFileSync(join(brandDir, `favicon-${size}.png`)) })),
)
writeFileSync(join(brandDir, 'favicon.ico'), ico)
console.log(`${'favicon.ico'.padEnd(30)} ${ICO_SIZES.map((s) => `${s}px`).join(' + ')}`)
