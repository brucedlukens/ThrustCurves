import { useUnitStore } from '@/store/unitStore'
import type { TowingEntry } from './entry'
import { fmtMass, fmtPower, fmtSpeedMs, gearLabel } from './format'

interface TowingSummaryTableProps {
  entries: TowingEntry[]
}

/** Side-by-side headline towing metrics, one column per truck */
export default function TowingSummaryTable({ entries }: TowingSummaryTableProps) {
  const units = useUnitStore(state => state.units)

  if (entries.length === 0) return null

  const rows: { label: string; render: (e: TowingEntry) => React.ReactNode }[] = [
    {
      label: 'Combined weight',
      render: e => fmtMass(e.analysis.totalMassKg, units),
    },
    {
      label: 'Required wheel power',
      render: e => fmtPower(e.analysis.requiredKw, units),
    },
    {
      label: 'Cruising gear (highest that holds speed)',
      render: e =>
        e.analysis.cruisingGear ? (
          `${gearLabel(e.analysis.cruisingGear.gear)} @ ${e.analysis.cruisingGear.rpm.toFixed(0)} rpm`
        ) : (
          <span className="text-red-400">cannot hold speed</span>
        ),
    },
    {
      label: 'Surplus in cruising gear',
      render: e =>
        e.analysis.cruisingGear ? (
          <span className={e.analysis.cruisingGear.surplusKw >= 0 ? 'text-emerald-400' : 'text-red-400'}>
            {fmtPower(e.analysis.cruisingGear.surplusKw, units, true)}
          </span>
        ) : (
          '—'
        ),
    },
    {
      label: 'Best surplus (any gear)',
      render: e => {
        const usable = e.analysis.gearsAtSpeed.filter(g => g.usable)
        if (usable.length === 0) return '—'
        const best = usable.reduce((a, b) => (b.surplusKw > a.surplusKw ? b : a))
        return (
          <span className={best.surplusKw >= 0 ? 'text-emerald-400' : 'text-red-400'}>
            {fmtPower(best.surplusKw, units, true)} ({gearLabel(best.gear)})
          </span>
        )
      },
    },
    {
      label: 'Max speed on this grade',
      render: e =>
        e.analysis.maxSustainable ? (
          `${fmtSpeedMs(e.analysis.maxSustainable.speedMs, units)} (${gearLabel(e.analysis.maxSustainable.gear)} @ ${e.analysis.maxSustainable.rpm.toFixed(0)} rpm)`
        ) : (
          <span className="text-red-400">cannot move</span>
        ),
    },
    {
      label: 'Max grade at target speed',
      render: e =>
        e.analysis.absoluteMaxGrade ? (
          `${e.analysis.absoluteMaxGrade.gradePercent.toFixed(1)}% (${gearLabel(e.analysis.absoluteMaxGrade.gear)})`
        ) : (
          '—'
        ),
    },
    {
      label: '40–60 mph passing',
      render: e =>
        e.analysis.passing.from40to60S !== null ? `${e.analysis.passing.from40to60S.toFixed(1)} s` : '—',
    },
    {
      label: '50–70 mph passing',
      render: e =>
        e.analysis.passing.from50to70S !== null ? `${e.analysis.passing.from50to70S.toFixed(1)} s` : '—',
    },
  ]

  return (
    <div className="overflow-x-auto rounded-xl border border-line bg-panel">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-line">
            <th className="px-3 py-2.5" />
            {entries.map(e => (
              <th key={e.key} className="px-3 py-2.5">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: e.color }} />
                  <span className="font-display text-xs font-semibold text-gray-100 whitespace-nowrap">
                    {e.name}
                  </span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr key={row.label} className="border-b border-faint last:border-0">
              <td className="px-3 py-2 font-display text-[11px] font-medium tracking-wide uppercase text-label whitespace-nowrap">
                {row.label}
              </td>
              {entries.map(e => (
                <td key={e.key} className="px-3 py-2 font-data text-xs tabular-nums text-data whitespace-nowrap">
                  {row.render(e)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
