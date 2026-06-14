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
      className="ws-press flex items-center gap-1.5 text-sm rounded-lg px-2 py-1 -ml-2 hover:opacity-100"
      style={{ color: '#7a756d', fontFamily: "'Inter', sans-serif" }}
      onMouseEnter={(e) => (e.currentTarget.style.color = '#c8aa82')}
      onMouseLeave={(e) => (e.currentTarget.style.color = '#7a756d')}
    >
      <ArrowLeft size={15} />
      {label}
    </button>
  )
}
