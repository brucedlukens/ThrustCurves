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

    expect(screen.getByText(/Animated Runs/i)).toBeInTheDocument()
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

  test('holding a gear starts a rolling run in that gear and greys out gears over redline', async () => {
    const user = userEvent.setup()
    render(<TowingPage />)
    await user.selectOptions(screen.getByRole('combobox', { name: /add a truck/i }), 'ford-f-250-super-duty')
    await user.click(screen.getByRole('button', { name: '50–70 mph' }))

    const hold = screen.getByRole('combobox', { name: /hold gear/i })
    expect(hold).toHaveValue('auto')
    // 1st can't reach 50 mph below redline
    expect(within(hold).getByRole('option', { name: /1st/ })).toBeDisabled()

    await user.selectOptions(hold, '8')
    expect(screen.getByTestId('lane-gear')).toHaveTextContent('8th held')

    await user.selectOptions(hold, 'auto')
    expect(screen.getByTestId('lane-gear')).not.toHaveTextContent('held')
  })

  test('the hill climb shows who holds the target speed and who settles lower', async () => {
    const user = userEvent.setup()
    render(<TowingPage />)
    await user.click(screen.getByRole('button', { name: '8%' }))
    const addSelect = screen.getByRole('combobox', { name: /add a truck/i })
    await user.selectOptions(addSelect, 'ford-f-150') // 3.0 EcoBoost: can't hold 65 on 8% with the default trailer
    await user.selectOptions(addSelect, 'ford-f-250-super-duty') // 6.8 V8: can

    await user.click(screen.getByRole('button', { name: 'Hill climb' }))
    // Everyone starts at the target speed
    // (the scenario's "65 mph" speed chip is a button; the lane readouts are spans)
    expect(screen.getAllByText('65 mph').filter(el => el.tagName === 'SPAN')).toHaveLength(2)

    const scrubber = screen.getByRole('slider', { name: /playback position/i })
    fireEvent.change(scrubber, { target: { value: scrubber.getAttribute('max') } })
    const finishes = screen.getAllByTestId('lane-finish').map(el => el.textContent)
    expect(finishes[0]).toMatch(/settles \d+ mph/)
    expect(finishes[1]).toMatch(/holds 65 mph/)
  })

  test('passing a semi shows a top-down view and each rig\'s pass time and clear road needed', async () => {
    const user = userEvent.setup()
    render(<TowingPage />)
    const addSelect = screen.getByRole('combobox', { name: /add a truck/i })
    await user.selectOptions(addSelect, 'ford-f-250-super-duty')
    await user.selectOptions(addSelect, 'toyota-tundra')

    await user.click(screen.getByRole('button', { name: 'Pass a semi' }))
    expect(screen.getByRole('img', { name: /rigs passing a semi/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Semi at 55 mph' })).toHaveAttribute('aria-pressed', 'true')
    // Both start at the semi's speed
    expect(screen.getAllByText('55 mph').filter(el => el.tagName === 'SPAN')).toHaveLength(2)

    const scrubber = screen.getByRole('slider', { name: /playback position/i })
    fireEvent.change(scrubber, { target: { value: scrubber.getAttribute('max') } })
    const results = screen.getAllByTestId('lane-finish').map(el => el.textContent)
    expect(results).toHaveLength(2)
    for (const r of results) expect(r).toMatch(/^\d+\.\d s · [\d,]+ ft clear$/)

    // A faster semi takes longer to pass
    const before = parseFloat(results[0]!)
    await user.click(screen.getByRole('button', { name: 'Semi at 65 mph' }))
    const scrubber2 = screen.getByRole('slider', { name: /playback position/i })
    fireEvent.change(scrubber2, { target: { value: scrubber2.getAttribute('max') } })
    expect(parseFloat(screen.getAllByTestId('lane-finish')[0].textContent!)).toBeGreaterThan(before)
  })
})
