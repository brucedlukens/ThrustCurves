import { openDB, type IDBPDatabase } from 'idb'
import type { SavedSetup } from '@/types/config'
import type { CarSpec } from '@/types/car'

const DB_NAME = 'thrust-curves-db'
const DB_VERSION = 2
const STORE_NAME = 'saved-setups'
const CUSTOM_CARS_STORE = 'custom-cars'

let dbPromise: Promise<IDBPDatabase> | null = null

function getDB(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains(CUSTOM_CARS_STORE)) {
          db.createObjectStore(CUSTOM_CARS_STORE, { keyPath: 'id' })
        }
      },
    })
  }
  return dbPromise
}

export async function getAllSetups(): Promise<SavedSetup[]> {
  const db = await getDB()
  return db.getAll(STORE_NAME)
}

export async function getSetup(id: string): Promise<SavedSetup | undefined> {
  const db = await getDB()
  return db.get(STORE_NAME, id)
}

export async function putSetup(setup: SavedSetup): Promise<void> {
  const db = await getDB()
  await db.put(STORE_NAME, setup)
}

export async function removeSetup(id: string): Promise<void> {
  const db = await getDB()
  await db.delete(STORE_NAME, id)
}

// ── Custom Cars ─────────────────────────────────────────────────────────────

export async function getAllCustomCars(): Promise<CarSpec[]> {
  const db = await getDB()
  return db.getAll(CUSTOM_CARS_STORE)
}

export async function putCustomCar(car: CarSpec): Promise<void> {
  const db = await getDB()
  await db.put(CUSTOM_CARS_STORE, car)
}

export async function removeCustomCar(id: string): Promise<void> {
  const db = await getDB()
  await db.delete(CUSTOM_CARS_STORE, id)
}
