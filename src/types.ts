// Node types

export interface Workflow {
  id: string
  name: string
  type: 'critical' | 'routine' | 'operational' | 'strategic'
  description: string
  owner: string
  frequency: 'ad-hoc' | 'daily' | 'weekly' | 'monthly' | 'quarterly'
  linkedSystems: string[]
}

export interface System {
  id: string
  name: string
  category: 'storage' | 'comms' | 'intelligence' | 'tracking' | 'reporting'
  description: string
  linkedWorkflows: string[]
  linkedUsers: string[]
}

export interface Persona {
  id: string
  name: string
  state: string
  description: string
}

// Relationship maps

/** Adjacency list: node ID -> array of connected node IDs */
export type ContextMap = Record<string, string[]>

/** Friction scores keyed by "workflowId::systemId" -> 0.0 to 1.0 */
export type FrictionRules = Record<string, number>

/** Simulation mode rules: which nodes to dim or highlight */
export interface ModeRule {
  dimmed: string[]
  highlighted: string[]
}

export type ModeRules = Record<string, ModeRule>

// Composite data

export interface OntologyData {
  workflows: Workflow[]
  systems: System[]
  personas: Persona[]
  contextMap: ContextMap
  frictionRules: FrictionRules
  modeRules: ModeRules
}

// App state

export type SimulationMode = 'morning-triage' | 'deep-focus' | 'firefighting'
export type NodeType = 'workflow' | 'system' | 'persona'
export type ViewKey = 'dashboard' | 'input-studio'

export interface SelectedNode {
  id: string
  type: NodeType
}

// Reducer actions

export type AppAction =
  | { type: 'SET_VIEW'; payload: ViewKey }
  | { type: 'SET_MODE'; payload: SimulationMode }
  | { type: 'SELECT_NODE'; payload: SelectedNode | null }
  | { type: 'ADD_NODE'; payload: { nodeType: NodeType; node: Workflow | System | Persona } }
  | { type: 'REMOVE_NODE'; payload: { id: string; nodeType: NodeType } }
  | { type: 'RESET_DATA'; payload?: { ontologyData: OntologyData } }
  | { type: 'SET_ONTOLOGY_DATA'; payload: OntologyData }

// Simulation visuals

export interface SimulationVisuals {
  opacity: number
  highlighted: boolean
  dimmed: boolean
  className: string
}
