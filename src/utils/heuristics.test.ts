import { describe, it, expect } from 'vitest'
import { calculateFriction, getFrictionColor, getSimulationVisuals } from './heuristics'
import type { FrictionRules, ModeRules } from '../types'

describe('calculateFriction', () => {
  const rules: FrictionRules = {
    'wf-a::sys-b': 0.85,
    'wf-c::sys-d': 0.15,
  }

  it('returns score for known pair', () => {
    expect(calculateFriction({ id: 'wf-a' }, { id: 'sys-b' }, rules)).toBe(0.85)
  })

  it('returns 0.5 for unknown pair', () => {
    expect(calculateFriction({ id: 'wf-x' }, { id: 'sys-y' }, rules)).toBe(0.5)
  })

  it('returns 0.5 when frictionRules is null', () => {
    expect(calculateFriction({ id: 'wf-a' }, { id: 'sys-b' }, null)).toBe(0.5)
  })

  it('returns 0.5 for missing workflow id', () => {
    expect(calculateFriction({ id: '' }, { id: 'sys-b' }, rules)).toBe(0.5)
  })

  it('returns 0.5 for missing system id', () => {
    expect(calculateFriction({ id: 'wf-a' }, { id: '' }, rules)).toBe(0.5)
  })
})

describe('getFrictionColor', () => {
  it('returns high friction class for >= 0.75', () => {
    expect(getFrictionColor(0.85)).toContain('destructive')
  })

  it('returns elevated class for >= 0.55', () => {
    expect(getFrictionColor(0.6)).toContain('FFB88A')
  })

  it('returns moderate class for >= 0.35', () => {
    expect(getFrictionColor(0.4)).toContain('primary')
  })

  it('returns low friction class for < 0.35', () => {
    expect(getFrictionColor(0.2)).toContain('secondary')
  })
})

describe('getSimulationVisuals', () => {
  const modeRules: ModeRules = {
    'morning-triage': {
      dimmed: ['wf-strategic-planning'],
      highlighted: ['wf-mgmt-escalations'],
    },
  }

  it('returns default visuals when mode is null', () => {
    const result = getSimulationVisuals({ id: 'wf-a' }, null, modeRules)
    expect(result.opacity).toBe(1)
    expect(result.dimmed).toBe(false)
    expect(result.highlighted).toBe(false)
  })

  it('returns dimmed visuals for dimmed node', () => {
    const result = getSimulationVisuals(
      { id: 'wf-strategic-planning' },
      'morning-triage',
      modeRules,
    )
    expect(result.dimmed).toBe(true)
    expect(result.opacity).toBe(0.3)
  })

  it('returns highlighted visuals for highlighted node', () => {
    const result = getSimulationVisuals({ id: 'wf-mgmt-escalations' }, 'morning-triage', modeRules)
    expect(result.highlighted).toBe(true)
    expect(result.opacity).toBe(1)
  })

  it('returns default visuals for node not in any list', () => {
    const result = getSimulationVisuals({ id: 'wf-other' }, 'morning-triage', modeRules)
    expect(result.opacity).toBe(1)
    expect(result.dimmed).toBe(false)
    expect(result.highlighted).toBe(false)
  })

  it('returns default visuals for unknown mode', () => {
    const result = getSimulationVisuals({ id: 'wf-a' }, 'unknown-mode', modeRules)
    expect(result.opacity).toBe(1)
  })
})
