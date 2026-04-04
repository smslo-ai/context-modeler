import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { AppProvider } from '@/context/AppContext'
import { InputStudio } from './InputStudio'

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
  Toaster: () => null,
}))

function renderWithProvider() {
  return render(
    <AppProvider>
      <InputStudio />
    </AppProvider>,
  )
}

describe('InputStudio integration', () => {
  it('renders all three tabs', () => {
    renderWithProvider()
    expect(screen.getByRole('tab', { name: /workflows/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /systems/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /business users/i })).toBeInTheDocument()
  })

  it('shows workflow form by default', () => {
    renderWithProvider()
    expect(screen.getByLabelText(/workflow name/i)).toBeInTheDocument()
  })

  it('switches to system form on tab click', async () => {
    const user = userEvent.setup()
    renderWithProvider()

    await user.click(screen.getByRole('tab', { name: /systems/i }))

    expect(screen.getByLabelText(/system name/i)).toBeInTheDocument()
  })

  it('switches to persona form on tab click', async () => {
    const user = userEvent.setup()
    renderWithProvider()

    await user.click(screen.getByRole('tab', { name: /business users/i }))

    expect(screen.getByLabelText(/name \/ role/i)).toBeInTheDocument()
  })

  it('adds a workflow and shows it in the node list', async () => {
    const user = userEvent.setup()
    renderWithProvider()

    await user.type(screen.getByLabelText(/workflow name/i), 'Q3 Reporting')
    await user.click(screen.getByRole('button', { name: /\+ add workflow node/i }))

    expect(screen.getByText('Q3 Reporting')).toBeInTheDocument()
  })

  it('validates empty workflow name and shows error', async () => {
    const user = userEvent.setup()
    renderWithProvider()

    await user.click(screen.getByRole('button', { name: /\+ add workflow node/i }))

    expect(screen.getByText('Name is required.')).toBeInTheDocument()
  })
})
