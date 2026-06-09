/**
 * One-off: split horizontal 3-icon sprite and remove black background.
 * Usage: node scripts/split-feature-icons.mjs <input.png>
 */
import { mkdir } from 'fs/promises'
import path from 'path'
import sharp from 'sharp'

const input = process.argv[2]
if (!input) {
  console.error('Usage: node scripts/split-feature-icons.mjs <input.png>')
  process.exit(1)
}

const outDir = path.join('public', 'images', 'icons')
const names = ['pest-alert', 'satellite-ndvi', 'ai-chat']

await mkdir(outDir, { recursive: true })

const { width, height } = await sharp(input).metadata()
const sliceWidth = Math.floor(width / 3)

function removeBlackBackground(buffer, info) {
  const data = Buffer.from(buffer)
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    if (r < 40 && g < 40 && b < 40) {
      data[i + 3] = 0
    }
  }
  return data
}

for (let i = 0; i < 3; i++) {
  const extracted = await sharp(input)
    .extract({ left: i * sliceWidth, top: 0, width: sliceWidth, height })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const transparent = removeBlackBackground(extracted.data, extracted.info)

  const outPath = path.join(outDir, `${names[i]}.png`)
  await sharp(transparent, {
    raw: {
      width: extracted.info.width,
      height: extracted.info.height,
      channels: 4,
    },
  })
    .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(outPath)

  console.log('Wrote', outPath)
}
