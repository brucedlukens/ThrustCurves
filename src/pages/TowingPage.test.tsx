import { describe, test, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
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
})
