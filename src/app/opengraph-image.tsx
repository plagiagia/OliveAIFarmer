import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function OpenGraphImage() {
  const image = await readFile(join(process.cwd(), 'public/images/hero-landscape.png'))
  const src = `data:image/png;base64,${image.toString('base64')}`
  return new ImageResponse(
    <div style={{ display: 'flex', width: '100%', height: '100%', background: '#f5f8ef', position: 'relative' }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" width="1200" height="630" style={{ objectFit: 'cover', position: 'absolute', inset: 0 }} />
      <div style={{ display: 'flex', alignItems: 'center', padding: '48px 70px', color: '#245630', fontSize: 88, fontWeight: 700, background: 'rgba(255,255,255,0.82)', alignSelf: 'flex-start', margin: 50, borderRadius: 24 }}>OliveIQ</div>
    </div>,
    size,
  )
}
