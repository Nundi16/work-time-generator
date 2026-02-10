const DB_NAME = 'WorkTimeGeneratorDB'
const DB_VERSION = 1

interface DBSchema {
  logs: string
  monthlyRecords: string
  shiftDefaults: string
  employeeNames: string
}

class WorkTimeDB {
  public db: IDBDatabase | null = null

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        if (!db.objectStoreNames.contains('logs')) {
          db.createObjectStore('logs', { keyPath: 'id' })
        }

        if (!db.objectStoreNames.contains('monthlyRecords')) {
          db.createObjectStore('monthlyRecords', { keyPath: 'id' })
        }

        if (!db.objectStoreNames.contains('shiftDefaults')) {
          db.createObjectStore('shiftDefaults', { keyPath: 'id' })
        }

        if (!db.objectStoreNames.contains('employeeNames')) {
          db.createObjectStore('employeeNames', { keyPath: 'employeeId' })
        }
      }
    })
  }

  private ensureDB(): IDBDatabase {
    if (!this.db) {
      throw new Error('Database not initialized')
    }
    return this.db
  }

  async set<T>(storeName: keyof DBSchema, key: string, value: T): Promise<void> {
    const db = this.ensureDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.put({ id: key, value })

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  async get<T>(storeName: keyof DBSchema, key: string): Promise<T | null> {
    const db = this.ensureDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly')
      const store = transaction.objectStore(storeName)
      const request = store.get(key)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        const result = request.result
        resolve(result ? result.value : null)
      }
    })
  }

  async delete(storeName: keyof DBSchema, key: string): Promise<void> {
    const db = this.ensureDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.delete(key)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  async getAll<T>(storeName: keyof DBSchema): Promise<T[]> {
    const db = this.ensureDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly')
      const store = transaction.objectStore(storeName)
      const request = store.getAll()

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        resolve(request.result.map((item: any) => item.value))
      }
    })
  }
}

export const workTimeDB = new WorkTimeDB()

export async function initDB(): Promise<void> {
  await workTimeDB.init()
}

export async function saveLogs(logs: any): Promise<void> {
  await workTimeDB.set('logs', 'current', logs)
}

export async function loadLogs<T>(): Promise<T | null> {
  return await workTimeDB.get<T>('logs', 'current')
}

export async function saveMonthlyRecords(records: any): Promise<void> {
  await workTimeDB.set('monthlyRecords', 'current', records)
}

export async function loadMonthlyRecords<T>(): Promise<T | null> {
  return await workTimeDB.get<T>('monthlyRecords', 'current')
}

export async function saveShiftDefaults(defaults: any): Promise<void> {
  await workTimeDB.set('shiftDefaults', 'current', defaults)
}

export async function loadShiftDefaults<T>(): Promise<T | null> {
  return await workTimeDB.get<T>('shiftDefaults', 'current')
}

export async function setEmployeeName(employeeId: string, name: string): Promise<void> {
  const db = workTimeDB['db']
  if (!db) throw new Error('Database not initialized')
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['employeeNames'], 'readwrite')
    const store = transaction.objectStore('employeeNames')
    const request = store.put({
      employeeId,
      name,
      updatedAt: new Date().toISOString()
    })

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

export async function getEmployeeName(employeeId: string): Promise<string | null> {
  const db = workTimeDB['db']
  if (!db) throw new Error('Database not initialized')
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['employeeNames'], 'readonly')
    const store = transaction.objectStore('employeeNames')
    const request = store.get(employeeId)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      const result = request.result
      resolve(result?.name || null)
    }
  })
}

export async function getAllEmployeeNames(): Promise<Record<string, string>> {
  const db = workTimeDB['db']
  if (!db) throw new Error('Database not initialized')
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['employeeNames'], 'readonly')
    const store = transaction.objectStore('employeeNames')
    const request = store.getAll()

    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      const names = request.result.reduce((acc: Record<string, string>, item: any) => {
        acc[item.employeeId] = item.name
        return acc
      }, {})
      resolve(names)
    }
  })
}
