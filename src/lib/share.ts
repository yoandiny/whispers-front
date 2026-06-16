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

// ── Palette "Lettre scellée à la cire" ───────────────────────────────────────
const C_BG_TOP    = '#FAF6F0'   // crème chaude
const C_BG_MID    = '#F5EBE6'   // parchemin rosé
const C_BG_BOT    = '#FAF0EE'   // parchemin pêche
const C_CARD      = '#FFF8F5'   // blanc chaud carte
const C_RED       = '#C0392B'   // rouge laque
const C_BROWN     = '#2C1A13'   // brun encre
const C_MUTED     = '#8A6B5E'   // brun clair
const C_BORDER    = 'rgba(192,57,43,0.20)' // bordure rouge tendre

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

/** Draw a noise-like grain over the canvas for a warm parchment feel. */
function drawGrain(ctx: CanvasRenderingContext2D) {
  const imageData = ctx.createImageData(STORY_W, STORY_H)
  for (let i = 0; i < imageData.data.length; i += 4) {
    const v = Math.random() > 0.5 ? 1 : 0
    imageData.data[i]     = 200
    imageData.data[i + 1] = 160
    imageData.data[i + 2] = 130
    imageData.data[i + 3] = v * 6 // très léger, quasi transparent
  }
  ctx.putImageData(imageData, 0, 0)
}


export interface StoryTemplateOptions {
  message: string
  username: string
  /** Footer call-to-action / link text */
  footer?: string
}

/**
 * Preload the fonts needed for canvas rendering.
 * CSS web fonts are NOT automatically available to canvas — we must
 * explicitly load them via document.fonts before drawing.
 */
async function preloadFonts(): Promise<void> {
  const toLoad = [
    '600 38px Syne',
    '400 40px "Plus Jakarta Sans"',
    '500 64px Caveat',
    '700 64px Caveat',
    '900 60px Syne',
    '600 38px "Space Grotesk"',
  ]
  await Promise.allSettled(toLoad.map((spec) => document.fonts.load(spec)))
}

/**
 * Render an anonymous message onto a branded 1080x1920 story template.
 * Theme: warm parchment "Lettre scellée à la cire" (light, never dark).
 * Returns a PNG blob ready to be shared.
 */
