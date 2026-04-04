import type { NodeType } from '@/types'

export type AIFeature = 'node-analyzer' | 'friction-resolver' | 'prompt-generator'

export interface AIRequest {
  feature: AIFeature
  context: Record<string, unknown>
}

export interface AIResponse {
  content: string
  model: string
  usage: { input_tokens: number; output_tokens: number }
}

export interface RateLimitError {
  error: 'rate_limit'
  retryAfter: number
}

export interface NodeAnalysisContext {
  node: {
    id: string
    name: string
    type: NodeType
    description: string
    workflowType?: string
    owner?: string
    frequency?: string
    category?: string
    state?: string
  }
  connections: Array<{
    id: string
    name: string
    type: NodeType
    description: string
  }>
  frictionProfile: Array<{
    pairedNodeId: string
    pairedNodeName: string
    score: number
  }>
  highFrictionPairs: Array<{
    workflowName: string
    systemName: string
    score: number
  }>
  modeBehavior: Array<{
    mode: string
    status: 'highlighted' | 'dimmed' | 'neutral'
  }>
  connectionDensity: {
    count: number
    average: number
  }
}

export interface FrictionContext {
  workflow: {
    id: string
    name: string
    type: string
    description: string
    owner: string
    frequency: string
  }
  system: {
    id: string
    name: string
    category: string
    description: string
  }
  score: number
  tier: string
  comparativeWorkflowScores: Array<{ systemName: string; score: number }>
  comparativeSystemScores: Array<{ workflowName: string; score: number }>
  affectedPersonas: Array<{ name: string; state: string }>
  modeOverlap: Array<{
    mode: string
    workflowStatus: string
    systemStatus: string
  }>
}

export interface PromptGenContext {
  workflow: {
    id: string
    name: string
    type: string
    description: string
    owner: string
    frequency: string
  }
  connectedSystems: Array<{
    name: string
    category: string
    description: string
  }>
  connectedPersonas: Array<{
    name: string
    state: string
    description: string
  }>
  modeRules: Record<string, { dimmed: string[]; highlighted: string[] }>
  frictionHotspots: Array<{ systemName: string; score: number }>
}
