import { useCallback } from 'react'
import { useApp } from '../context/AppContext'
import type { SimulationMode, SimulationVisuals } from '../types'
import { getSimulationVisuals } from '../utils/heuristics'

export function useSimulation() {
  const { currentMode, ontologyData, dispatch } = useApp()

  const setMode = useCallback(
    (mode: SimulationMode) => {
      dispatch({ type: 'SET_MODE', payload: mode })
    },
    [dispatch],
  )

  const getVisuals = useCallback(
    (node: { id: string }): SimulationVisuals => {
      return getSimulationVisuals(node, currentMode, ontologyData.modeRules)
    },
    [currentMode, ontologyData.modeRules],
  )

  return { currentMode, setMode, getVisuals }
}
