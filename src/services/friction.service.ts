import type { Workflow, System, FrictionRules } from '../types'
import { calculateFriction } from '../utils/heuristics'

export function buildFrictionMatrix(
  workflows: Workflow[],
  systems: System[],
  frictionRules: FrictionRules,
): number[][] {
  return systems.map((system) =>
    workflows.map((wf) => calculateFriction(wf, system, frictionRules)),
  )
}

export interface FrictionBreakdown {
  workflowId: string
  workflowName: string
  systemId: string
  systemName: string
  score: number
}

export function getFrictionBreakdown(
  workflows: Workflow[],
  systems: System[],
  frictionRules: FrictionRules,
): FrictionBreakdown[] {
  const breakdown: FrictionBreakdown[] = []

  for (const wf of workflows) {
    for (const sys of systems) {
      breakdown.push({
        workflowId: wf.id,
        workflowName: wf.name,
        systemId: sys.id,
        systemName: sys.name,
        score: calculateFriction(wf, sys, frictionRules),
      })
    }
  }

  return breakdown
}

export function getHighFrictionPairs(
  workflows: Workflow[],
  systems: System[],
  frictionRules: FrictionRules,
  threshold = 0.75,
): FrictionBreakdown[] {
  return getFrictionBreakdown(workflows, systems, frictionRules).filter(
    (pair) => pair.score >= threshold,
  )
}
