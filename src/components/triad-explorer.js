import { EVENTS } from '../constants/events.js'
import { getSimulationVisuals } from '../utils/heuristics.js'

export function renderNodeCard(node, nodeType) {
  const item = document.createElement('div')
  item.className = 'triad-item p-4 cursor-pointer hover:bg-slate-50 transition-all duration-200'
  item.setAttribute('data-node-id', node.id)
  item.setAttribute('data-node-type', nodeType)
  item.setAttribute('tabindex', '0')
  item.setAttribute('role', 'button')

  const header = document.createElement('div')
  header.className = 'flex items-center justify-between'

  const nameSpan = document.createElement('span')
  nameSpan.className = 'font-medium text-sm text-slate-800'
  nameSpan.textContent = node.name  // textContent is XSS-safe

  header.appendChild(nameSpan)

  // Badge: workflows show frequency, systems show category, personas have no badge
  if (nodeType === 'workflow' && node.frequency) {
    const badge = document.createElement('span')
    badge.className = 'text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded uppercase'
    badge.textContent = node.frequency
    header.appendChild(badge)
  } else if (nodeType === 'system' && node.category) {
    const badge = document.createElement('span')
    badge.className = 'text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded uppercase'
    badge.textContent = node.category
    header.appendChild(badge)
  }

  item.appendChild(header)

  if (node.description) {
    const desc = document.createElement('p')
    desc.className = 'text-xs text-slate-400 mt-1'
    desc.textContent = node.description  // textContent is XSS-safe
    item.appendChild(desc)
  }

  return item
}

export function initTriadExplorer(store) {
  const colWorkflows = document.getElementById('col-workflows')
  const colSystems = document.getElementById('col-systems')
  const colPersonas = document.getElementById('col-personas')
  const nodeCounter = document.getElementById('node-counter')

  if (!colWorkflows || !colSystems || !colPersonas) return

  // Attach delegated event handlers once per column — avoids O(n) per-card listener setup on every render
  ;[colWorkflows, colSystems, colPersonas].forEach(col => {
    col.addEventListener('click', (e) => {
      const card = e.target.closest('[data-node-id]')
      if (!card) return
      store.dispatch(EVENTS.NODE_SELECTED, { id: card.dataset.nodeId, type: card.dataset.nodeType })
    })
    col.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return
      const card = e.target.closest('[data-node-id]')
      if (!card) return
      e.preventDefault()
      store.dispatch(EVENTS.NODE_SELECTED, { id: card.dataset.nodeId, type: card.dataset.nodeType })
    })
  })

  function applySimVisuals(items, nodes, mode, modeRules) {
    items.forEach((item, i) => {
      const node = nodes[i]
      if (!node) return
      const { dimmed, highlighted } = getSimulationVisuals(node, mode, modeRules)
      item.classList.toggle('opacity-30', dimmed)
      item.classList.toggle('ring-2', highlighted)
      item.classList.toggle('ring-indigo-500', highlighted)
    })
  }

  function render() {
    const state = store.getState()
    const { workflows, systems, personas, modeRules } = state.ontologyData
    const { currentMode, selectedNode } = state

    // Render workflows
    colWorkflows.innerHTML = ''
    workflows.forEach(wf => {
      const card = renderNodeCard(wf, 'workflow')
      if (selectedNode?.id === wf.id) card.classList.add('bg-indigo-50', 'ring-1', 'ring-indigo-300')
      colWorkflows.appendChild(card)
    })

    // Render systems
    colSystems.innerHTML = ''
    systems.forEach(sys => {
      const card = renderNodeCard(sys, 'system')
      if (selectedNode?.id === sys.id) card.classList.add('bg-indigo-50', 'ring-1', 'ring-indigo-300')
      colSystems.appendChild(card)
    })

    // Render personas
    colPersonas.innerHTML = ''
    personas.forEach(persona => {
      const card = renderNodeCard(persona, 'persona')
      if (selectedNode?.id === persona.id) card.classList.add('bg-indigo-50', 'ring-1', 'ring-indigo-300')
      colPersonas.appendChild(card)
    })

    // Apply simulation visuals
    applySimVisuals(Array.from(colWorkflows.children), workflows, currentMode, modeRules)
    applySimVisuals(Array.from(colSystems.children), systems, currentMode, modeRules)
    applySimVisuals(Array.from(colPersonas.children), personas, currentMode, modeRules)

    // Update node counter
    if (nodeCounter) {
      nodeCounter.textContent = `${workflows.length + systems.length + personas.length} Nodes Loaded`
    }
  }

  render()

  store.subscribe(EVENTS.NODE_ADDED, render)
  store.subscribe(EVENTS.NODE_REMOVED, render)
  store.subscribe(EVENTS.DATA_RESET, render)
  store.subscribe(EVENTS.MODE_CHANGED, render)
  store.subscribe(EVENTS.NODE_SELECTED, render)
}
