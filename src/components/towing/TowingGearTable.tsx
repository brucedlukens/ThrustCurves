import { useUnitStore } from '@/store/unitStore'
import type { TowingEntry } from './entry'
import { fmtPower, gearLabel } from './format'

interface TowingGearTableProps {
  entry: TowingEntry
}

/** Per-gear analysis at the scenario speed for one truck */
export default function TowingGearTable({ entry }: TowingGearTableProps) {
  const units = useUnitStore(state => state.units)
  const { analysis, powertrain } = entry
  const cruisingGear = analysis.cruisingGear?.gear

  return (
    <div className="rounded-xl border border-line bg-panel overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-line">
        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
        <span className="font-display text-xs font-semibold text-gray-100 truncate">{entry.name}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-faint">
              {['Gear', 'RPM', 'Available', 'Surplus', 'Max grade'].map(h => (
                <th
                  key={h}
                  className="px-3 py-1.5 font-display text-[9px] font-semibold tracking-[0.15em] uppercase text-muted-txt whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {analysis.gearsAtSpeed.map(g => {
              const maxGrade = analysis.maxGradePerGear.find(m => m.gear === g.gear)
              const isCruising = g.gear === cruisingGear
              const reason =
                g.rpm > powertrain.redlineRpm
                  ? 'over redline'
                  : g.rpm < analysis.minLoadRpm
                    ? `below ${analysis.minLoadRpm} rpm`
                    : null

              return (
                <tr
                  key={g.gear}
                  className={`border-b border-faint last:border-0 ${
                    isCruising ? 'bg-signal-dim' : ''
                  } ${g.usable ? '' : 'opacity-40'}`}
                >
                  <td className="px-3 py-1.5 font-data text-xs text-data whitespace-nowrap">
                    {gearLabel(g.gear)}
                    {isCruising && <span className="text-signal-hi ml-1.5">●</span>}
                  </td>
                  <td className="px-3 py-1.5 font-data text-xs tabular-nums text-data">
                    {g.rpm.toFixed(0)}
                  </td>
                  {g.usable ? (
                    <>
                      <td className="px-3 py-1.5 font-data text-xs tabular-nums text-data">
                        {fmtPower(g.availableKw, units)}
                      </td>
                      <td
                        className={`px-3 py-1.5 font-data text-xs tabular-nums ${
                          g.surplusKw >= 0 ? 'text-emerald-400' : 'text-red-400'
                        }`}
                      >
                        {fmtPower(g.surplusKw, units, true)}
                      </td>
                      <td className="px-3 py-1.5 font-data text-xs tabular-nums text-data">
                        {maxGrade ? `${maxGrade.maxGradePercent.toFixed(1)}%` : '—'}
                      </td>
                    </>
                  ) : (
                    <td colSpan={3} className="px-3 py-1.5 font-data text-[10px] text-muted-txt">
                      {reason}
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