export async function generateStoryImage(opts: StoryTemplateOptions): Promise<Blob> {
  const { message, username, footer } = opts

  // Ensure Google Fonts are available to the canvas context
  await preloadFonts()

  const canvas = document.createElement('canvas')
  canvas.width = STORY_W
  canvas.height = STORY_H
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas non supporté')

  // ── 1. Solid warm cream base (drawn FIRST to guarantee light background) ──
  ctx.fillStyle = C_BG_TOP
  ctx.fillRect(0, 0, STORY_W, STORY_H)

  // ── 2. Soft parchment gradient overlay ─────────────────────────────────────
  const bg = ctx.createLinearGradient(0, 0, 0, STORY_H)
  bg.addColorStop(0,   C_BG_TOP)
  bg.addColorStop(0.45, C_BG_MID)
  bg.addColorStop(1,   C_BG_BOT)
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, STORY_W, STORY_H)

  // ── 3. Grain texture ───────────────────────────────────────────────────────
  drawGrain(ctx)

  // ── 4. Warm radial bloom (centre-haut) ─────────────────────────────────────
  const bloom = ctx.createRadialGradient(STORY_W / 2, STORY_H * 0.28, 80, STORY_W / 2, STORY_H * 0.28, 700)
  bloom.addColorStop(0, 'rgba(192,57,43,0.06)')
  bloom.addColorStop(1, 'rgba(192,57,43,0)')
  ctx.fillStyle = bloom
  ctx.fillRect(0, 0, STORY_W, STORY_H)

  // ── 5. Top separator line ───────────────────────────────────────────────────
  const sepGrad = ctx.createLinearGradient(200, 0, STORY_W - 200, 0)
  sepGrad.addColorStop(0, 'rgba(192,57,43,0)')
  sepGrad.addColorStop(0.5, C_BORDER)
  sepGrad.addColorStop(1, 'rgba(192,57,43,0)')
  ctx.strokeStyle = sepGrad
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(160, 340)
  ctx.lineTo(STORY_W - 160, 340)
  ctx.stroke()

  // ── 6. Brand label ─────────────────────────────────────────────────────────
  ctx.textAlign = 'center'

  // "WHISPERS" label — use Syne if loaded, fallback to system sans-serif
  ctx.fillStyle = C_MUTED
  ctx.font = `700 42px Syne, 'Arial Black', sans-serif`
  ctx.fillText('✦  WHISPERS  ✦', STORY_W / 2, 230)

  // Subtitle
  ctx.fillStyle = C_MUTED
  ctx.font = `400 38px 'Plus Jakarta Sans', Arial, sans-serif`
  ctx.fillText('Message anonyme reçu', STORY_W / 2, 298)

  // ── 7. Message card ─────────────────────────────────────────────────────────
  const cardX  = 100
  const cardW  = STORY_W - cardX * 2
  const cardY  = 410
  const padH   = 90
  const padV   = 70

  // Measure message lines with Caveat (falls back to Georgia — both cursive)
  ctx.font = `500 64px Caveat, Georgia, cursive`
  const lines      = wrapText(ctx, message, cardW - padH * 2)
  const lineH      = 88
  const textBlockH = lines.length * lineH
  const cardH      = Math.max(500, textBlockH + padV * 2 + 80)

  // Card shadow
  ctx.shadowColor   = 'rgba(44,26,19,0.12)'
  ctx.shadowBlur    = 55
  ctx.shadowOffsetY = 18

  // Card fill — solid warm white (never transparent/dark)
  ctx.fillStyle = C_CARD
  roundRect(ctx, cardX, cardY, cardW, cardH, 56)
  ctx.fill()

  ctx.shadowColor   = 'transparent'
  ctx.shadowBlur    = 0
  ctx.shadowOffsetY = 0

  // Card border
  const cardBorderGrad = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + cardH)
  cardBorderGrad.addColorStop(0, 'rgba(192,57,43,0.30)')
  cardBorderGrad.addColorStop(0.5, 'rgba(192,57,43,0.10)')
  cardBorderGrad.addColorStop(1, 'rgba(192,57,43,0.30)')
  ctx.strokeStyle = cardBorderGrad
  ctx.lineWidth   = 3
  roundRect(ctx, cardX, cardY, cardW, cardH, 56)
  ctx.stroke()

  // Opening quote "
  ctx.fillStyle   = 'rgba(192,57,43,0.20)'
  ctx.font        = `italic 160px Georgia, serif`
  ctx.textAlign   = 'left'
  ctx.fillText('\u201C', cardX + padH - 10, cardY + padV + 110)

  // Message text — Caveat (handwritten) with Georgia fallback
  ctx.fillStyle   = C_BROWN
  ctx.font        = `500 64px Caveat, Georgia, cursive`
  ctx.textAlign   = 'center'
  const startY    = cardY + (cardH - textBlockH) / 2 + lineH * 0.4
  lines.forEach((line, i) => {
    ctx.fillText(line, STORY_W / 2, startY + i * lineH)
  })

  // Closing quote "
  ctx.fillStyle   = 'rgba(192,57,43,0.20)'
  ctx.font        = `italic 160px Georgia, serif`
  ctx.textAlign   = 'right'
  ctx.fillText('\u201D', cardX + cardW - padH + 15, cardY + cardH - padV + 60)

  // ── 8. Footer — username & CTA ─────────────────────────────────────────────
  const footerY = cardY + cardH + 110

  // @username — Syne bold (falls back to Arial Black)
  ctx.fillStyle  = C_BROWN
  ctx.font       = `900 58px Syne, 'Arial Black', sans-serif`
  ctx.textAlign  = 'center'
  ctx.fillText(`@${username}`, STORY_W / 2, footerY)

  // CTA
  ctx.fillStyle  = C_MUTED
  ctx.font       = `400 40px 'Plus Jakarta Sans', Arial, sans-serif`
  ctx.fillText(footer ?? 'Envoie-moi un message anonyme', STORY_W / 2, footerY + 68)

  // ── 9. URL pill ─────────────────────────────────────────────────────────────
  const pillText = 'whispers.yotech.mg'
  ctx.font       = `600 36px 'Space Grotesk', Arial, sans-serif`
  const pillW    = ctx.measureText(pillText).width + 90
  const pillH    = 86
  const pillX    = (STORY_W - pillW) / 2
  const pillY    = STORY_H - 200

  // Pill fill
  ctx.fillStyle = 'rgba(192,57,43,0.08)'
  roundRect(ctx, pillX, pillY, pillW, pillH, pillH / 2)
  ctx.fill()

  // Pill border
  ctx.strokeStyle = C_BORDER
  ctx.lineWidth   = 2.5
  roundRect(ctx, pillX, pillY, pillW, pillH, pillH / 2)
  ctx.stroke()

  // Pill text
  ctx.fillStyle  = C_RED
  ctx.textAlign  = 'center'
  ctx.fillText(pillText, STORY_W / 2, pillY + 54)

  // ── 10. Bottom separator ───────────────────────────────────────────────────
  const sepGrad2 = ctx.createLinearGradient(200, 0, STORY_W - 200, 0)
  sepGrad2.addColorStop(0, 'rgba(192,57,43,0)')
  sepGrad2.addColorStop(0.5, C_BORDER)
  sepGrad2.addColorStop(1, 'rgba(192,57,43,0)')
  ctx.strokeStyle = sepGrad2
  ctx.lineWidth   = 2
  ctx.beginPath()
  ctx.moveTo(160, STORY_H - 110)
  ctx.lineTo(STORY_W - 160, STORY_H - 110)
  ctx.stroke()

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error("Échec de la génération de l'image"))
    }, 'image/png')
  })
}

