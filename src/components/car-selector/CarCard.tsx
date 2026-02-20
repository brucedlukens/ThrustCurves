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
      className="w-full text-left rounded-lg transition-all duration-150 overflow-hidden"
      style={{
        background: isSelected ? 'var(--surface-3)' : 'var(--surface-2)',
        border: isSelected ? '1px solid var(--accent)' : '1px solid var(--border)',
        boxShadow: isSelected ? '0 0 0 1px var(--accent-glow), inset 0 0 20px var(--accent-glow)' : undefined,
      }}
    >
      {/* Selection indicator bar */}
      {isSelected && (
        <div
          className="h-0.5 w-full"
          style={{ background: 'linear-gradient(90deg, var(--accent), transparent)' }}
        />
      )}
      <div className="px-4 py-3">
        <div className="flex justify-between items-start gap-2">
          <div className="min-w-0">
            <p
              className="font-display text-sm font-semibold truncate"
              style={{ color: isSelected ? 'var(--accent-text)' : 'var(--text-primary)' }}
            >
              {car.year} {car.make} {car.model}
            </p>
            <p
              className="font-ui text-xs mt-0.5"
              style={{ color: 'var(--text-secondary)' }}
            >
              {car.trim}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p
              className="font-data text-sm font-semibold"
              style={{ color: isSelected ? 'var(--accent)' : 'var(--text-secondary)' }}
            >
              {kwToHp(maxPowerKw).toFixed(0)} hp
            </p>
            <p
              className="font-data text-xs"
              style={{ color: 'var(--text-tertiary)' }}
            >
              {nmToLbft(maxTorqueNm).toFixed(0)} lb·ft
            </p>
          </div>
        </div>

        {/* Tags row */}
        <div className="mt-2 flex gap-1.5 flex-wrap">
          {[
            car.drivetrain,
            `${car.transmission.gearRatios.length}-spd ${car.transmission.type}`,
            `${car.engine.displacementL}L ${car.engine.forcedInduction ? 'Turbo' : 'NA'}`,
          ].map(tag => (
            <span
              key={tag}
              className="font-ui text-xs px-1.5 py-0.5 rounded"
              style={{
                background: 'var(--surface-3)',
                color: 'var(--text-tertiary)',
                border: '1px solid var(--border)',
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </button>
  )
}
