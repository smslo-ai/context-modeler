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
          {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- span wraps disabled button for tooltip keyboard access */}
          <span className="inline-flex" tabIndex={0}>
            <Button disabled variant="secondary" className={cn('gap-2', className)}>
              <Lock className="h-4 w-4" />
              {label}
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p>AI features coming soon</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
