import { useState } from 'react'
import { toast } from 'sonner'
import { useOntology } from '@/hooks/useOntology'
import { generateNodeId, validateNodeName, validateDescription } from '@/utils/form-validation'
import { Button } from '@/components/ui/button'
import { NodeList } from '@/components/input-studio/NodeList'
import type { Workflow } from '@/types'

const INPUT_CLASS =
  'border-white/8 bg-surface text-foreground placeholder:text-foreground-subtle w-full rounded-lg border px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary'

const LABEL_CLASS = 'text-foreground-muted mb-1 block text-sm'
const ERROR_CLASS = 'text-destructive mt-1 text-xs'

const WORKFLOW_TYPES: { value: Workflow['type']; label: string }[] = [
  { value: 'critical', label: 'Critical (High Urgency)' },
  { value: 'routine', label: 'Routine' },
  { value: 'strategic', label: 'Strategic' },
  { value: 'operational', label: 'Operational' },
]

const FREQUENCY_OPTIONS: { value: Workflow['frequency']; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'ad-hoc', label: 'Ad-hoc' },
]

interface FormErrors {
  name?: string
  description?: string
}

export function WorkflowForm() {
  const { workflows, systems, addNode, removeNode } = useOntology()

  const [name, setName] = useState('')
  const [type, setType] = useState<Workflow['type']>('routine')
  const [description, setDescription] = useState('')
  const [owner, setOwner] = useState('')
  const [frequency, setFrequency] = useState<Workflow['frequency']>('weekly')
  const [linkedSystems, setLinkedSystems] = useState<string[]>([])
  const [errors, setErrors] = useState<FormErrors>({})

  function toggleSystem(id: string) {
    setLinkedSystems((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const nameError = validateNodeName(name)
    const descError = validateDescription(description)
    if (nameError || descError) {
      setErrors({ name: nameError ?? undefined, description: descError ?? undefined })
      return
    }
    setErrors({})

    const existingIds = workflows.map((w) => w.id)
    const id = generateNodeId('workflow', name, existingIds)

    const workflow: Workflow = {
      id,
      name: name.trim(),
      type,
      description: description.trim(),
      owner,
      frequency,
      linkedSystems,
    }

    addNode('workflow', workflow)
    toast.success(`Workflow added: ${name.trim()}`)

    setName('')
    setType('routine')
    setDescription('')
    setOwner('')
    setFrequency('weekly')
    setLinkedSystems([])
  }

  function handleDelete(id: string) {
    removeNode(id, 'workflow')
    toast.success('Workflow removed')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h2 className="text-foreground font-[family-name:var(--font-display)] text-lg font-semibold">
          Workflows
        </h2>
        <span className="bg-secondary/20 text-secondary rounded-full px-2 py-0.5 text-xs">
          Demand Node
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* Workflow Name */}
        <div>
          <label htmlFor="workflow-name" className={LABEL_CLASS}>
            Workflow Name <span className="text-destructive">*</span>
          </label>
          <input
            id="workflow-name"
            type="text"
            className={INPUT_CLASS}
            placeholder="e.g. Q3 Financial Reporting"
            maxLength={100}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          {errors.name && <p className={ERROR_CLASS}>{errors.name}</p>}
        </div>

        {/* Type */}
        <div>
          <label htmlFor="workflow-type" className={LABEL_CLASS}>
            Type <span className="text-destructive">*</span>
          </label>
          <select
            id="workflow-type"
            className={INPUT_CLASS}
            value={type}
            onChange={(e) => setType(e.target.value as Workflow['type'])}
          >
            {WORKFLOW_TYPES.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div>
          <label htmlFor="workflow-description" className={LABEL_CLASS}>
            Description
          </label>
          <textarea
            id="workflow-description"
            className={`${INPUT_CLASS} resize-none`}
            rows={2}
            maxLength={500}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          {errors.description && <p className={ERROR_CLASS}>{errors.description}</p>}
        </div>

        {/* Business Owner */}
        <div>
          <label htmlFor="workflow-owner" className={LABEL_CLASS}>
            Business Owner
          </label>
          <input
            id="workflow-owner"
            type="text"
            className={INPUT_CLASS}
            maxLength={100}
            value={owner}
            onChange={(e) => setOwner(e.target.value)}
          />
        </div>

        {/* Frequency */}
        <div>
          <label htmlFor="workflow-frequency" className={LABEL_CLASS}>
            Frequency <span className="text-destructive">*</span>
          </label>
          <select
            id="workflow-frequency"
            className={INPUT_CLASS}
            value={frequency}
            onChange={(e) => setFrequency(e.target.value as Workflow['frequency'])}
          >
            {FREQUENCY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Link to Systems */}
        {systems.length > 0 && (
          <div>
            <p className={LABEL_CLASS}>Link to Systems</p>
            <div className="space-y-1">
              {systems.map((sys) => (
                <label
                  key={sys.id}
                  className="bg-surface/50 hover:bg-surface-elevated/50 flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors"
                >
                  <input
                    type="checkbox"
                    className="accent-primary"
                    checked={linkedSystems.includes(sys.id)}
                    onChange={() => toggleSystem(sys.id)}
                  />
                  {sys.name}
                </label>
              ))}
            </div>
          </div>
        )}

        <Button type="submit" className="bg-primary hover:bg-primary-hover text-background w-full">
          + Add Workflow Node
        </Button>
      </form>

      <NodeList nodes={workflows} onDelete={handleDelete} />
    </div>
  )
}
