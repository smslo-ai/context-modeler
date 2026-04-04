import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SystemForm } from './SystemForm'

const mockAddNode = vi.fn()
const mockRemoveNode = vi.fn()

vi.mock('@/hooks/useOntology', () => ({
  useOntology: () => ({
    systems: [
      {
        id: 'sys-existing',
        name: 'Existing Sys',
        category: 'storage',
        description: 'd',
        linkedWorkflows: [],
        linkedUsers: [],
      },
    ],
    workflows: [{ id: 'wf-1', name: 'Workflow 1' }],
    personas: [{ id: 'usr-1', name: 'User 1' }],
    addNode: mockAddNode,
    removeNode: mockRemoveNode,
  }),
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('SystemForm', () => {
  it('renders form fields', () => {
    render(<SystemForm />)
    expect(screen.getByLabelText(/system name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/category/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /add system node/i })).toBeInTheDocument()
  })

  it('shows validation errors on empty submit', async () => {
    const user = userEvent.setup()
    render(<SystemForm />)

    await user.click(screen.getByRole('button', { name: /add system node/i }))

    await waitFor(() => {
      expect(screen.getByText(/name is required/i)).toBeInTheDocument()
      expect(screen.getByText(/category is required/i)).toBeInTheDocument()
    })
    expect(mockAddNode).not.toHaveBeenCalled()
  })

  it('submits valid form and calls addNode', async () => {
    const user = userEvent.setup()
    render(<SystemForm />)

    await user.type(screen.getByLabelText(/system name/i), 'New System')
    await user.selectOptions(screen.getByLabelText(/category/i), 'comms')
    await user.click(screen.getByRole('button', { name: /add system node/i }))

    await waitFor(() => {
      expect(mockAddNode).toHaveBeenCalledOnce()
    })
    expect(mockAddNode).toHaveBeenCalledWith(
      'system',
      expect.objectContaining({
        name: 'New System',
        category: 'comms',
      }),
    )
  })

  it('renders existing systems and linked workflow checkboxes', () => {
    render(<SystemForm />)
    expect(screen.getByText('Existing Sys')).toBeInTheDocument()
    expect(screen.getByText('Workflow 1')).toBeInTheDocument()
    expect(screen.getByText('User 1')).toBeInTheDocument()
  })
})
