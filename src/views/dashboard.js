import { EVENTS } from '../constants/events.js'
import { initTriadExplorer } from '../components/triad-explorer.js'
import { initHeatmap } from '../components/heatmap.js'
import { initCharts } from '../components/charts.js'

const modeLabels = {
  'morning-triage': 'Morning Triage mode active — urgent workflows highlighted.',
  'deep-focus': 'Deep Focus mode active — communication systems dimmed.',
  'firefighting': 'Firefighting mode active — critical workflows highlighted.',
}

export function initDashboard(store) {
  const container = document.getElementById('view-dashboard')
  if (!container) return

  // Inject full dashboard HTML structure
  container.innerHTML = `
    <!-- Global Header Banner -->
    <div class="bg-slate-900 text-white py-8 px-4 sm:px-6 lg:px-8">
      <div class="max-w-7xl mx-auto">
        <p class="text-sm font-bold text-indigo-400 uppercase tracking-widest mb-2">Digital Workspace Architecture</p>
        <h2 class="text-2xl sm:text-3xl font-extrabold mb-4 leading-tight">Map your workplace as a connected system</h2>
        <p class="text-slate-300 text-lg max-w-2xl">Traditional workflows are static. A <strong>Context-Aware Workplace</strong> dynamically adapts based on the intersection of three dimensions: Business Demand, System Capability, and User State.</p>
      </div>
    </div>

    <!-- Hero: Description + Simulation Control -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div class="lg:col-span-2">
          <p class="text-slate-600 text-lg leading-relaxed">Use the Simulation Controls and Ontology Graph below to explore different environmental states and their effects on cognitive load.</p>
        </div>
        <!-- Simulation Control Panel -->
        <div id="simulation-control" class="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h3 class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Simulation Control</h3>
          <div class="space-y-2">
            <button class="mode-card mode-card-active flex items-center w-full p-3 rounded-xl border-2 border-indigo-500 bg-indigo-50 text-left transition-all" data-mode="morning-triage">
              <span class="text-lg mr-2" aria-hidden="true">🌅</span>
              <div><div class="font-semibold text-sm">Morning Triage</div><div class="text-xs text-slate-500">High Speed / Low Depth</div></div>
            </button>
            <button class="mode-card flex items-center w-full p-3 rounded-xl border-2 border-transparent bg-slate-50 text-left transition-all hover:bg-slate-100" data-mode="deep-focus">
              <span class="text-lg mr-2" aria-hidden="true">🧠</span>
              <div><div class="font-semibold text-sm">Deep Focus</div><div class="text-xs text-slate-500">Low Distraction / High Depth</div></div>
            </button>
            <button class="mode-card flex items-center w-full p-3 rounded-xl border-2 border-transparent bg-slate-50 text-left transition-all hover:bg-slate-100" data-mode="firefighting">
              <span class="text-lg mr-2" aria-hidden="true">🔥</span>
              <div><div class="font-semibold text-sm">Firefighting</div><div class="text-xs text-slate-500">Critical / Reactive</div></div>
            </button>
          </div>
          <button id="btn-simulate-scenario" disabled aria-disabled="true"
                  title="AI features coming in Phase 5"
                  class="mt-4 w-full text-center text-sm text-slate-400 font-medium cursor-not-allowed">
            ✦ Simulate Scenario (AI — Phase 5)
          </button>
        </div>
      </div>
    </section>

    <!-- Context Ontology Explorer -->
    <section id="ontology-explorer" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h2 class="text-2xl font-extrabold text-slate-900 tracking-tight">Context Ontology Explorer</h2>
          <p class="text-sm text-slate-500 mt-1">Interactive mapping of your defined Workflows, Systems, and Users.</p>
          <p id="mode-status-label" class="text-xs text-slate-500 mt-1 hidden"></p>
        </div>
        <div class="flex items-center">
          <span id="node-counter" aria-live="polite" aria-atomic="true" class="text-sm font-medium text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full">14 Nodes Loaded</span>
          <span id="storage-status" class="text-xs text-slate-400 ml-2 hidden">✓ Saved</span>
        </div>
      </div>

      <!-- Mobile column tab switcher (hidden on md+) -->
      <div id="triad-tab-bar" class="flex md:hidden rounded-lg overflow-hidden border border-slate-200 mb-4">
        <button class="triad-col-tab triad-col-tab-active flex-1 py-2 text-xs font-semibold text-center text-indigo-700 bg-white" data-col="col-workflows">Workflows</button>
        <button class="triad-col-tab flex-1 py-2 text-xs font-semibold text-center text-slate-500 bg-slate-50" data-col="col-systems">Systems</button>
        <button class="triad-col-tab flex-1 py-2 text-xs font-semibold text-center text-slate-500 bg-slate-50" data-col="col-personas">Personas</button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div id="card-col-workflows" class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div class="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <h3 class="font-bold text-sm text-slate-800">1. Business Workflows</h3>
            <span class="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded uppercase tracking-wide">Demand</span>
          </div>
          <div id="col-workflows" class="divide-y divide-slate-100" role="list" aria-label="Business workflows"></div>
        </div>
        <div id="card-col-systems" class="hidden md:block bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div class="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <h3 class="font-bold text-sm text-slate-800">2. Systems &amp; Infra</h3>
            <span class="text-xs font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded uppercase tracking-wide">Supply</span>
          </div>
          <div id="col-systems" class="divide-y divide-slate-100" role="list" aria-label="Systems and infrastructure"></div>
        </div>
        <div id="card-col-personas" class="hidden md:block bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div class="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <h3 class="font-bold text-sm text-slate-800">3. Users &amp; Personas</h3>
            <span class="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded uppercase tracking-wide">State</span>
          </div>
          <div id="col-personas" class="divide-y divide-slate-100" role="list" aria-label="User personas"></div>
        </div>
      </div>

      <!-- Insight Panel (hidden until node selected) -->
      <div id="insight-panel" class="hidden mt-6 bg-slate-900 text-white rounded-xl p-6 shadow-lg" role="region" aria-label="Active context analysis" aria-live="polite">
        <div class="flex items-start justify-between">
          <div>
            <h3 class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Active Context Analysis</h3>
            <p class="text-lg font-semibold">Selected: <span id="insight-node-name" class="text-indigo-400"></span></p>
            <p class="text-sm text-slate-300 mt-1">Detected <span id="insight-connection-count" class="font-bold"></span> direct connections in the graph.</p>
          </div>
          <div class="flex flex-col gap-2 ml-4">
            <button id="btn-ai-analyze" disabled aria-disabled="true" title="AI features coming in Phase 5"
                    class="bg-slate-700 text-slate-400 text-sm font-medium px-5 py-2.5 rounded-lg cursor-not-allowed">
              ✦ Analyze Logic (AI)
            </button>
            <button id="btn-ai-prompt" disabled aria-disabled="true" title="AI features coming in Phase 5"
                    class="text-sm text-slate-500 cursor-not-allowed">
              ✦ Generate Prompt (AI)
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- Cognitive Friction Heatmap -->
    <section id="friction-heatmap-section" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h2 class="text-2xl font-extrabold text-slate-900 tracking-tight mb-2">Cognitive Friction Heatmap</h2>
      <p class="text-sm text-slate-500 mb-6">Context Engineering analysis of workflow-system compatibility.</p>
      <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-6 overflow-x-auto">
        <div id="heatmap-grid"></div>
        <div class="flex flex-wrap items-center gap-4 mt-4 text-xs text-slate-500">
          <div class="flex items-center gap-1"><span class="w-4 h-4 rounded bg-green-400 inline-block"></span> Low Friction (0–34%)</div>
          <div class="flex items-center gap-1"><span class="w-4 h-4 rounded bg-yellow-200 inline-block"></span> Moderate (35–54%)</div>
          <div class="flex items-center gap-1"><span class="w-4 h-4 rounded bg-amber-400 inline-block"></span> Elevated (55–74%)</div>
          <div class="flex items-center gap-1"><span class="w-4 h-4 rounded bg-red-500 inline-block"></span> High Friction (75–100%)</div>
        </div>
      </div>
    </section>

    <!-- Charts Section -->
    <section id="charts-section" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h3 class="text-lg font-bold text-slate-900 mb-1">Ontology Readiness Score</h3>
          <p class="text-xs text-slate-500 mb-4">Current maturity vs. all-software-is-a-semantic-layer target.</p>
          <div class="chart-container" style="height: 350px;"><canvas id="chart-radar"></canvas></div>
          <p class="text-xs text-slate-400 mt-2 text-center italic">Sample data — charts will reflect your ontology in Phase 5</p>
        </div>
        <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h3 class="text-lg font-bold text-slate-900 mb-1">Responsibility Mapping</h3>
          <p class="text-xs text-slate-500 mb-4">Prioritization: Complexity vs. Strategic Value.</p>
          <div class="chart-container" style="height: 350px;"><canvas id="chart-bubble"></canvas></div>
          <p class="text-xs text-slate-400 mt-2 text-center italic">Sample data — charts will reflect your ontology in Phase 5</p>
        </div>
      </div>
    </section>

    <!-- Implementation Roadmap -->
    <section id="roadmap-section" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-16">
      <h2 class="text-2xl font-extrabold text-slate-900 tracking-tight mb-6">Implementation Roadmap</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div class="flex items-center gap-3 mb-3">
            <span class="w-8 h-8 bg-indigo-100 text-indigo-700 rounded-lg flex items-center justify-center font-bold text-sm">1</span>
            <h3 class="font-bold text-slate-900">Define the Schema</h3>
          </div>
          <p class="text-sm text-slate-600 mb-4">Map all business workflows, systems, and user personas into a structured ontology with explicit relationships.</p>
          <button disabled aria-disabled="true" title="AI features coming in Phase 5"
                  class="text-sm text-slate-400 cursor-not-allowed font-medium">
            ✦ Generate Action Plan (AI)
          </button>
        </div>
        <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div class="flex items-center gap-3 mb-3">
            <span class="w-8 h-8 bg-emerald-100 text-emerald-700 rounded-lg flex items-center justify-center font-bold text-sm">2</span>
            <h3 class="font-bold text-slate-900">Build Context Gates</h3>
          </div>
          <p class="text-sm text-slate-600 mb-4">Create decision points that route information based on user state, workflow priority, and system capability.</p>
          <button disabled aria-disabled="true" title="AI features coming in Phase 5"
                  class="text-sm text-slate-400 cursor-not-allowed font-medium">
            ✦ Generate Action Plan (AI)
          </button>
        </div>
        <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div class="flex items-center gap-3 mb-3">
            <span class="w-8 h-8 bg-amber-100 text-amber-700 rounded-lg flex items-center justify-center font-bold text-sm">3</span>
            <h3 class="font-bold text-slate-900">Deploy Semantic Layer</h3>
          </div>
          <p class="text-sm text-slate-600 mb-4">Implement the AI-powered context engine that dynamically adapts the workspace based on real-time signals.</p>
          <button disabled aria-disabled="true" title="AI features coming in Phase 5"
                  class="text-sm text-slate-400 cursor-not-allowed font-medium">
            ✦ Generate Action Plan (AI)
          </button>
        </div>
        <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div class="flex items-center gap-3 mb-3">
            <span class="w-8 h-8 bg-red-100 text-red-700 rounded-lg flex items-center justify-center font-bold text-sm">4</span>
            <h3 class="font-bold text-slate-900">Measure &amp; Iterate</h3>
          </div>
          <p class="text-sm text-slate-600 mb-4">Track KPIs like context switching frequency, mean time to triage, and cognitive load scores to validate improvements.</p>
          <button disabled aria-disabled="true" title="AI features coming in Phase 5"
                  class="text-sm text-slate-400 cursor-not-allowed font-medium">
            ✦ Generate Action Plan (AI)
          </button>
        </div>
      </div>
    </section>

    <!-- A11Y-06: Screen-reader mode-change announcements (visually hidden) -->
    <p id="mode-announcement" class="sr-only" aria-live="polite" aria-atomic="true"></p>

    <!-- A11Y-07: Friction Detail Modal — accessible dialog with focus trap -->
    <div id="friction-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center"
         role="dialog" aria-modal="true" aria-labelledby="friction-modal-title">
      <div class="absolute inset-0 bg-black/50" id="friction-modal-backdrop" aria-hidden="true"></div>
      <div class="relative bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
        <div class="flex items-start gap-3 mb-4">
          <span class="text-2xl" aria-hidden="true">⚠️</span>
          <div>
            <h3 id="friction-modal-title" class="font-bold text-lg text-slate-900">Friction Analysis</h3>
            <span id="friction-modal-level" class="text-xs font-bold uppercase text-slate-600"></span>
          </div>
          <button id="friction-modal-close"
                  class="ml-auto text-slate-400 hover:text-slate-600 text-xl leading-none rounded"
                  aria-label="Close friction analysis dialog">&times;</button>
        </div>
        <div class="space-y-1 text-sm text-slate-700 mb-4">
          <p>Workflow: <strong id="friction-modal-workflow"></strong></p>
          <p>System: <strong id="friction-modal-system"></strong></p>
          <p>Friction Score: <strong id="friction-modal-score"></strong></p>
        </div>
        <button id="btn-friction-resolve" disabled aria-disabled="true"
                title="AI features coming in Phase 5"
                class="text-sm text-slate-400 cursor-not-allowed font-medium">
          ✦ Resolve &amp; Assign Friction (AI — Phase 5)
        </button>
      </div>
    </div>
  `

  // First-visit welcome banner
  const hasCustomData = localStorage.getItem('context-modeler:ontology-data')
  if (!hasCustomData) {
    const banner = document.createElement('div')
    banner.id = 'welcome-banner'
    banner.setAttribute('role', 'status')
    banner.className = 'bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-3 mb-6 flex items-start gap-3 text-sm'
    banner.innerHTML = `
      <span class="text-indigo-500 text-lg mt-0.5" aria-hidden="true">👋</span>
      <div class="flex-1">
        <strong class="text-indigo-800">You're exploring sample data.</strong>
        <span class="text-indigo-700"> Add your own workflows, systems, and personas in the </span>
        <button id="welcome-goto-studio" class="text-indigo-600 font-semibold underline hover:text-indigo-800 focus-visible:ring-1 focus-visible:ring-indigo-500 rounded">Input Studio</button>
        <span class="text-indigo-700">.</span>
      </div>
      <button id="welcome-dismiss" class="text-indigo-400 hover:text-indigo-600 text-lg leading-none" aria-label="Dismiss welcome banner">&times;</button>
    `
    container.prepend(banner)
  }

  // Wire simulation mode buttons
  // Cache mode card refs once so click handler and DATA_RESET subscriber skip repeated DOM queries
  const modeCards = Array.from(container.querySelectorAll('.mode-card'))
  modeCards.forEach(btn => {
    btn.addEventListener('click', () => {
      modeCards.forEach(b => {
        b.classList.remove('mode-card-active', 'border-indigo-500', 'bg-indigo-50')
        b.classList.add('border-transparent', 'bg-slate-50')
      })
      btn.classList.add('mode-card-active', 'border-indigo-500', 'bg-indigo-50')
      btn.classList.remove('border-transparent', 'bg-slate-50')
      store.dispatch(EVENTS.MODE_CHANGED, btn.dataset.mode)
    })
  })

  // Sync mode button active state when mode changes externally (e.g. DATA_RESET)
  store.subscribe(EVENTS.DATA_RESET, () => {
    modeCards.forEach(b => {
      const isActive = b.dataset.mode === 'morning-triage'
      b.classList.toggle('mode-card-active', isActive)
      b.classList.toggle('border-indigo-500', isActive)
      b.classList.toggle('bg-indigo-50', isActive)
      b.classList.toggle('border-transparent', !isActive)
      b.classList.toggle('bg-slate-50', !isActive)
    })
  })

  // Wire insight panel: update on NODE_SELECTED
  store.subscribe(EVENTS.NODE_SELECTED, (state) => {
    const panel = document.getElementById('insight-panel')
    const nodeName = document.getElementById('insight-node-name')
    const connCount = document.getElementById('insight-connection-count')

    if (!state.selectedNode || !panel) return

    const { id } = state.selectedNode
    const { contextMap, workflows, systems, personas } = state.ontologyData

    // Find node name
    const allNodes = [...workflows, ...systems, ...personas]
    const node = allNodes.find(n => n.id === id)
    const connections = contextMap[id] || []

    if (nodeName) nodeName.textContent = node?.name ?? id
    if (connCount) connCount.textContent = connections.length

    panel.classList.remove('hidden')
    panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  })

  store.subscribe(EVENTS.DATA_RESET, () => {
    document.getElementById('insight-panel')?.classList.add('hidden')
  })

  // A11Y-06: Announce mode changes to screen readers
  store.subscribe(EVENTS.MODE_CHANGED, (state) => {
    const announcement = document.getElementById('mode-announcement')
    const modeNames = {
      'morning-triage': 'Morning Triage',
      'deep-focus': 'Deep Focus',
      'firefighting': 'Firefighting',
    }
    if (announcement) {
      announcement.textContent = `Switched to ${modeNames[state.currentMode] ?? state.currentMode} simulation mode`
    }
  })

  // A11Y-07: Friction modal — open when heatmap cell dispatches NODE_SELECTED with frictionPair
  store.subscribe(EVENTS.NODE_SELECTED, (state) => {
    if (!state.selectedNode?.frictionPair) return
    const { workflowId, systemId, score } = state.selectedNode.frictionPair
    const { workflows, systems } = state.ontologyData

    const wf = workflows.find(w => w.id === workflowId)
    const sys = systems.find(s => s.id === systemId)
    if (!wf || !sys) return

    const pct = Math.round(score * 100)
    const level = score >= 0.75 ? 'High Friction'
      : score >= 0.55 ? 'Elevated'
      : score >= 0.35 ? 'Moderate'
      : 'Low Friction'

    const modal = document.getElementById('friction-modal')
    const wfEl = document.getElementById('friction-modal-workflow')
    const sysEl = document.getElementById('friction-modal-system')
    const scoreEl = document.getElementById('friction-modal-score')
    const levelEl = document.getElementById('friction-modal-level')

    if (wfEl) wfEl.textContent = wf.name
    if (sysEl) sysEl.textContent = sys.name
    if (scoreEl) scoreEl.textContent = `${pct}%`
    if (levelEl) levelEl.textContent = level

    modal?.classList.remove('hidden')

    // Move focus to close button (focus trap entry point)
    document.getElementById('friction-modal-close')?.focus()
  })

  // A11Y-07: Close modal via close button, backdrop click, or Escape key
  // Use event delegation so listeners attach after HTML injection
  container.addEventListener('click', (e) => {
    if (e.target.id === 'friction-modal-close' || e.target.id === 'friction-modal-backdrop') {
      document.getElementById('friction-modal')?.classList.add('hidden')
    }
    if (e.target.id === 'welcome-dismiss' || e.target.closest('#welcome-dismiss')) {
      document.getElementById('welcome-banner')?.remove()
    }
    if (e.target.id === 'welcome-goto-studio') {
      store.dispatch(EVENTS.VIEW_CHANGED, 'input-studio')
    }
  })

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const modal = document.getElementById('friction-modal')
      if (modal && !modal.classList.contains('hidden')) {
        modal.classList.add('hidden')
      }
    }
  })

  // Mobile triad column tab switcher
  container.querySelectorAll('.triad-col-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const targetCol = tab.dataset.col
      container.querySelectorAll('.triad-col-tab').forEach(t => {
        const isActive = t.dataset.col === targetCol
        t.classList.toggle('triad-col-tab-active', isActive)
        t.classList.toggle('bg-white', isActive)
        t.classList.toggle('text-indigo-700', isActive)
        t.classList.toggle('bg-slate-50', !isActive)
        t.classList.toggle('text-slate-500', !isActive)
      })
      // Show/hide column cards on mobile
      ;['col-workflows', 'col-systems', 'col-personas'].forEach(col => {
        const card = document.getElementById(`card-${col}`)
        if (card) {
          card.classList.toggle('hidden', col !== targetCol)
          card.classList.add('md:block')
        }
      })
    })
  })

  // Mode status label subscription
  store.subscribe(EVENTS.MODE_CHANGED, (state) => {
    const label = document.getElementById('mode-status-label')
    if (label) {
      const text = modeLabels[state.currentMode] ?? ''
      label.textContent = text
      label.classList.toggle('hidden', !text)
    }
  })

  // Initialize components into their respective containers
  initTriadExplorer(store)
  initHeatmap(store)
  initCharts()
}
