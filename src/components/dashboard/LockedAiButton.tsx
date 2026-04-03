import { Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/utils/cn'

interface LockedAiButtonProps {
  label: string
  className?: string
}

export function LockedAiButton({ label, className }: LockedAiButtonProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button disabled variant="secondary" className={cn('gap-2', className)}>
            <Lock className="h-4 w-4" />
            {label}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Coming in Phase 5</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
