// 從 src/timeline.json 產生各影片的 WebVTT 字幕檔，輸出到 ../public/videos/{file}.vtt
// 用法：npm run captions
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(fileURLToPath(import.meta.url))
const timeline = JSON.parse(readFileSync(join(root, '../src/timeline.json'), 'utf8'))
const outDir = join(root, '../../public/videos')
mkdirSync(outDir, { recursive: true })

const pad = (n, w = 2) => String(n).padStart(w, '0')

// 影格 → WebVTT 時間碼 HH:MM:SS.mmm
function stamp(frame) {
  const ms = Math.round((frame / timeline.fps) * 1000)
  const h = Math.floor(ms / 3_600_000)
  const m = Math.floor((ms % 3_600_000) / 60_000)
  const s = Math.floor((ms % 60_000) / 1000)
  return `${pad(h)}:${pad(m)}:${pad(s)}.${pad(ms % 1000, 3)}`
}

for (const [id, video] of Object.entries(timeline.videos)) {
  const lines = ['WEBVTT', '']
  let offset = 0
  let n = 0
  for (const scene of video.scenes) {
    for (const cue of scene.cues) {
      if (cue.to > scene.frames) {
        throw new Error(`${id}/${scene.id}：字幕結束時間 ${cue.to} 超過場景長度 ${scene.frames}`)
      }
      if (cue.to <= cue.from) {
        throw new Error(`${id}/${scene.id}：字幕「${cue.text}」結束時間必須晚於開始時間`)
      }
      n += 1
      lines.push(String(n), `${stamp(offset + cue.from)} --> ${stamp(offset + cue.to)}`, cue.text, '')
    }
    offset += scene.frames
  }
  const file = join(outDir, `${video.file}.vtt`)
  writeFileSync(file, lines.join('\n'), 'utf8')
  console.log(`${video.file}.vtt  ${n} 句，${stamp(offset)}`)
}
