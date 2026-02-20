import { describe, test, expect, vi, beforeEach } from 'vitest'
import { usePersistenceStore } from './persistenceStore'
import { DEFAULT_MODIFICATIONS } from '@/types/config'

// vi.mock is hoisted - factory must NOT reference outer variables (TDZ issue).
// Use inline data only inside the factory.
vi.mock('@/services/persistence', () => ({
  getAllSetups: vi.fn().mockResolvedValue([
    {
      id: 'test-id-1',
      name: 'My Setup',
      carId: 'supra-2020',
      modifications: {
        weightDeltaKg: -50,
        torqueMultiplier: 1.0,
        gearRatioOverrides: [],
        altitudeM: 0,
      },
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
  ]),
  putSetup: vi.fn().mockResolvedValue(undefined),
  removeSetup: vi.fn().mockResolvedValue(undefined),
}))

describe('persistenceStore', () => {
  beforeEach(() => {
    usePersistenceStore.setState({
      savedSetups: [],
      isLoading: false,
      error: null,
    })
    vi.clearAllMocks()
  })

  test('initial state has empty savedSetups', () => {
    expect(usePersistenceStore.getState().savedSetups).toEqual([])
    expect(usePersistenceStore.getState().isLoading).toBe(false)
  })

  test('loadSetups fetches from persistence and populates store', async () => {
    // Re-import the mock to restore implementation after clearAllMocks
    const { getAllSetups } = await import('@/services/persistence')
    vi.mocked(getAllSetups).mockResolvedValueOnce([
      {
        id: 'test-id-1',
        name: 'My Setup',
        carId: 'supra-2020',
        modifications: { ...DEFAULT_MODIFICATIONS, weightDeltaKg: -50 },
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    ])
    await usePersistenceStore.getState().loadSetups()
    expect(usePersistenceStore.getState().savedSetups).toHaveLength(1)
    expect(usePersistenceStore.getState().savedSetups[0].name).toBe('My Setup')
    expect(usePersistenceStore.getState().isLoading).toBe(false)
  })

  test('saveSetup adds a new setup to the store', async () => {
    const setup = await usePersistenceStore
      .getState()
      .saveSetup('New Setup', 'supra-2020', DEFAULT_MODIFICATIONS)

    expect(setup.name).toBe('New Setup')
    expect(setup.carId).toBe('supra-2020')
    expect(setup.id).toBeTruthy()
    expect(usePersistenceStore.getState().savedSetups).toHaveLength(1)
  })

  test('saveSetup assigns unique ids', async () => {
    const s1 = await usePersistenceStore
      .getState()
      .saveSetup('Setup 1', 'supra-2020', DEFAULT_MODIFICATIONS)
    const s2 = await usePersistenceStore
      .getState()
      .saveSetup('Setup 2', 'supra-2020', DEFAULT_MODIFICATIONS)

    expect(s1.id).not.toBe(s2.id)
    expect(usePersistenceStore.getState().savedSetups).toHaveLength(2)
  })

  test('deleteSetup removes setup from store', async () => {
    usePersistenceStore.setState({
      savedSetups: [
        {
          id: 'test-id-1',
          name: 'My Setup',
          carId: 'supra-2020',
          modifications: DEFAULT_MODIFICATIONS,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      ],
    })
    await usePersistenceStore.getState().deleteSetup('test-id-1')
    expect(usePersistenceStore.getState().savedSetups).toHaveLength(0)
  })

  test('loadSetups sets isLoading during fetch', async () => {
    const { getAllSetups } = await import('@/services/persistence')
    vi.mocked(getAllSetups).mockResolvedValueOnce([])
    const states: boolean[] = []
    const unsub = usePersistenceStore.subscribe(s => states.push(s.isLoading))
    await usePersistenceStore.getState().loadSetups()
    unsub()
    expect(states).toContain(true)
    expect(usePersistenceStore.getState().isLoading).toBe(false)
  })
})
