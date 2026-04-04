import { useEffect } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { Sparkles, FileCode } from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { useOntology } from '@/hooks/useOntology'
import { useAI } from '@/hooks/useAI'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { AIResponse } from './AIResponse'
import { sanitizeHTML } from '@/utils/sanitize'
import type { Workflow } from '@/types'

export function InsightPanel() {
  const { selectedNode } = useApp()
  const { workflows, systems, personas, contextMap } = useOntology()
  const { analyzeNode, generatePrompt, result, loading, error, reset } = useAI()

  const prefersReduced = useReducedMotion()

  useEffect(() => {
    reset()
  }, [selectedNode, reset])

  if (!selectedNode) return null

  const node =
    selectedNode.type === 'workflow'
      ? workflows.find((n) => n.id === selectedNode.id)
      : selectedNode.type === 'system'
        ? systems.find((n) => n.id === selectedNode.id)
        : personas.find((n) => n.id === selectedNode.id)

  if (!node) return null

  const connections = contextMap[selectedNode.id] ?? []
  const isWorkflow = selectedNode.type === 'workflow'

  return (
    <motion.aside
      initial={prefersReduced ? undefined : { opacity: 0, y: 10 }}
      animate={prefersReduced ? undefined : { opacity: 1, y: 0 }}
      transition={prefersReduced ? undefined : { duration: 0.3 }}
      aria-live="polite"
      aria-label="Node details"
      className="modern-box mt-6 p-6"
    >
      <h3 className="text-foreground font-[family-name:var(--font-display)] text-lg font-bold">
        {sanitizeHTML(node.name)}
      </h3>
      <p className="text-foreground-muted mt-1 text-sm">
        {connections.length} connection{connections.length !== 1 ? 's' : ''} in context map
      </p>
      <p className="text-foreground-muted mt-1 text-xs">{sanitizeHTML(node.description)}</p>
      <p className="text-accent mt-3 text-xs font-semibold">
        AI agent recommended for deeper analysis
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          variant="secondary"
          size="sm"
          className="bg-indigo-600/20 hover:bg-indigo-600/30"
          onClick={() => analyzeNode(node, selectedNode.type)}
          disabled={loading}
        >
          <Sparkles className="mr-1.5 h-3.5 w-3.5" />
          {loading ? 'Analyzing...' : 'Analyze Logic'}
        </Button>
        {isWorkflow ? (
          <Button
            variant="secondary"
            size="sm"
            className="bg-emerald-600/20 hover:bg-emerald-600/30"
            onClick={() => generatePrompt(node as Workflow)}
            disabled={loading}
          >
            <FileCode className="mr-1.5 h-3.5 w-3.5" />
            Generate Prompt
          </Button>
        ) : (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="bg-emerald-600/20 hover:bg-emerald-600/30"
                    disabled
                  >
                    <FileCode className="mr-1.5 h-3.5 w-3.5" />
                    Generate Prompt
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>Only available for workflows</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      <AIResponse
        result={result}
        loading={loading}
        error={error}
        onRetry={() => analyzeNode(node, selectedNode.type)}
        variant={result?.trimStart().startsWith('{') ? 'json' : 'markdown'}
      />
    </motion.aside>
  )
}
