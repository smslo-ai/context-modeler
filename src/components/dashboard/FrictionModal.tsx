import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { LockedAiButton } from './LockedAiButton'
import { getFrictionColor } from '@/utils/heuristics'
import { cn } from '@/utils/cn'

interface FrictionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  workflowName: string
  systemName: string
  score: number
}

function getFrictionLabel(score: number): string {
  if (score >= 0.75) return 'High'
  if (score >= 0.55) return 'Elevated'
  if (score >= 0.35) return 'Moderate'
  return 'Low'
}

export function FrictionModal({
  open,
  onOpenChange,
  workflowName,
  systemName,
  score,
}: FrictionModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Friction Detail</DialogTitle>
          <DialogDescription>
            {workflowName} + {systemName}
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-3 py-4">
          <span className="text-foreground text-3xl font-bold">{Math.round(score * 100)}%</span>
          <Badge className={cn('text-xs', getFrictionColor(score))}>
            {getFrictionLabel(score)}
          </Badge>
        </div>
        <DialogFooter>
          <LockedAiButton label="Resolve & Assign Friction" />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
