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
      className={[
        'w-full text-left px-4 py-3 rounded-lg border transition-all duration-200',
        isSelected
          ? 'border-signal bg-signal-dim shadow-[0_0_16px_rgba(220,38,38,0.15)] ring-1 ring-signal/30'
          : 'border-line bg-lift hover:border-gray-500 hover:bg-raised',
      ].join(' ')}
    >
      {/* Selected indicator bar */}
      {isSelected && (
        <div className="absolute left-0 top-0 h-full w-0.5 bg-signal rounded-l-lg" />
      )}

      <div className="flex justify-between items-start gap-3">
        <div className="min-w-0">
          <p className="font-display text-base font-semibold text-gray-100 leading-tight tracking-wide">
            {car.year} {car.make} {car.model}
          </p>
          <p className="font-display text-xs text-label tracking-wider mt-0.5">{car.trim}</p>
        </div>

        {/* Power / Torque — instrument numbers */}
        <div className="text-right shrink-0">
          <p className="font-data text-lg font-semibold text-data leading-none">
            {kwToHp(maxPowerKw).toFixed(0)}
            <span className="text-xs font-normal text-label ml-1">hp</span>
          </p>
          <p className="font-data text-sm text-label mt-0.5">
            {nmToLbft(maxTorqueNm).toFixed(0)}
            <span className="text-xs ml-1">lb·ft</span>
          </p>
        </div>
      </div>

      {/* Tags row */}
      <div className="mt-2 flex gap-2 flex-wrap">
        <span className="font-display text-[10px] font-semibold tracking-[0.15em] uppercase px-1.5 py-0.5 rounded bg-raised text-label border border-faint">
          {car.drivetrain}
        </span>
        <span className="font-display text-[10px] font-semibold tracking-[0.15em] uppercase px-1.5 py-0.5 rounded bg-raised text-label border border-faint">
          {car.transmission.gearRatios.length}-spd {car.transmission.type}
        </span>
        <span className="font-display text-[10px] font-semibold tracking-[0.15em] uppercase px-1.5 py-0.5 rounded bg-raised text-label border border-faint">
          {car.engine.displacementL}L {car.engine.forcedInduction ? 'Turbo' : 'NA'}
        </span>
      </div>
    </button>
  )
}
