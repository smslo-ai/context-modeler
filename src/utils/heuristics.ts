import type { FrictionRules, ModeRules, SimulationVisuals } from '../types'

const DEFAULT_VISUALS: SimulationVisuals = {
  opacity: 1,
  highlighted: false,
  dimmed: false,
  className: '',
}

export function calculateFriction(
  workflow: { id: string },
  system: { id: string },
  frictionRules: FrictionRules | null,
): number {
  if (!workflow?.id || !system?.id) return 0.5
  const key = `${workflow.id}::${system.id}`
  const rules = frictionRules ?? {}
  return key in rules ? (rules[key] ?? 0.5) : 0.5
}

export function getFrictionColor(score: number): string {
  if (score >= 0.75) return 'bg-destructive/40 text-[#FF9B7A]'
  if (score >= 0.55) return 'bg-[rgba(212,120,74,0.35)] text-[#FFB88A]'
  if (score >= 0.35) return 'bg-primary/30 text-[#FFD09B]'
  return 'bg-secondary/30 text-[#5EECD8]'
}

export function getSimulationVisuals(
  node: { id: string },
  mode: string | null,
  modeRules: ModeRules | null,
): SimulationVisuals {
  if (!mode || !node?.id) return DEFAULT_VISUALS

  const rule = modeRules?.[mode]
  if (!rule) return DEFAULT_VISUALS

  if (rule.dimmed?.includes(node.id)) {
    return { opacity: 0.3, highlighted: false, dimmed: true, className: 'opacity-30' }
  }
  if (rule.highlighted?.includes(node.id)) {
    return {
      opacity: 1,
      highlighted: true,
      dimmed: false,
      className: 'ring-2 ring-primary',
    }
  }

  return DEFAULT_VISUALS
}
