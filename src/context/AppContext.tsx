import { createContext, useContext, useReducer, useMemo, type ReactNode } from 'react'
import type {
  OntologyData,
  Workflow,
  System,
  Persona,
  SimulationMode,
  SelectedNode,
  AppAction,
  ViewKey,
} from '../types'
import { getDefaultData } from '../data/defaults'

interface AppState {
  ontologyData: OntologyData
  currentView: ViewKey
  currentMode: SimulationMode
  selectedNode: SelectedNode | null
}

interface AppContextType extends AppState {
  dispatch: React.Dispatch<AppAction>
}

const AppContext = createContext<AppContextType | null>(null)

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_VIEW':
      return { ...state, currentView: action.payload }

    case 'SET_MODE':
      return { ...state, currentMode: action.payload }

    case 'SELECT_NODE':
      return { ...state, selectedNode: action.payload }

    case 'ADD_NODE': {
      const { nodeType, node } = action.payload
      const data = state.ontologyData

      switch (nodeType) {
        case 'workflow':
          return {
            ...state,
            ontologyData: { ...data, workflows: [...data.workflows, node as Workflow] },
          }
        case 'system':
          return { ...state, ontologyData: { ...data, systems: [...data.systems, node as System] } }
        case 'persona':
          return {
            ...state,
            ontologyData: { ...data, personas: [...data.personas, node as Persona] },
          }
      }
      break
    }

    case 'REMOVE_NODE': {
      const { id, nodeType } = action.payload
      const data = state.ontologyData

      const workflows =
        nodeType === 'workflow' ? data.workflows.filter((w) => w.id !== id) : data.workflows
      const systems = nodeType === 'system' ? data.systems.filter((s) => s.id !== id) : data.systems
      const personas =
        nodeType === 'persona' ? data.personas.filter((p) => p.id !== id) : data.personas

      const contextMap = Object.fromEntries(
        Object.entries(data.contextMap)
          .filter(([key]) => key !== id)
          .map(([key, targets]) => [key, targets.filter((t) => t !== id)]),
      )

      const frictionRules = Object.fromEntries(
        Object.entries(data.frictionRules).filter(
          ([key]) => !key.startsWith(id + '::') && !key.endsWith('::' + id),
        ),
      )

      const cleanedWorkflows = workflows.map((w) => ({
        ...w,
        linkedSystems: w.linkedSystems.filter((sid) => sid !== id),
      }))
      const cleanedSystems = systems.map((s) => ({
        ...s,
        linkedWorkflows: s.linkedWorkflows.filter((wid) => wid !== id),
        linkedUsers: s.linkedUsers.filter((uid) => uid !== id),
      }))

      const selectedNode = state.selectedNode?.id === id ? null : state.selectedNode

      return {
        ...state,
        selectedNode,
        ontologyData: {
          ...data,
          workflows: cleanedWorkflows,
          systems: cleanedSystems,
          personas,
          contextMap,
          frictionRules,
        },
      }
    }

    case 'RESET_DATA':
      return {
        ...state,
        ontologyData: action.payload?.ontologyData ?? getDefaultData(),
        selectedNode: null,
        currentMode: 'morning-triage',
      }

    case 'SET_ONTOLOGY_DATA':
      return { ...state, ontologyData: action.payload }
  }
}

interface AppProviderProps {
  children: ReactNode
  initialData?: OntologyData
}

export function AppProvider({ children, initialData }: AppProviderProps) {
  const [state, dispatch] = useReducer(appReducer, {
    ontologyData: initialData ?? getDefaultData(),
    currentView: 'dashboard',
    currentMode: 'morning-triage',
    selectedNode: null,
  })

  const value = useMemo(() => ({ ...state, dispatch }), [state])

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp(): AppContextType {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
