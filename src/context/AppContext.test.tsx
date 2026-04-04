import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { AppProvider, useApp } from './AppContext'
import { getDefaultData } from '../data/defaults'
import type { OntologyData, Workflow, System, Persona } from '../types'

function renderWithProvider(initialData?: OntologyData) {
  return renderHook(() => useApp(), {
    wrapper: ({ children }) => <AppProvider initialData={initialData}>{children}</AppProvider>,
  })
}

const testWorkflow: Workflow = {
  id: 'wf-test',
  name: 'Test Workflow',
  type: 'routine',
  description: 'test',
  owner: 'owner',
  frequency: 'daily',
  linkedSystems: ['sys-a'],
}

const testSystem: System = {
  id: 'sys-test',
  name: 'Test System',
  category: 'storage',
  description: 'test',
  linkedWorkflows: ['wf-test'],
  linkedUsers: ['usr-test'],
}

const testPersona: Persona = {
  id: 'usr-test',
  name: 'Test User',
  state: 'reactive-firefighter',
  description: 'test',
}

describe('AppContext', () => {
  describe('useApp outside provider', () => {
    it('throws when used outside AppProvider', () => {
      // Suppress console.error for expected throw
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
      expect(() => renderHook(() => useApp())).toThrow('useApp must be used within AppProvider')
      spy.mockRestore()
    })
  })

  describe('initial state', () => {
    it('provides default data', () => {
      const { result } = renderWithProvider()
      expect(result.current.currentView).toBe('dashboard')
      expect(result.current.currentMode).toBe('morning-triage')
      expect(result.current.selectedNode).toBeNull()
      expect(result.current.ontologyData.workflows.length).toBeGreaterThan(0)
    })

    it('accepts custom initial data', () => {
      const custom: OntologyData = {
        workflows: [testWorkflow],
        systems: [],
        personas: [],
        contextMap: {},
        frictionRules: {},
        modeRules: {},
      }
      const { result } = renderWithProvider(custom)
      expect(result.current.ontologyData.workflows).toHaveLength(1)
      expect(result.current.ontologyData.workflows[0]!.id).toBe('wf-test')
    })
  })

  describe('SET_VIEW', () => {
    it('changes the current view', () => {
      const { result } = renderWithProvider()
      act(() => result.current.dispatch({ type: 'SET_VIEW', payload: 'input-studio' }))
      expect(result.current.currentView).toBe('input-studio')
    })
  })

  describe('SET_MODE', () => {
    it('changes the simulation mode', () => {
      const { result } = renderWithProvider()
      act(() => result.current.dispatch({ type: 'SET_MODE', payload: 'deep-focus' }))
      expect(result.current.currentMode).toBe('deep-focus')
    })
  })

  describe('SELECT_NODE', () => {
    it('selects a node', () => {
      const { result } = renderWithProvider()
      act(() =>
        result.current.dispatch({
          type: 'SELECT_NODE',
          payload: { id: 'wf-test', type: 'workflow' },
        }),
      )
      expect(result.current.selectedNode).toEqual({ id: 'wf-test', type: 'workflow' })
    })

    it('clears selection with null', () => {
      const { result } = renderWithProvider()
      act(() =>
        result.current.dispatch({
          type: 'SELECT_NODE',
          payload: { id: 'wf-test', type: 'workflow' },
        }),
      )
      act(() => result.current.dispatch({ type: 'SELECT_NODE', payload: null }))
      expect(result.current.selectedNode).toBeNull()
    })
  })

  describe('ADD_NODE', () => {
    it('adds a workflow', () => {
      const { result } = renderWithProvider({
        ...getDefaultData(),
        workflows: [],
        systems: [],
        personas: [],
      })
      act(() =>
        result.current.dispatch({
          type: 'ADD_NODE',
          payload: { nodeType: 'workflow', node: testWorkflow },
        }),
      )
      expect(result.current.ontologyData.workflows).toHaveLength(1)
      expect(result.current.ontologyData.workflows[0]!.id).toBe('wf-test')
    })

    it('adds a system', () => {
      const { result } = renderWithProvider({
        ...getDefaultData(),
        workflows: [],
        systems: [],
        personas: [],
      })
      act(() =>
        result.current.dispatch({
          type: 'ADD_NODE',
          payload: { nodeType: 'system', node: testSystem },
        }),
      )
      expect(result.current.ontologyData.systems).toHaveLength(1)
    })

    it('adds a persona', () => {
      const { result } = renderWithProvider({
        ...getDefaultData(),
        workflows: [],
        systems: [],
        personas: [],
      })
      act(() =>
        result.current.dispatch({
          type: 'ADD_NODE',
          payload: { nodeType: 'persona', node: testPersona },
        }),
      )
      expect(result.current.ontologyData.personas).toHaveLength(1)
    })
  })

  describe('REMOVE_NODE', () => {
    const initialData: OntologyData = {
      workflows: [testWorkflow],
      systems: [testSystem],
      personas: [testPersona],
      contextMap: {
        'wf-test': ['sys-test'],
        'sys-test': ['wf-test', 'usr-test'],
      },
      frictionRules: {
        'wf-test::sys-test': 0.75,
      },
      modeRules: {},
    }

    it('removes a workflow and cascades to contextMap', () => {
      const { result } = renderWithProvider(initialData)
      act(() =>
        result.current.dispatch({
          type: 'REMOVE_NODE',
          payload: { id: 'wf-test', nodeType: 'workflow' },
        }),
      )
      expect(result.current.ontologyData.workflows).toHaveLength(0)
      // contextMap entry for wf-test should be gone
      expect(result.current.ontologyData.contextMap['wf-test']).toBeUndefined()
      // wf-test should be removed from sys-test's adjacency list
      expect(result.current.ontologyData.contextMap['sys-test']).not.toContain('wf-test')
    })

    it('removes a workflow and cascades to frictionRules', () => {
      const { result } = renderWithProvider(initialData)
      act(() =>
        result.current.dispatch({
          type: 'REMOVE_NODE',
          payload: { id: 'wf-test', nodeType: 'workflow' },
        }),
      )
      expect(result.current.ontologyData.frictionRules['wf-test::sys-test']).toBeUndefined()
    })

    it('removes a system and cleans linkedWorkflows on remaining systems', () => {
      const { result } = renderWithProvider(initialData)
      act(() =>
        result.current.dispatch({
          type: 'REMOVE_NODE',
          payload: { id: 'sys-test', nodeType: 'system' },
        }),
      )
      expect(result.current.ontologyData.systems).toHaveLength(0)
      // sys-test should be cleaned from workflow's linkedSystems
      expect(result.current.ontologyData.workflows[0]!.linkedSystems).not.toContain('sys-test')
    })

    it('removes a persona and cleans linkedUsers on systems', () => {
      const { result } = renderWithProvider(initialData)
      act(() =>
        result.current.dispatch({
          type: 'REMOVE_NODE',
          payload: { id: 'usr-test', nodeType: 'persona' },
        }),
      )
      expect(result.current.ontologyData.personas).toHaveLength(0)
      expect(result.current.ontologyData.systems[0]!.linkedUsers).not.toContain('usr-test')
    })

    it('clears selectedNode when the selected node is removed', () => {
      const { result } = renderWithProvider(initialData)
      act(() =>
        result.current.dispatch({
          type: 'SELECT_NODE',
          payload: { id: 'wf-test', type: 'workflow' },
        }),
      )
      expect(result.current.selectedNode).not.toBeNull()
      act(() =>
        result.current.dispatch({
          type: 'REMOVE_NODE',
          payload: { id: 'wf-test', nodeType: 'workflow' },
        }),
      )
      expect(result.current.selectedNode).toBeNull()
    })

    it('preserves selectedNode when a different node is removed', () => {
      const { result } = renderWithProvider(initialData)
      act(() =>
        result.current.dispatch({
          type: 'SELECT_NODE',
          payload: { id: 'sys-test', type: 'system' },
        }),
      )
      act(() =>
        result.current.dispatch({
          type: 'REMOVE_NODE',
          payload: { id: 'wf-test', nodeType: 'workflow' },
        }),
      )
      expect(result.current.selectedNode).toEqual({ id: 'sys-test', type: 'system' })
    })

    it('removes frictionRules where deleted node is the system side', () => {
      const { result } = renderWithProvider(initialData)
      act(() =>
        result.current.dispatch({
          type: 'REMOVE_NODE',
          payload: { id: 'sys-test', nodeType: 'system' },
        }),
      )
      expect(Object.keys(result.current.ontologyData.frictionRules)).toHaveLength(0)
    })
  })

  describe('RESET_DATA', () => {
    it('resets to defaults without payload', () => {
      const { result } = renderWithProvider()
      // Change state first
      act(() => result.current.dispatch({ type: 'SET_MODE', payload: 'firefighting' }))
      act(() =>
        result.current.dispatch({
          type: 'SELECT_NODE',
          payload: { id: 'wf-test', type: 'workflow' },
        }),
      )
      // Reset
      act(() => result.current.dispatch({ type: 'RESET_DATA' }))
      expect(result.current.currentMode).toBe('morning-triage')
      expect(result.current.selectedNode).toBeNull()
      expect(result.current.ontologyData).toEqual(getDefaultData())
    })

    it('resets to provided data with payload', () => {
      const custom: OntologyData = {
        workflows: [testWorkflow],
        systems: [],
        personas: [],
        contextMap: {},
        frictionRules: {},
        modeRules: {},
      }
      const { result } = renderWithProvider()
      act(() => result.current.dispatch({ type: 'RESET_DATA', payload: { ontologyData: custom } }))
      expect(result.current.ontologyData.workflows).toHaveLength(1)
      expect(result.current.selectedNode).toBeNull()
      expect(result.current.currentMode).toBe('morning-triage')
    })
  })

  describe('SET_ONTOLOGY_DATA', () => {
    it('replaces ontology data', () => {
      const custom: OntologyData = {
        workflows: [],
        systems: [testSystem],
        personas: [],
        contextMap: {},
        frictionRules: {},
        modeRules: {},
      }
      const { result } = renderWithProvider()
      act(() => result.current.dispatch({ type: 'SET_ONTOLOGY_DATA', payload: custom }))
      expect(result.current.ontologyData.workflows).toHaveLength(0)
      expect(result.current.ontologyData.systems).toHaveLength(1)
    })
  })
})
