import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface NodeListItem {
  id: string
  name: string
  description: string
}

interface NodeListProps {
  nodes: NodeListItem[]
  onDelete: (id: string) => void
}

export function NodeList({ nodes, onDelete }: NodeListProps) {
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)

  function handleDeleteClick(id: string) {
    setPendingDeleteId(id)
  }

  function handleConfirm() {
    if (pendingDeleteId !== null) {
      onDelete(pendingDeleteId)
    }
    setPendingDeleteId(null)
  }

  function handleCancel() {
    setPendingDeleteId(null)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-foreground-muted text-sm font-medium">Nodes</span>
        <Badge variant="secondary">{nodes.length}</Badge>
      </div>

      {nodes.length === 0 ? (
        <p className="text-foreground-subtle text-sm">No nodes yet. Add one above.</p>
      ) : (
        <ul className="space-y-2">
          {nodes.map((node) => (
            <li key={node.id} className="modern-box-sm flex items-start justify-between gap-3 p-3">
              <div className="min-w-0">
                <p className="text-foreground text-sm font-semibold">{node.name}</p>
                <p className="text-foreground-muted mt-0.5 text-xs">{node.description}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive-hover shrink-0"
                onClick={() => handleDeleteClick(node.id)}
              >
                Delete
              </Button>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={pendingDeleteId !== null} onOpenChange={(open) => !open && handleCancel()}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Delete node?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. The node and its connections will be removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirm}>
              Confirm delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
