import { describe, test, expect } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TowingPage from './TowingPage'

describe('TowingPage', () => {
  test('renders the scenario controls and empty state', () => {
    render(<TowingPage />)
    expect(screen.getByRole('heading', { name: /towing/i })).toBeInTheDocument()
    expect(screen.getByText(/add trucks to compare/i)).toBeInTheDocument()
    expect(screen.getByText('Trailer')).toBeInTheDocument()
    expect(screen.getByText('Grade (%)')).toBeInTheDocument()
  })

  test('the add-truck list shows one entry per model family', () => {
    render(<TowingPage />)
    const addSelect = screen.getByRole('combobox', { name: /add a truck/i })
    const options = within(addSelect).getAllByRole('option')
    expect(options.filter(o => /F-250 Super Duty/.test(o.textContent ?? ''))).toHaveLength(1)
  })

  test('adding a truck shows its card, generation select, and the results tables', async () => {
    const user = userEvent.setup()
    render(<TowingPage />)

    const addSelect = screen.getByRole('combobox', { name: /add a truck/i })
    await user.selectOptions(addSelect, 'ford-f-250-super-duty')

    expect(screen.getByRole('button', { name: /remove f-250 super duty/i })).toBeInTheDocument()
    // Defaults to the newest generation of the family
    const genSelect = screen.getByRole('combobox', { name: /f-250 super duty generation/i })
    expect(genSelect).toHaveValue('ford-f250-2023')
    expect(screen.getByText(/Towing Metrics/i)).toBeInTheDocument()
    expect(screen.getByText(/Gears at Target Speed/i)).toBeInTheDocument()
  })

  test('removing a truck returns to the empty state', async () => {
    const user = userEvent.setup()
    render(<TowingPage />)

    await user.selectOptions(screen.getByRole('combobox', { name: /add a truck/i }), 'toyota-tundra')
    expect(screen.getByRole('button', { name: /remove tundra/i })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /remove tundra/i }))
    expect(screen.queryByRole('button', { name: /remove tundra/i })).not.toBeInTheDocument()
    expect(screen.getByText(/add trucks to compare/i)).toBeInTheDocument()
  })

  test('the acceleration run shows a lane per truck and switches runs', async () => {
    const user = userEvent.setup()
    render(<TowingPage />)
    const addSelect = screen.getByRole('combobox', { name: /add a truck/i })
    await user.selectOptions(addSelect, 'ford-f-250-super-duty')
    await user.selectOptions(addSelect, 'toyota-tundra')

    expect(screen.getByText(/Acceleration Run/i)).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /rigs accelerating/i })).toBeInTheDocument()
    // Everyone starts in 1st from a standstill
    expect(screen.getAllByTestId('lane-gear').map(el => el.textContent)).toEqual(['1st', '1st'])

    const zeroTo60 = screen.getByRole('button', { name: '0–60 mph' })
    expect(zeroTo60).toHaveAttribute('aria-pressed', 'true')
    await user.click(screen.getByRole('button', { name: '50–70 mph' }))
    expect(screen.getByRole('button', { name: '50–70 mph' })).toHaveAttribute('aria-pressed', 'true')
    expect(zeroTo60).toHaveAttribute('aria-pressed', 'false')
    // A rolling start enters a higher gear directly
    expect(screen.getAllByTestId('lane-gear').every(el => el.textContent !== '1st')).toBe(true)
  })

  test('scrubbing moves every rig forward and the lead is labeled', async () => {
    const user = userEvent.setup()
    render(<TowingPage />)
    const addSelect = screen.getByRole('combobox', { name: /add a truck/i })
    await user.selectOptions(addSelect, 'ford-f-150')
    await user.selectOptions(addSelect, 'ram-2500')

    const scrubber = screen.getByRole('slider', { name: /playback position/i })
    const end = Number(scrubber.getAttribute('max'))
    expect(end).toBeGreaterThan(0)
    fireEvent.change(scrubber, { target: { value: String(end) } })

    expect(screen.getByText(`${end.toFixed(1)} / ${end.toFixed(1)} s`)).toBeInTheDocument()
    expect(screen.getByText('lead')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Play' })).toBeInTheDocument()
  })
})
