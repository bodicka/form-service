import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const dataDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'data')
const dbFile = path.join(dataDir, 'db.json')
let writeQueue = Promise.resolve()

export async function initializeStore() {
  await mkdir(dataDir, { recursive: true })
  try {
    await readFile(dbFile, 'utf8')
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
    await writeFile(dbFile, JSON.stringify({ forms: [], responses: [], events: [] }, null, 2))
  }
}

export async function readStore() {
  const content = await readFile(dbFile, 'utf8')
  return JSON.parse(content)
}

export function updateStore(updater) {
  const operation = writeQueue.then(async () => {
    const store = await readStore()
    const result = await updater(store)
    const temporary = `${dbFile}.${process.pid}.tmp`
    await writeFile(temporary, JSON.stringify(store, null, 2))
    await rename(temporary, dbFile)
    return result
  })
  writeQueue = operation.catch(() => {})
  return operation
}
