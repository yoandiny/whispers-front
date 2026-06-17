export function BackgroundBlobs() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0" style={{ opacity: 0.35 }}>
      {/* Blob 1 - Rouge Signature */}
      <div
        className="absolute rounded-full animate-blob-float"
        style={{
          width: '350px',
          height: '350px',
          background: 'radial-gradient(circle, rgba(192,57,43,0.35) 0%, rgba(192,57,43,0) 70%)',
          top: '-5%',
          left: '-10%',
          filter: 'blur(70px)',
        }}
      />
      {/* Blob 2 - Beige Parchemin */}
      <div
        className="absolute rounded-full animate-blob-float animation-delay-4000"
        style={{
          width: '450px',
          height: '450px',
          background: 'radial-gradient(circle, rgba(237,220,210,0.5) 0%, rgba(245,235,230,0) 70%)',
          bottom: '5%',
          right: '-10%',
          filter: 'blur(80px)',
        }}
      />
      {/* Blob 3 - Bordeaux Profond */}
      <div
        className="absolute rounded-full animate-blob-float animation-delay-2000"
        style={{
          width: '280px',
          height: '280px',
          background: 'radial-gradient(circle, rgba(139,0,0,0.3) 0%, rgba(139,0,0,0) 70%)',
          top: '35%',
          right: '15%',
          filter: 'blur(60px)',
        }}
      />
    </div>
  )
}
