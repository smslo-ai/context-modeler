import { useEffect } from 'react'
import { Zap } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAI } from '@/hooks/useAI'
import { AIResponse } from './AIResponse'
import { getFrictionColor } from '@/utils/heuristics'
import { cn } from '@/utils/cn'
import type { Workflow, System } from '@/types'

interface FrictionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  workflow: Workflow | null
  system: System | null
  score: number
}

function getFrictionLabel(score: number): string {
  if (score >= 0.75) return 'High'
  if (score >= 0.55) return 'Elevated'
  if (score >= 0.35) return 'Moderate'
  return 'Low'
}

export function FrictionModal({ open, onOpenChange, workflow, system, score }: FrictionModalProps) {
  const { resolveFriction, result, loading, error, reset } = useAI()

  useEffect(() => {
    if (!open) reset()
  }, [open, reset])

  const workflowName = workflow?.name ?? ''
  const systemName = system?.name ?? ''

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
        <AIResponse
          result={result}
          loading={loading}
          error={error}
          onRetry={() => {
            if (workflow && system) resolveFriction(workflow, system, score)
          }}
        />
        <DialogFooter>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              if (workflow && system) resolveFriction(workflow, system, score)
            }}
            disabled={loading || !workflow || !system}
          >
            <Zap className="mr-1.5 h-3.5 w-3.5" />
            {loading ? 'Resolving...' : 'Resolve & Assign Friction'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
