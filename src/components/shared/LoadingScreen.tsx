
/* Flamme SVG animée pour le loading */
function FlameIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ animation: 'flamePulse 1.6s ease-in-out infinite' }}>
      <path
        d="M12 2C12 2 7 7.5 7 12.5C7 15.538 9.239 18 12 18C14.761 18 17 15.538 17 12.5C17 9.5 15 7 14 5.5C14 5.5 13.5 8 12 9C12 9 10 7 12 2Z"
        fill="url(#flameGrad)"
        opacity="0.9"
      />
      <path
        d="M12 10C12 10 10.5 11.5 10.5 13C10.5 14.381 11.172 15.5 12 15.5C12.828 15.5 13.5 14.381 13.5 13C13.5 11.8 12.8 10.8 12 10Z"
        fill="#FFF8F5"
        opacity="0.7"
      />
      <defs>
        <linearGradient id="flameGrad" x1="12" y1="2" x2="12" y2="18" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#E53935" />
          <stop offset="60%" stopColor="#C0392B" />
          <stop offset="100%" stopColor="#8B0000" />
        </linearGradient>
      </defs>
    </svg>
  )
}

export function LoadingScreen({ label = 'Chargement...' }: { label?: string }) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-6 animate-fade-in"
      style={{
        background: 'linear-gradient(180deg, #FAF6F0 0%, #F5EBE6 50%, #FAF0EE 100%)',
      }}
    >
      <style>{`
        @keyframes flamePulse {
          0%, 100% { transform: scale(1) rotate(-2deg); }
          50% { transform: scale(1.14) rotate(2deg); }
        }
        @keyframes dotBounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-6px); opacity: 1; }
        }
      `}</style>

      {/* Icône flamme */}
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center"
        style={{
          background: 'linear-gradient(135deg, #FFF8F5 0%, #F5EBE6 100%)',
          border: '1px solid rgba(192, 57, 43, 0.18)',
          boxShadow: '0 6px 24px rgba(192, 57, 43, 0.14)',
        }}
      >
        <FlameIcon />
      </div>

      {/* Titre en Dela Gothic */}
      <span
        style={{
          fontFamily: 'var(--font-gothic)',
          fontSize: '1.6rem',
          color: '#2C1A13',
          letterSpacing: '0.01em',
          lineHeight: 1,
        }}
      >
        Whispers
      </span>

      {/* Points animés */}
      <div className="flex items-center gap-1.5">
        {[0, 0.18, 0.36].map((delay, i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full"
            style={{
              background: '#C0392B',
              animation: `dotBounce 1.2s ease-in-out ${delay}s infinite`,
            }}
          />
        ))}
      </div>

      {/* Label en DM Mono */}
      <p style={{ color: '#8A6B5E', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        {label}
      </p>
    </div>
  )
}
