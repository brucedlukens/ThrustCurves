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
        'w-full text-left px-4 py-3 rounded-lg border transition-colors',
        isSelected
          ? 'border-indigo-500 bg-indigo-900/30'
          : 'border-gray-700 bg-gray-800 hover:border-gray-600',
      ].join(' ')}
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="font-semibold text-gray-100">
            {car.year} {car.make} {car.model}
          </p>
          <p className="text-sm text-gray-400">{car.trim}</p>
        </div>
        <div className="text-right text-sm text-gray-400">
          <p>{kwToHp(maxPowerKw).toFixed(0)} hp</p>
          <p>{nmToLbft(maxTorqueNm).toFixed(0)} lb·ft</p>
        </div>
      </div>
      <div className="mt-1 text-xs text-gray-500 flex gap-3">
        <span>{car.drivetrain}</span>
        <span>
          {car.transmission.gearRatios.length}-speed {car.transmission.type}
        </span>
        <span>
          {car.engine.displacementL}L {car.engine.forcedInduction ? 'Turbo' : 'NA'}
        </span>
      </div>
    </button>
  )
}
