import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ImportExportBar } from './ImportExportBar'

// Mock useOntology so tests don't need AppProvider
const mockResetData = vi.fn()
const mockSaveData = vi.fn()
const mockOntologyData = {
  workflows: [],
  systems: [],
  personas: [],
  contextMap: {},
  frictionRules: {},
  modeRules: {},
}

vi.mock('@/hooks/useOntology', () => ({
  useOntology: () => ({
    ontologyData: mockOntologyData,
    resetData: mockResetData,
    saveData: mockSaveData,
  }),
}))

vi.mock('@/context/AppContext', () => ({
  useApp: () => ({ dispatch: vi.fn() }),
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('ImportExportBar', () => {
  it('renders export, import, and reset buttons', () => {
    render(<ImportExportBar />)
    expect(screen.getByRole('button', { name: /export json/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /import json/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /reset to defaults/i })).toBeInTheDocument()
  })

  it('resets data after confirmation', async () => {
    const user = userEvent.setup()
    render(<ImportExportBar />)

    await user.click(screen.getByRole('button', { name: /reset to defaults/i }))
    const confirmButton = await screen.findByRole('button', { name: /confirm reset/i })
    await user.click(confirmButton)

    expect(mockResetData).toHaveBeenCalledOnce()
    expect(mockSaveData).toHaveBeenCalledOnce()
  })

  it('does NOT reset when cancelled', async () => {
    const user = userEvent.setup()
    render(<ImportExportBar />)

    await user.click(screen.getByRole('button', { name: /reset to defaults/i }))
    const cancelButton = await screen.findByRole('button', { name: /cancel/i })
    await user.click(cancelButton)

    expect(mockResetData).not.toHaveBeenCalled()
    expect(mockSaveData).not.toHaveBeenCalled()
  })
})
