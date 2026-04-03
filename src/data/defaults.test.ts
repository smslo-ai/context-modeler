import { describe, it, expect } from 'vitest'
import { getDefaultData } from './defaults'

describe('getDefaultData', () => {
  it('returns all required top-level keys', () => {
    const data = getDefaultData()
    expect(data).toHaveProperty('workflows')
    expect(data).toHaveProperty('systems')
    expect(data).toHaveProperty('personas')
    expect(data).toHaveProperty('contextMap')
    expect(data).toHaveProperty('frictionRules')
    expect(data).toHaveProperty('modeRules')
  })

  it('returns non-empty arrays', () => {
    const data = getDefaultData()
    expect(data.workflows.length).toBeGreaterThan(0)
    expect(data.systems.length).toBeGreaterThan(0)
    expect(data.personas.length).toBeGreaterThan(0)
  })

  it('returns a fresh copy on each call (no shared references)', () => {
    const a = getDefaultData()
    const b = getDefaultData()
    expect(a).not.toBe(b)
    expect(a.workflows).not.toBe(b.workflows)
    expect(a.contextMap).not.toBe(b.contextMap)

    // Mutating one should not affect the other
    a.workflows.push({
      id: 'wf-test',
      name: 'Test',
      type: 'routine',
      description: '',
      owner: '',
      frequency: 'daily',
      linkedSystems: [],
    })
    expect(b.workflows.length).toBe(5)
  })

  it('all workflow IDs start with wf-', () => {
    const data = getDefaultData()
    for (const wf of data.workflows) {
      expect(wf.id).toMatch(/^wf-/)
    }
  })

  it('all system IDs start with sys-', () => {
    const data = getDefaultData()
    for (const sys of data.systems) {
      expect(sys.id).toMatch(/^sys-/)
    }
  })

  it('all persona IDs start with usr-', () => {
    const data = getDefaultData()
    for (const p of data.personas) {
      expect(p.id).toMatch(/^usr-/)
    }
  })

  it('friction rules reference valid workflow::system pairs', () => {
    const data = getDefaultData()
    const wfIds = new Set(data.workflows.map((w) => w.id))
    const sysIds = new Set(data.systems.map((s) => s.id))

    for (const key of Object.keys(data.frictionRules)) {
      const [wfId, sysId] = key.split('::')
      expect(wfIds.has(wfId!)).toBe(true)
      expect(sysIds.has(sysId!)).toBe(true)
    }
  })
})
