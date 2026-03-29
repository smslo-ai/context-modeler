import { describe, it, expect, vi } from 'vitest'
import { createStore } from '../../src/state/store.js'
import { EVENTS } from '../../src/constants/events.js'
import { getDefaultData } from '../../src/data/defaults.js'

describe('createStore', () => {
  it('initializes with provided data', () => {
    const store = createStore(getDefaultData())
    const state = store.getState()
    expect(state.ontologyData.workflows).toHaveLength(5)
    expect(state.currentView).toBe('dashboard')
    expect(state.currentMode).toBe('morning-triage')
    expect(state.selectedNode).toBeNull()
  })

  it('getState returns a frozen snapshot', () => {
    const store = createStore(getDefaultData())
    const state = store.getState()
    expect(Object.isFrozen(state)).toBe(true)
  })

  it('mutations to getState snapshot do not affect store', () => {
    const store = createStore(getDefaultData())
    const state = store.getState()
    // Should not throw (frozen) but even if it did, store should be unaffected
    try { state.currentView = 'input-studio' } catch {}
    expect(store.getState().currentView).toBe('dashboard')
  })

  it('subscribe + dispatch triggers callback', () => {
    const store = createStore(getDefaultData())
    const cb = vi.fn()
    store.subscribe(EVENTS.VIEW_CHANGED, cb)
    store.dispatch(EVENTS.VIEW_CHANGED, 'input-studio')
    expect(cb).toHaveBeenCalledOnce()
  })

  it('unsubscribe stops callbacks', () => {
    const store = createStore(getDefaultData())
    const cb = vi.fn()
    const unsub = store.subscribe(EVENTS.VIEW_CHANGED, cb)
    unsub()
    store.dispatch(EVENTS.VIEW_CHANGED, 'input-studio')
    expect(cb).not.toHaveBeenCalled()
  })

  it('VIEW_CHANGED updates currentView', () => {
    const store = createStore(getDefaultData())
    store.dispatch(EVENTS.VIEW_CHANGED, 'input-studio')
    expect(store.getState().currentView).toBe('input-studio')
  })

  it('MODE_CHANGED updates currentMode', () => {
    const store = createStore(getDefaultData())
    store.dispatch(EVENTS.MODE_CHANGED, 'deep-focus')
    expect(store.getState().currentMode).toBe('deep-focus')
  })

  it('NODE_SELECTED updates selectedNode', () => {
    const store = createStore(getDefaultData())
    store.dispatch(EVENTS.NODE_SELECTED, { id: 'wf-mgmt-escalations', type: 'workflow' })
    expect(store.getState().selectedNode).toEqual({ id: 'wf-mgmt-escalations', type: 'workflow' })
  })

  it('NODE_ADDED adds workflow to workflows array', () => {
    const store = createStore(getDefaultData())
    store.dispatch(EVENTS.NODE_ADDED, {
      nodeType: 'workflow',
      node: { id: 'wf-new', name: 'New Workflow', type: 'routine', description: '', owner: '', frequency: 'daily', linkedSystems: [] }
    })
    expect(store.getState().ontologyData.workflows).toHaveLength(6)
  })

  it('NODE_ADDED adds system to systems array', () => {
    const store = createStore(getDefaultData())
    store.dispatch(EVENTS.NODE_ADDED, {
      nodeType: 'system',
      node: { id: 'sys-new', name: 'New System', category: 'comms', description: '', linkedWorkflows: [], linkedUsers: [] }
    })
    expect(store.getState().ontologyData.systems).toHaveLength(6)
  })

  it('NODE_REMOVED removes workflow from workflows array', () => {
    const store = createStore(getDefaultData())
    store.dispatch(EVENTS.NODE_REMOVED, { id: 'wf-mgmt-escalations', nodeType: 'workflow' })
    expect(store.getState().ontologyData.workflows).toHaveLength(4)
    expect(store.getState().ontologyData.workflows.find(w => w.id === 'wf-mgmt-escalations')).toBeUndefined()
  })

  it('NODE_REMOVED cascades: removes node from contextMap sources', () => {
    const store = createStore(getDefaultData())
    store.dispatch(EVENTS.NODE_REMOVED, { id: 'wf-mgmt-escalations', nodeType: 'workflow' })
    expect(store.getState().ontologyData.contextMap).not.toHaveProperty('wf-mgmt-escalations')
  })

  it('NODE_REMOVED cascades: removes node from contextMap target arrays', () => {
    const store = createStore(getDefaultData())
    store.dispatch(EVENTS.NODE_REMOVED, { id: 'wf-mgmt-escalations', nodeType: 'workflow' })
    const cm = store.getState().ontologyData.contextMap
    Object.values(cm).forEach(targets => {
      expect(targets).not.toContain('wf-mgmt-escalations')
    })
  })

  it('NODE_REMOVED cascades: removes frictionRules keys with removed node', () => {
    const store = createStore(getDefaultData())
    store.dispatch(EVENTS.NODE_REMOVED, { id: 'wf-mgmt-escalations', nodeType: 'workflow' })
    const fr = store.getState().ontologyData.frictionRules
    Object.keys(fr).forEach(key => {
      expect(key).not.toContain('wf-mgmt-escalations')
    })
  })

  it('NODE_REMOVED: node with no relationships removes cleanly', () => {
    const store = createStore(getDefaultData())
    store.dispatch(EVENTS.NODE_ADDED, {
      nodeType: 'persona',
      node: { id: 'usr-isolated', name: 'Isolated', state: 'process-admin', description: '' }
    })
    expect(() => store.dispatch(EVENTS.NODE_REMOVED, { id: 'usr-isolated', nodeType: 'persona' })).not.toThrow()
  })

  it('DATA_RESET restores defaults', () => {
    const store = createStore(getDefaultData())
    store.dispatch(EVENTS.NODE_REMOVED, { id: 'wf-mgmt-escalations', nodeType: 'workflow' })
    store.dispatch(EVENTS.DATA_RESET)
    expect(store.getState().ontologyData.workflows).toHaveLength(5)
  })
})
