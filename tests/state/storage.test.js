import { describe, it, expect, beforeEach, vi } from 'vitest'
import { validateOntologyData, saveToStorage, loadFromStorage } from '../../src/state/storage.js'
import { getDefaultData } from '../../src/data/defaults.js'

describe('validateOntologyData', () => {
  it('accepts valid default data', () => {
    expect(validateOntologyData(getDefaultData())).toBe(true)
  })
  it('rejects null', () => {
    expect(validateOntologyData(null)).toBe(false)
  })
  it('rejects missing workflows array', () => {
    const d = getDefaultData()
    delete d.workflows
    expect(validateOntologyData(d)).toBe(false)
  })
  it('rejects missing systems array', () => {
    const d = getDefaultData()
    delete d.systems
    expect(validateOntologyData(d)).toBe(false)
  })
  it('rejects missing personas array', () => {
    const d = getDefaultData()
    delete d.personas
    expect(validateOntologyData(d)).toBe(false)
  })
  it('rejects arrays over 100 items', () => {
    const d = getDefaultData()
    d.workflows = new Array(101).fill({ id: 'wf-x', name: 'x', type: 'routine', description: '', owner: '', frequency: 'daily', linkedSystems: [] })
    expect(validateOntologyData(d)).toBe(false)
  })
  it('rejects node with missing id', () => {
    const d = getDefaultData()
    delete d.workflows[0].id
    expect(validateOntologyData(d)).toBe(false)
  })
  it('rejects node with missing name', () => {
    const d = getDefaultData()
    delete d.workflows[0].name
    expect(validateOntologyData(d)).toBe(false)
  })
})

describe('saveToStorage / loadFromStorage', () => {
  beforeEach(() => {
    localStorage.clear()
  })
  it('round-trips data correctly', () => {
    const data = getDefaultData()
    saveToStorage(data)
    const loaded = loadFromStorage()
    expect(loaded.workflows).toHaveLength(5)
    expect(loaded.systems).toHaveLength(5)
  })
  it('returns defaults when localStorage is empty', () => {
    const loaded = loadFromStorage()
    expect(loaded.workflows).toHaveLength(5)
  })
  it('returns defaults when localStorage has invalid JSON', () => {
    localStorage.setItem('context-modeler:ontology-data', 'not-json')
    const loaded = loadFromStorage()
    expect(loaded.workflows).toHaveLength(5)
  })
})
