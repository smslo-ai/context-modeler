/**
 * Central state store for the Context-Aware Workplace Modeler.
 *
 * CONTRACT:
 * - Every state mutation flows through dispatch(eventName, payload).
 * - Components register exactly one listener per event via subscribe().
 * - Components never mutate state directly — they call dispatch().
 * - All event names reference EVENTS.* constants; raw strings are forbidden.
 *
 * State shape:
 * {
 *   ontologyData:        object   — workflows / systems / personas + relationship maps
 *   currentView:        string   — active SPA view key  (default: 'dashboard')
 *   currentMode:        string   — active simulation mode (default: 'morning-triage')
 *   selectedNode:       object|null — currently focused graph node
 *   insightPanelVisible: boolean
 * }
 */

import { EVENTS } from '../constants/events.js'
import { getDefaultData } from '../data/defaults.js'
import { saveToStorage } from './storage.js'

/**
 * Create and return a new store instance seeded with initialData.
 *
 * @param {object} initialData — result of getDefaultData() or loadFromStorage()
 * @returns {{ getState, dispatch, subscribe }}
 */
export function createStore(initialData) {
  // ── Internal mutable state (never exposed directly) ─────────────────────
  let state = {
    ontologyData: initialData,
    currentView: 'dashboard',
    currentMode: 'morning-triage',
    selectedNode: null,
    insightPanelVisible: false,
  }

  // ── Listener registry ────────────────────────────────────────────────────
  const listeners = {}

  // ── Public API ───────────────────────────────────────────────────────────

  /**
   * Register a callback for a specific event.
   * Returns an unsubscribe function for clean teardown.
   *
   * @param {string}   eventName
   * @param {Function} callback  — called with current state object after dispatch
   * @returns {Function} unsubscribe
   */
  function subscribe(eventName, callback) {
    if (!listeners[eventName]) listeners[eventName] = []
    listeners[eventName].push(callback)
    return function unsubscribe() {
      listeners[eventName] = listeners[eventName].filter(cb => cb !== callback)
    }
  }

  /**
   * Return an immutable snapshot of the current state.
   * Top-level object is frozen; ontologyData reference is the live internal
   * object (avoid deep-freezing for performance — callers must not mutate it).
   */
  function getState() {
    return Object.freeze({ ...state, ontologyData: state.ontologyData })
  }

  /**
   * Dispatch an event, update state, then notify all subscribers.
   *
   * @param {string} eventName — use EVENTS.* constants
   * @param {*}      payload   — event-specific data
   */
  function dispatch(eventName, payload) {
    switch (eventName) {

      // ── Navigation ───────────────────────────────────────────────────────
      case EVENTS.VIEW_CHANGED:
        state = { ...state, currentView: payload }
        break

      case EVENTS.MODE_CHANGED:
        state = { ...state, currentMode: payload }
        break

      // ── Selection ────────────────────────────────────────────────────────
      case EVENTS.NODE_SELECTED:
        state = { ...state, selectedNode: payload }
        break

      // ── Ontology mutations ───────────────────────────────────────────────
      case EVENTS.NODE_ADDED: {
        const { nodeType, node } = payload
        const data = state.ontologyData
        let updated

        if (nodeType === 'workflow') {
          updated = { ...data, workflows: [...data.workflows, node] }
        } else if (nodeType === 'system') {
          updated = { ...data, systems: [...data.systems, node] }
        } else if (nodeType === 'persona') {
          updated = { ...data, personas: [...data.personas, node] }
        } else {
          console.warn(`[store] NODE_ADDED: unknown nodeType "${nodeType}"`)
          break
        }

        state = { ...state, ontologyData: updated }
        saveToStorage(state.ontologyData)
        break
      }

      case EVENTS.NODE_REMOVED: {
        const { id: removedId, nodeType } = payload
        const data = state.ontologyData

        // 1. Remove from the typed node array
        const workflows = nodeType === 'workflow'
          ? data.workflows.filter(w => w.id !== removedId)
          : data.workflows
        const systems = nodeType === 'system'
          ? data.systems.filter(s => s.id !== removedId)
          : data.systems
        const personas = nodeType === 'persona'
          ? data.personas.filter(p => p.id !== removedId)
          : data.personas

        // 2. Cascade: contextMap — remove as key AND from every target array
        const contextMap = Object.fromEntries(
          Object.entries(data.contextMap)
            .filter(([key]) => key !== removedId)
            .map(([key, targets]) => [key, targets.filter(t => t !== removedId)])
        )

        // 3. Cascade: frictionRules — exact segment match to avoid prefix collisions
        const frictionRules = Object.fromEntries(
          Object.entries(data.frictionRules).filter(
            ([key]) => !key.startsWith(removedId + '::') && !key.endsWith('::' + removedId)
          )
        )

        // 4. Cascade: linked arrays on remaining workflow / system nodes
        const cleanedWorkflows = workflows.map(w => ({
          ...w,
          linkedSystems: w.linkedSystems?.filter(id => id !== removedId) ?? [],
        }))
        const cleanedSystems = systems.map(s => ({
          ...s,
          linkedWorkflows: s.linkedWorkflows?.filter(id => id !== removedId) ?? [],
          linkedUsers:     s.linkedUsers?.filter(id => id !== removedId) ?? [],
        }))

        // 5. Clear selection if the removed node was selected
        const selectedNode =
          state.selectedNode?.id === removedId ? null : state.selectedNode

        state = {
          ...state,
          selectedNode,
          ontologyData: {
            ...data,
            workflows: cleanedWorkflows,
            systems:   cleanedSystems,
            personas,
            contextMap,
            frictionRules,
          },
        }
        saveToStorage(state.ontologyData)
        break
      }

      case EVENTS.DATA_RESET:
        state = {
          ...state,
          ontologyData: payload?.ontologyData ?? getDefaultData(),
          selectedNode: null,
          currentMode:  'morning-triage',
        }
        saveToStorage(state.ontologyData)
        break

      default:
        console.warn(`[store] Unknown event dispatched: ${eventName}`)
    }

    // Notify direct event listeners
    _notify(eventName)

    // Notify catch-all STATE_CHANGED listeners (skip double-notify if it was STATE_CHANGED itself)
    if (eventName !== EVENTS.STATE_CHANGED) {
      _notify(EVENTS.STATE_CHANGED)
    }
  }

  // ── Internal helpers ─────────────────────────────────────────────────────

  function _notify(eventName) {
    const eventCallbacks = listeners[eventName]
    if (!eventCallbacks) return
    // Pass a frozen snapshot so listeners cannot accidentally mutate state
    const snapshot = getState()
    eventCallbacks.forEach(cb => cb(snapshot))
  }

  return { getState, dispatch, subscribe }
}
