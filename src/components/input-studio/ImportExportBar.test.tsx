import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ImportExportBar } from './ImportExportBar'
import { toast } from 'sonner'

// Mock useOntology so tests don't need AppProvider
const mockResetData = vi.fn()
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
  }),
}))

const mockDispatch = vi.fn()
vi.mock('@/context/AppContext', () => ({
  useApp: () => ({ dispatch: mockDispatch }),
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
  })

  it('does NOT reset when cancelled', async () => {
    const user = userEvent.setup()
    render(<ImportExportBar />)

    await user.click(screen.getByRole('button', { name: /reset to defaults/i }))
    const cancelButton = await screen.findByRole('button', { name: /cancel/i })
    await user.click(cancelButton)

    expect(mockResetData).not.toHaveBeenCalled()
  })

  it('exports data as JSON download', async () => {
    const user = userEvent.setup()
    const mockClick = vi.fn()
    const originalCreateElement = document.createElement.bind(document)

    // Only intercept anchor creation
    vi.spyOn(document, 'createElement').mockImplementation(
      (tag: string, options?: ElementCreationOptions) => {
        if (tag === 'a') {
          const el = originalCreateElement(tag, options)
          el.click = mockClick
          return el
        }
        return originalCreateElement(tag, options)
      },
    )

    render(<ImportExportBar />)
    await user.click(screen.getByRole('button', { name: /export json/i }))

    expect(mockClick).toHaveBeenCalledOnce()
    expect(toast.success).toHaveBeenCalledWith('Data exported')

    vi.restoreAllMocks()
  })

  it('imports valid JSON and dispatches SET_ONTOLOGY_DATA', async () => {
    const user = userEvent.setup()
    render(<ImportExportBar />)

    const validData = {
      workflows: [
        {
          id: 'wf-1',
          name: 'W',
          type: 'routine',
          description: 'd',
          owner: 'o',
          frequency: 'daily',
          linkedSystems: [],
        },
      ],
      systems: [
        {
          id: 'sys-1',
          name: 'S',
          category: 'storage',
          description: 'd',
          linkedWorkflows: [],
          linkedUsers: [],
        },
      ],
      personas: [{ id: 'usr-1', name: 'U', state: 's', description: 'd' }],
      contextMap: {},
      frictionRules: {},
      modeRules: {},
    }
    const file = new File([JSON.stringify(validData)], 'test.json', { type: 'application/json' })

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    await user.upload(fileInput, file)

    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'SET_ONTOLOGY_DATA',
        payload: validData,
      })
    })
    expect(toast.success).toHaveBeenCalledWith('Data imported')
  })

  it('shows error toast on invalid JSON import', async () => {
    const user = userEvent.setup()
    render(<ImportExportBar />)

    const file = new File(['not json'], 'bad.json', { type: 'application/json' })
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    await user.upload(fileInput, file)

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to parse JSON file')
    })
  })

  it('shows error toast on structurally invalid data', async () => {
    const user = userEvent.setup()
    render(<ImportExportBar />)

    const file = new File([JSON.stringify({ workflows: 'bad' })], 'bad.json', {
      type: 'application/json',
    })
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    await user.upload(fileInput, file)

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Invalid data format. Check the JSON structure.')
    })
  })
})
