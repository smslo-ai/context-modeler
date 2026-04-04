import { describe, it, expect } from 'vitest'
import { getDefaultData } from '../../src/data/defaults.js'

describe('getDefaultData', () => {
  it('returns object with workflows, systems, personas arrays', () => {
    const d = getDefaultData()
    expect(Array.isArray(d.workflows)).toBe(true)
    expect(Array.isArray(d.systems)).toBe(true)
    expect(Array.isArray(d.personas)).toBe(true)
  })
  it('returns 5 workflows, 5 systems, 4 personas', () => {
    const d = getDefaultData()
    expect(d.workflows).toHaveLength(5)
    expect(d.systems).toHaveLength(5)
    expect(d.personas).toHaveLength(4)
  })
  it('returns fresh copy each call (mutation isolation)', () => {
    const a = getDefaultData()
    const b = getDefaultData()
    a.workflows.push({ id: 'test' })
    expect(b.workflows).toHaveLength(5)
  })
  it('includes contextMap and frictionRules', () => {
    const d = getDefaultData()
    expect(typeof d.contextMap).toBe('object')
    expect(typeof d.frictionRules).toBe('object')
    expect(typeof d.modeRules).toBe('object')
  })
  it('all workflow IDs use kebab-case wf- prefix', () => {
    const d = getDefaultData()
    d.workflows.forEach(w => expect(w.id).toMatch(/^wf-/))
  })
  it('all system IDs use kebab-case sys- prefix', () => {
    const d = getDefaultData()
    d.systems.forEach(s => expect(s.id).toMatch(/^sys-/))
  })
  it('all persona IDs use kebab-case usr- prefix', () => {
    const d = getDefaultData()
    d.personas.forEach(p => expect(p.id).toMatch(/^usr-/))
  })
  it('contextMap keys include all node IDs', () => {
    const d = getDefaultData()
    const allIds = [...d.workflows.map(w => w.id), ...d.systems.map(s => s.id), ...d.personas.map(p => p.id)]
    allIds.forEach(id => expect(d.contextMap).toHaveProperty(id))
  })
})
