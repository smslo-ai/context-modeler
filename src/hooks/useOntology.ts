import { useCallback, useEffect } from 'react'
import { useApp } from '@/context/AppContext'
import type { Workflow, System, Persona, NodeType } from '@/types'
import { localStorageAdapter } from '@/services/storage.service'

export function useOntology() {
  const { ontologyData, dispatch } = useApp()

  // Auto-save whenever ontologyData changes -- eliminates stale-closure bugs
  useEffect(() => {
    localStorageAdapter.save(ontologyData)
  }, [ontologyData])

  const addNode = useCallback(
    (nodeType: NodeType, node: Workflow | System | Persona) => {
      dispatch({ type: 'ADD_NODE', payload: { nodeType, node } })
    },
    [dispatch],
  )

  const removeNode = useCallback(
    (id: string, nodeType: NodeType) => {
      dispatch({ type: 'REMOVE_NODE', payload: { id, nodeType } })
    },
    [dispatch],
  )

  const resetData = useCallback(() => {
    dispatch({ type: 'RESET_DATA' })
  }, [dispatch])

  return {
    ontologyData,
    workflows: ontologyData.workflows,
    systems: ontologyData.systems,
    personas: ontologyData.personas,
    contextMap: ontologyData.contextMap,
    frictionRules: ontologyData.frictionRules,
    modeRules: ontologyData.modeRules,
    addNode,
    removeNode,
    resetData,
  }
}
