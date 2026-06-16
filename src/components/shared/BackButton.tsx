import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

interface BackButtonProps {
  /** Explicit destination. Defaults to browser history back. */
  to?: string
  label?: string
}

export function BackButton({ to, label = 'Retour' }: BackButtonProps) {
  const navigate = useNavigate()

  return (
    <button
      id="back-btn"
      onClick={() => (to ? navigate(to) : navigate(-1))}
      className="ws-press flex items-center gap-1.5 text-sm rounded-lg px-2 py-1 -ml-2"
      style={{ color: '#8A6B5E', fontFamily: "'DM Sans', sans-serif", transition: 'color 0.15s' }}
      onMouseEnter={(e) => (e.currentTarget.style.color = '#C0392B')}
      onMouseLeave={(e) => (e.currentTarget.style.color = '#8A6B5E')}
    >
      <ArrowLeft size={15} />
      {label}
    </button>
  )
}
