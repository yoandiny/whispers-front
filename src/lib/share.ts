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
const C_RED_DARK  = '#8B0000'   // bordeaux profond
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

/** Draw decorative wax seal circle. */
function drawWaxSeal(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  // Outer glow
  const glow = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r * 1.6)
  glow.addColorStop(0, 'rgba(192,57,43,0.20)')
  glow.addColorStop(1, 'rgba(192,57,43,0)')
  ctx.fillStyle = glow
  ctx.beginPath()
  ctx.arc(cx, cy, r * 1.6, 0, Math.PI * 2)
  ctx.fill()

  // Main disc – radial gradient for wax relief
  const disc = ctx.createRadialGradient(cx - r * 0.25, cy - r * 0.25, r * 0.05, cx, cy, r)
  disc.addColorStop(0, '#D44535')
  disc.addColorStop(0.5, C_RED)
  disc.addColorStop(1, C_RED_DARK)
  ctx.fillStyle = disc
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.fill()

  // Rim
  ctx.strokeStyle = 'rgba(255,200,190,0.25)'
  ctx.lineWidth = 4
  ctx.beginPath()
  ctx.arc(cx, cy, r - 3, 0, Math.PI * 2)
  ctx.stroke()

  // Inner "W" monogram
  ctx.fillStyle = 'rgba(255,248,245,0.9)'
  ctx.font = `bold ${Math.round(r * 0.85)}px Georgia, serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('W', cx, cy + r * 0.05)
  ctx.textBaseline = 'alphabetic'
}

export interface StoryTemplateOptions {
  message: string
  username: string
  /** Footer call-to-action / link text */
  footer?: string
}

/**
 * Render an anonymous message onto a branded 1080x1920 story template.
 * Theme: warm parchment "Lettre scellée à la cire".
 * Returns a PNG blob ready to be shared.
 */
export async function generateStoryImage(opts: StoryTemplateOptions): Promise<Blob> {
  const { message, username, footer } = opts
  const canvas = document.createElement('canvas')
  canvas.width = STORY_W
  canvas.height = STORY_H
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas non supporté')

  // ── 1. Background gradient (crème → parchemin rosé → parchemin pêche) ──
  const bg = ctx.createLinearGradient(0, 0, STORY_W * 0.4, STORY_H)
  bg.addColorStop(0,   C_BG_TOP)
  bg.addColorStop(0.5, C_BG_MID)
  bg.addColorStop(1,   C_BG_BOT)
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, STORY_W, STORY_H)

  // ── 2. Grain texture ───────────────────────────────────────────────────────
  drawGrain(ctx)

  // ── 3. Warm radial bloom (centre-haut) ────────────────────────────────────
  const bloom = ctx.createRadialGradient(STORY_W / 2, STORY_H * 0.28, 80, STORY_W / 2, STORY_H * 0.28, 700)
  bloom.addColorStop(0, 'rgba(192,57,43,0.07)')
  bloom.addColorStop(1, 'rgba(192,57,43,0)')
  ctx.fillStyle = bloom
  ctx.fillRect(0, 0, STORY_W, STORY_H)

  // ── 4. Top horizontal separator line ──────────────────────────────────────
  const sepGrad = ctx.createLinearGradient(200, 0, STORY_W - 200, 0)
  sepGrad.addColorStop(0, 'rgba(192,57,43,0)')
  sepGrad.addColorStop(0.5, C_BORDER)
  sepGrad.addColorStop(1, 'rgba(192,57,43,0)')
  ctx.strokeStyle = sepGrad
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(160, 360)
  ctx.lineTo(STORY_W - 160, 360)
  ctx.stroke()

  // ── 5. Brand name "Whispers" ───────────────────────────────────────────────
  ctx.textAlign = 'center'

  // Small label above
  ctx.fillStyle = C_MUTED
  ctx.font = `600 38px 'Syne', 'Space Grotesk', sans-serif`
  ctx.letterSpacing = '0.12em'  // not standard, harmless
  ctx.fillText('✦  WHISPERS  ✦', STORY_W / 2, 240)
  ctx.letterSpacing = '0'

  // Subtitle
  ctx.fillStyle = C_MUTED
  ctx.font = `400 40px 'Plus Jakarta Sans', sans-serif`
  ctx.fillText('Message anonyme reçu', STORY_W / 2, 312)

  // ── 6. Message card ────────────────────────────────────────────────────────
  const cardX   = 100
  const cardW   = STORY_W - cardX * 2
  const cardY   = 440
  const padH    = 90
  const padV    = 70

  // Font for wrapping measurement (Caveat-style: cursive-ish with Georgia fallback)
  ctx.font = `500 64px 'Caveat', Georgia, cursive`
  const lines     = wrapText(ctx, message, cardW - padH * 2)
  const lineH     = 88
  const textBlockH = lines.length * lineH
  const cardH     = Math.max(500, textBlockH + padV * 2 + 80)

  // Card shadow
  ctx.shadowColor   = 'rgba(44,26,19,0.10)'
  ctx.shadowBlur    = 60
  ctx.shadowOffsetY = 20

  // Card fill
  ctx.fillStyle = C_CARD
  roundRect(ctx, cardX, cardY, cardW, cardH, 56)
  ctx.fill()

  ctx.shadowColor = 'transparent'
  ctx.shadowBlur  = 0
  ctx.shadowOffsetY = 0

  // Card border — gradient rouge laque
  const cardBorderGrad = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + cardH)
  cardBorderGrad.addColorStop(0, 'rgba(192,57,43,0.30)')
  cardBorderGrad.addColorStop(0.5, 'rgba(192,57,43,0.12)')
  cardBorderGrad.addColorStop(1, 'rgba(192,57,43,0.30)')
  ctx.strokeStyle = cardBorderGrad
  ctx.lineWidth   = 3
  roundRect(ctx, cardX, cardY, cardW, cardH, 56)
  ctx.stroke()

  // Opening quote " — Caveat handwriting style
  ctx.fillStyle   = 'rgba(192,57,43,0.22)'
  ctx.font        = `italic 180px Georgia, serif`
  ctx.textAlign   = 'left'
  ctx.fillText('\u201C', cardX + padH - 16, cardY + padV + 120)

  // Message text in Caveat (cursive, warm, handwritten feel)
  ctx.fillStyle   = C_BROWN
  ctx.font        = `500 64px 'Caveat', Georgia, cursive`
  ctx.textAlign   = 'center'
  const startY    = cardY + (cardH - textBlockH) / 2 + lineH * 0.4
  lines.forEach((line, i) => {
    ctx.fillText(line, STORY_W / 2, startY + i * lineH)
  })

  // Closing quote " — bottom right
  ctx.fillStyle   = 'rgba(192,57,43,0.22)'
  ctx.font        = `italic 180px Georgia, serif`
  ctx.textAlign   = 'right'
  ctx.fillText('\u201D', cardX + cardW - padH + 20, cardY + cardH - padV + 80)

  // ── 7. Wax seal between card and footer ────────────────────────────────────
  const sealCY = cardY + cardH + 140
  drawWaxSeal(ctx, STORY_W / 2, sealCY, 72)

  // ── 8. Footer — username & CTA ─────────────────────────────────────────────
  const footerY = sealCY + 140

  // @username in gothic bold
  ctx.fillStyle  = C_BROWN
  ctx.font       = `900 60px 'Unbounded', 'Syne', sans-serif`
  ctx.textAlign  = 'center'
  ctx.fillText(`@${username}`, STORY_W / 2, footerY)

  // CTA line
  ctx.fillStyle  = C_MUTED
  ctx.font       = `400 42px 'Plus Jakarta Sans', sans-serif`
  ctx.fillText(footer ?? 'Envoie-moi un message anonyme', STORY_W / 2, footerY + 72)

  // ── 9. URL pill button ─────────────────────────────────────────────────────
  const pillText  = 'whispers.yotech.mg'
  ctx.font        = `600 38px 'Space Grotesk', sans-serif`
  const pillW     = ctx.measureText(pillText).width + 90
  const pillH     = 90
  const pillX     = (STORY_W - pillW) / 2
  const pillY     = STORY_H - 200

  // Pill background
  const pillBg = ctx.createLinearGradient(pillX, pillY, pillX + pillW, pillY + pillH)
  pillBg.addColorStop(0, 'rgba(192,57,43,0.10)')
  pillBg.addColorStop(1, 'rgba(139,0,0,0.08)')
  ctx.fillStyle = pillBg
  roundRect(ctx, pillX, pillY, pillW, pillH, pillH / 2)
  ctx.fill()

  // Pill border
  ctx.strokeStyle = C_BORDER
  ctx.lineWidth   = 2.5
  roundRect(ctx, pillX, pillY, pillW, pillH, pillH / 2)
  ctx.stroke()

  // Pill text
  ctx.fillStyle   = C_RED
  ctx.textAlign   = 'center'
  ctx.fillText(pillText, STORY_W / 2, pillY + 57)

  // ── 10. Bottom separator line ──────────────────────────────────────────────
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
