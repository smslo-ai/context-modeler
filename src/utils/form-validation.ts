import type { NodeType } from '@/types'

const NODE_TYPE_PREFIXES: Record<NodeType, string> = {
  workflow: 'wf',
  system: 'sys',
  persona: 'usr',
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // non-alphanumeric runs -> single hyphen
    .replace(/-{2,}/g, '-') // collapse any remaining double hyphens
    .replace(/^-+|-+$/g, '') // trim leading/trailing hyphens
}

export function generateNodeId(nodeType: NodeType, name: string, existingIds: string[]): string {
  const prefix = NODE_TYPE_PREFIXES[nodeType]
  const base = `${prefix}-${slugify(name)}`

  if (!existingIds.includes(base)) {
    return base
  }

  let counter = 2
  while (existingIds.includes(`${base}-${counter}`)) {
    counter++
  }
  return `${base}-${counter}`
}

export function validateNodeName(name: string): string | null {
  const trimmed = name.trim()
  if (trimmed.length === 0) {
    return 'Name is required.'
  }
  if (trimmed.length > 100) {
    return 'Name must be 100 characters or fewer.'
  }
  return null
}

export function validateDescription(description: string): string | null {
  if (description.length > 500) {
    return 'Description must be 500 characters or fewer.'
  }
  return null
}
