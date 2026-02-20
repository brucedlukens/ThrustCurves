import { Link } from 'react-router-dom'

const FEATURE_CARDS = [
  {
    title: 'OEM Specs',
    description: '5 production vehicles with empirical torque and power curves',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
      </svg>
    ),
  },
  {
    title: 'Physics Engine',
    description: 'Gear-by-gear thrust curves, envelope, and numerical integration',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
  },
  {
    title: 'Modifications',
    description: 'Tune weight, gears, tires, aero, forced induction, and more',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    title: 'Compare Setups',
    description: 'Overlay envelopes and rank performance across saved configurations',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
      </svg>
    ),
  },
]

export default function HomePage() {
  return (
    <div className="max-w-2xl mx-auto py-8 lg:py-16 px-2">
      {/* Hero */}
      <div className="mb-12">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-px bg-signal" />
          <span className="font-display text-xs font-semibold tracking-[0.3em] uppercase text-signal">
            Vehicle Physics Simulator
          </span>
        </div>
        <h1 className="font-display text-5xl lg:text-7xl font-bold tracking-tight text-gray-100 uppercase leading-none mb-4">
          Thrust<br />Curves
        </h1>
        <p className="font-data text-sm text-label leading-relaxed max-w-md">
          Generate gear-by-gear thrust curves for production vehicles.
          Apply modifications, visualize telemetry, and compare performance setups.
        </p>
      </div>

      {/* CTA buttons */}
      <div className="flex flex-wrap gap-3 mb-12">
        <Link
          to="/simulator"
          className="font-display text-sm font-bold tracking-wider uppercase px-6 py-3 bg-signal hover:bg-signal-hi text-white rounded-lg transition-all shadow-[0_0_20px_rgba(220,38,38,0.2)] hover:shadow-[0_0_30px_rgba(220,38,38,0.35)]"
        >
          Open Simulator
        </Link>
        <Link
          to="/compare"
          className="font-display text-sm font-bold tracking-wider uppercase px-6 py-3 bg-lift hover:bg-raised text-gray-300 rounded-lg border border-line transition-all"
        >
          Compare Setups
        </Link>
        <Link
          to="/saved"
          className="font-display text-sm font-bold tracking-wider uppercase px-6 py-3 text-label hover:text-gray-300 transition-colors"
        >
          Saved Configs →
        </Link>
      </div>

      {/* Feature cards */}
      <div className="grid grid-cols-2 gap-3">
        {FEATURE_CARDS.map(({ title, description, icon }) => (
          <div key={title} className="rounded-xl border border-line bg-panel p-4 flex flex-col gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-lift border border-faint flex items-center justify-center text-signal-hi">
              {icon}
            </div>
            <div>
              <p className="font-display text-sm font-semibold tracking-wide text-gray-200 mb-0.5">
                {title}
              </p>
              <p className="font-data text-xs text-muted-txt leading-relaxed">
                {description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Vehicles row */}
      <div className="mt-8 pt-6 border-t border-faint">
        <p className="font-display text-[10px] font-semibold tracking-[0.3em] uppercase text-muted-txt mb-3">
          Included Vehicles
        </p>
        <div className="flex flex-wrap gap-2">
          {['2020 Toyota Supra', '2024 Ford Mustang GT', 'BMW M3', 'Honda Civic', 'Chevrolet Corvette'].map(v => (
            <span key={v} className="font-data text-xs text-label px-2.5 py-1 rounded border border-faint bg-lift">
              {v}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
