import type { OntologyData, NodeType, Workflow, System } from '@/types'
import type {
  NodeAnalysisContext,
  FrictionContext,
  PromptGenContext,
  AIResponse,
} from '@/services/ai.types'
import { calculateFriction } from '@/utils/heuristics'
import { getHighFrictionPairs } from '@/services/friction.service'

function resolveNodeType(id: string): NodeType {
  if (id.startsWith('wf-')) return 'workflow'
  if (id.startsWith('sys-')) return 'system'
  return 'persona'
}

function resolveNode(
  id: string,
  data: OntologyData,
): { id: string; name: string; type: NodeType; description: string } | undefined {
  const type = resolveNodeType(id)
  const arrays = { workflow: data.workflows, system: data.systems, persona: data.personas } as const
  const node = arrays[type].find((n) => n.id === id)
  if (!node) return undefined
  return { id: node.id, name: node.name, type, description: node.description }
}

function getModeBehavior(
  nodeId: string,
  modeRules: OntologyData['modeRules'],
): NodeAnalysisContext['modeBehavior'] {
  return Object.entries(modeRules).map(([mode, rule]) => {
    if (rule.highlighted.includes(nodeId)) return { mode, status: 'highlighted' as const }
    if (rule.dimmed.includes(nodeId)) return { mode, status: 'dimmed' as const }
    return { mode, status: 'neutral' as const }
  })
}

function getModeStatus(nodeId: string, rule: { dimmed: string[]; highlighted: string[] }): string {
  if (rule.highlighted.includes(nodeId)) return 'highlighted'
  if (rule.dimmed.includes(nodeId)) return 'dimmed'
  return 'neutral'
}

function getFrictionTier(score: number): string {
  if (score >= 0.75) return 'High'
  if (score >= 0.55) return 'Elevated'
  if (score >= 0.35) return 'Moderate'
  return 'Low'
}

export function buildNodeContext(
  nodeId: string,
  nodeType: NodeType,
  data: OntologyData,
): NodeAnalysisContext {
  const { workflows, systems, personas, contextMap, frictionRules, modeRules } = data

  const arrays = { workflow: workflows, system: systems, persona: personas } as const
  const raw = arrays[nodeType].find((n) => n.id === nodeId)
  if (!raw) throw new Error(`Node not found: ${nodeId}`)

  const nodeInfo: NodeAnalysisContext['node'] = {
    id: raw.id,
    name: raw.name,
    type: nodeType,
    description: raw.description,
  }

  if (nodeType === 'workflow') {
    const wf = raw as Workflow
    nodeInfo.workflowType = wf.type
    nodeInfo.owner = wf.owner
    nodeInfo.frequency = wf.frequency
  } else if (nodeType === 'system') {
    nodeInfo.category = (raw as System).category
  } else {
    nodeInfo.state = (raw as { state: string }).state
  }

  const connectionIds = contextMap[nodeId] ?? []
  const connections = connectionIds
    .map((id) => resolveNode(id, data))
    .filter((c): c is NonNullable<typeof c> => c !== undefined)

  let frictionProfile: NodeAnalysisContext['frictionProfile'] = []
  if (nodeType === 'workflow') {
    frictionProfile = systems.map((sys) => ({
      pairedNodeId: sys.id,
      pairedNodeName: sys.name,
      score: calculateFriction({ id: nodeId }, sys, frictionRules),
    }))
  } else if (nodeType === 'system') {
    frictionProfile = workflows.map((wf) => ({
      pairedNodeId: wf.id,
      pairedNodeName: wf.name,
      score: calculateFriction(wf, { id: nodeId }, frictionRules),
    }))
  }

  const allHighFriction = getHighFrictionPairs(workflows, systems, frictionRules)
  const highFrictionPairs = allHighFriction
    .filter((pair) => pair.workflowId === nodeId || pair.systemId === nodeId)
    .map((pair) => ({
      workflowName: pair.workflowName,
      systemName: pair.systemName,
      score: pair.score,
    }))

  const modeBehavior = getModeBehavior(nodeId, modeRules)

  const sameTypeNodes = arrays[nodeType]
  const totalConnections = sameTypeNodes.reduce(
    (sum, n) => sum + (contextMap[n.id]?.length ?? 0),
    0,
  )
  const average = sameTypeNodes.length > 0 ? totalConnections / sameTypeNodes.length : 0

  return {
    node: nodeInfo,
    connections,
    frictionProfile,
    highFrictionPairs,
    modeBehavior,
    connectionDensity: {
      count: connectionIds.length,
      average,
    },
  }
}

