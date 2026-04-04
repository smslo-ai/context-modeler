import { getFrictionColor } from '@/utils/heuristics'
import { cn } from '@/utils/cn'

interface HeatmapCellProps {
  score: number
  workflowId: string
  workflowName: string
  systemId: string
  systemName: string
  onClick: () => void
}

export function HeatmapCell({
  score,
  workflowId,
  workflowName,
  systemId,
  systemName,
  onClick,
}: HeatmapCellProps) {
  return (
    <td className={getFrictionColor(score)}>
      <button
        type="button"
        data-workflow={workflowId}
        data-system={systemId}
        aria-label={`${workflowName} and ${systemName}: ${Math.round(score * 100)}% friction`}
        onClick={onClick}
        className={cn(
          'h-full w-full cursor-pointer px-2 py-3 text-center text-xs font-semibold transition-all',
          'hover:scale-[1.03] hover:brightness-125',
          'focus-visible:outline-primary focus-visible:outline-2 focus-visible:outline-offset-2',
        )}
      >
        {Math.round(score * 100)}
      </button>
    </td>
  )
}
