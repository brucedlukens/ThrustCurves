import { describe, test, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import TelemetryPage from './TelemetryPage'
import { useTelemetryStore } from '@/store/telemetryStore'
import { useCarStore } from '@/store/carStore'
import { getTestCar, rowsToCsv, synthesizeRun, SAMPLE_COURSE } from '@/test/telemetryFixtures'

const car = getTestCar()
const csv = rowsToCsv(synthesizeRun(car, SAMPLE_COURSE, { rateHz: 10 }))

function renderPage() {
  return render(
    <MemoryRouter>
      <TelemetryPage />
    </MemoryRouter>,
  )
}

describe('TelemetryPage', () => {
  beforeEach(() => {
    useTelemetryStore.getState().clear()
    useCarStore.setState({ selectedCarId: null })
    useCarStore.getState().resetModifications()
  })

  test('renders the intro and uploader when nothing is loaded', () => {
    renderPage()
    expect(screen.getByRole('heading', { name: /telemetry what-if/i })).toBeInTheDocument()
    expect(screen.getByText(/load a logged run/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /upload a csv log/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /load sample run/i })).toBeInTheDocument()
  })

  test('uploading a file builds the run and asks for a car', async () => {
    const user = userEvent.setup()
    renderPage()
    const input = screen.getByLabelText('CSV file') as HTMLInputElement
    await user.upload(input, new File([csv], 'run.csv', { type: 'text/csv' }))
    await waitFor(() => expect(screen.getByText('run.csv')).toBeInTheDocument())
    expect(screen.getByText(/select the car this run was logged in/i)).toBeInTheDocument()
    expect(screen.getByText('Rows')).toBeInTheDocument()
  })

  test('with a run and a car, shows the summary, chart, table and road dyno', async () => {
    useTelemetryStore.getState().loadCsvText(csv, 'run.csv')
    useCarStore.getState().selectCar(car.id)
    renderPage()
    expect(await screen.findByText(/what-if result/i)).toBeInTheDocument()
    expect(screen.getByText(/speed vs distance/i)).toBeInTheDocument()
    expect(screen.getAllByText(/power-limited stretches/i).length).toBeGreaterThan(0)
    expect(screen.getByText(/road dyno/i)).toBeInTheDocument()
    // No modification yet ⇒ no delta shown
    expect(screen.getByText('Run Δ').nextSibling).toHaveTextContent('—')
  })

  test('a modification produces a run delta', async () => {
    useTelemetryStore.getState().loadCsvText(csv, 'run.csv')
    useCarStore.getState().selectCar(car.id)
    useCarStore.getState().updateModifications({ torqueMultiplier: 1.3 })
    renderPage()
    const label = await screen.findByText('Run Δ')
    expect(label.nextSibling).toHaveTextContent(/−\d+\.\d{3}s/)
    // Segment table rows carry the "line headroom"/"straight" annotation
    expect(screen.getAllByText(/straight|line headroom/).length).toBeGreaterThan(0)
  })

  test('channel mapping can be opened and changed', async () => {
    const user = userEvent.setup()
    useTelemetryStore.getState().loadCsvText(csv, 'run.csv')
    renderPage()
    await user.click(screen.getByRole('button', { name: /channel mapping/i }))
    const speedSelect = screen.getByRole('combobox', { name: /speed column/i })
    expect(speedSelect).toHaveValue('Speed (mph)')
    const derive = screen.getByRole('checkbox', { name: /derive longitudinal accel/i })
    expect(derive).toBeChecked()
    await user.click(derive)
    expect(useTelemetryStore.getState().mapping?.deriveLongAccelFromSpeed).toBe(false)
    await user.selectOptions(speedSelect, '')
    expect(await screen.findByRole('alert')).toHaveTextContent(/speed column is required/i)
  })

  test('analysis options toggle and envelope overrides feed the analysis', async () => {
    const user = userEvent.setup()
    useTelemetryStore.getState().loadCsvText(csv, 'run.csv')
    useCarStore.getState().selectCar(car.id)
    renderPage()
    await screen.findByText(/what-if result/i)
    await user.click(screen.getByRole('checkbox', { name: /calibrate model to log/i }))
    expect(useTelemetryStore.getState().options.calibrate).toBe(false)
    // The synthetic log has rpm, so hold-gear is the default; switching to optimal must stick
    expect(useTelemetryStore.getState().options.gearStrategy).toBe('hold')
    await user.selectOptions(screen.getByRole('combobox', { name: /gear strategy/i }), 'optimal')
    expect(useTelemetryStore.getState().options.gearStrategy).toBe('optimal')
    await user.type(screen.getByRole('spinbutton', { name: /^lateral$/i }), '1.3')
    expect(useTelemetryStore.getState().envelopeOverrides.maxLatG).toBe(1.3)
    expect(screen.getByText(/grip 1\.30g/)).toBeInTheDocument()
  })

  test('load sample fetches the bundled CSV', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, text: async () => csv })
    vi.stubGlobal('fetch', fetchMock)
    renderPage()
    await user.click(screen.getByRole('button', { name: /load sample run/i }))
    await waitFor(() => expect(screen.getByText('autocross-mx5-sample.csv')).toBeInTheDocument())
    expect(fetchMock).toHaveBeenCalledWith('/samples/autocross-mx5-sample.csv')
    vi.unstubAllGlobals()
  })

  test('load sample reports a fetch failure', async () => {
    const user = userEvent.setup()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404 }))
    renderPage()
    await user.click(screen.getByRole('button', { name: /load sample run/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/HTTP 404/)
    vi.unstubAllGlobals()
  })

  test('clear resets the page', async () => {
    const user = userEvent.setup()
    useTelemetryStore.getState().loadCsvText(csv, 'run.csv')
    renderPage()
    await user.click(screen.getByRole('button', { name: /^clear$/i }))
    expect(screen.getByText(/load a logged run/i)).toBeInTheDocument()
  })
})
