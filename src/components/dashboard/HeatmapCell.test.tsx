import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { HeatmapCell } from './HeatmapCell'

function renderCell(score = 0.5, onClick = vi.fn()) {
  return render(
    <table>
      <tbody>
        <tr>
          <HeatmapCell
            score={score}
            workflowId="wf-test"
            workflowName="Test Workflow"
            systemId="sys-test"
            systemName="Test System"
            onClick={onClick}
          />
        </tr>
      </tbody>
    </table>,
  )
}

describe('HeatmapCell', () => {
  it('renders score as percentage', () => {
    renderCell(0.85)
    expect(screen.getByText('85')).toBeInTheDocument()
  })

  it('applies low friction color for score < 0.35', () => {
    renderCell(0.2)
    const cell = screen.getByRole('button')
    expect(cell.className).toContain('bg-secondary/30')
  })

  it('applies high friction color for score >= 0.75', () => {
    renderCell(0.9)
    const cell = screen.getByRole('button')
    expect(cell.className).toContain('bg-destructive/40')
  })

  it('calls onClick on click', async () => {
    const onClick = vi.fn()
    const user = userEvent.setup()
    renderCell(0.5, onClick)
    await user.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('calls onClick on Enter key', async () => {
    const onClick = vi.fn()
    const user = userEvent.setup()
    renderCell(0.5, onClick)
    const cell = screen.getByRole('button')
    cell.focus()
    await user.keyboard('{Enter}')
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('has correct aria-label', () => {
    renderCell(0.85)
    expect(screen.getByRole('button')).toHaveAttribute(
      'aria-label',
      'Test Workflow and Test System: 85% friction',
    )
  })

  it('has data attributes', () => {
    renderCell(0.5)
    const cell = screen.getByRole('button')
    expect(cell).toHaveAttribute('data-workflow', 'wf-test')
    expect(cell).toHaveAttribute('data-system', 'sys-test')
  })
})
