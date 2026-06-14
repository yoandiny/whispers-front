// ─── Sharing utilities (Web Share API + canvas story image) ──────────────────

export interface ShareResult {
  method: 'shared' | 'copied' | 'downloaded'
}

/** True on devices that can natively share (mobile / PWA). */
export function canNativeShare(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.share === 'function'
}

/** True when the device can share generated files (image stories). */
export function canShareFiles(): boolean {
  return (
    canNativeShare() &&
    typeof (navigator as Navigator & { canShare?: (d: ShareData) => boolean }).canShare === 'function'
  )
}

/**
 * Share a clickable link to Instagram / Facebook story or any app via the
 * native share sheet. Falls back to copying the link to the clipboard.
 */
export async function shareLink(url: string, text?: string): Promise<ShareResult> {
  if (canNativeShare()) {
    try {
      await navigator.share({ title: 'Whispers', text: text ?? 'Envoie-moi un message anonyme', url })
      return { method: 'shared' }
    } catch (err: any) {
      if (err?.name === 'AbortError') throw err
      // fall through to clipboard
    }
  }
  await navigator.clipboard.writeText(url)
  return { method: 'copied' }
}

/**
 * Share a generated image (story format) via the native share sheet.
 * Falls back to downloading the image when file-sharing is unavailable.
 */
export async function shareImage(blob: Blob, filename = 'whispers-story.png', text?: string): Promise<ShareResult> {
  const file = new File([blob], filename, { type: 'image/png' })

  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean }
  if (canNativeShare() && nav.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], text })
      return { method: 'shared' }
    } catch (err: any) {
      if (err?.name === 'AbortError') throw err
    }
  }

  // Fallback: trigger a download
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  setTimeout(() => URL.revokeObjectURL(link.href), 1000)
  return { method: 'downloaded' }
}

// ─── Canvas story-image generation ───────────────────────────────────────────

const STORY_W = 1080
const STORY_H = 1920

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/)
  const lines: string[] = []
  let current = ''

  for (const word of words) {
    const test = current ? `${current} ${word}` : word
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current)
      current = word
    } else {
      current = test
    }
  }
  if (current) lines.push(current)
  return lines
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

export interface StoryTemplateOptions {
  message: string
  username: string
  /** Footer call-to-action / link text */
  footer?: string
}

/**
 * Render an anonymous message onto a branded 1080x1920 story template.
 * Returns a PNG blob ready to be shared.
 */
export async function generateStoryImage(opts: StoryTemplateOptions): Promise<Blob> {
  const { message, username, footer } = opts
  const canvas = document.createElement('canvas')
  canvas.width = STORY_W
  canvas.height = STORY_H
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas non supporté')

  // Background gradient
  const bg = ctx.createLinearGradient(0, 0, STORY_W, STORY_H)
  bg.addColorStop(0, '#141210')
  bg.addColorStop(1, '#0a0a0b')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, STORY_W, STORY_H)

  // Soft accent glow
  const glow = ctx.createRadialGradient(STORY_W / 2, 520, 40, STORY_W / 2, 520, 700)
  glow.addColorStop(0, 'rgba(200,170,130,0.16)')
  glow.addColorStop(1, 'rgba(200,170,130,0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, STORY_W, STORY_H)

  // Brand title
  ctx.textAlign = 'center'
  ctx.fillStyle = '#c8aa82'
  ctx.font = "italic 64px 'Instrument Serif', Georgia, serif"
  ctx.fillText('Whispers', STORY_W / 2, 280)

  ctx.fillStyle = '#7a756d'
  ctx.font = "400 34px 'Inter', sans-serif"
  ctx.fillText('Message anonyme', STORY_W / 2, 340)

  // Message card
  const cardX = 110
  const cardW = STORY_W - cardX * 2
  const cardY = 540
  const padding = 80

  ctx.font = "500 52px 'Inter', sans-serif"
  const lines = wrapText(ctx, message, cardW - padding * 2)
  const lineHeight = 76
  const textBlockH = lines.length * lineHeight
  const cardH = Math.max(420, textBlockH + padding * 2 + 60)

  ctx.fillStyle = 'rgba(255,255,255,0.04)'
  roundRect(ctx, cardX, cardY, cardW, cardH, 48)
  ctx.fill()
  ctx.lineWidth = 2
  ctx.strokeStyle = 'rgba(200,170,130,0.22)'
  roundRect(ctx, cardX, cardY, cardW, cardH, 48)
  ctx.stroke()

  // Opening quote mark
  ctx.fillStyle = 'rgba(200,170,130,0.35)'
  ctx.font = "italic 120px 'Instrument Serif', Georgia, serif"
  ctx.textAlign = 'left'
  ctx.fillText('“', cardX + padding - 10, cardY + 110)

  // Message text
  ctx.fillStyle = '#ede8e1'
  ctx.font = "500 52px 'Inter', sans-serif"
  ctx.textAlign = 'center'
  const startY = cardY + (cardH - textBlockH) / 2 + 40
  lines.forEach((line, i) => {
    ctx.fillText(line, STORY_W / 2, startY + i * lineHeight)
  })

  // Footer CTA
  ctx.fillStyle = '#ede8e1'
  ctx.font = "600 44px 'Inter', sans-serif"
  ctx.textAlign = 'center'
  ctx.fillText(`@${username}`, STORY_W / 2, STORY_H - 320)

  ctx.fillStyle = '#c8aa82'
  ctx.font = "400 36px 'Inter', sans-serif"
  ctx.fillText(footer ?? 'Envoie-moi un message anonyme', STORY_W / 2, STORY_H - 250)

  // Pill button
  const pillText = 'whispers.app'
  ctx.font = "500 34px 'Inter', sans-serif"
  const pillW = ctx.measureText(pillText).width + 80
  const pillH = 84
  const pillX = (STORY_W - pillW) / 2
  const pillY = STORY_H - 200
  ctx.fillStyle = 'rgba(200,170,130,0.12)'
  roundRect(ctx, pillX, pillY, pillW, pillH, pillH / 2)
  ctx.fill()
  ctx.strokeStyle = 'rgba(200,170,130,0.3)'
  ctx.lineWidth = 2
  roundRect(ctx, pillX, pillY, pillW, pillH, pillH / 2)
  ctx.stroke()
  ctx.fillStyle = '#c8aa82'
  ctx.fillText(pillText, STORY_W / 2, pillY + 54)

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error("Échec de la génération de l'image"))
    }, 'image/png')
  })
}
