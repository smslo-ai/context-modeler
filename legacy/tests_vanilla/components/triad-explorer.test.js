import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { initTriadExplorer, renderNodeCard } from '../../src/components/triad-explorer.js'
import { createStore } from '../../src/state/store.js'
import { EVENTS } from '../../src/constants/events.js'
import { getDefaultData } from '../../src/data/defaults.js'

describe('renderNodeCard', () => {
  it('returns a DOM element', () => {
    const card = renderNodeCard({ id: 'wf-test', name: 'Test WF', type: 'routine', description: 'Desc', frequency: 'weekly' }, 'workflow')
    expect(card instanceof HTMLElement).toBe(true)
  })

  it('card textContent includes node name', () => {
    const card = renderNodeCard({ id: 'wf-test', name: 'My Workflow', type: 'routine', description: '', frequency: 'daily' }, 'workflow')
    expect(card.textContent).toContain('My Workflow')
  })

  it('does not put XSS script tags into innerHTML via name', () => {
    const card = renderNodeCard({ id: 'wf-xss', name: '<script>evil()</script>', type: 'routine', description: '', frequency: 'daily' }, 'workflow')
    expect(card.innerHTML).not.toContain('<script>')
  })

  it('uses data-node-id attribute', () => {
    const card = renderNodeCard({ id: 'wf-abc', name: 'ABC', type: 'routine', description: '', frequency: 'daily' }, 'workflow')
    expect(card.getAttribute('data-node-id')).toBe('wf-abc')
  })
})

describe('initTriadExplorer', () => {
  let store

  beforeEach(() => {
    ['col-workflows', 'col-systems', 'col-personas', 'node-counter'].forEach(id => {
      const el = document.createElement('div')
      el.id = id
      document.body.appendChild(el)
    })
    store = createStore(getDefaultData())
  })

  afterEach(() => {
    ['col-workflows', 'col-systems', 'col-personas', 'node-counter'].forEach(id => {
      const el = document.getElementById(id)
      if (el) document.body.removeChild(el)
    })
  })

  it('renders workflow cards into #col-workflows', () => {
    initTriadExplorer(store)
    expect(document.getElementById('col-workflows').children.length).toBe(5)
  })

  it('renders system cards into #col-systems', () => {
    initTriadExplorer(store)
    expect(document.getElementById('col-systems').children.length).toBe(5)
  })

  it('renders persona cards into #col-personas', () => {
    initTriadExplorer(store)
    expect(document.getElementById('col-personas').children.length).toBe(4)
  })

  it('updates node-counter to total count', () => {
    initTriadExplorer(store)
    const counter = document.getElementById('node-counter')
    expect(counter.textContent).toContain('14')
  })

  it('re-renders when NODE_ADDED is dispatched', () => {
    initTriadExplorer(store)
    store.dispatch(EVENTS.NODE_ADDED, {
      nodeType: 'workflow',
      node: { id: 'wf-new', name: 'New WF', type: 'routine', description: '', owner: '', frequency: 'daily', linkedSystems: [] }
    })
    expect(document.getElementById('col-workflows').children.length).toBe(6)
  })

  it('dispatches NODE_SELECTED when card is clicked', () => {
    initTriadExplorer(store)
    const firstCard = document.getElementById('col-workflows').children[0]
    firstCard.click()
    expect(store.getState().selectedNode).not.toBeNull()
  })
})
