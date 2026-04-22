import { useState, useCallback } from 'react'
import { useOntology } from '@/hooks/useOntology'
import type { Workflow, System, Persona, NodeType } from '@/types'
import * as aiService from '@/services/ai.service'

export function useAI() {
  const { ontologyData } = useOntology()
  const [result, setResult] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const analyzeNode = useCallback(
    async (node: Workflow | System | Persona, type: NodeType) => {
      setLoading(true)
      setError(null)
      setResult(null)
      try {
        const context = aiService.buildNodeContext(node.id, type, ontologyData)
        const content = await aiService.analyzeNode(context)
        setResult(content)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unexpected error occurred')
      } finally {
        setLoading(false)
      }
    },
    [ontologyData],
  )

  const generatePrompt = useCallback(
    async (workflow: Workflow) => {
      setLoading(true)
      setError(null)
      setResult(null)
      try {
        const context = aiService.buildPromptGenContext(workflow, ontologyData)
        const content = await aiService.generatePrompt(context)
        setResult(content)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unexpected error occurred')
      } finally {
        setLoading(false)
      }
    },
    [ontologyData],
  )

  const resolveFriction = useCallback(
    async (workflow: Workflow, system: System, score: number) => {
      setLoading(true)
      setError(null)
      setResult(null)
      try {
        const context = aiService.buildFrictionContext(workflow, system, score, ontologyData)
        const content = await aiService.resolveFriction(context)
        setResult(content)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unexpected error occurred')
      } finally {
        setLoading(false)
      }
    },
    [ontologyData],
  )

  const reset = useCallback(() => {
    setResult(null)
    setLoading(false)
    setError(null)
  }, [])

  return { analyzeNode, generatePrompt, resolveFriction, result, loading, error, reset }
}
