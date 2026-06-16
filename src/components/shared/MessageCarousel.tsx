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
                background: 'linear-gradient(150deg, #1c1a17 0%, #131214 60%, #0f0f10 100%)',
                border: '1px solid rgba(124,92,252,0.15)',
                boxShadow: '0 20px 50px rgba(0,0,0,0.45)',
              }}
            >
              {/* Top: status + time */}
              <div className="flex items-center gap-2 mb-6">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ background: msg.read ? '#d9d2e6' : '#7c5cfc' }}
                />
                <span className="text-xs" style={{ color: '#857e95' }}>
                  {msg.read ? 'Déjà vu' : 'Nouveau'} · {timeAgo(msg.time)}
                </span>
              </div>

              {/* Message */}
              <div className="flex-1 flex items-center justify-center">
                <p
                  className="text-center"
                  style={{
                    fontFamily: "'Instrument Serif', serif",
                    color: '#2b2540',
                    fontSize: msg.text.length > 140 ? '1.4rem' : '1.9rem',
                    lineHeight: 1.45,
                  }}
                >
                  {msg.text}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-center gap-3 mt-6">
                <button
                  id={`card-share-${msg.id}`}
                  onClick={() => onShare(msg)}
                  disabled={sharingId === msg.id}
                  className="ws-press flex items-center gap-1.5 text-xs px-4 py-2 rounded-full"
                  style={{ background: 'rgba(124,92,252,0.12)', color: '#7c5cfc', border: '1px solid rgba(124,92,252,0.25)' }}
                >
                  <ImageIcon size={13} />
                  {sharingId === msg.id ? 'Génération...' : 'Story'}
                </button>
                <button
                  id={`card-delete-${msg.id}`}
                  onClick={() => onDelete(msg.id)}
                  className="ws-press flex items-center gap-1.5 text-xs px-4 py-2 rounded-full"
                  style={{ background: 'rgba(255,107,107,0.1)', color: '#ff6b6b', border: '1px solid rgba(255,107,107,0.2)' }}
                >
                  <Trash2 size={13} />
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Arrows */}
      {active > 0 && (
        <button
          aria-label="Précédent"
          onClick={() => goTo(active - 1)}
          className="ws-press absolute left-0 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(20,20,21,0.85)', border: '1px solid rgba(40,30,70,0.08)', color: '#2b2540' }}
        >
          <ChevronLeft size={18} />
        </button>
      )}
      {active < messages.length - 1 && (
        <button
          aria-label="Suivant"
          onClick={() => goTo(active + 1)}
          className="ws-press absolute right-0 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(20,20,21,0.85)', border: '1px solid rgba(40,30,70,0.08)', color: '#2b2540' }}
        >
          <ChevronRight size={18} />
        </button>
      )}

      {/* Dots + counter */}
      <div className="flex items-center justify-center gap-1.5 mt-5">
        {messages.slice(0, 12).map((_, i) => (
          <button
            key={i}
            aria-label={`Aller au message ${i + 1}`}
            onClick={() => goTo(i)}
            className="rounded-full transition-all"
            style={{
              width: i === active ? 18 : 6,
              height: 6,
              background: i === active ? '#7c5cfc' : 'rgba(40,30,70,0.18)',
            }}
          />
        ))}
      </div>
      <p className="text-center text-xs mt-2" style={{ color: '#b3acc2' }}>
        {active + 1} / {messages.length}
      </p>
    </div>
  )
}
