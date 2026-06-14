import { MessageCircle } from 'lucide-react'

export function LoadingScreen({ label = 'Chargement...' }: { label?: string }) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-4 animate-fade-in"
      style={{ background: '#0e0e0f', fontFamily: "'Inter', sans-serif" }}
    >
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center animate-pop"
        style={{ background: 'rgba(200,170,130,0.08)', border: '1px solid rgba(200,170,130,0.15)' }}
      >
        <MessageCircle size={22} style={{ color: '#c8aa82' }} />
      </div>
      <div className="flex items-center gap-2">
        <span
          className="w-2 h-2 rounded-full animate-pulse"
          style={{ background: '#c8aa82', animationDelay: '0s' }}
        />
        <span
          className="w-2 h-2 rounded-full animate-pulse"
          style={{ background: '#c8aa82', animationDelay: '0.15s' }}
        />
        <span
          className="w-2 h-2 rounded-full animate-pulse"
          style={{ background: '#c8aa82', animationDelay: '0.3s' }}
        />
      </div>
      <p className="text-xs" style={{ color: '#7a756d' }}>
        {label}
      </p>
    </div>
  )
}
