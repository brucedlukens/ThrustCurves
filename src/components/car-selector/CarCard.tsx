import type { CarSpec } from '@/types/car'
import { kwToHp, nmToLbft } from '@/utils/units'

interface CarCardProps {
  car: CarSpec
  isSelected: boolean
  onSelect: () => void
}

export default function CarCard({ car, isSelected, onSelect }: CarCardProps) {
  const maxPowerKw = Math.max(...car.engine.powerCurve.map(([, p]) => p))
  const maxTorqueNm = Math.max(...car.engine.torqueCurve.map(([, t]) => t))

  return (
    <button
      onClick={onSelect}
      className="w-full text-left rounded-lg transition-all"
      style={{
        padding: '10px 12px',
        border: isSelected ? '1px solid var(--color-accent)' : '1px solid var(--color-border)',
        borderLeft: isSelected ? '2px solid var(--color-accent)' : '2px solid transparent',
        backgroundColor: isSelected ? 'var(--color-accent-dim)' : 'var(--color-surface)',
      }}
      onMouseEnter={e => {
        if (!isSelected) {
          e.currentTarget.style.borderColor = 'var(--color-border-2)'
        }
      }}
      onMouseLeave={e => {
        if (!isSelected) {
          e.currentTarget.style.borderColor = 'var(--color-border)'
          e.currentTarget.style.borderLeftColor = 'transparent'
        }
      }}
    >
      <div className="flex items-start justify-between gap-2">
        {/* Left: name + trim */}
        <div className="min-w-0">
          <p
            className="text-sm font-medium leading-tight truncate"
            style={{ fontFamily: 'var(--font-ui)', color: 'var(--color-text-1)' }}
          >
            {car.year} {car.make} {car.model}
          </p>
          <p
            className="text-xs leading-tight mt-0.5 truncate"
            style={{ fontFamily: 'var(--font-ui)', color: 'var(--color-text-2)' }}
          >
            {car.trim}
          </p>
        </div>

        {/* Right: HP/torque + selected indicator */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="text-right">
            <p
              className="text-sm font-medium leading-tight"
              style={{ fontFamily: 'var(--font-mono)', color: isSelected ? 'var(--color-accent)' : 'var(--color-text-1)' }}
            >
              {kwToHp(maxPowerKw).toFixed(0)} hp
            </p>
            <p
              className="text-xs leading-tight"
              style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-2)' }}
            >
              {nmToLbft(maxTorqueNm).toFixed(0)} lb·ft
            </p>
          </div>
          {isSelected && (
            <span style={{ color: 'var(--color-accent)' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </span>
          )}
        </div>
      </div>

      {/* Tags row */}
      <div className="flex gap-1.5 mt-2 flex-wrap">
        {[
          car.drivetrain,
          `${car.transmission.gearRatios.length}-spd ${car.transmission.type}`,
          `${car.engine.displacementL}L ${car.engine.forcedInduction ? 'Turbo' : 'NA'}`,
        ].map(tag => (
          <span
            key={tag}
            className="text-[10px] px-1.5 py-0.5 rounded"
            style={{
              fontFamily: 'var(--font-display)',
              backgroundColor: 'var(--color-surface-2)',
              color: 'var(--color-text-3)',
              letterSpacing: '0.04em',
            }}
          >
            {tag}
          </span>
        ))}
      </div>
    </button>
  )
}
