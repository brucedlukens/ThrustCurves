import { describe, test, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
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

  test('adding a truck shows its card and the results tables', async () => {
    const user = userEvent.setup()
    render(<TowingPage />)

    const addSelect = screen.getByRole('combobox', { name: /add a truck/i })
    await user.selectOptions(addSelect, 'ford-f250-2023')

    expect(screen.getByText('Ford F-250 Super Duty')).toBeInTheDocument()
    expect(screen.getByText(/Towing Metrics/i)).toBeInTheDocument()
    expect(screen.getByText(/Gears at Target Speed/i)).toBeInTheDocument()
  })

  test('removing a truck returns to the empty state', async () => {
    const user = userEvent.setup()
    render(<TowingPage />)

    await user.selectOptions(screen.getByRole('combobox', { name: /add a truck/i }), 'toyota-tundra-2022')
    expect(screen.getByText('Toyota Tundra')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /remove tundra/i }))
    expect(screen.queryByText('Toyota Tundra')).not.toBeInTheDocument()
    expect(screen.getByText(/add trucks to compare/i)).toBeInTheDocument()
  })
})
