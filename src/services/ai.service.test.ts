import { describe, it, expect, afterEach, vi } from 'vitest'
import { getDefaultData } from '@/data/defaults'
import {
  buildNodeContext,
  buildFrictionContext,
  buildPromptGenContext,
  analyzeNode,
} from '@/services/ai.service'

const data = getDefaultData()

describe('buildNodeContext', () => {
  it('builds context for a workflow with connections, friction, and mode behavior', () => {
    const ctx = buildNodeContext('wf-mgmt-escalations', 'workflow', data)

    expect(ctx.node.id).toBe('wf-mgmt-escalations')
    expect(ctx.node.type).toBe('workflow')
    expect(ctx.node.workflowType).toBe('critical')
    expect(ctx.node.owner).toBe('Director / VP')
    expect(ctx.node.frequency).toBe('ad-hoc')

    // Connections from contextMap
    expect(ctx.connections).toHaveLength(3)
    const connectionIds = ctx.connections.map((c) => c.id)
    expect(connectionIds).toContain('sys-slack-teams')
    expect(connectionIds).toContain('sys-exec-dashboard')
    expect(connectionIds).toContain('usr-firefighter')

    // Friction profile covers all 5 systems
    expect(ctx.frictionProfile).toHaveLength(5)
    const sharepointFriction = ctx.frictionProfile.find((f) => f.pairedNodeId === 'sys-sharepoint')
    expect(sharepointFriction?.score).toBe(0.85)

    // High friction pairs: 0.85 >= 0.75
    expect(ctx.highFrictionPairs.length).toBeGreaterThanOrEqual(1)
    expect(ctx.highFrictionPairs.some((p) => p.systemName === 'Shared Sites (SharePoint)')).toBe(
      true,
    )

    // Mode behavior for all 3 modes
    expect(ctx.modeBehavior).toHaveLength(3)
    const triageBehavior = ctx.modeBehavior.find((m) => m.mode === 'morning-triage')
    expect(triageBehavior?.status).toBe('highlighted')
    const deepFocusBehavior = ctx.modeBehavior.find((m) => m.mode === 'deep-focus')
    expect(deepFocusBehavior?.status).toBe('dimmed')

    // Connection density
    expect(ctx.connectionDensity.count).toBe(3)
    expect(ctx.connectionDensity.average).toBeGreaterThan(0)
  })

  it('builds context for a system with friction from all workflows', () => {
    const ctx = buildNodeContext('sys-jira', 'system', data)

    expect(ctx.node.id).toBe('sys-jira')
    expect(ctx.node.type).toBe('system')
    expect(ctx.node.category).toBe('tracking')

    // System friction profile: one entry per workflow
    expect(ctx.frictionProfile).toHaveLength(5)
    const adminScore = ctx.frictionProfile.find((f) => f.pairedNodeId === 'wf-admin-deadlines')
    expect(adminScore?.score).toBe(0.15)
  })

  it('builds context for a persona with empty friction profile', () => {
    const ctx = buildNodeContext('usr-firefighter', 'persona', data)

    expect(ctx.node.id).toBe('usr-firefighter')
    expect(ctx.node.type).toBe('persona')
    expect(ctx.node.state).toBe('reactive-firefighter')
    expect(ctx.frictionProfile).toHaveLength(0)

    // Connections should still be populated
    expect(ctx.connections.length).toBeGreaterThan(0)
    const connectionIds = ctx.connections.map((c) => c.id)
    expect(connectionIds).toContain('wf-mgmt-escalations')
  })

  it('throws for a nonexistent node', () => {
    expect(() => buildNodeContext('wf-nonexistent', 'workflow', data)).toThrow('Node not found')
  })
})

describe('buildFrictionContext', () => {
  const workflow = data.workflows.find((w) => w.id === 'wf-mgmt-escalations')!
  const system = data.systems.find((s) => s.id === 'sys-sharepoint')!

  it('assigns correct tier labels', () => {
    expect(buildFrictionContext(workflow, system, 0.85, data).tier).toBe('High')
    expect(buildFrictionContext(workflow, system, 0.75, data).tier).toBe('High')
    expect(buildFrictionContext(workflow, system, 0.6, data).tier).toBe('Elevated')
    expect(buildFrictionContext(workflow, system, 0.4, data).tier).toBe('Moderate')
    expect(buildFrictionContext(workflow, system, 0.2, data).tier).toBe('Low')
  })

  it('includes comparative scores excluding the target pair', () => {
    const ctx = buildFrictionContext(workflow, system, 0.85, data)

    // comparativeWorkflowScores: same workflow vs all OTHER systems (4 remaining)
    expect(ctx.comparativeWorkflowScores).toHaveLength(4)
    expect(ctx.comparativeWorkflowScores.every((s) => s.systemName !== system.name)).toBe(true)

    // comparativeSystemScores: same system vs all OTHER workflows (4 remaining)
    expect(ctx.comparativeSystemScores).toHaveLength(4)
    expect(ctx.comparativeSystemScores.every((s) => s.workflowName !== workflow.name)).toBe(true)
  })

  it('finds affected personas connected to workflow or system', () => {
    const ctx = buildFrictionContext(workflow, system, 0.85, data)

    // wf-mgmt-escalations connects to usr-firefighter; sys-sharepoint connects to usr-process-admin
    const names = ctx.affectedPersonas.map((p) => p.name)
    expect(names).toContain('Reactive Firefighter')
    expect(names).toContain('Process Admin')
  })

  it('computes mode overlap for workflow and system', () => {
    const ctx = buildFrictionContext(workflow, system, 0.85, data)

    expect(ctx.modeOverlap).toHaveLength(3)
    const triage = ctx.modeOverlap.find((m) => m.mode === 'morning-triage')
    expect(triage?.workflowStatus).toBe('highlighted')
    expect(triage?.systemStatus).toBe('neutral')
  })
})

