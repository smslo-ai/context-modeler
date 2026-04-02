import type { OntologyData } from '../types'
import type { StorageAdapter } from './types'
import { getDefaultData } from '../data/defaults'

const STORAGE_KEY = 'context-modeler:ontology-data'
const MAX_ARRAY_LENGTH = 100
const MAX_STRING_LENGTH = 500

export function validateOntologyData(data: unknown): data is OntologyData {
  if (!data || typeof data !== 'object') return false
  const d = data as Record<string, unknown>

  if (!Array.isArray(d.workflows)) return false
  if (!Array.isArray(d.systems)) return false
  if (!Array.isArray(d.personas)) return false

  if (d.workflows.length > MAX_ARRAY_LENGTH) return false
  if (d.systems.length > MAX_ARRAY_LENGTH) return false
  if (d.personas.length > MAX_ARRAY_LENGTH) return false

  const allNodes = [
    ...(d.workflows as unknown[]),
    ...(d.systems as unknown[]),
    ...(d.personas as unknown[]),
  ]
  for (const node of allNodes) {
    if (!node || typeof node !== 'object') return false
    const n = node as Record<string, unknown>
    for (const field of ['id', 'name']) {
      if (!n[field] || typeof n[field] !== 'string') return false
      if ((n[field] as string).length > MAX_STRING_LENGTH) return false
    }
  }
  return true
}

let saveTimer: ReturnType<typeof setTimeout> | null = null
let pendingData: OntologyData | null = null

function flushSave(): void {
  if (pendingData === null) return
  const data = pendingData
  pendingData = null
  if (saveTimer) clearTimeout(saveTimer)
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    window.dispatchEvent(new CustomEvent('data-saved'))
  } catch (err) {
    if (err instanceof DOMException && err.name === 'QuotaExceededError') {
      window.dispatchEvent(new CustomEvent('storage-quota-exceeded'))
    }
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', flushSave)
}

export const localStorageAdapter: StorageAdapter = {
  load(): OntologyData {
    try {
      const json = localStorage.getItem(STORAGE_KEY)
      if (!json) return getDefaultData()
      const parsed: unknown = JSON.parse(json)
      if (!validateOntologyData(parsed)) return getDefaultData()
      const defaults = getDefaultData()
      return {
        ...parsed,
        contextMap: parsed.contextMap ?? defaults.contextMap,
        frictionRules: parsed.frictionRules ?? defaults.frictionRules,
        modeRules: parsed.modeRules ?? defaults.modeRules,
      }
    } catch {
      return getDefaultData()
    }
  },

  save(data: OntologyData): void {
    pendingData = data
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(flushSave, 300)
  },
}
