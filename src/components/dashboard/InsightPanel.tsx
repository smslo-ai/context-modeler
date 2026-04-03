import { motion, useReducedMotion } from 'motion/react'
import { useApp } from '@/context/AppContext'
import { useOntology } from '@/hooks/useOntology'
import { LockedAiButton } from './LockedAiButton'
import { sanitizeHTML } from '@/utils/sanitize'

export function InsightPanel() {
  const { selectedNode } = useApp()
  const { workflows, systems, personas, contextMap } = useOntology()

  const prefersReduced = useReducedMotion()

  if (!selectedNode) return null

  const node =
    selectedNode.type === 'workflow'
      ? workflows.find((n) => n.id === selectedNode.id)
      : selectedNode.type === 'system'
        ? systems.find((n) => n.id === selectedNode.id)
        : personas.find((n) => n.id === selectedNode.id)

  if (!node) return null

  const connections = contextMap[selectedNode.id] ?? []

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
        <LockedAiButton label="Analyze Logic" className="bg-indigo-600/20" />
        <LockedAiButton label="Generate Prompt" className="bg-emerald-600/20" />
      </div>
    </motion.aside>
  )
}
