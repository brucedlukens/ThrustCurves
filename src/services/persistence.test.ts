import { describe, test, expect, vi, beforeEach } from 'vitest'
import type { SavedSetup } from '@/types/config'
import { DEFAULT_MODIFICATIONS } from '@/types/config'

const mockSetup: SavedSetup = {
  id: 'test-id-1',
  name: 'Test Setup',
  carId: 'supra-2020',
  modifications: { ...DEFAULT_MODIFICATIONS, weightDeltaKg: -50 },
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
}

/**
 * Creates a fresh in-memory mock DB for each test.
 * We use vi.resetModules() + dynamic import to reset the module-level dbPromise singleton.
 */
async function setupPersistence() {
  const store = new Map<string, SavedSetup>()

  vi.resetModules()
  vi.doMock('idb', () => ({
    openDB: vi.fn().mockResolvedValue({
      getAll: vi.fn(() => Promise.resolve([...store.values()])),
      get: vi.fn((_storeName: string, id: string) => Promise.resolve(store.get(id))),
      put: vi.fn((_storeName: string, setup: SavedSetup) => {
        store.set(setup.id, setup)
        return Promise.resolve()
      }),
      delete: vi.fn((_storeName: string, id: string) => {
        store.delete(id)
        return Promise.resolve()
      }),
    }),
  }))

  const mod = await import('./persistence')
  return { store, ...mod }
}

describe('persistence service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('getAllSetups returns empty array initially', async () => {
    const { getAllSetups } = await setupPersistence()
    const result = await getAllSetups()
    expect(result).toEqual([])
  })

  test('putSetup stores a setup and getAllSetups retrieves it', async () => {
    const { putSetup, getAllSetups } = await setupPersistence()
    await putSetup(mockSetup)
    const result = await getAllSetups()
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual(mockSetup)
  })

  test('getSetup retrieves a specific setup', async () => {
    const { putSetup, getSetup } = await setupPersistence()
    await putSetup(mockSetup)
    const result = await getSetup(mockSetup.id)
    expect(result).toEqual(mockSetup)
  })

  test('getSetup returns undefined for unknown id', async () => {
    const { getSetup } = await setupPersistence()
    const result = await getSetup('nonexistent')
    expect(result).toBeUndefined()
  })

  test('getAllSetups returns all stored setups', async () => {
    const { putSetup, getAllSetups } = await setupPersistence()
    const setup2: SavedSetup = { ...mockSetup, id: 'test-id-2', name: 'Setup 2' }
    await putSetup(mockSetup)
    await putSetup(setup2)
    const result = await getAllSetups()
    expect(result).toHaveLength(2)
  })

  test('removeSetup deletes a setup', async () => {
    const { putSetup, removeSetup, getAllSetups } = await setupPersistence()
    await putSetup(mockSetup)
    await removeSetup(mockSetup.id)
    const result = await getAllSetups()
    expect(result).toHaveLength(0)
  })
})
