import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface AboutModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AboutModal({ open, onOpenChange }: AboutModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground font-[family-name:var(--font-display)]">
            About Context Modeler
          </DialogTitle>
          <DialogDescription>A context-aware workplace modeling tool</DialogDescription>
        </DialogHeader>

        <div className="text-foreground-muted space-y-4 text-sm">
          <p>
            Context Modeler maps your workplace through three lenses —{' '}
            <span className="text-primary">Business Workflows</span>,{' '}
            <span className="text-secondary">Systems & Infrastructure</span>, and{' '}
            <span className="text-foreground">User Personas</span> — then visualizes how they
            interact and where friction lives.
          </p>

          <p>
            Built as a portfolio project demonstrating context engineering thinking: how the systems
            you use, the workflows you follow, and the roles you inhabit create (or destroy)
            productive flow.
          </p>

          <div className="bg-muted/30 rounded-xl p-3">
            <p className="text-foreground-subtle text-[10px] font-bold tracking-widest uppercase">
              Built with
            </p>
            <p className="text-foreground-muted mt-1">
              React 19 + TypeScript + Tailwind CSS v4 + Vite
            </p>
          </div>

          <p className="text-foreground-subtle text-xs">
            Created by Shane Slosar &middot;{' '}
            <a
              href="https://github.com/smslo-ai/context-modeler"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline-offset-2 hover:underline"
            >
              View on GitHub<span className="sr-only"> (opens in new tab)</span>
            </a>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
