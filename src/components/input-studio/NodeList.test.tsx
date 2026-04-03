import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { NodeList } from './NodeList'

const mockNodes = [
  { id: 'node-1', name: 'Workflow Alpha', description: 'First workflow' },
  { id: 'node-2', name: 'Workflow Beta', description: 'Second workflow' },
]

describe('NodeList', () => {
  it('renders each node name', () => {
    render(<NodeList nodes={mockNodes} onDelete={vi.fn()} />)
    expect(screen.getByText('Workflow Alpha')).toBeInTheDocument()
    expect(screen.getByText('Workflow Beta')).toBeInTheDocument()
  })

  it('shows node count', () => {
    render(<NodeList nodes={mockNodes} onDelete={vi.fn()} />)
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('calls onDelete with node id after confirm', async () => {
    const user = userEvent.setup()
    const onDelete = vi.fn()
    render(<NodeList nodes={mockNodes} onDelete={onDelete} />)

    const deleteButtons = screen.getAllByRole('button', { name: /delete/i })
    await user.click(deleteButtons[0])

    const confirmButton = screen.getByRole('button', { name: /confirm delete/i })
    await user.click(confirmButton)

    expect(onDelete).toHaveBeenCalledOnce()
    expect(onDelete).toHaveBeenCalledWith('node-1')
  })

  it('does NOT call onDelete when cancelled', async () => {
    const user = userEvent.setup()
    const onDelete = vi.fn()
    render(<NodeList nodes={mockNodes} onDelete={onDelete} />)

    const deleteButtons = screen.getAllByRole('button', { name: /delete/i })
    await user.click(deleteButtons[0])

    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    await user.click(cancelButton)

    expect(onDelete).not.toHaveBeenCalled()
  })

  it('renders empty state when no nodes', () => {
    render(<NodeList nodes={[]} onDelete={vi.fn()} />)
    expect(screen.getByText('No nodes yet. Add one above.')).toBeInTheDocument()
  })
})
