import { useRef, useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Trash2, Image as ImageIcon } from 'lucide-react'
import type { Message } from '@/types'

function timeAgo(date: Date): string {
  const diff = (Date.now() - date.getTime()) / 1000
  if (diff < 60) return "à l'instant"
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`
  return `il y a ${Math.floor(diff / 86400)} j`
}

interface MessageCarouselProps {
  messages: Message[]
  sharingId: string | null
  onShare: (msg: Message) => void
  onDelete: (id: string) => void
  /** Called when a card becomes the active (centered) one. */
  onActive?: (msg: Message) => void
}

export function MessageCarousel({ messages, sharingId, onShare, onDelete, onActive }: MessageCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)

  const goTo = useCallback((index: number) => {
    const el = scrollRef.current
    if (!el) return
    const clamped = Math.max(0, Math.min(index, messages.length - 1))
    el.scrollTo({ left: clamped * el.clientWidth, behavior: 'smooth' })
  }, [messages.length])

  function handleScroll() {
    const el = scrollRef.current
    if (!el) return
    const index = Math.round(el.scrollLeft / el.clientWidth)
    if (index !== active) setActive(index)
  }

  // Notify parent (used to mark the visible message as read)
  useEffect(() => {
    const msg = messages[active]
    if (msg) onActive?.(msg)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, messages.length])

  // Keep active index valid if the list shrinks (after a delete)
  useEffect(() => {
    if (active > messages.length - 1) setActive(Math.max(0, messages.length - 1))
  }, [messages.length, active])

  return (
    <div className="relative animate-fade-in">
      {/* Track */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar"
        style={{ scrollBehavior: 'smooth' }}
      >
        {messages.map((msg) => (
          <div key={msg.id} className="snap-center shrink-0 w-full px-1">
            <div
              className="rounded-3xl p-7 flex flex-col min-h-[60dvh]"
              style={{
                background: 'linear-gradient(150deg, #FFF8F5 0%, #F9F0EB 60%, #F5EBE6 100%)',
                border: '1px solid rgba(192,57,43,0.12)',
                boxShadow: '0 12px 40px rgba(192,57,43,0.1), 0 2px 8px rgba(44,26,19,0.04)',
              }}
            >
              {/* Top: status + time */}
              <div className="flex items-center gap-2 mb-6">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{
                    background: msg.read ? 'rgba(44,26,19,0.12)' : '#C0392B',
                    boxShadow: msg.read ? 'none' : '0 0 6px rgba(192,57,43,0.4)',
                  }}
                />
                <span
                  style={{
                    color: '#8A6B5E',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.68rem',
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                  }}
                >
                  {msg.read ? 'Déjà vu' : 'Nouveau'} · {timeAgo(msg.time)}
                </span>
              </div>

              {/* Message — Caveat pour l'écriture manuscrite */}
              <div className="flex-1 flex items-center justify-center px-2">
                <p
                  className="text-center"
                  style={{
                    fontFamily: 'var(--font-cursive)',
                    color: '#2C1A13',
                    fontSize: msg.text.length > 140 ? '1.6rem' : '2.1rem',
                    lineHeight: 1.35,
                    transform: 'rotate(-0.5deg)',
                  }}
                >
                  "{msg.text}"
                </p>
              </div>

              {/* Séparateur pointillé style lettre */}
              <div
                style={{
                  borderTop: '1px dashed rgba(44,26,19,0.1)',
                  margin: '1.25rem 0 1rem',
                }}
              />

              {/* Actions */}
              <div className="flex items-center justify-center gap-3">
                <button
                  id={`card-share-${msg.id}`}
                  onClick={() => onShare(msg)}
                  disabled={sharingId === msg.id}
                  className="btn-explosive flex items-center gap-1.5 px-4 py-2 rounded-full"
                  style={{
                    background: 'rgba(192,57,43,0.06)',
                    color: '#C0392B',
                    border: '1px solid rgba(192,57,43,0.18)',
                    fontFamily: 'var(--font-tech)',
                    fontWeight: 700,
                    fontSize: '0.72rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  <ImageIcon size={13} />
                  {sharingId === msg.id ? 'Génération...' : 'Story'}
                </button>
                <button
                  id={`card-delete-${msg.id}`}
                  onClick={() => onDelete(msg.id)}
                  className="btn-explosive flex items-center gap-1.5 px-4 py-2 rounded-full"
                  style={{
                    background: 'rgba(192,57,43,0.04)',
                    color: '#C0392B',
                    border: '1px solid rgba(192,57,43,0.1)',
                    fontFamily: 'var(--font-tech)',
                    fontWeight: 700,
                    fontSize: '0.72rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  <Trash2 size={13} />
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Flèche gauche */}
      {active > 0 && (
        <button
          aria-label="Précédent"
          onClick={() => goTo(active - 1)}
          className="btn-explosive absolute left-0 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center"
          style={{
            background: '#FFF8F5',
            border: '1px solid rgba(44,26,19,0.08)',
            color: '#2C1A13',
            boxShadow: '0 2px 8px rgba(44,26,19,0.06)',
          }}
        >
          <ChevronLeft size={18} />
        </button>
      )}
      {/* Flèche droite */}
      {active < messages.length - 1 && (
        <button
          aria-label="Suivant"
          onClick={() => goTo(active + 1)}
          className="btn-explosive absolute right-0 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center"
          style={{
            background: '#FFF8F5',
            border: '1px solid rgba(44,26,19,0.08)',
            color: '#2C1A13',
            boxShadow: '0 2px 8px rgba(44,26,19,0.06)',
          }}
        >
          <ChevronRight size={18} />
        </button>
      )}

      {/* Dots de navigation */}
      <div className="flex items-center justify-center gap-1.5 mt-5">
        {messages.slice(0, 12).map((_, i) => (
          <button
            key={i}
            aria-label={`Aller au message ${i + 1}`}
            onClick={() => goTo(i)}
            className="rounded-full transition-all"
            style={{
              width: i === active ? 20 : 6,
              height: 6,
              background: i === active ? '#C0392B' : 'rgba(44,26,19,0.14)',
              transition: 'all 0.25s ease',
            }}
          />
        ))}
      </div>

      {/* Compteur en DM Mono */}
      <p
        className="text-center mt-2"
        style={{
          color: '#8A6B5E',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.68rem',
          letterSpacing: '0.04em',
        }}
      >
        {active + 1} / {messages.length}
      </p>
    </div>
  )
}
