import { Link } from 'react-router-dom'

const FEATURES = [
  {
    label: 'OEM Data',
    desc: '5 vehicles with real dyno curves — Supra, Mustang, M3, Civic, C8 Corvette',
  },
  {
    label: 'Physics Simulation',
    desc: 'Gear-by-gear thrust curves with aero drag, rolling resistance, and altitude effects',
  },
  {
    label: 'Modifications',
    desc: 'Weight, forced induction, gear ratios, tires, aero — see the delta instantly',
  },
  {
    label: 'Compare',
    desc: 'Overlay thrust envelopes and compare performance metrics side-by-side',
  },
]

export default function HomePage() {
  return (
    <div
      className="min-h-full flex flex-col items-center justify-center px-6 py-16"
      style={{ background: 'var(--bg)' }}
    >
      {/* Hero */}
      <div className="text-center max-w-xl mb-16">
        <div
          className="inline-block font-data text-xs tracking-widest uppercase px-3 py-1 rounded-full mb-6"
          style={{
            color: 'var(--accent-text)',
            background: 'var(--accent-glow)',
            border: '1px solid var(--accent-dim)',
          }}
        >
          Precision Motorsport Telemetry
        </div>

        <h1
          className="font-display text-5xl font-bold mb-4"
          style={{
            color: 'var(--text-primary)',
            letterSpacing: '-0.03em',
            lineHeight: 1.1,
          }}
        >
          Thrust
          <span style={{ color: 'var(--accent)' }}>Curves</span>
        </h1>

        <p
          className="font-ui text-lg mb-8"
          style={{ color: 'var(--text-secondary)' }}
        >
          Generate gear-by-gear thrust curves using OEM dyno data, apply
          real-world modifications, and compare performance setups with
          engineering precision.
        </p>

        <div className="flex justify-center gap-3 flex-wrap">
          <Link
            to="/simulator"
            className="font-display px-6 py-3 rounded-lg font-semibold text-base transition-all duration-150"
            style={{
              background: 'var(--accent)',
              color: 'var(--bg)',
            }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLAnchorElement
              el.style.background = 'var(--accent-text)'
              el.style.boxShadow = '0 0 20px var(--accent-glow-strong)'
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLAnchorElement
              el.style.background = 'var(--accent)'
              el.style.boxShadow = 'none'
            }}
          >
            Open Simulator
          </Link>
          <Link
            to="/compare"
            className="font-display px-6 py-3 rounded-lg font-semibold text-base transition-all duration-150"
            style={{
              background: 'var(--surface-3)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
            }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLAnchorElement
              el.style.borderColor = 'var(--accent-dim)'
              el.style.color = 'var(--accent-text)'
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLAnchorElement
              el.style.borderColor = 'var(--border)'
              el.style.color = 'var(--text-primary)'
            }}
          >
            Compare Setups
          </Link>
        </div>
      </div>

      {/* Feature cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl w-full">
        {FEATURES.map(({ label, desc }) => (
          <div
            key={label}
            className="p-5 rounded-xl"
            style={{
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span
                className="w-1 h-4 rounded-full"
                style={{ background: 'var(--accent)' }}
              />
              <h3
                className="font-display text-sm font-semibold"
                style={{ color: 'var(--accent-text)' }}
              >
                {label}
              </h3>
            </div>
            <p
              className="font-ui text-sm"
              style={{ color: 'var(--text-secondary)' }}
            >
              {desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
