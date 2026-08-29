import { describe, test, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import TowingGearTable from './TowingGearTable'
import TowingSummaryTable from './TowingSummaryTable'
import { findTruck, findPowertrain, resolveTruckToCarSpec } from '@/data/trucks'
import { TRAILER_PRESETS, trailerToLoad } from '@/data/trailers'
import { runTowingAnalysis } from '@/engine/towing'
import { mphToMs } from '@/utils/units'
import type { TowingEntry } from './entry'

function makeEntry(): TowingEntry {
  const truck = findTruck('gm-2500hd-2020')!
  const powertrain = findPowertrain(truck, '66-duramax')!
  const preset = TRAILER_PRESETS.find(p => p.id === 'travel-trailer-mid')!
  const spec = resolveTruckToCarSpec(truck, powertrain, 3.42)
  const analysis = runTowingAnalysis(
    spec,
    {
      trailer: trailerToLoad(preset, preset.defaultMassKg),
      cargoMassKg: 136,
      altitudeM: 0,
      gradePercent: 3,
      speedMs: mphToMs(65),
    },
    powertrain.fuel,
  )
  return {
    key: 'test-entry',
    name: '2500HD 6.6L Duramax 3.42',
    color: '#ef4444',
    truck,
    powertrain,
    analysis,
  }
}

describe('TowingGearTable', () => {
  test('renders a row per transmission gear', () => {
    const entry = makeEntry()
    render(<TowingGearTable entry={entry} />)
    expect(screen.getByText('1st')).toBeInTheDocument()
    expect(screen.getByText('10th')).toBeInTheDocument()
  })

  test('renders the truck name in the header', () => {
    render(<TowingGearTable entry={makeEntry()} />)
    expect(screen.getByText('2500HD 6.6L Duramax 3.42')).toBeInTheDocument()
  })

  test('marks unusable gears with a reason', () => {
    const entry = makeEntry()
    render(<TowingGearTable entry={entry} />)
    // Low gears exceed the diesel's redline at 65 mph
    expect(screen.getAllByText('over redline').length).toBeGreaterThan(0)
  })
})

describe('TowingSummaryTable', () => {
  test('renders headline metrics for each entry', () => {
    const entry = makeEntry()
    render(<TowingSummaryTable entries={[entry]} />)
    expect(screen.getByText(/Combined weight/i)).toBeInTheDocument()
    expect(screen.getByText(/Max speed on this grade/i)).toBeInTheDocument()
    expect(screen.getByText(/40–60 mph passing/i)).toBeInTheDocument()
  })

  test('renders nothing without entries', () => {
    const { container } = render(<TowingSummaryTable entries={[]} />)
    expect(container).toBeEmptyDOMElement()
  })
})
