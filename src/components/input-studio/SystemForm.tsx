import { useState } from 'react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { NodeList } from '@/components/input-studio/NodeList'
import { useOntology } from '@/hooks/useOntology'
import type { System } from '@/types'
import { generateNodeId, validateNodeName, validateDescription } from '@/utils/form-validation'

const CATEGORY_OPTIONS: { value: System['category']; label: string }[] = [
  { value: 'reporting', label: 'Power BI / Tableau / Dashboard' },
  { value: 'storage', label: 'SharePoint / Drive' },
  { value: 'comms', label: 'Communication' },
  { value: 'intelligence', label: 'AI / Intelligence' },
  { value: 'tracking', label: 'Project Management' },
]

const INPUT_CLASS =
  'border-white/8 bg-surface text-foreground placeholder:text-foreground-subtle w-full rounded-lg border px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary'
const LABEL_CLASS = 'text-foreground-muted mb-1 block text-sm'

interface FormState {
  name: string
  category: System['category'] | ''
  description: string
  linkedWorkflows: string[]
  linkedUsers: string[]
}

const EMPTY_FORM: FormState = {
  name: '',
  category: '',
  description: '',
  linkedWorkflows: [],
  linkedUsers: [],
}

function toggleId(ids: string[], id: string): string[] {
  return ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]
}

export function SystemForm() {
  const { systems, workflows, personas, addNode, removeNode } = useOntology()
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [errors, setErrors] = useState<{ name?: string; description?: string; category?: string }>(
    {},
  )

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const nameError = validateNodeName(form.name)
    const descError = validateDescription(form.description)

    const categoryError = form.category === '' ? 'Category is required.' : null

    if (nameError || descError || categoryError) {
      setErrors({
        ...(nameError ? { name: nameError } : {}),
        ...(descError ? { description: descError } : {}),
        ...(categoryError ? { category: categoryError } : {}),
      })
      return
    }

    const existingIds = systems.map((s) => s.id)
    const id = generateNodeId('system', form.name, existingIds)

    const system: System = {
      id,
      name: form.name.trim(),
      category: form.category as System['category'],
      description: form.description.trim(),
      linkedWorkflows: form.linkedWorkflows,
      linkedUsers: form.linkedUsers,
    }

    addNode('system', system)
    toast.success(`System "${system.name}" added.`)
    setForm(EMPTY_FORM)
    setErrors({})
  }

  function handleDelete(id: string) {
    removeNode(id, 'system')
    toast.success('System removed')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <h2 className="text-foreground font-[family-name:var(--font-display)] text-lg font-semibold">
          System Node
        </h2>
        <Badge className="bg-primary/20 text-primary">Supply Node</Badge>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {/* Name */}
        <div>
          <label htmlFor="system-name" className={LABEL_CLASS}>
            System Name <span className="text-destructive">*</span>
          </label>
          <input
            id="system-name"
            type="text"
            maxLength={100}
            placeholder="e.g. Finance Power BI Dashboard"
            className={INPUT_CLASS}
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
          />
          {errors.name && <p className="text-destructive mt-1 text-xs">{errors.name}</p>}
        </div>

        {/* Category */}
        <div>
          <label htmlFor="system-category" className={LABEL_CLASS}>
            Category <span className="text-destructive">*</span>
          </label>
          <select
            id="system-category"
            className={INPUT_CLASS}
            value={form.category}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, category: e.target.value as System['category'] | '' }))
            }
          >
            <option value="" disabled>
              Select a category
            </option>
            {CATEGORY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {errors.category && <p className="text-destructive mt-1 text-xs">{errors.category}</p>}
        </div>

        {/* Description */}
        <div>
          <label htmlFor="system-description" className={LABEL_CLASS}>
            Description
          </label>
          <textarea
            id="system-description"
            rows={2}
            maxLength={500}
            className={`${INPUT_CLASS} resize-none`}
            value={form.description}
            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
          />
          {errors.description && (
            <p className="text-destructive mt-1 text-xs">{errors.description}</p>
          )}
        </div>

        {/* Link to Workflows */}
        {workflows.length > 0 && (
          <div>
            <p className={LABEL_CLASS}>Link to Workflows</p>
            <div className="space-y-1">
              {workflows.map((wf) => (
                <label
                  key={wf.id}
                  className="bg-surface/50 hover:bg-surface-elevated/50 flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={form.linkedWorkflows.includes(wf.id)}
                    onChange={() =>
                      setForm((prev) => ({
                        ...prev,
                        linkedWorkflows: toggleId(prev.linkedWorkflows, wf.id),
                      }))
                    }
                  />
                  {wf.name}
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Link to Users (Personas) */}
        {personas.length > 0 && (
          <div>
            <p className={LABEL_CLASS}>Link to Users</p>
            <div className="space-y-1">
              {personas.map((persona) => (
                <label
                  key={persona.id}
                  className="bg-surface/50 hover:bg-surface-elevated/50 flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={form.linkedUsers.includes(persona.id)}
                    onChange={() =>
                      setForm((prev) => ({
                        ...prev,
                        linkedUsers: toggleId(prev.linkedUsers, persona.id),
                      }))
                    }
                  />
                  {persona.name}
                </label>
              ))}
            </div>
          </div>
        )}

        <Button
          type="submit"
          className="bg-secondary hover:bg-secondary-hover text-background w-full"
        >
          + Add System Node
        </Button>
      </form>

      <NodeList nodes={systems} onDelete={handleDelete} />
    </div>
  )
}
