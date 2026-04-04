# Phase 5: Input Studio View Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Input Studio view -- a 3-tab form (Workflows, Systems, Users) with add/delete, JSON export/import, and data reset.

**Architecture:** Three form components share a common validation utility. Each form dispatches through the existing `useOntology` hook (ADD_NODE action). Node ID generation uses slugified names with prefix (`wf-`, `sys-`, `usr-`). Export/import serialize `OntologyData` to JSON. Reset dispatches `RESET_DATA`. No new state management -- all actions flow through the existing `AppContext` reducer. No form library -- plain controlled inputs with local `useState`.

**Tech Stack:** React 19, TypeScript (strict), shadcn/ui (Tabs, Dialog, Button, Badge), Sonner toasts, Framer Motion, Vitest + Testing Library

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/utils/form-validation.ts` | Create | Validate & slugify node form inputs; generate unique IDs |
| `src/utils/form-validation.test.ts` | Create | Tests for validation + slug + ID generation |
| `src/components/input-studio/InputStudio.tsx` | Create | Tab container, header banner, export/import/reset buttons |
| `src/components/input-studio/WorkflowForm.tsx` | Create | Add-workflow form with system link checkboxes |
| `src/components/input-studio/SystemForm.tsx` | Create | Add-system form with workflow/user link checkboxes |
| `src/components/input-studio/PersonaForm.tsx` | Create | Add-persona form |
| `src/components/input-studio/NodeList.tsx` | Create | Existing-node list with delete buttons (shared across tabs) |
| `src/components/input-studio/NodeList.test.tsx` | Create | Tests for node rendering and delete confirmation |
| `src/components/input-studio/ImportExportBar.tsx` | Create | Export JSON download + import file picker + reset button |
| `src/components/input-studio/ImportExportBar.test.tsx` | Create | Round-trip export/import tests |
| `src/components/input-studio/InputStudio.test.tsx` | Create | Tab switching + integration tests |
| `src/App.tsx` | Modify | Replace `InputStudioPlaceholder` with `InputStudio` import |
| `src/services/storage.service.ts` | Read-only | Reuse `validateOntologyData` for import validation |

---

## Task 1: Form Validation Utility

**Files:**
- Create: `src/utils/form-validation.ts`
- Create: `src/utils/form-validation.test.ts`

- [ ] **Step 1: Write failing tests for `slugify`**

```typescript
// src/utils/form-validation.test.ts
import { describe, it, expect } from 'vitest'
import { slugify, generateNodeId, validateNodeName, validateDescription } from './form-validation'

