import { describe, it, expect } from 'vitest'
import { buildFrictionMatrix, getFrictionBreakdown, getHighFrictionPairs } from './friction.service'
import { getDefaultData } from '../data/defaults'

describe('buildFrictionMatrix', () => {
  it('returns matrix with systems as rows and workflows as columns', () => {
    const { workflows, systems, frictionRules } = getDefaultData()
    const matrix = buildFrictionMatrix(workflows, systems, frictionRules)

    expect(matrix.length).toBe(systems.length)
    for (const row of matrix) {
      expect(row.length).toBe(workflows.length)
    }
  })

  it('scores match the friction rules', () => {
    const { workflows, systems, frictionRules } = getDefaultData()
    const matrix = buildFrictionMatrix(workflows, systems, frictionRules)

    // wf-mgmt-escalations (index 0) :: sys-sharepoint (index 0) = 0.85
    expect(matrix[0]![0]).toBe(0.85)
  })

  it('uses 0.5 default for unknown pairs', () => {
    const matrix = buildFrictionMatrix(
      [
        {
          id: 'wf-x',
          name: 'X',
          type: 'routine',
          description: '',
          owner: '',
          frequency: 'daily',
          linkedSystems: [],
        },
      ],
      [
        {
          id: 'sys-y',
          name: 'Y',
          category: 'storage',
          description: '',
          linkedWorkflows: [],
          linkedUsers: [],
        },
      ],
      {},
    )
    expect(matrix[0]![0]).toBe(0.5)
  })
})

describe('getFrictionBreakdown', () => {
  it('returns one entry per workflow-system pair', () => {
    const { workflows, systems, frictionRules } = getDefaultData()
    const breakdown = getFrictionBreakdown(workflows, systems, frictionRules)
    expect(breakdown.length).toBe(workflows.length * systems.length)
  })

  it('includes names and IDs', () => {
    const { workflows, systems, frictionRules } = getDefaultData()
    const breakdown = getFrictionBreakdown(workflows, systems, frictionRules)
    const first = breakdown[0]!
    expect(first.workflowId).toBeTruthy()
    expect(first.workflowName).toBeTruthy()
    expect(first.systemId).toBeTruthy()
    expect(first.systemName).toBeTruthy()
  })
})

describe('getHighFrictionPairs', () => {
  it('filters to pairs at or above threshold', () => {
    const { workflows, systems, frictionRules } = getDefaultData()
    const highPairs = getHighFrictionPairs(workflows, systems, frictionRules, 0.75)

    for (const pair of highPairs) {
      expect(pair.score).toBeGreaterThanOrEqual(0.75)
    }
    expect(highPairs.length).toBeGreaterThan(0)
  })

  it('uses 0.75 as default threshold', () => {
    const { workflows, systems, frictionRules } = getDefaultData()
    const highPairs = getHighFrictionPairs(workflows, systems, frictionRules)

    for (const pair of highPairs) {
      expect(pair.score).toBeGreaterThanOrEqual(0.75)
    }
  })
})
