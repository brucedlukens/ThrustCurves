import { Link } from 'react-router-dom'

export default function HomePage() {
  return (
    <div className="max-w-2xl mx-auto py-12 md:py-20 text-center flex flex-col items-center gap-8">
      {/* Speed stripe decorative element */}
      <div className="flex flex-col gap-1.5 items-center opacity-40">
        <div className="h-px w-24" style={{ backgroundColor: 'var(--color-accent)' }} />
        <div className="h-px w-16" style={{ backgroundColor: 'var(--color-accent)' }} />
        <div className="h-px w-10" style={{ backgroundColor: 'var(--color-accent)' }} />
      </div>

      {/* Hero title */}
      <div className="flex flex-col gap-3">
        <h1
          className="text-5xl md:text-7xl font-bold tracking-widest uppercase"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--color-accent)' }}
        >
          ThrustCurves
        </h1>
        <p
          className="text-base md:text-lg tracking-widest uppercase"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-3)' }}
        >
          Car Performance Simulator
        </p>
      </div>

      {/* Description */}
      <p
        className="text-base md:text-lg max-w-lg"
        style={{ fontFamily: 'var(--font-ui)', color: 'var(--color-text-2)', lineHeight: 1.7 }}
      >
        Generate thrust curves for real cars using OEM specs. Apply modifications,
        account for altitude, and compare performance setups side by side.
      </p>

      {/* CTA buttons */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          to="/simulator"
          className="px-8 py-3 rounded font-medium transition-colors uppercase tracking-widest text-sm"
          style={{
            backgroundColor: 'var(--color-accent)',
            color: '#000',
            fontFamily: 'var(--font-display)',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.85' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1' }}
        >
          Open Simulator
        </Link>
        <Link
          to="/saved"
          className="px-8 py-3 rounded font-medium transition-colors uppercase tracking-widest text-sm"
          style={{
            border: '1px solid var(--color-accent)',
            color: 'var(--color-accent)',
            fontFamily: 'var(--font-display)',
          }}
          onMouseEnter={e => {
            const el = e.currentTarget as HTMLElement
            el.style.backgroundColor = 'var(--color-accent-dim)'
          }}
          onMouseLeave={e => {
            const el = e.currentTarget as HTMLElement
            el.style.backgroundColor = 'transparent'
          }}
        >
          Saved Configs
        </Link>
      </div>

      {/* Feature pills */}
      <div className="flex flex-wrap justify-center gap-2 mt-2">
        {['5 OEM Cars', 'Gear Ratios', 'Forced Induction', 'Altitude', 'Tire Size', 'Aero Drag'].map(feat => (
          <span
            key={feat}
            className="text-[10px] px-3 py-1 rounded-full uppercase tracking-wider"
            style={{
              fontFamily: 'var(--font-display)',
              border: '1px solid var(--color-border-2)',
              color: 'var(--color-text-3)',
              backgroundColor: 'var(--color-surface)',
            }}
          >
            {feat}
          </span>
        ))}
      </div>

      {/* Bottom speed stripes */}
      <div className="flex flex-col gap-1.5 items-center opacity-20 mt-4">
        <div className="h-px w-10" style={{ backgroundColor: 'var(--color-accent)' }} />
        <div className="h-px w-16" style={{ backgroundColor: 'var(--color-accent)' }} />
        <div className="h-px w-24" style={{ backgroundColor: 'var(--color-accent)' }} />
      </div>
    </div>
  )
}
