import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PersonaForm } from './PersonaForm'

const mockAddNode = vi.fn()
const mockRemoveNode = vi.fn()
const mockPersonas = [
  { id: 'usr-existing', name: 'Existing User', state: 'reactive-firefighter', description: 'desc' },
]

vi.mock('@/hooks/useOntology', () => ({
  useOntology: () => ({
    personas: mockPersonas,
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

describe('PersonaForm', () => {
  it('renders form fields', () => {
    render(<PersonaForm />)
    expect(screen.getByLabelText(/name \/ role/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/persona state/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/role description/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /add user node/i })).toBeInTheDocument()
  })

  it('shows validation error on empty name submit', async () => {
    const user = userEvent.setup()
    render(<PersonaForm />)

    await user.click(screen.getByRole('button', { name: /add user node/i }))

    await waitFor(() => {
      expect(screen.getByText(/name is required/i)).toBeInTheDocument()
    })
    expect(mockAddNode).not.toHaveBeenCalled()
  })

  it('submits valid form and calls addNode', async () => {
    const user = userEvent.setup()
    render(<PersonaForm />)

    await user.type(screen.getByLabelText(/name \/ role/i), 'Test Persona')
    await user.click(screen.getByRole('button', { name: /add user node/i }))

    await waitFor(() => {
      expect(mockAddNode).toHaveBeenCalledOnce()
    })
    expect(mockAddNode).toHaveBeenCalledWith(
      'persona',
      expect.objectContaining({
        name: 'Test Persona',
        state: 'reactive-firefighter',
      }),
    )
  })

  it('renders existing personas in the list', () => {
    render(<PersonaForm />)
    expect(screen.getByText('Existing User')).toBeInTheDocument()
  })
})
