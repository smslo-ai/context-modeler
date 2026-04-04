import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { validateOntologyData, localStorageAdapter } from './storage.service'
import { getDefaultData } from '../data/defaults'

describe('validateOntologyData', () => {
  it('accepts valid ontology data', () => {
    expect(validateOntologyData(getDefaultData())).toBe(true)
  })

  it('rejects null', () => {
    expect(validateOntologyData(null)).toBe(false)
  })

  it('rejects non-object', () => {
    expect(validateOntologyData('string')).toBe(false)
  })

  it('rejects missing workflows array', () => {
    const data = { ...getDefaultData(), workflows: 'not-array' }
    expect(validateOntologyData(data)).toBe(false)
  })

  it('rejects missing systems array', () => {
    const data = { ...getDefaultData(), systems: undefined }
    expect(validateOntologyData(data)).toBe(false)
  })

  it('rejects missing personas array', () => {
    const data = { ...getDefaultData(), personas: null }
    expect(validateOntologyData(data)).toBe(false)
  })

  it('rejects oversized arrays', () => {
    const data = getDefaultData()
    data.workflows = Array.from({ length: 101 }, (_, i) => ({
      id: `wf-${i}`,
      name: `Workflow ${i}`,
      type: 'routine' as const,
      description: '',
      owner: '',
      frequency: 'daily' as const,
      linkedSystems: [],
    }))
    expect(validateOntologyData(data)).toBe(false)
  })

  it('rejects nodes without id', () => {
    const data = getDefaultData()
    data.workflows[0] = { ...data.workflows[0]!, id: '' }
    expect(validateOntologyData(data)).toBe(false)
  })

  it('rejects nodes without name', () => {
    const data = getDefaultData()
    data.workflows[0] = { ...data.workflows[0]!, name: '' }
    expect(validateOntologyData(data)).toBe(false)
  })

  it('rejects nodes with overly long strings', () => {
    const data = getDefaultData()
    data.workflows[0] = { ...data.workflows[0]!, name: 'x'.repeat(501) }
    expect(validateOntologyData(data)).toBe(false)
  })
})

describe('localStorageAdapter', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('loads default data when localStorage is empty', () => {
    const data = localStorageAdapter.load()
    expect(data.workflows.length).toBeGreaterThan(0)
    expect(data.systems.length).toBeGreaterThan(0)
  })

  it('loads default data when localStorage has invalid JSON', () => {
    localStorage.setItem('context-modeler:ontology-data', 'not-json')
    const data = localStorageAdapter.load()
    expect(data.workflows.length).toBeGreaterThan(0)
  })

  it('loads default data when stored data fails validation', () => {
    localStorage.setItem('context-modeler:ontology-data', '{"workflows":"bad"}')
    const data = localStorageAdapter.load()
    expect(data.workflows.length).toBeGreaterThan(0)
  })

  it('loads valid stored data', () => {
    const original = getDefaultData()
    original.workflows.push({
      id: 'wf-custom',
      name: 'Custom Workflow',
      type: 'routine',
      description: 'test',
      owner: 'test',
      frequency: 'daily',
      linkedSystems: [],
    })
    localStorage.setItem('context-modeler:ontology-data', JSON.stringify(original))
    const loaded = localStorageAdapter.load()
    expect(loaded.workflows.find((w) => w.id === 'wf-custom')).toBeTruthy()
  })

  it('back-fills missing optional fields from defaults', () => {
    const minimal = getDefaultData()
    const { contextMap: _cm, frictionRules: _fr, modeRules: _mr, ...withoutOptional } = minimal
    localStorage.setItem('context-modeler:ontology-data', JSON.stringify(withoutOptional))
    const loaded = localStorageAdapter.load()
    expect(loaded.contextMap).toBeTruthy()
    expect(loaded.frictionRules).toBeTruthy()
    expect(loaded.modeRules).toBeTruthy()
  })
})

describe('localStorageAdapter.save (debounce)', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('debounces writes with 300ms delay', () => {
    const data = getDefaultData()
    localStorageAdapter.save(data)
    // Not written yet
    expect(localStorage.getItem('context-modeler:ontology-data')).toBeNull()
    // After debounce
    vi.advanceTimersByTime(300)
    expect(localStorage.getItem('context-modeler:ontology-data')).toBeTruthy()
  })

  it('only writes once when save is called rapidly', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem')
    const data = getDefaultData()
    localStorageAdapter.save(data)
    localStorageAdapter.save(data)
    localStorageAdapter.save(data)
    vi.advanceTimersByTime(300)
    // setItem is called for many things; filter to our key
    const ourCalls = spy.mock.calls.filter(([key]) => key === 'context-modeler:ontology-data')
    expect(ourCalls).toHaveLength(1)
    spy.mockRestore()
  })
})

describe('vanilla JS data round-trip compatibility', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('reads data saved in vanilla JS format', () => {
    // Simulate what the vanilla JS app would save
    const vanillaData = {
      workflows: [
        {
          id: 'wf-test',
          name: 'Test WF',
          type: 'routine',
          description: 'd',
          owner: 'o',
          frequency: 'daily',
          linkedSystems: [],
        },
      ],
      systems: [
        {
          id: 'sys-test',
          name: 'Test Sys',
          category: 'storage',
          description: 'd',
          linkedWorkflows: [],
          linkedUsers: [],
        },
      ],
      personas: [{ id: 'usr-test', name: 'Test User', state: 'test', description: 'd' }],
      contextMap: { 'wf-test': ['sys-test'] },
      frictionRules: { 'wf-test::sys-test': 0.5 },
      modeRules: { 'morning-triage': { dimmed: [], highlighted: [] } },
    }
    localStorage.setItem('context-modeler:ontology-data', JSON.stringify(vanillaData))

    const loaded = localStorageAdapter.load()
    expect(loaded.workflows[0]!.id).toBe('wf-test')
    expect(loaded.systems[0]!.id).toBe('sys-test')
    expect(loaded.personas[0]!.id).toBe('usr-test')
    expect(loaded.frictionRules['wf-test::sys-test']).toBe(0.5)
  })
})
