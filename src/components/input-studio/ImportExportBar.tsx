import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useApp } from '@/context/AppContext'
import { useOntology } from '@/hooks/useOntology'
import { validateOntologyData } from '@/services/storage.service'
import type { OntologyData } from '@/types'

export function ImportExportBar() {
  const { dispatch } = useApp()
  const { ontologyData, resetData } = useOntology()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [resetDialogOpen, setResetDialogOpen] = useState(false)

  function handleExport() {
    const json = JSON.stringify(ontologyData, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `context-modeler-export-${Date.now()}.json`
    anchor.click()
    URL.revokeObjectURL(url)
    toast.success('Data exported')
  }

  function handleImportClick() {
    fileInputRef.current?.click()
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const parsed: unknown = JSON.parse(e.target?.result as string)
        if (!validateOntologyData(parsed)) {
          toast.error('Invalid data format. Check the JSON structure.')
          return
        }
        dispatch({ type: 'SET_ONTOLOGY_DATA', payload: parsed as OntologyData })
        toast.success('Data imported')
      } catch {
        toast.error('Failed to parse JSON file')
      } finally {
        // Reset so the same file can be re-imported
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      }
    }
    reader.readAsText(file)
  }

  function handleConfirmReset() {
    resetData()
    setResetDialogOpen(false)
    toast.success('Data reset to defaults')
  }

  function handleCancelReset() {
    setResetDialogOpen(false)
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={handleExport}>
        Export JSON
      </Button>

      <Button variant="outline" size="sm" onClick={handleImportClick}>
        Import JSON
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleFileChange}
        aria-hidden="true"
      />

      <Button
        variant="outline"
        size="sm"
        className="text-destructive hover:text-destructive-hover"
        onClick={() => setResetDialogOpen(true)}
      >
        Reset to Defaults
      </Button>

      <Dialog open={resetDialogOpen} onOpenChange={(open) => !open && handleCancelReset()}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Reset to defaults?</DialogTitle>
            <DialogDescription>
              This will replace all current data with the default dataset. This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelReset}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmReset}>
              Confirm reset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