describe('buildPromptGenContext', () => {
  const workflow = data.workflows.find((w) => w.id === 'wf-mgmt-escalations')!

  it('returns connected systems resolved from contextMap', () => {
    const ctx = buildPromptGenContext(workflow, data)

    const systemNames = ctx.connectedSystems.map((s) => s.name)
    expect(systemNames).toContain('Comm Hub (Slack/Teams)')
    expect(systemNames).toContain('Exec Dashboard')
  })

  it('returns connected personas (direct and via systems)', () => {
    const ctx = buildPromptGenContext(workflow, data)

    const personaNames = ctx.connectedPersonas.map((p) => p.name)
    expect(personaNames).toContain('Reactive Firefighter')
    // usr-bridge-builder is connected to sys-slack-teams, which is connected to this workflow
    expect(personaNames).toContain('Bridge Builder')
  })

  it('returns friction hotspots sorted descending', () => {
    const ctx = buildPromptGenContext(workflow, data)

    expect(ctx.frictionHotspots.length).toBe(5)
    for (let i = 1; i < ctx.frictionHotspots.length; i++) {
      expect(ctx.frictionHotspots[i - 1]!.score).toBeGreaterThanOrEqual(
        ctx.frictionHotspots[i]!.score,
      )
    }
    // Highest friction for this workflow is sys-sharepoint at 0.85
    expect(ctx.frictionHotspots[0]!.systemName).toBe('Shared Sites (SharePoint)')
  })

  it('includes all mode rules', () => {
    const ctx = buildPromptGenContext(workflow, data)
    expect(Object.keys(ctx.modeRules)).toEqual(['morning-triage', 'deep-focus', 'firefighting'])
  })
})

describe('analyzeNode API calls', () => {
  const nodeCtx = buildNodeContext('wf-mgmt-escalations', 'workflow', data)

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('sends correct payload and returns content', async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({
        content: 'Analysis result',
        model: 'claude-3',
        usage: { input_tokens: 100, output_tokens: 50 },
      }),
    }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse))

    // Need to set the env var for the URL
    vi.stubEnv('VITE_AI_PROXY_URL', 'http://localhost:3001')

    const result = await analyzeNode(nodeCtx)

    expect(result).toBe('Analysis result')
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/analyze'),
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('node-analyzer'),
      }),
    )
  })

  it('throws with retry info on 429 rate limit', async () => {
    const mockResponse = {
      ok: false,
      status: 429,
      json: vi.fn().mockResolvedValue({ retryAfter: 30 }),
    }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse))
    vi.stubEnv('VITE_AI_PROXY_URL', 'http://localhost:3001')

    await expect(analyzeNode(nodeCtx)).rejects.toThrow('Rate limited. Try again in 30 seconds.')
  })

  it('throws on timeout after 10 seconds', async () => {
    vi.useFakeTimers()

    // fetch that never resolves, but respects abort signal
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(
        (_url: string, init: { signal: AbortSignal }) =>
          new Promise((_resolve, reject) => {
            init.signal.addEventListener('abort', () => {
              reject(new DOMException('The operation was aborted.', 'AbortError'))
            })
          }),
      ),
    )
    vi.stubEnv('VITE_AI_PROXY_URL', 'http://localhost:3001')

    // Attach the catch handler immediately to prevent unhandled rejection
    let caughtError: Error | undefined
    const promise = analyzeNode(nodeCtx).catch((err: Error) => {
      caughtError = err
    })

    await vi.advanceTimersByTimeAsync(10_000)
    await promise

    expect(caughtError).toBeDefined()
    expect(caughtError!.message).toBe('Request timed out. Please try again.')

    vi.useRealTimers()
  })

  it('wraps network errors in a user-friendly message', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
    vi.stubEnv('VITE_AI_PROXY_URL', 'http://localhost:3001')

    await expect(analyzeNode(nodeCtx)).rejects.toThrow('Failed to fetch')
  })

  it('handles non-JSON error responses gracefully', async () => {
    const mockResponse = {
      ok: false,
      status: 500,
      json: vi.fn().mockRejectedValue(new Error('not json')),
    }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse))
    vi.stubEnv('VITE_AI_PROXY_URL', 'http://localhost:3001')

    await expect(analyzeNode(nodeCtx)).rejects.toThrow('Unknown error')
  })
})
