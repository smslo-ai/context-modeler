import { getDefaultData } from '../data/defaults.js'

const STORAGE_KEY = 'context-modeler:ontology-data'
const MAX_ARRAY_LENGTH = 100
const MAX_STRING_LENGTH = 500
const REQUIRED_NODE_FIELDS = ['id', 'name']

/**
 * Validate that a parsed ontology data object meets the minimum structural
 * requirements before it is accepted from localStorage.
 *
 * Checks performed:
 *  - Must be a non-null object
 *  - Must contain workflows, systems, personas as arrays
 *  - No array may exceed MAX_ARRAY_LENGTH items (guard against bloated storage)
 *  - Every node must have a non-empty 'id' and 'name' string within MAX_STRING_LENGTH
 *
 * @param {unknown} data
 * @returns {boolean}
 */
export function validateOntologyData(data) {
  if (!data || typeof data !== 'object') return false
  if (!Array.isArray(data.workflows)) return false
  if (!Array.isArray(data.systems)) return false
  if (!Array.isArray(data.personas)) return false
  if (data.workflows.length > MAX_ARRAY_LENGTH) return false
  if (data.systems.length > MAX_ARRAY_LENGTH) return false
  if (data.personas.length > MAX_ARRAY_LENGTH) return false

  const allOntologyNodes = [...data.workflows, ...data.systems, ...data.personas]
  for (const node of allOntologyNodes) {
    if (!node || typeof node !== 'object') return false
    for (const field of REQUIRED_NODE_FIELDS) {
      if (!node[field] || typeof node[field] !== 'string') return false
      if (node[field].length > MAX_STRING_LENGTH) return false
    }
  }
  return true
}

// Module-level timer and pending data for debounced saves
let _saveTimer = null
let _pendingData = null

/**
 * Persist ontology data to localStorage.
 * Calls are debounced (300 ms) so that rapid successive mutations
 * (e.g. adding several nodes in quick succession) result in a single
 * write, keeping the main thread free during bursts of activity.
 *
 * A beforeunload listener flushes any pending write synchronously so
 * data is never lost when the user navigates away or closes the tab.
 *
 * Silently handles QuotaExceededError by dispatching a DOM event so
 * any toast listener in the UI can surface the error without crashing.
 *
 * @param {object} data - validated ontology data object
 */
export function saveToStorage(data) {
  _pendingData = data
  clearTimeout(_saveTimer)
  _saveTimer = setTimeout(() => {
    _flushSave()
  }, 300)
}

/** @internal Synchronously write any pending data to localStorage. */
function _flushSave() {
  if (_pendingData === null) return
  const data = _pendingData
  _pendingData = null
  clearTimeout(_saveTimer)
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    window.dispatchEvent(new CustomEvent('data-saved'))
  } catch (err) {
    if (err.name === 'QuotaExceededError') {
      window.dispatchEvent(new CustomEvent('storage-quota-exceeded'))
    }
  }
}

// Guarantee the latest state is written before the page unloads
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', _flushSave)
}

/**
 * Load ontology data from localStorage.
 * Falls back to getDefaultData() when:
 *  - localStorage is empty
 *  - JSON is malformed
 *  - Parsed object fails validation
 *
 * Also back-fills optional fields (contextMap, frictionRules, modeRules)
 * from defaults for forward-compatibility with older persisted shapes.
 *
 * @returns {object} validated ontology data
 */
export function loadFromStorage() {
  try {
    const storedJson = localStorage.getItem(STORAGE_KEY)
    if (!storedJson) return getDefaultData()
    const parsedOntologyData = JSON.parse(storedJson)
    if (!validateOntologyData(parsedOntologyData)) return getDefaultData()
    // Ensure optional rich fields exist (backward compat with v0.x saves)
    const defaults = getDefaultData()
    return {
      ...parsedOntologyData,
      contextMap:   parsedOntologyData.contextMap   ?? defaults.contextMap,
      frictionRules: parsedOntologyData.frictionRules ?? defaults.frictionRules,
      modeRules:    parsedOntologyData.modeRules    ?? defaults.modeRules,
    }
  } catch {
    return getDefaultData()
  }
}
