import { describe, test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TowingPage from './TowingPage'

// The real catalog has one generation per family so far. Mock in a second
// F-150 generation (cloned from the real 2021 truck so the physics data stays
// valid) to exercise the generation-swap behavior end to end.
vi.mock('@/data/trucks', async importOriginal => {
  const orig = await importOriginal<typeof import('@/data/trucks')>()
  const current = orig.TRUCKS.find(t => t.id === 'ford-f150-2021')!
  const older = {
    ...current,
    id: 'ford-f150-2015',
    generation: '13th gen',
    yearStart: 2015,
    yearEnd: 2020,
    powertrains: current.powertrains.map(p => ({
      ...p,
      id: `old-${p.id}`,
      curbWeightKg: p.curbWeightKg - 90,
    })),
  }
  const trucks = [current, older]
  const families = orig.buildTruckFamilies(trucks)
  return {
    ...orig,
    TRUCKS: trucks,
    TRUCK_FAMILIES: families,
    findTruck: (id: string) => trucks.find(t => t.id === id),
    findTruckFamily: (key: string) => families.find(f => f.key === key),
    familyOfTruck: (truckId: string) =>
      families.find(f => f.generations.some(g => g.id === truckId)),
  }
})

describe('TowingPage generation swap', () => {
  test('lists both generations but one add-truck entry', async () => {
    const user = userEvent.setup()
    render(<TowingPage />)

    await user.selectOptions(screen.getByRole('combobox', { name: /add a truck/i }), 'ford-f-150')

    const genSelect = screen.getByRole('combobox', { name: /f-150 generation/i })
    expect(genSelect).toHaveValue('ford-f150-2021')
    expect(screen.getByRole('option', { name: /2021–present/ })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /2015–2020/ })).toBeInTheDocument()
  })

  test('swapping generation carries the engine and axle, resets the weight override', async () => {
    const user = userEvent.setup()
    render(<TowingPage />)

    await user.selectOptions(screen.getByRole('combobox', { name: /add a truck/i }), 'ford-f-150')

    // Pick a non-default engine and axle, then override the weight
    await user.selectOptions(screen.getByRole('combobox', { name: /f-150 engine/i }), '35-ecoboost')
    await user.selectOptions(screen.getByRole('combobox', { name: /f-150 axle ratio/i }), '3.73')
    const weight = screen.getByRole('spinbutton', { name: /f-150 weight/i })
    await user.clear(weight)
    await user.type(weight, '6000')
    expect(screen.getByRole('button', { name: /reset to stock/i })).toBeInTheDocument()

    // Swap to the older generation
    await user.selectOptions(
      screen.getByRole('combobox', { name: /f-150 generation/i }),
      'ford-f150-2015',
    )

    // Same engine (matched by name) and axle ratio, but the stale weight override is gone
    expect(screen.getByRole('combobox', { name: /f-150 engine/i })).toHaveValue('old-35-ecoboost')
    expect(screen.getByRole('combobox', { name: /f-150 axle ratio/i })).toHaveValue('3.73')
    expect(screen.queryByRole('button', { name: /reset to stock/i })).not.toBeInTheDocument()
  })
})
