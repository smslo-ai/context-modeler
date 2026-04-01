import { EVENTS } from '../constants/events.js'
import { buildFrictionMatrix, getFrictionColor } from '../utils/heuristics.js'

export function initHeatmap(store) {
  const container = document.getElementById('heatmap-grid')
  if (!container) return

  // Attach delegated event handlers once on the persistent container element,
  // not on the table (which is recreated on every render).
  container.addEventListener('click', (e) => {
    const td = e.target.closest('td[data-workflow][data-system]')
    if (!td) return
    const wfId = td.dataset.workflow
    const sysId = td.dataset.system
    const score = parseFloat(td.dataset.score)
    store.dispatch(EVENTS.NODE_SELECTED, {
      id: wfId,
      type: 'workflow',
      frictionPair: { workflowId: wfId, systemId: sysId, score },
    })
  })

  container.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return
    const td = e.target.closest('td[data-workflow][data-system]')
    if (!td) return
    e.preventDefault()
    td.click()
  })

  function render() {
    const { ontologyData } = store.getState()
    const { workflows, systems, frictionRules } = ontologyData

    // Empty state
    if (workflows.length === 0 || systems.length === 0) {
      container.innerHTML = `
        <div class="text-center py-12 text-slate-400">
          <p class="text-4xl mb-3" aria-hidden="true">📊</p>
          <p class="font-medium text-slate-600">No friction data yet</p>
          <p class="text-sm mt-1">Add at least one workflow and one system in the Input Studio.</p>
        </div>
      `
      return
    }

    const matrix = buildFrictionMatrix(workflows, systems, frictionRules)

    // Build semantic <table>
    const table = document.createElement('table')
    table.className = 'w-full border-collapse text-xs'
    table.setAttribute('role', 'grid')
    table.setAttribute('aria-label', 'Cognitive Friction Heatmap — rows are systems, columns are workflows')

    // <thead> with workflow column headers
    const thead = document.createElement('thead')
    const headerRow = document.createElement('tr')

    // Corner cell
    const cornerCell = document.createElement('th')
    cornerCell.scope = 'col'
    cornerCell.className = 'p-2 text-left font-semibold text-slate-500 min-w-[140px]'
    cornerCell.textContent = 'System \\ Workflow'
    headerRow.appendChild(cornerCell)

    workflows.forEach(wf => {
      const th = document.createElement('th')
      th.scope = 'col'
      th.className = 'p-2 text-center font-semibold text-slate-700 min-w-[90px] whitespace-nowrap'
      th.textContent = wf.name
      headerRow.appendChild(th)
    })
    thead.appendChild(headerRow)
    table.appendChild(thead)

    // <tbody> with system rows and friction cells
    const tbody = document.createElement('tbody')
    systems.forEach((system, sysIdx) => {
      const row = document.createElement('tr')
      row.className = 'border-t border-slate-100'

      // Row header: system name
      const rowHeader = document.createElement('th')
      rowHeader.scope = 'row'
      rowHeader.className = 'p-2 text-left font-medium text-slate-700 bg-slate-50 min-w-[120px] whitespace-nowrap'
      rowHeader.textContent = system.name
      row.appendChild(rowHeader)

      // Friction cells — data-score stores the value for the delegated click handler
      workflows.forEach((wf, wfIdx) => {
        const score = matrix[sysIdx][wfIdx]
        const colorClass = getFrictionColor(score)
        const pct = Math.round(score * 100)

        const td = document.createElement('td')
        td.className = `p-2 text-center cursor-pointer transition-opacity hover:opacity-80 ${colorClass}`
        td.textContent = `${pct}%`
        td.setAttribute('data-workflow', wf.id)
        td.setAttribute('data-system', system.id)
        td.setAttribute('data-score', score)
        td.setAttribute('aria-label', `${wf.name} vs ${system.name}: ${pct}% friction`)
        td.setAttribute('tabindex', '0')
        td.setAttribute('role', 'gridcell')

        row.appendChild(td)
      })
      tbody.appendChild(row)
    })
    table.appendChild(tbody)

    container.innerHTML = ''
    container.appendChild(table)

    // Heatmap explainer text (once only)
    if (!container.querySelector('.heatmap-explainer')) {
      const explainer = document.createElement('p')
      explainer.className = 'heatmap-explainer text-xs text-slate-500 mb-2'
      explainer.textContent = 'Each cell shows how well a workflow fits a system. Darker = higher cognitive friction.'
      container.prepend(explainer)
    }

    // Mobile scroll hint
    const existingHint = container.parentElement?.querySelector('.heatmap-scroll-hint')
    if (!existingHint) {
      const hint = document.createElement('p')
      hint.className = 'heatmap-scroll-hint text-xs text-slate-400 mt-2 md:hidden'
      hint.textContent = '← Scroll horizontally to see all workflows →'
      container.parentElement?.appendChild(hint)
    }
  }

  render()

  store.subscribe(EVENTS.NODE_ADDED, render)
  store.subscribe(EVENTS.NODE_REMOVED, render)
  store.subscribe(EVENTS.DATA_RESET, render)
  store.subscribe(EVENTS.MODE_CHANGED, render)
}
