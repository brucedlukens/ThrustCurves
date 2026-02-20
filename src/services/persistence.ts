import { openDB, type IDBPDatabase } from 'idb'
import type { SavedSetup } from '@/types/config'

const DB_NAME = 'thrust-curves-db'
const DB_VERSION = 1
const STORE_NAME = 'saved-setups'

let dbPromise: Promise<IDBPDatabase> | null = null

function getDB(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' })
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
