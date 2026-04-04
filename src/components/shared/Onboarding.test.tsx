import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Onboarding } from './Onboarding'

const STORAGE_KEY = 'context-modeler:onboarding-dismissed'

// Mock target elements for getBoundingClientRect
function createMockTargets() {
  const ids = ['simulation-control', 'triad-heading', 'heatmap-heading', 'tab-input-studio']
  ids.forEach((id) => {
    const el = document.createElement('div')
    el.id = id
    el.getBoundingClientRect = () => ({
      top: 100,
      bottom: 150,
      left: 50,
      right: 200,
      width: 150,
      height: 50,
      x: 50,
      y: 100,
      toJSON: () => ({}),
    })
    el.scrollIntoView = vi.fn()
    document.body.appendChild(el)
  })
}

function cleanupMockTargets() {
  const ids = ['simulation-control', 'triad-heading', 'heatmap-heading', 'tab-input-studio']
  ids.forEach((id) => {
    document.getElementById(id)?.remove()
  })
}

describe('Onboarding', () => {
  beforeEach(() => {
    localStorage.clear()
    cleanupMockTargets()
    createMockTargets()
  })

  it('renders tour when localStorage key is absent', () => {
    render(<Onboarding />)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Simulation Modes')).toBeInTheDocument()
    expect(screen.getByText('1 / 4')).toBeInTheDocument()
  })

  it('does not render when localStorage key is present', () => {
    localStorage.setItem(STORAGE_KEY, 'true')
    render(<Onboarding />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('advances steps on Next click', async () => {
    const user = userEvent.setup()
    render(<Onboarding />)

    expect(screen.getByText('Simulation Modes')).toBeInTheDocument()

    await user.click(screen.getByText('Next'))
    await waitFor(() => expect(screen.getByText('Context Ontology')).toBeInTheDocument())
    expect(screen.getByText('2 / 4')).toBeInTheDocument()

    await user.click(screen.getByText('Next'))
    await waitFor(() => expect(screen.getByText('Friction Heatmap')).toBeInTheDocument())
    expect(screen.getByText('3 / 4')).toBeInTheDocument()
  })

  it('dismisses and sets localStorage on Skip', async () => {
    const user = userEvent.setup()
    render(<Onboarding />)

    await user.click(screen.getByText('Skip tour'))
    expect(localStorage.getItem(STORAGE_KEY)).toBe('true')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('dismisses on final step Done click', async () => {
    const user = userEvent.setup()
    render(<Onboarding />)

    // Advance to last step
    await user.click(screen.getByText('Next'))
    await waitFor(() => expect(screen.getByText('Context Ontology')).toBeInTheDocument())
    await user.click(screen.getByText('Next'))
    await waitFor(() => expect(screen.getByText('Friction Heatmap')).toBeInTheDocument())
    await user.click(screen.getByText('Next'))
    await waitFor(() => expect(screen.getByText('Input Studio')).toBeInTheDocument())

    expect(screen.getByText('Done')).toBeInTheDocument()

    await user.click(screen.getByText('Done'))
    expect(localStorage.getItem(STORAGE_KEY)).toBe('true')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('dismisses on backdrop click', async () => {
    const user = userEvent.setup()
    render(<Onboarding />)

    // Click the backdrop (first child with aria-hidden)
    const backdrop = document.querySelector('[aria-hidden="true"]')
    expect(backdrop).toBeInTheDocument()
    await user.click(backdrop!)
    expect(localStorage.getItem(STORAGE_KEY)).toBe('true')
  })
})
