/**
 * Pure heuristic functions for the Context-Aware Workplace Modeler.
 *
 * RULES:
 *  - No DOM access.
 *  - No state mutation.
 *  - No side effects.
 *  - No imports from src/state/.
 *  - All functions operate on plain node objects and data passed as arguments.
 */

/**
 * Calculate the friction score for a workflow-system pair.
 *
 * Uses the frictionRules lookup table (keyed as "wf-id::sys-id").
 * Returns 0.5 as a neutral default for unknown pairs or invalid input.
 *
 * @param {{ id: string }} workflow
 * @param {{ id: string }} system
 * @param {Record<string, number>|null} frictionRules
 * @returns {number} 0.0 (no friction) → 1.0 (maximum friction)
 */
export function calculateFriction(workflow, system, frictionRules) {
  if (!workflow?.id || !system?.id) return 0.5
  const frictionLookupKey = `${workflow.id}::${system.id}`
  const rulesMap = frictionRules ?? {}
  return frictionLookupKey in rulesMap ? rulesMap[frictionLookupKey] : 0.5
}

/**
 * Map a friction score (0.0–1.0) to Tailwind CSS utility classes.
 *
 * Bands:
 *  0.00 – 0.34  low friction    → green
 *  0.35 – 0.54  moderate        → yellow
 *  0.55 – 0.74  elevated        → amber/orange
 *  0.75 – 1.00  high friction   → red
 *
 * @param {number} score
 * @returns {string} Tailwind class string
 */
export function getFrictionColor(score) {
  if (score >= 0.75) return 'bg-red-500 text-white'
  if (score >= 0.55) return 'bg-amber-400 text-amber-900'
  if (score >= 0.35) return 'bg-yellow-200 text-yellow-900'
  return 'bg-green-400 text-white'
}

/**
 * Derive the visual simulation state for a node under the active mode.
 *
 * Returns a descriptor object consumed by rendering code to apply
 * opacity, ring highlights, and Tailwind utility classes.
 *
 * @param {{ id: string }}              node
 * @param {string|null}                 mode       — active mode key, or null for normal view
 * @param {Record<string, { dimmed: string[], highlighted: string[] }>} modeRules
 * @returns {{ opacity: number, highlighted: boolean, dimmed: boolean, className: string }}
 */
export function getSimulationVisuals(node, mode, modeRules) {
  const DEFAULT_SIMULATION_VISUALS = { opacity: 1, highlighted: false, dimmed: false, className: '' }

  if (!mode || !node?.id) return DEFAULT_SIMULATION_VISUALS

  const activeSimulationRule = modeRules?.[mode]
  if (!activeSimulationRule) return DEFAULT_SIMULATION_VISUALS

  if (activeSimulationRule.dimmed?.includes(node.id)) {
    return { opacity: 0.3, highlighted: false, dimmed: true, className: 'opacity-30' }
  }
  if (activeSimulationRule.highlighted?.includes(node.id)) {
    return { opacity: 1, highlighted: true, dimmed: false, className: 'ring-2 ring-indigo-500' }
  }

  return DEFAULT_SIMULATION_VISUALS
}

/**
 * Build the full friction matrix for heatmap rendering.
 *
 * Orientation: matrix[systemIndex][workflowIndex] = frictionScore
 * Rows = systems, columns = workflows — matching standard heatmap layout.
 *
 * @param {{ id: string }[]}            workflows
 * @param {{ id: string }[]}            systems
 * @param {Record<string, number>}      frictionRules
 * @returns {number[][]}
 */
export function buildFrictionMatrix(workflows, systems, frictionRules) {
  return systems.map(system =>
    workflows.map(workflow => calculateFriction(workflow, system, frictionRules))
  )
}
