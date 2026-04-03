import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect } from 'vitest'
import { AppProvider } from '@/context/AppContext'
import { SimulationControl } from './SimulationControl'

function renderWithProvider() {
  return render(
    <AppProvider>
      <SimulationControl />
    </AppProvider>,
  )
}

describe('SimulationControl', () => {
  it('renders three mode cards', () => {
    renderWithProvider()
    expect(screen.getByText('Morning Triage')).toBeInTheDocument()
    expect(screen.getByText('Deep Focus')).toBeInTheDocument()
    expect(screen.getByText('Firefighting')).toBeInTheDocument()
  })

  it('has radiogroup role', () => {
    renderWithProvider()
    expect(screen.getByRole('radiogroup')).toBeInTheDocument()
  })

  it('marks default mode as checked', () => {
    renderWithProvider()
    const radios = screen.getAllByRole('radio')
    expect(radios[0]).toHaveAttribute('aria-checked', 'true')
  })

  it('switches mode on click', async () => {
    const user = userEvent.setup()
    renderWithProvider()
    const deepFocus = screen.getByText('Deep Focus').closest('button')!
    await user.click(deepFocus)
    const radios = screen.getAllByRole('radio')
    expect(radios[1]).toHaveAttribute('aria-checked', 'true')
    expect(radios[0]).toHaveAttribute('aria-checked', 'false')
  })
})