describe('slugify', () => {
  it('converts name to kebab-case', () => {
    expect(slugify('Q3 Financial Reporting')).toBe('q3-financial-reporting')
  })

  it('strips non-alphanumeric characters', () => {
    expect(slugify('Hello! World? #123')).toBe('hello-world-123')
  })

  it('collapses multiple hyphens', () => {
    expect(slugify('too   many   spaces')).toBe('too-many-spaces')
  })

  it('trims leading and trailing hyphens', () => {
    expect(slugify('--leading-and-trailing--')).toBe('leading-and-trailing')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest src/utils/form-validation.test.ts --run`
Expected: FAIL -- module not found

- [ ] **Step 3: Implement `slugify`**

```typescript
// src/utils/form-validation.ts

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest src/utils/form-validation.test.ts --run`
Expected: 4 PASS

- [ ] **Step 5: Write failing tests for `generateNodeId`**

Add to the same test file:

```typescript
describe('generateNodeId', () => {
  it('prefixes workflow IDs with wf-', () => {
    expect(generateNodeId('workflow', 'Monthly Close', [])).toBe('wf-monthly-close')
  })

  it('prefixes system IDs with sys-', () => {
    expect(generateNodeId('system', 'Jira', [])).toBe('sys-jira')
  })

  it('prefixes persona IDs with usr-', () => {
    expect(generateNodeId('persona', 'New Hire', [])).toBe('usr-new-hire')
  })

  it('appends counter when ID already exists', () => {
    expect(generateNodeId('workflow', 'Close', ['wf-close'])).toBe('wf-close-2')
  })

  it('increments counter until unique', () => {
    expect(generateNodeId('workflow', 'Close', ['wf-close', 'wf-close-2'])).toBe('wf-close-3')
  })
})
```

- [ ] **Step 6: Implement `generateNodeId`**

Add to `src/utils/form-validation.ts`:

```typescript
import type { NodeType } from '@/types'

const PREFIX: Record<NodeType, string> = {
  workflow: 'wf',
  system: 'sys',
  persona: 'usr',
}

export function generateNodeId(
  nodeType: NodeType,
  name: string,
  existingIds: string[],
): string {
  const base = `${PREFIX[nodeType]}-${slugify(name)}`
  if (!existingIds.includes(base)) return base
  let counter = 2
  while (existingIds.includes(`${base}-${counter}`)) counter++
  return `${base}-${counter}`
}
```

- [ ] **Step 7: Run tests -- expect 9 PASS**

Run: `npx vitest src/utils/form-validation.test.ts --run`

- [ ] **Step 8: Write failing tests for `validateNodeName` and `validateDescription`**

```typescript
describe('validateNodeName', () => {
  it('returns error for empty string', () => {
    expect(validateNodeName('')).toBe('Name is required')
  })

  it('returns error for whitespace-only', () => {
    expect(validateNodeName('   ')).toBe('Name is required')
  })

  it('returns error for names over 100 chars', () => {
    expect(validateNodeName('a'.repeat(101))).toBe('Name must be 100 characters or fewer')
  })

  it('returns null for valid name', () => {
    expect(validateNodeName('Valid Name')).toBeNull()
  })
})

describe('validateDescription', () => {
  it('returns null for empty string (optional field)', () => {
    expect(validateDescription('')).toBeNull()
  })

  it('returns error for descriptions over 500 chars', () => {
    expect(validateDescription('a'.repeat(501))).toBe('Description must be 500 characters or fewer')
  })

  it('returns null for valid description', () => {
    expect(validateDescription('A short description.')).toBeNull()
  })
})
```

- [ ] **Step 9: Implement validation functions**

Add to `src/utils/form-validation.ts`:

```typescript
export function validateNodeName(name: string): string | null {
  const trimmed = name.trim()
  if (!trimmed) return 'Name is required'
  if (trimmed.length > 100) return 'Name must be 100 characters or fewer'
  return null
}

export function validateDescription(description: string): string | null {
  if (description.length > 500) return 'Description must be 500 characters or fewer'
  return null
}
```

- [ ] **Step 10: Run all validation tests -- expect 16 PASS**

Run: `npx vitest src/utils/form-validation.test.ts --run`

- [ ] **Step 11: Commit**

```bash
git add src/utils/form-validation.ts src/utils/form-validation.test.ts
git commit -m "feat: add form validation utility with slugify and ID generation"
```

---

## Task 2: NodeList Component (shared delete UI)

**Files:**
- Create: `src/components/input-studio/NodeList.tsx`
- Create: `src/components/input-studio/NodeList.test.tsx`

- [ ] **Step 1: Write failing tests**

```typescript
// src/components/input-studio/NodeList.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { NodeList } from './NodeList'

const mockNodes = [
  { id: 'wf-test-1', name: 'Test Workflow 1', description: 'Desc 1' },
  { id: 'wf-test-2', name: 'Test Workflow 2', description: 'Desc 2' },
]

describe('NodeList', () => {
  it('renders each node name', () => {
    render(<NodeList nodes={mockNodes} onDelete={vi.fn()} />)
    expect(screen.getByText('Test Workflow 1')).toBeInTheDocument()
    expect(screen.getByText('Test Workflow 2')).toBeInTheDocument()
  })

  it('shows node count', () => {
    render(<NodeList nodes={mockNodes} onDelete={vi.fn()} />)
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('calls onDelete with node id after confirmation', async () => {
    const onDelete = vi.fn()
    const user = userEvent.setup()
    render(<NodeList nodes={mockNodes} onDelete={onDelete} />)

    const deleteButtons = screen.getAllByRole('button', { name: /delete/i })
    await user.click(deleteButtons[0]!)

    // Confirm dialog appears
    const confirmButton = screen.getByRole('button', { name: /confirm/i })
    await user.click(confirmButton)

    expect(onDelete).toHaveBeenCalledWith('wf-test-1')
  })

  it('does not call onDelete when cancelled', async () => {
    const onDelete = vi.fn()
    const user = userEvent.setup()
    render(<NodeList nodes={mockNodes} onDelete={onDelete} />)

    const deleteButtons = screen.getAllByRole('button', { name: /delete/i })
    await user.click(deleteButtons[0]!)

    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    await user.click(cancelButton)

    expect(onDelete).not.toHaveBeenCalled()
  })

  it('renders empty state when no nodes', () => {
    render(<NodeList nodes={[]} onDelete={vi.fn()} />)
    expect(screen.getByText(/no nodes yet/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest src/components/input-studio/NodeList.test.tsx --run`
Expected: FAIL -- module not found

- [ ] **Step 3: Implement NodeList**

```typescript
// src/components/input-studio/NodeList.tsx
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
  const pendingNode = nodes.find((n) => n.id === pendingDeleteId)

  function handleConfirmDelete() {
    if (pendingDeleteId) {
      onDelete(pendingDeleteId)
      setPendingDeleteId(null)
    }
  }

  if (nodes.length === 0) {
    return (
      <p className="text-foreground-subtle py-4 text-center text-sm">No nodes yet. Add one above.</p>
    )
  }

  return (
    <>
      <div className="flex items-center gap-2 mb-3">
        <h4 className="text-foreground text-sm font-semibold">Existing Nodes</h4>
        <Badge variant="outline">{nodes.length}</Badge>
      </div>
      <ul className="flex flex-col gap-2">
        {nodes.map((node) => (
          <li
            key={node.id}
            className="modern-box-sm flex items-center justify-between gap-3 p-3"
          >
            <div className="min-w-0">
              <p className="text-foreground text-sm font-medium truncate">{node.name}</p>
              <p className="text-foreground-muted text-xs truncate">{node.description}</p>
            </div>
            <Button
              variant="ghost"
              size="xs"
              onClick={() => setPendingDeleteId(node.id)}
              aria-label={`Delete ${node.name}`}
              className="text-destructive hover:text-destructive-hover shrink-0"
            >
              Delete
            </Button>
          </li>
        ))}
      </ul>

      <Dialog open={!!pendingDeleteId} onOpenChange={() => setPendingDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete node?</DialogTitle>
          </DialogHeader>
          <p className="text-foreground-muted text-sm">
            This will remove <strong>{pendingNode?.name}</strong> and clean up all linked references.
            This cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingDeleteId(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Confirm delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
```

- [ ] **Step 4: Run tests -- expect 5 PASS**

Run: `npx vitest src/components/input-studio/NodeList.test.tsx --run`

- [ ] **Step 5: Commit**

```bash
git add src/components/input-studio/NodeList.tsx src/components/input-studio/NodeList.test.tsx
git commit -m "feat: add NodeList component with delete confirmation dialog"
```

---

## Task 3: WorkflowForm Component

**Files:**
- Create: `src/components/input-studio/WorkflowForm.tsx`

- [ ] **Step 1: Implement WorkflowForm**

This is a controlled form with local state. On submit it validates, generates an ID, creates a `Workflow` object, and dispatches via `useOntology().addNode`. System link checkboxes are dynamically generated from `ontologyData.systems`.

```typescript
// src/components/input-studio/WorkflowForm.tsx
import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { useOntology } from '@/hooks/useOntology'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { validateNodeName, validateDescription, generateNodeId } from '@/utils/form-validation'
import { NodeList } from './NodeList'
import type { Workflow } from '@/types'

const WORKFLOW_TYPES: { value: Workflow['type']; label: string }[] = [
  { value: 'critical', label: 'Critical (High Urgency)' },
  { value: 'routine', label: 'Routine' },
  { value: 'strategic', label: 'Strategic' },
  { value: 'operational', label: 'Operational' },
]

const FREQUENCIES: { value: Workflow['frequency']; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'ad-hoc', label: 'Ad-hoc' },
]

export function WorkflowForm() {
  const { workflows, systems, addNode, removeNode, saveData } = useOntology()

  const [name, setName] = useState('')
  const [type, setType] = useState<Workflow['type']>('routine')
  const [description, setDescription] = useState('')
  const [owner, setOwner] = useState('')
  const [frequency, setFrequency] = useState<Workflow['frequency']>('weekly')
  const [linkedSystems, setLinkedSystems] = useState<string[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})

  function resetForm() {
    setName('')
    setType('routine')
    setDescription('')
    setOwner('')
    setFrequency('weekly')
    setLinkedSystems([])
    setErrors({})
  }

  function toggleSystem(sysId: string) {
    setLinkedSystems((prev) =>
      prev.includes(sysId) ? prev.filter((id) => id !== sysId) : [...prev, sysId],
    )
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()

    const nameError = validateNodeName(name)
    const descError = validateDescription(description)
    const newErrors: Record<string, string> = {}
    if (nameError) newErrors.name = nameError
    if (descError) newErrors.description = descError

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    const trimmedName = name.trim()
    const existingIds = workflows.map((w) => w.id)
    const id = generateNodeId('workflow', trimmedName, existingIds)

    const workflow: Workflow = {
      id,
      name: trimmedName,
      type,
      description: description.trim(),
      owner: owner.trim(),
      frequency,
      linkedSystems,
    }

    addNode('workflow', workflow)
    saveData()
    toast.success(`Workflow added: ${trimmedName}`)
    resetForm()
  }

  function handleDelete(id: string) {
    removeNode(id, 'workflow')
    saveData()
    toast.success('Workflow removed')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <h3 className="text-foreground font-[family-name:var(--font-display)] text-lg font-semibold">
          Add Workflow
        </h3>
        <Badge className="bg-secondary/20 text-secondary text-xs">Demand Node</Badge>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="wf-name" className="text-foreground-muted mb-1 block text-sm">
              Workflow Name <span className="text-destructive">*</span>
            </label>
            <input
              id="wf-name"
              type="text"
              required
              maxLength={100}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Q3 Financial Reporting"
              className="border-white/8 bg-surface text-foreground placeholder:text-foreground-subtle w-full rounded-lg border px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {errors.name && <p className="text-destructive mt-1 text-xs">{errors.name}</p>}
          </div>

          <div>
            <label htmlFor="wf-type" className="text-foreground-muted mb-1 block text-sm">
              Type <span className="text-destructive">*</span>
            </label>
            <select
              id="wf-type"
              required
              value={type}
              onChange={(e) => setType(e.target.value as Workflow['type'])}
              className="border-white/8 bg-surface text-foreground w-full rounded-lg border px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {WORKFLOW_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="wf-description" className="text-foreground-muted mb-1 block text-sm">
            Description
          </label>
          <textarea
            id="wf-description"
            maxLength={500}
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of this workflow"
            className="border-white/8 bg-surface text-foreground placeholder:text-foreground-subtle w-full resize-none rounded-lg border px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {errors.description && (
            <p className="text-destructive mt-1 text-xs">{errors.description}</p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="wf-owner" className="text-foreground-muted mb-1 block text-sm">
              Business Owner
            </label>
            <input
              id="wf-owner"
              type="text"
              maxLength={100}
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              placeholder="e.g. VP of Operations"
              className="border-white/8 bg-surface text-foreground placeholder:text-foreground-subtle w-full rounded-lg border px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label htmlFor="wf-frequency" className="text-foreground-muted mb-1 block text-sm">
              Frequency <span className="text-destructive">*</span>
            </label>
            <select
              id="wf-frequency"
              required
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as Workflow['frequency'])}
              className="border-white/8 bg-surface text-foreground w-full rounded-lg border px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {FREQUENCIES.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {systems.length > 0 && (
          <fieldset>
            <legend className="text-foreground-muted mb-2 text-sm">Link to Systems</legend>
            <div className="grid grid-cols-2 gap-2">
              {systems.map((sys) => (
                <label
                  key={sys.id}
                  className="flex items-center gap-2 rounded-lg bg-surface/50 px-3 py-2 text-sm cursor-pointer hover:bg-surface-elevated/50 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={linkedSystems.includes(sys.id)}
                    onChange={() => toggleSystem(sys.id)}
                    className="accent-primary"
                  />
                  <span className="text-foreground">{sys.name}</span>
                </label>
              ))}
            </div>
          </fieldset>
        )}

        <Button type="submit" className="w-full bg-primary hover:bg-primary-hover text-background font-bold">
          + Add Workflow Node
        </Button>
      </form>

      <NodeList nodes={workflows} onDelete={handleDelete} />
    </div>
  )
}
```

- [ ] **Step 2: Verify no type errors**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/components/input-studio/WorkflowForm.tsx
git commit -m "feat: add WorkflowForm with validation, system links, and node list"
```

---

## Task 4: SystemForm Component

**Files:**
- Create: `src/components/input-studio/SystemForm.tsx`

- [ ] **Step 1: Implement SystemForm**

Same pattern as WorkflowForm. Links to both workflows and personas via checkboxes.

```typescript
// src/components/input-studio/SystemForm.tsx
import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { useOntology } from '@/hooks/useOntology'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { validateNodeName, validateDescription, generateNodeId } from '@/utils/form-validation'
import { NodeList } from './NodeList'
import type { System } from '@/types'

const CATEGORIES: { value: System['category']; label: string }[] = [
  { value: 'reporting', label: 'Power BI / Tableau / Dashboard' },
  { value: 'storage', label: 'SharePoint / Drive' },
  { value: 'comms', label: 'Communication' },
  { value: 'intelligence', label: 'AI / Intelligence' },
  { value: 'tracking', label: 'Project Management' },
]

export function SystemForm() {
  const { workflows, systems, personas, addNode, removeNode, saveData } = useOntology()

  const [name, setName] = useState('')
  const [category, setCategory] = useState<System['category']>('reporting')
  const [description, setDescription] = useState('')
  const [linkedWorkflows, setLinkedWorkflows] = useState<string[]>([])
  const [linkedUsers, setLinkedUsers] = useState<string[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})

  function resetForm() {
    setName('')
    setCategory('reporting')
    setDescription('')
    setLinkedWorkflows([])
    setLinkedUsers([])
    setErrors({})
  }

  function toggleWorkflow(wfId: string) {
    setLinkedWorkflows((prev) =>
      prev.includes(wfId) ? prev.filter((id) => id !== wfId) : [...prev, wfId],
    )
  }

  function toggleUser(usrId: string) {
    setLinkedUsers((prev) =>
      prev.includes(usrId) ? prev.filter((id) => id !== usrId) : [...prev, usrId],
    )
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()

    const nameError = validateNodeName(name)
    const descError = validateDescription(description)
    const newErrors: Record<string, string> = {}
    if (nameError) newErrors.name = nameError
    if (descError) newErrors.description = descError

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    const trimmedName = name.trim()
    const existingIds = systems.map((s) => s.id)
    const id = generateNodeId('system', trimmedName, existingIds)

    const system: System = {
      id,
      name: trimmedName,
      category,
      description: description.trim(),
      linkedWorkflows,
      linkedUsers,
    }

    addNode('system', system)
    saveData()
    toast.success(`System added: ${trimmedName}`)
    resetForm()
  }

  function handleDelete(id: string) {
    removeNode(id, 'system')
    saveData()
    toast.success('System removed')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <h3 className="text-foreground font-[family-name:var(--font-display)] text-lg font-semibold">
          Add System
        </h3>
        <Badge className="bg-primary/20 text-primary text-xs">Supply Node</Badge>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="sys-name" className="text-foreground-muted mb-1 block text-sm">
              System Name <span className="text-destructive">*</span>
            </label>
            <input
              id="sys-name"
              type="text"
              required
              maxLength={100}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Finance Power BI Dashboard"
              className="border-white/8 bg-surface text-foreground placeholder:text-foreground-subtle w-full rounded-lg border px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {errors.name && <p className="text-destructive mt-1 text-xs">{errors.name}</p>}
          </div>

          <div>
            <label htmlFor="sys-category" className="text-foreground-muted mb-1 block text-sm">
              Category <span className="text-destructive">*</span>
            </label>
            <select
              id="sys-category"
              required
              value={category}
              onChange={(e) => setCategory(e.target.value as System['category'])}
              className="border-white/8 bg-surface text-foreground w-full rounded-lg border px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="sys-description" className="text-foreground-muted mb-1 block text-sm">
            Description
          </label>
          <textarea
            id="sys-description"
            maxLength={500}
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe purpose or function"
            className="border-white/8 bg-surface text-foreground placeholder:text-foreground-subtle w-full resize-none rounded-lg border px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {errors.description && (
            <p className="text-destructive mt-1 text-xs">{errors.description}</p>
          )}
        </div>

        {workflows.length > 0 && (
          <fieldset>
            <legend className="text-foreground-muted mb-2 text-sm">Link to Workflows</legend>
            <div className="grid grid-cols-2 gap-2">
              {workflows.map((wf) => (
                <label
                  key={wf.id}
                  className="flex items-center gap-2 rounded-lg bg-surface/50 px-3 py-2 text-sm cursor-pointer hover:bg-surface-elevated/50 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={linkedWorkflows.includes(wf.id)}
                    onChange={() => toggleWorkflow(wf.id)}
                    className="accent-primary"
                  />
                  <span className="text-foreground">{wf.name}</span>
                </label>
              ))}
            </div>
          </fieldset>
        )}

        {personas.length > 0 && (
          <fieldset>
            <legend className="text-foreground-muted mb-2 text-sm">Link to Users</legend>
            <div className="grid grid-cols-2 gap-2">
              {personas.map((p) => (
                <label
                  key={p.id}
                  className="flex items-center gap-2 rounded-lg bg-surface/50 px-3 py-2 text-sm cursor-pointer hover:bg-surface-elevated/50 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={linkedUsers.includes(p.id)}
                    onChange={() => toggleUser(p.id)}
                    className="accent-primary"
                  />
                  <span className="text-foreground">{p.name}</span>
                </label>
              ))}
            </div>
          </fieldset>
        )}

        <Button type="submit" className="w-full bg-secondary hover:bg-secondary-hover text-background font-bold">
          + Add System Node
        </Button>
      </form>

      <NodeList nodes={systems} onDelete={handleDelete} />
    </div>
  )
}
```

- [ ] **Step 2: Verify no type errors**

Run: `npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add src/components/input-studio/SystemForm.tsx
git commit -m "feat: add SystemForm with workflow/user links and validation"
```

---

## Task 5: PersonaForm Component

**Files:**
- Create: `src/components/input-studio/PersonaForm.tsx`

- [ ] **Step 1: Implement PersonaForm**

Simplest form -- name, state (select), description. No link checkboxes.

```typescript
// src/components/input-studio/PersonaForm.tsx
import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { useOntology } from '@/hooks/useOntology'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { validateNodeName, validateDescription, generateNodeId } from '@/utils/form-validation'
import { NodeList } from './NodeList'
import type { Persona } from '@/types'

const PERSONA_STATES: { value: string; label: string }[] = [
  { value: 'reactive-firefighter', label: 'Reactive Firefighter (High Stress)' },
  { value: 'deep-focus-architect', label: 'Deep Focus Architect (Low Distraction)' },
  { value: 'process-admin', label: 'Process Admin (Methodical)' },
  { value: 'bridge-builder', label: 'Bridge Builder (Collaborative)' },
]

export function PersonaForm() {
  const { personas, addNode, removeNode, saveData } = useOntology()

  const [name, setName] = useState('')
  const [state, setState] = useState('reactive-firefighter')
  const [description, setDescription] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  function resetForm() {
    setName('')
    setState('reactive-firefighter')
    setDescription('')
    setErrors({})
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()

    const nameError = validateNodeName(name)
    const descError = validateDescription(description)
    const newErrors: Record<string, string> = {}
    if (nameError) newErrors.name = nameError
    if (descError) newErrors.description = descError

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    const trimmedName = name.trim()
    const existingIds = personas.map((p) => p.id)
    const id = generateNodeId('persona', trimmedName, existingIds)

    const persona: Persona = {
      id,
      name: trimmedName,
      state,
      description: description.trim(),
    }

    addNode('persona', persona)
    saveData()
    toast.success(`User added: ${trimmedName}`)
    resetForm()
  }

  function handleDelete(id: string) {
    removeNode(id, 'persona')
    saveData()
    toast.success('User removed')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <h3 className="text-foreground font-[family-name:var(--font-display)] text-lg font-semibold">
          Add User
        </h3>
        <Badge className="bg-destructive/20 text-destructive text-xs">State Node</Badge>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="usr-name" className="text-foreground-muted mb-1 block text-sm">
              Name / Role <span className="text-destructive">*</span>
            </label>
            <input
              id="usr-name"
              type="text"
              required
              maxLength={100}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sarah (Finance Analyst)"
              className="border-white/8 bg-surface text-foreground placeholder:text-foreground-subtle w-full rounded-lg border px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {errors.name && <p className="text-destructive mt-1 text-xs">{errors.name}</p>}
          </div>

          <div>
            <label htmlFor="usr-state" className="text-foreground-muted mb-1 block text-sm">
              Persona State <span className="text-destructive">*</span>
            </label>
            <select
              id="usr-state"
              required
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="border-white/8 bg-surface text-foreground w-full rounded-lg border px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {PERSONA_STATES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="usr-description" className="text-foreground-muted mb-1 block text-sm">
            Role Description
          </label>
          <textarea
            id="usr-description"
            maxLength={500}
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What is their primary responsibility?"
            className="border-white/8 bg-surface text-foreground placeholder:text-foreground-subtle w-full resize-none rounded-lg border px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {errors.description && (
            <p className="text-destructive mt-1 text-xs">{errors.description}</p>
          )}
        </div>

        <Button type="submit" className="w-full bg-primary hover:bg-primary-hover text-background font-bold">
          + Add User Node
        </Button>
      </form>

      <NodeList nodes={personas} onDelete={handleDelete} />
    </div>
  )
}
```

- [ ] **Step 2: Verify no type errors**

Run: `npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add src/components/input-studio/PersonaForm.tsx
git commit -m "feat: add PersonaForm with state selection and validation"
```

---

## Task 6: ImportExportBar Component

**Files:**
- Create: `src/components/input-studio/ImportExportBar.tsx`
- Create: `src/components/input-studio/ImportExportBar.test.tsx`

- [ ] **Step 1: Write failing tests**

```typescript
// src/components/input-studio/ImportExportBar.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ImportExportBar } from './ImportExportBar'

// Mock useOntology
const mockResetData = vi.fn()
const mockSaveData = vi.fn()
const mockDispatch = vi.fn()

vi.mock('@/hooks/useOntology', () => ({
  useOntology: () => ({
    ontologyData: {
      workflows: [{ id: 'wf-test', name: 'Test', type: 'routine', description: '', owner: '', frequency: 'weekly', linkedSystems: [] }],
      systems: [],
      personas: [],
      contextMap: {},
      frictionRules: {},
      modeRules: {},
    },
    resetData: mockResetData,
    saveData: mockSaveData,
  }),
}))

vi.mock('@/context/AppContext', () => ({
  useApp: () => ({ dispatch: mockDispatch }),
}))

describe('ImportExportBar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders export, import, and reset buttons', () => {
    render(<ImportExportBar />)
    expect(screen.getByRole('button', { name: /export/i })).toBeInTheDocument()
    expect(screen.getByText(/import/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /reset/i })).toBeInTheDocument()
  })

  it('resets data after confirmation', async () => {
    const user = userEvent.setup()
    render(<ImportExportBar />)

    await user.click(screen.getByRole('button', { name: /reset/i }))

    const confirmButton = screen.getByRole('button', { name: /confirm/i })
    await user.click(confirmButton)

    expect(mockResetData).toHaveBeenCalled()
  })

  it('does not reset when cancelled', async () => {
    const user = userEvent.setup()
    render(<ImportExportBar />)

    await user.click(screen.getByRole('button', { name: /reset/i }))

    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    await user.click(cancelButton)

    expect(mockResetData).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest src/components/input-studio/ImportExportBar.test.tsx --run`
Expected: FAIL

- [ ] **Step 3: Implement ImportExportBar**

```typescript
// src/components/input-studio/ImportExportBar.tsx
import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { useOntology } from '@/hooks/useOntology'
import { useApp } from '@/context/AppContext'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { validateOntologyData } from '@/services/storage.service'

export function ImportExportBar() {
  const { ontologyData, resetData, saveData } = useOntology()
  const { dispatch } = useApp()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [resetDialogOpen, setResetDialogOpen] = useState(false)

  function handleExport() {
    const json = JSON.stringify(ontologyData, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `context-modeler-export-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Data exported')
  }

  function handleImportClick() {
    fileInputRef.current?.click()
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const parsed: unknown = JSON.parse(event.target?.result as string)
        if (!validateOntologyData(parsed)) {
          toast.error('Invalid data format. Check the JSON structure.')
          return
        }
        dispatch({ type: 'SET_ONTOLOGY_DATA', payload: parsed })
        saveData()
        toast.success('Data imported')
      } catch {
        toast.error('Failed to parse JSON file')
      }
    }
    reader.readAsText(file)

    // Reset file input so the same file can be re-imported
    e.target.value = ''
  }

  function handleConfirmReset() {
    resetData()
    saveData()
    setResetDialogOpen(false)
    toast.success('Data reset to defaults')
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
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
          onChange={handleFileChange}
          className="hidden"
          aria-label="Import JSON file"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => setResetDialogOpen(true)}
          className="text-destructive hover:text-destructive-hover"
        >
          Reset to defaults
        </Button>
      </div>

      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset all data?</DialogTitle>
          </DialogHeader>
          <p className="text-foreground-muted text-sm">
            This will replace all workflows, systems, and personas with the default sample data.
            This cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmReset}>
              Confirm reset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
```

- [ ] **Step 4: Run tests -- expect 3 PASS**

Run: `npx vitest src/components/input-studio/ImportExportBar.test.tsx --run`

- [ ] **Step 5: Commit**

```bash
git add src/components/input-studio/ImportExportBar.tsx src/components/input-studio/ImportExportBar.test.tsx
git commit -m "feat: add ImportExportBar with JSON export, file import, and reset"
```

---

## Task 7: InputStudio Container + Wire into App

**Files:**
- Create: `src/components/input-studio/InputStudio.tsx`
- Modify: `src/App.tsx` (lines 4, 31-32)

- [ ] **Step 1: Create InputStudio container**

```typescript
// src/components/input-studio/InputStudio.tsx
import { motion, useReducedMotion } from 'motion/react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { WorkflowForm } from './WorkflowForm'
import { SystemForm } from './SystemForm'
import { PersonaForm } from './PersonaForm'
import { ImportExportBar } from './ImportExportBar'

export function InputStudio() {
  const prefersReduced = useReducedMotion()

  const fadeUp = prefersReduced
    ? {}
    : { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4 } }

  return (
    <div className="space-y-6">
      <motion.div {...fadeUp}>
        <div className="modern-box overflow-hidden">
          <div className="bg-accent/20 border-b border-white/5 px-6 py-5">
            <h2 className="text-foreground font-[family-name:var(--font-display)] text-2xl font-bold">
              Ontology Input Studio
            </h2>
            <p className="text-foreground-muted mt-1 text-sm">
              Define the nodes of your workplace graph. Link systems to workflows to build the ontology.
            </p>
            <div className="mt-4">
              <ImportExportBar />
            </div>
          </div>

          <div className="p-6">
            <Tabs defaultValue="workflows">
              <TabsList variant="line" className="mb-6 w-full">
                <TabsTrigger value="workflows" className="flex-1">
                  1. Workflows
                </TabsTrigger>
                <TabsTrigger value="systems" className="flex-1">
                  2. Systems & Infra
                </TabsTrigger>
                <TabsTrigger value="personas" className="flex-1">
                  3. Business Users
                </TabsTrigger>
              </TabsList>

              <TabsContent value="workflows">
                <WorkflowForm />
              </TabsContent>
              <TabsContent value="systems">
                <SystemForm />
              </TabsContent>
              <TabsContent value="personas">
                <PersonaForm />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
```

- [ ] **Step 2: Wire InputStudio into App.tsx**

In `src/App.tsx`, replace the `InputStudioPlaceholder` usage:

1. Replace import area -- add: `import { InputStudio } from '@/components/input-studio/InputStudio'`
2. Replace `<InputStudioPlaceholder />` on line 31 with `<InputStudio />`
3. Delete the `InputStudioPlaceholder` function (lines 40-50)

- [ ] **Step 3: Verify typecheck + dev server**

Run: `npx tsc --noEmit`
Run: `npm run dev` -- manually navigate to Input Studio tab, verify tabs render, forms display

- [ ] **Step 4: Commit**

```bash
git add src/components/input-studio/InputStudio.tsx src/App.tsx
git commit -m "feat: add InputStudio container and wire into App shell"
```

---

## Task 8: Integration Tests

**Files:**
- Create: `src/components/input-studio/InputStudio.test.tsx`

- [ ] **Step 1: Write integration tests**

```typescript
// src/components/input-studio/InputStudio.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { AppProvider } from '@/context/AppContext'
import { InputStudio } from './InputStudio'

// Wrap in AppProvider for real state
function renderWithProvider() {
  return render(
    <AppProvider>
      <InputStudio />
    </AppProvider>,
  )
}

describe('InputStudio', () => {
  it('renders all three tabs', () => {
    renderWithProvider()
    expect(screen.getByRole('tab', { name: /workflows/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /systems/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /users/i })).toBeInTheDocument()
  })

  it('shows workflow form by default', () => {
    renderWithProvider()
    expect(screen.getByLabelText(/workflow name/i)).toBeInTheDocument()
  })

  it('switches to system form on tab click', async () => {
    const user = userEvent.setup()
    renderWithProvider()

    await user.click(screen.getByRole('tab', { name: /systems/i }))
    expect(screen.getByLabelText(/system name/i)).toBeInTheDocument()
  })

  it('switches to persona form on tab click', async () => {
    const user = userEvent.setup()
    renderWithProvider()

    await user.click(screen.getByRole('tab', { name: /users/i }))
    expect(screen.getByLabelText(/name \/ role/i)).toBeInTheDocument()
  })

  it('adds a workflow and shows it in the node list', async () => {
    const user = userEvent.setup()
    renderWithProvider()

    await user.type(screen.getByLabelText(/workflow name/i), 'Test Workflow')
    await user.click(screen.getByRole('button', { name: /add workflow/i }))

    expect(screen.getByText('Test Workflow')).toBeInTheDocument()
  })

  it('validates empty workflow name', async () => {
    const user = userEvent.setup()
    renderWithProvider()

    await user.click(screen.getByRole('button', { name: /add workflow/i }))

    expect(screen.getByText('Name is required')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests**

Run: `npx vitest src/components/input-studio/InputStudio.test.tsx --run`
Expected: 6 PASS

- [ ] **Step 3: Run full test suite**

Run: `npm test`
Expected: All tests pass (77 existing + new tests)

- [ ] **Step 4: Commit**

```bash
git add src/components/input-studio/InputStudio.test.tsx
git commit -m "test: add InputStudio integration tests for tabs, forms, and validation"
```

---

## Task 9: Full Validation + Conductor Update

- [ ] **Step 1: Run full validate**

Run: `npm run validate`
Expected: typecheck pass, lint pass, all tests pass

- [ ] **Step 2: Fix any lint/type issues**

Address any errors from validate. Common issues:
- Unused imports
- Missing `aria-label` on interactive elements
- `any` type leaks

- [ ] **Step 3: Update conductor plan**

Mark Phase 5 tasks 5.1-5.9 as complete in `conductor/tracks/react-migration_20260402/plan.md`.

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "chore: pass full validation and update conductor plan for Phase 5"
```

---

## Verification

After all tasks, verify end-to-end:

1. `npm run dev` -- open browser
2. Switch to Input Studio tab -- verify header, tabs, export/import/reset buttons render
3. Add a workflow -- fill name, select type/frequency, check a system link, submit. See toast, node appears in list
4. Switch to Dashboard -- new workflow appears in TriadExplorer
5. Go back to Input Studio, switch to Systems tab -- add a system, link to the new workflow
6. Switch to Users tab -- add a persona
7. Click Export JSON -- file downloads, open it, verify structure matches `OntologyData`
8. Click Reset -- confirm dialog appears, confirm -- data reverts to defaults
9. Click Import -- select the exported file -- data restores
10. Delete a node -- confirm dialog, node disappears, linked references cleaned up
11. `npm run validate` -- all green
