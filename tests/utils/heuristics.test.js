import { describe, it, expect } from 'vitest'
import { calculateFriction, getSimulationVisuals, getFrictionColor, buildFrictionMatrix } from '../../src/utils/heuristics.js'

describe('calculateFriction', () => {
  it('returns score for known wf::sys pair from frictionRules', () => {
    const rules = { 'wf-a::sys-b': 0.85 }
    expect(calculateFriction({ id: 'wf-a' }, { id: 'sys-b' }, rules)).toBe(0.85)
  })
  it('returns 0.5 default for unknown pair', () => {
    expect(calculateFriction({ id: 'wf-x' }, { id: 'sys-y' }, {})).toBe(0.5)
  })
  it('handles missing frictionRules gracefully', () => {
    expect(() => calculateFriction({ id: 'wf-x' }, { id: 'sys-y' }, null)).not.toThrow()
  })
})

describe('getFrictionColor', () => {
  it('returns red class for high friction (>= 0.75)', () => {
    expect(getFrictionColor(0.85)).toContain('red')
  })
  it('returns orange class for mod-high friction (>= 0.5)', () => {
    expect(getFrictionColor(0.6)).toMatch(/orange|amber/)
  })
  it('returns green class for low friction (< 0.35)', () => {
    expect(getFrictionColor(0.2)).toContain('green')
  })
})

describe('getSimulationVisuals', () => {
  it('returns normal state when mode is null', () => {
    const result = getSimulationVisuals({ id: 'wf-x' }, null, {})
    expect(result.opacity).toBe(1)
    expect(result.highlighted).toBe(false)
    expect(result.dimmed).toBe(false)
  })
  it('returns dimmed for dimmed node in morning-triage', () => {
    const modeRules = {
      'morning-triage': { dimmed: ['wf-strategic-planning'], highlighted: [] }
    }
    const result = getSimulationVisuals({ id: 'wf-strategic-planning' }, 'morning-triage', modeRules)
    expect(result.dimmed).toBe(true)
    expect(result.opacity).toBeLessThan(1)
  })
  it('returns highlighted for highlighted node in morning-triage', () => {
    const modeRules = {
      'morning-triage': { dimmed: [], highlighted: ['wf-mgmt-escalations'] }
    }
    const result = getSimulationVisuals({ id: 'wf-mgmt-escalations' }, 'morning-triage', modeRules)
    expect(result.highlighted).toBe(true)
  })
  it('returns normal for unspecified node in a mode', () => {
    const modeRules = {
      'deep-focus': { dimmed: ['sys-slack-teams'], highlighted: ['wf-strategic-planning'] }
    }
    const result = getSimulationVisuals({ id: 'sys-jira' }, 'deep-focus', modeRules)
    expect(result.dimmed).toBe(false)
    expect(result.highlighted).toBe(false)
  })
})

describe('buildFrictionMatrix', () => {
  it('returns correct dimensions', () => {
    const workflows = [{ id: 'wf-a' }, { id: 'wf-b' }]
    const systems = [{ id: 'sys-x' }, { id: 'sys-y' }, { id: 'sys-z' }]
    const matrix = buildFrictionMatrix(workflows, systems, {})
    expect(matrix).toHaveLength(3)       // rows = systems
    expect(matrix[0]).toHaveLength(2)    // cols = workflows
  })
  it('matrix values match individual calculateFriction calls', () => {
    const workflows = [{ id: 'wf-a' }]
    const systems = [{ id: 'sys-x' }]
    const rules = { 'wf-a::sys-x': 0.75 }
    const matrix = buildFrictionMatrix(workflows, systems, rules)
    expect(matrix[0][0]).toBe(0.75)
  })
  it('handles empty arrays without throwing', () => {
    expect(() => buildFrictionMatrix([], [], {})).not.toThrow()
    expect(buildFrictionMatrix([], [], {})).toHaveLength(0)
  })
})
