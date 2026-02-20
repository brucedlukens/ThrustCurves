import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SaveLoadControls from './SaveLoadControls'
import { useCarStore } from '@/store/carStore'
import { DEFAULT_MODIFICATIONS } from '@/types/config'

const mockSaveSetup = vi.fn().mockResolvedValue({
  id: 'new-id',
  name: 'Test Save',
  carId: 'supra-2020',
  modifications: DEFAULT_MODIFICATIONS,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
})

vi.mock('@/store/persistenceStore', () => ({
  usePersistenceStore: vi.fn((selector: (s: { saveSetup: typeof mockSaveSetup }) => unknown) =>
    selector({ saveSetup: mockSaveSetup })
  ),
}))

describe('SaveLoadControls', () => {
  beforeEach(() => {
    useCarStore.setState({ modifications: { ...DEFAULT_MODIFICATIONS } })
    vi.clearAllMocks()
    mockSaveSetup.mockResolvedValue({
      id: 'new-id',
      name: 'Test Save',
      carId: 'supra-2020',
      modifications: DEFAULT_MODIFICATIONS,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  })

  test('renders a Save Setup button', () => {
    render(<SaveLoadControls carId="supra-2020" />)
    expect(screen.getByRole('button', { name: /save setup/i })).toBeInTheDocument()
  })

  test('clicking Save Setup shows name input', async () => {
    const user = userEvent.setup()
    render(<SaveLoadControls carId="supra-2020" />)
    await user.click(screen.getByRole('button', { name: /save setup/i }))
    expect(screen.getByRole('textbox', { name: /setup name/i })).toBeInTheDocument()
  })

  test('cancel button hides the form', async () => {
    const user = userEvent.setup()
    render(<SaveLoadControls carId="supra-2020" />)
    await user.click(screen.getByRole('button', { name: /save setup/i }))
    await user.click(screen.getByText(/cancel/i))
    expect(screen.queryByRole('textbox', { name: /setup name/i })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /save setup/i })).toBeInTheDocument()
  })

  test('save button is disabled when name is empty', async () => {
    const user = userEvent.setup()
    render(<SaveLoadControls carId="supra-2020" />)
    await user.click(screen.getByRole('button', { name: /save setup/i }))
    const saveBtn = screen.getByRole('button', { name: /^save$/i })
    expect(saveBtn).toBeDisabled()
  })

  test('save button enables when name is typed', async () => {
    const user = userEvent.setup()
    render(<SaveLoadControls carId="supra-2020" />)
    await user.click(screen.getByRole('button', { name: /save setup/i }))
    await user.type(screen.getByRole('textbox', { name: /setup name/i }), 'My Setup')
    expect(screen.getByRole('button', { name: /^save$/i })).not.toBeDisabled()
  })

  test('pressing Enter in the input calls saveSetup', async () => {
    const user = userEvent.setup()
    render(<SaveLoadControls carId="supra-2020" />)
    await user.click(screen.getByRole('button', { name: /save setup/i }))
    await user.type(screen.getByRole('textbox', { name: /setup name/i }), 'My Setup{Enter}')
    expect(mockSaveSetup).toHaveBeenCalledWith('My Setup', 'supra-2020', expect.any(Object))
  })
})
