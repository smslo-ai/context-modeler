import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect } from 'vitest'
import { AppProvider } from '@/context/AppContext'
import { NodeCard } from './NodeCard'
import type { Workflow, System, Persona } from '@/types'

const mockWorkflow: Workflow = {
  id: 'wf-test',
  name: 'Test Workflow',
  type: 'routine',
  description: 'A test workflow',
  owner: 'Tester',
  frequency: 'weekly',
  linkedSystems: [],
}

const mockSystem: System = {
  id: 'sys-test',
  name: 'Test System',
  category: 'comms',
  description: 'A test system',
  linkedWorkflows: [],
  linkedUsers: [],
}

const mockPersona: Persona = {
  id: 'usr-test',
  name: 'Test Persona',
  state: 'test-state',
  description: 'A test persona',
}

function renderWithProvider(ui: React.ReactElement) {
  return render(<AppProvider>{ui}</AppProvider>)
}

describe('NodeCard', () => {
  it('renders workflow name and frequency badge', () => {
    renderWithProvider(<NodeCard node={mockWorkflow} nodeType="workflow" />)
    expect(screen.getByText('Test Workflow')).toBeInTheDocument()
    expect(screen.getByText('weekly')).toBeInTheDocument()
  })

  it('renders system name and category badge', () => {
    renderWithProvider(<NodeCard node={mockSystem} nodeType="system" />)
    expect(screen.getByText('Test System')).toBeInTheDocument()
    expect(screen.getByText('comms')).toBeInTheDocument()
  })

  it('renders persona name without badge', () => {
    renderWithProvider(<NodeCard node={mockPersona} nodeType="persona" />)
    expect(screen.getByText('Test Persona')).toBeInTheDocument()
    expect(screen.queryByText('test-state')).not.toBeInTheDocument()
  })

  it('toggles aria-pressed on click', async () => {
    const user = userEvent.setup()
    renderWithProvider(<NodeCard node={mockWorkflow} nodeType="workflow" />)
    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('aria-pressed', 'false')
    await user.click(button)
    expect(button).toHaveAttribute('aria-pressed', 'true')
  })

  it('selects on Enter key', async () => {
    const user = userEvent.setup()
    renderWithProvider(<NodeCard node={mockWorkflow} nodeType="workflow" />)
    const button = screen.getByRole('button')
    button.focus()
    await user.keyboard('{Enter}')
    expect(button).toHaveAttribute('aria-pressed', 'true')
  })
})
