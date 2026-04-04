import { useState } from 'react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { NodeList } from '@/components/input-studio/NodeList'
import { useOntology } from '@/hooks/useOntology'
import { generateNodeId, validateNodeName, validateDescription } from '@/utils/form-validation'
import type { Persona } from '@/types'

const PERSONA_STATES: { value: string; label: string }[] = [
  { value: 'reactive-firefighter', label: 'Reactive Firefighter (High Stress)' },
  { value: 'deep-focus-architect', label: 'Deep Focus Architect (Low Distraction)' },
  { value: 'process-admin', label: 'Process Admin (Methodical)' },
  { value: 'bridge-builder', label: 'Bridge Builder (Collaborative)' },
]

const INPUT_CLASS =
  'border-white/8 bg-surface text-foreground placeholder:text-foreground-subtle w-full rounded-lg border px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary'
const LABEL_CLASS = 'text-foreground-muted mb-1 block text-sm'
const ERROR_CLASS = 'text-destructive mt-1 text-xs'

interface FormState {
  name: string
  state: string
  description: string
}

const DEFAULT_FORM: FormState = {
  name: '',
  // PERSONA_STATES is a non-empty const -- the non-null assertion is safe
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  state: PERSONA_STATES[0]!.value,
  description: '',
}

export function PersonaForm() {
  const { personas, addNode, removeNode } = useOntology()

  const [form, setForm] = useState<FormState>(DEFAULT_FORM)
  const [errors, setErrors] = useState<{ name?: string; description?: string }>({})

  function handleChange(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
    // Clear error on change
    if (field === 'name' || field === 'description') {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    const nameError = validateNodeName(form.name)
    const descError = validateDescription(form.description)

    if (nameError || descError) {
      setErrors({ name: nameError ?? undefined, description: descError ?? undefined })
      return
    }

    const existingIds = personas.map((p) => p.id)
    const id = generateNodeId('persona', form.name, existingIds)

    const persona: Persona = {
      id,
      name: form.name.trim(),
      state: form.state,
      description: form.description.trim(),
    }

    addNode('persona', persona)
    toast.success(`User added: ${persona.name}`)
    setForm(DEFAULT_FORM)
    setErrors({})
  }

  function handleDelete(id: string) {
    removeNode(id, 'persona')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <h2 className="text-foreground font-[family-name:var(--font-display)] text-lg font-semibold">
          User Personas
        </h2>
        <Badge className="bg-destructive/20 text-destructive">State Node</Badge>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {/* Name / Role */}
        <div>
          <label htmlFor="persona-name" className={LABEL_CLASS}>
            Name / Role <span className="text-destructive">*</span>
          </label>
          <input
            id="persona-name"
            type="text"
            value={form.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="e.g. Sarah (Finance Analyst)"
            maxLength={100}
            className={INPUT_CLASS}
          />
          {errors.name && <p className={ERROR_CLASS}>{errors.name}</p>}
        </div>

        {/* Persona State */}
        <div>
          <label htmlFor="persona-state" className={LABEL_CLASS}>
            Persona State <span className="text-destructive">*</span>
          </label>
          <select
            id="persona-state"
            value={form.state}
            onChange={(e) => handleChange('state', e.target.value)}
            className={INPUT_CLASS}
          >
            {PERSONA_STATES.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* Role Description */}
        <div>
          <label htmlFor="persona-description" className={LABEL_CLASS}>
            Role Description
          </label>
          <textarea
            id="persona-description"
            value={form.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="What is their primary responsibility?"
            maxLength={500}
            rows={2}
            className={`${INPUT_CLASS} resize-none`}
          />
          {errors.description && <p className={ERROR_CLASS}>{errors.description}</p>}
        </div>

        <Button type="submit" className="bg-primary hover:bg-primary-hover text-background w-full">
          + Add User Node
        </Button>
      </form>

      <NodeList nodes={personas} onDelete={handleDelete} />
    </div>
  )
}