export function buildFrictionContext(
  workflow: Workflow,
  system: System,
  score: number,
  data: OntologyData,
): FrictionContext {
  const { workflows, systems, contextMap, frictionRules, modeRules } = data

  const comparativeWorkflowScores = systems
    .filter((s) => s.id !== system.id)
    .map((s) => ({
      systemName: s.name,
      score: calculateFriction(workflow, s, frictionRules),
    }))

  const comparativeSystemScores = workflows
    .filter((w) => w.id !== workflow.id)
    .map((w) => ({
      workflowName: w.name,
      score: calculateFriction(w, system, frictionRules),
    }))

  const workflowConnections = new Set(contextMap[workflow.id] ?? [])
  const systemConnections = new Set(contextMap[system.id] ?? [])
  const affectedPersonas = data.personas
    .filter((p) => workflowConnections.has(p.id) || systemConnections.has(p.id))
    .map((p) => ({ name: p.name, state: p.state }))

  const modeOverlap = Object.entries(modeRules).map(([mode, rule]) => ({
    mode,
    workflowStatus: getModeStatus(workflow.id, rule),
    systemStatus: getModeStatus(system.id, rule),
  }))

  return {
    workflow: {
      id: workflow.id,
      name: workflow.name,
      type: workflow.type,
      description: workflow.description,
      owner: workflow.owner,
      frequency: workflow.frequency,
    },
    system: {
      id: system.id,
      name: system.name,
      category: system.category,
      description: system.description,
    },
    score,
    tier: getFrictionTier(score),
    comparativeWorkflowScores,
    comparativeSystemScores,
    affectedPersonas,
    modeOverlap,
  }
}

export function buildPromptGenContext(workflow: Workflow, data: OntologyData): PromptGenContext {
  const { contextMap, frictionRules, modeRules, systems, personas } = data

  const connectionIds = contextMap[workflow.id] ?? []

  const connectedSystems = connectionIds
    .filter((id) => id.startsWith('sys-'))
    .map((id) => systems.find((s) => s.id === id))
    .filter((s): s is System => s !== undefined)
    .map((s) => ({ name: s.name, category: s.category, description: s.description }))

  // Personas connected directly or via linked systems
  const directPersonaIds = new Set(connectionIds.filter((id) => id.startsWith('usr-')))
  const systemPersonaIds = new Set(
    connectionIds
      .filter((id) => id.startsWith('sys-'))
      .flatMap((sysId) => (contextMap[sysId] ?? []).filter((id) => id.startsWith('usr-'))),
  )
  const allPersonaIds = new Set([...directPersonaIds, ...systemPersonaIds])

  const connectedPersonas = personas
    .filter((p) => allPersonaIds.has(p.id))
    .map((p) => ({ name: p.name, state: p.state, description: p.description }))

  const frictionHotspots = systems
    .map((s) => ({
      systemName: s.name,
      score: calculateFriction(workflow, s, frictionRules),
    }))
    .sort((a, b) => b.score - a.score)

  return {
    workflow: {
      id: workflow.id,
      name: workflow.name,
      type: workflow.type,
      description: workflow.description,
      owner: workflow.owner,
      frequency: workflow.frequency,
    },
    connectedSystems,
    connectedPersonas,
    modeRules,
    frictionHotspots,
  }
}

async function callAI(feature: string, context: Record<string, unknown>): Promise<string> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10_000)

  try {
    const response = await fetch(`${import.meta.env.VITE_AI_PROXY_URL}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ feature, context }),
      signal: controller.signal,
    })

    if (response.status === 429) {
      const body = (await response.json()) as { retryAfter?: number }
      throw new Error(`Rate limited. Try again in ${body.retryAfter ?? 60} seconds.`)
    }

    if (!response.ok) {
      const body = (await response.json().catch(() => ({ error: 'Unknown error' }))) as {
        error?: string
      }
      throw new Error(body.error ?? `Request failed with status ${response.status}`)
    }

    const data = (await response.json()) as AIResponse
    return data.content
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error('Request timed out. Please try again.')
    }
    throw err
  } finally {
    clearTimeout(timeout)
  }
}

export async function analyzeNode(context: NodeAnalysisContext): Promise<string> {
  return callAI('node-analyzer', context as unknown as Record<string, unknown>)
}

export async function resolveFriction(context: FrictionContext): Promise<string> {
  return callAI('friction-resolver', context as unknown as Record<string, unknown>)
}

export async function generatePrompt(context: PromptGenContext): Promise<string> {
  return callAI('prompt-generator', context as unknown as Record<string, unknown>)
}
