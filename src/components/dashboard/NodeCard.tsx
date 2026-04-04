import { useApp } from '@/context/AppContext'
import { useSimulation } from '@/hooks/useSimulation'
import { Badge } from '@/components/ui/badge'
import type { Workflow, System, Persona, NodeType } from '@/types'
import { cn } from '@/utils/cn'
import { sanitizeHTML } from '@/utils/sanitize'

interface NodeCardProps {
  node: Workflow | System | Persona
  nodeType: NodeType
}

function getBadgeLabel(node: Workflow | System | Persona, nodeType: NodeType): string | null {
  if (nodeType === 'workflow') return (node as Workflow).frequency
  if (nodeType === 'system') return (node as System).category
  return null
}

export function NodeCard({ node, nodeType }: NodeCardProps) {
  const { selectedNode, dispatch } = useApp()
  const { getVisuals } = useSimulation()

  const isSelected = selectedNode?.id === node.id
  const visuals = getVisuals(node)
  const badgeLabel = getBadgeLabel(node, nodeType)

  function handleSelect() {
    dispatch({
      type: 'SELECT_NODE',
      payload: isSelected ? null : { id: node.id, type: nodeType },
    })
  }

  return (
    <button
      type="button"
      onClick={handleSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleSelect()
        }
      }}
      aria-pressed={isSelected}
      className={cn(
        'modern-box-sm w-full cursor-pointer border border-white/8 p-3 text-left transition-all hover:border-white/16 hover:shadow-lg',
        visuals.className,
        isSelected && 'ring-primary bg-surface-elevated/80 ring-2',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-foreground text-sm font-semibold">{sanitizeHTML(node.name)}</span>
        {badgeLabel && (
          <Badge variant="outline" className="shrink-0 text-[10px]">
            {badgeLabel}
          </Badge>
        )}
      </div>
      <p className="text-foreground-muted mt-1 text-xs">{sanitizeHTML(node.description)}</p>
    </button>
  )
}
