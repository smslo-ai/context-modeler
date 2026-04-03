import { describe, it, expect } from 'vitest'
import { slugify, generateNodeId, validateNodeName, validateDescription } from './form-validation'

describe('slugify', () => {
  it('converts a name to kebab-case', () => {
    expect(slugify('My Workflow Name')).toBe('my-workflow-name')
  })

  it('strips special characters', () => {
    expect(slugify('Hello! @World#')).toBe('hello-world')
  })

  it('collapses multiple hyphens into one', () => {
    expect(slugify('foo--bar   baz')).toBe('foo-bar-baz')
  })

  it('trims leading and trailing hyphens', () => {
    expect(slugify('  --hello--  ')).toBe('hello')
  })
})

describe('generateNodeId', () => {
  it('uses wf- prefix for workflow type', () => {
    expect(generateNodeId('workflow', 'My Flow', [])).toBe('wf-my-flow')
  })

  it('uses sys- prefix for system type', () => {
    expect(generateNodeId('system', 'Core DB', [])).toBe('sys-core-db')
  })

  it('uses usr- prefix for persona type', () => {
    expect(generateNodeId('persona', 'Admin User', [])).toBe('usr-admin-user')
  })

  it('appends -2 when base ID already exists', () => {
    expect(generateNodeId('workflow', 'My Flow', ['wf-my-flow'])).toBe('wf-my-flow-2')
  })

  it('increments to -3 when -2 also exists', () => {
    expect(generateNodeId('workflow', 'My Flow', ['wf-my-flow', 'wf-my-flow-2'])).toBe(
      'wf-my-flow-3',
    )
  })
})

describe('validateNodeName', () => {
  it('returns an error for empty string', () => {
    expect(validateNodeName('')).not.toBeNull()
  })

  it('returns an error for whitespace-only string', () => {
    expect(validateNodeName('   ')).not.toBeNull()
  })

  it('returns an error when name exceeds 100 characters', () => {
    expect(validateNodeName('a'.repeat(101))).not.toBeNull()
  })

  it('returns null for a valid name', () => {
    expect(validateNodeName('Valid Name')).toBeNull()
  })
})

describe('validateDescription', () => {
  it('returns null for empty string (field is optional)', () => {
    expect(validateDescription('')).toBeNull()
  })

  it('returns an error when description exceeds 500 characters', () => {
    expect(validateDescription('a'.repeat(501))).not.toBeNull()
  })

  it('returns null for a valid description', () => {
    expect(validateDescription('A valid description.')).toBeNull()
  })
})
