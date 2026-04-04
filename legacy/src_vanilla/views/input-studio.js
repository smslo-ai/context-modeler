import { EVENTS } from '../constants/events.js'
import { sanitizeHTML } from '../utils/sanitize.js'
import { showToast } from '../utils/toast.js'
import { exportOntologyData, importOntologyData } from '../utils/data-io.js'

function generateId(prefix, name, existingIds) {
  const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').slice(0, 40)
  const idSet = new Set(existingIds)
  let id = `${prefix}-${slug}`
  let deduplicateSuffix = 2
  while (idSet.has(id)) {
    id = `${prefix}-${slug}-${deduplicateSuffix++}`
  }
  return id
}

function buildCheckboxList(items, nameKey = 'name') {
  const fragment = document.createDocumentFragment()
  items.forEach(item => {
    const label = document.createElement('label')
    label.className = 'flex items-center gap-2 text-sm text-slate-700'
    const input = document.createElement('input')
    input.type = 'checkbox'
    input.value = item.id          // id is [a-z0-9-] per spec — safe as attribute
    input.className = 'rounded border-slate-300'
    const text = document.createTextNode(item[nameKey])
    label.appendChild(input)
    label.appendChild(text)
    fragment.appendChild(label)
  })
  return fragment
}

function renderSystemCheckboxes(container, systems) {
  const systemCheckboxContainer = container.querySelector('#wf-system-checkboxes')
  if (systemCheckboxContainer) { systemCheckboxContainer.textContent = ''; systemCheckboxContainer.appendChild(buildCheckboxList(systems)) }
}

function renderSysLinkCheckboxes(container, workflows, personas) {
  const linkCheckboxContainer = container.querySelector('#sys-link-checkboxes')
  if (linkCheckboxContainer) { linkCheckboxContainer.textContent = ''; linkCheckboxContainer.appendChild(buildCheckboxList([...workflows, ...personas])) }
}

export function initInputStudio(store) {
  const container = document.getElementById('view-input-studio')
  if (!container) return

  container.innerHTML = `
    <div class="bg-indigo-900 text-white py-8 px-4 sm:px-6 lg:px-8 text-center">
      <h2 class="text-2xl font-extrabold">Ontology Input Studio</h2>
      <p class="text-sm text-indigo-200 mt-2 max-w-2xl mx-auto">Define the nodes of your workplace graph. Explicitly link systems to workflows to build the ontology.</p>
    </div>

    <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4 pb-16">
      <div class="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">

        <!-- Tab Navigation -->
        <div class="flex border-b border-slate-200" role="tablist">
          <button class="studio-tab studio-tab-active flex-1 py-3 text-sm font-medium text-center border-b-2 border-indigo-600 text-indigo-700"
                  data-tab="tab-workflows" role="tab" aria-selected="true" aria-controls="tab-workflows">
            1. Workflows
          </button>
          <button class="studio-tab flex-1 py-3 text-sm font-medium text-center text-slate-500 hover:text-slate-700"
                  data-tab="tab-systems" role="tab" aria-selected="false" aria-controls="tab-systems">
            2. Systems &amp; Infra
          </button>
          <button class="studio-tab flex-1 py-3 text-sm font-medium text-center text-slate-500 hover:text-slate-700"
                  data-tab="tab-users" role="tab" aria-selected="false" aria-controls="tab-users">
            3. Business Users
          </button>
        </div>

        <!-- Tab 1: Workflows -->
        <div id="tab-workflows" class="p-6" role="tabpanel">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-bold text-slate-900">Add New Business Workflow</h3>
            <span class="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded uppercase">Demand Node</span>
          </div>
          <form id="form-add-workflow" class="space-y-4" novalidate>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label for="wf-name" class="block text-xs font-medium text-slate-500 mb-1">Workflow Name *</label>
                <input type="text" id="wf-name" maxlength="100" required
                       aria-describedby="wf-name-error"
                       class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                       placeholder="e.g. Q3 Financial Reporting">
                <p class="text-xs text-red-500 mt-1 hidden" id="wf-name-error">Name is required.</p>
              </div>
              <div>
                <label for="wf-type" class="block text-xs font-medium text-slate-500 mb-1">Type / Category</label>
                <select id="wf-type" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                  <option value="critical">Critical (High Urgency)</option>
                  <option value="routine">Routine</option>
                  <option value="strategic">Strategic</option>
                  <option value="operational">Operational</option>
                  <option value="ad-hoc">Ad-hoc</option>
                </select>
              </div>
            </div>
            <div>
              <label for="wf-description" class="block text-xs font-medium text-slate-500 mb-1">Description</label>
              <textarea id="wf-description" rows="2" maxlength="500"
                        class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                        placeholder="Brief description of this workflow"></textarea>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label for="wf-owner" class="block text-xs font-medium text-slate-500 mb-1">Business Owner</label>
                <input type="text" id="wf-owner" maxlength="100"
                       class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                       placeholder="e.g. VP of Operations">
              </div>
              <div>
                <label for="wf-frequency" class="block text-xs font-medium text-slate-500 mb-1">Frequency</label>
                <select id="wf-frequency" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="ad-hoc">Ad-hoc</option>
                </select>
              </div>
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-500 mb-2">Link to Supporting Systems</label>
              <div id="wf-system-checkboxes" class="grid grid-cols-2 gap-2"></div>
            </div>
            <button type="submit" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg transition-colors text-sm">
              + Add Workflow Node
            </button>
          </form>
        </div>

        <!-- Tab 2: Systems -->
        <div id="tab-systems" class="hidden p-6" role="tabpanel">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-bold text-slate-900">Add New System / Infrastructure</h3>
            <span class="text-xs font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded uppercase">Supply Node</span>
          </div>
          <form id="form-add-system" class="space-y-4" novalidate>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label for="sys-name" class="block text-xs font-medium text-slate-500 mb-1">System Name *</label>
                <input type="text" id="sys-name" maxlength="100" required
                       aria-describedby="sys-name-error"
                       class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                       placeholder="e.g. Finance Power BI Dashboard">
                <p class="text-xs text-red-500 mt-1 hidden" id="sys-name-error">Name is required.</p>
              </div>
              <div>
                <label for="sys-category" class="block text-xs font-medium text-slate-500 mb-1">Category</label>
                <select id="sys-category" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                  <option value="reporting">Power BI / Tableau / Dashboard</option>
                  <option value="storage">SharePoint / Drive</option>
                  <option value="comms">Communication</option>
                  <option value="intelligence">AI / Intelligence</option>
                  <option value="tracking">Project Management</option>
                </select>
              </div>
            </div>
            <div>
              <label for="sys-description" class="block text-xs font-medium text-slate-500 mb-1">Description</label>
              <textarea id="sys-description" rows="2" maxlength="500"
                        class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                        placeholder="Describe purpose or function"></textarea>
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-500 mb-2">Link to Existing Workflows &amp; Users</label>
              <div id="sys-link-checkboxes" class="grid grid-cols-2 gap-2"></div>
            </div>
            <button type="submit" class="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-3 rounded-lg transition-colors text-sm">
              + Add System Node
            </button>
          </form>
        </div>

        <!-- Tab 3: Users -->
        <div id="tab-users" class="hidden p-6" role="tabpanel">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-bold text-slate-900">Add Business User</h3>
            <span class="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded uppercase">State Node</span>
          </div>
          <form id="form-add-user" class="space-y-4" novalidate>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label for="usr-name" class="block text-xs font-medium text-slate-500 mb-1">Name / Role *</label>
                <input type="text" id="usr-name" maxlength="100" required
                       aria-describedby="usr-name-error"
                       class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                       placeholder="e.g. Sarah (Finance Analyst)">
                <p class="text-xs text-red-500 mt-1 hidden" id="usr-name-error">Name is required.</p>
              </div>
              <div>
                <label for="usr-state" class="block text-xs font-medium text-slate-500 mb-1">Primary Persona State</label>
                <select id="usr-state" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                  <option value="reactive-firefighter">Reactive Firefighter (High Stress)</option>
                  <option value="deep-focus-architect">Deep Focus Architect (Low Distraction)</option>
                  <option value="process-admin">Process Admin (Methodical)</option>
                  <option value="bridge-builder">Bridge Builder (Collaborative)</option>
                </select>
              </div>
            </div>
            <div>
              <label for="usr-description" class="block text-xs font-medium text-slate-500 mb-1">Role Description</label>
              <textarea id="usr-description" rows="2" maxlength="500"
                        class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                        placeholder="What is their primary responsibility?"></textarea>
            </div>
            <button type="submit" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg transition-colors text-sm">
              + Add User Node
            </button>
          </form>
        </div>

      </div>

      <!-- Export / Import -->
      <div class="mt-8 pt-6 border-t border-slate-200 px-6 pb-6">
        <h3 class="text-sm font-semibold text-slate-700 mb-3">Export / Import Data</h3>
        <div class="flex flex-wrap gap-3">
          <button id="btn-export" class="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-indigo-500">
            <span aria-hidden="true">⬇</span> Export JSON
          </button>
          <label class="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 cursor-pointer focus-within:ring-2 focus-within:ring-indigo-500">
            <span aria-hidden="true">⬆</span> Import JSON
            <input type="file" id="import-file-input" accept=".json,application/json" class="sr-only" aria-label="Import ontology JSON file">
          </label>
        </div>
        <p id="import-status" class="text-xs text-slate-500 mt-2 hidden" role="status"></p>
      </div>

    </div>
    </div>
  `

  // --- Tab switching ---
  container.querySelectorAll('.studio-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const targetId = tab.dataset.tab

      container.querySelectorAll('.studio-tab').forEach(t => {
        const isActive = t.dataset.tab === targetId
        t.classList.toggle('studio-tab-active', isActive)
        t.classList.toggle('border-b-2', isActive)
        t.classList.toggle('border-indigo-600', isActive)
        t.classList.toggle('text-indigo-700', isActive)
        t.classList.toggle('text-slate-500', !isActive)
        t.setAttribute('aria-selected', isActive ? 'true' : 'false')
      })

      container.querySelectorAll('[role="tabpanel"]').forEach(panel => {
        panel.classList.toggle('hidden', panel.id !== targetId)
      })

      // Refresh checkboxes when switching to a tab
      const { workflows, systems, personas } = store.getState().ontologyData
      if (targetId === 'tab-workflows') renderSystemCheckboxes(container, systems)
      if (targetId === 'tab-systems') renderSysLinkCheckboxes(container, workflows, personas)
    })
  })

  // Initial checkbox population
  const { workflows, systems, personas } = store.getState().ontologyData
  renderSystemCheckboxes(container, systems)
  renderSysLinkCheckboxes(container, workflows, personas)

  // Refresh checkboxes when nodes are added/removed
  const refreshCheckboxes = () => {
    const { workflows: latestWorkflows, systems: latestSystems, personas: latestPersonas } = store.getState().ontologyData
    renderSystemCheckboxes(container, latestSystems)
    renderSysLinkCheckboxes(container, latestWorkflows, latestPersonas)
  }
  store.subscribe(EVENTS.NODE_ADDED, refreshCheckboxes)
  store.subscribe(EVENTS.NODE_REMOVED, refreshCheckboxes)
  store.subscribe(EVENTS.DATA_RESET, refreshCheckboxes)

  // --- Workflow form submit ---
  container.querySelector('#form-add-workflow')?.addEventListener('submit', (e) => {
    e.preventDefault()
    const nameRaw = container.querySelector('#wf-name')?.value.trim() ?? ''
    const nameError = container.querySelector('#wf-name-error')

    if (!nameRaw) {
      nameError?.classList.remove('hidden')
      const input = container.querySelector('#wf-name')
      input?.classList.add('border-red-500', 'ring-1', 'ring-red-500')
      input?.setAttribute('aria-invalid', 'true')
      input?.focus()
      return
    }
    nameError?.classList.add('hidden')
    container.querySelector('#wf-name')?.classList.remove('border-red-500', 'ring-1', 'ring-red-500')
    container.querySelector('#wf-name')?.removeAttribute('aria-invalid')

    const name = sanitizeHTML(nameRaw).replace(/<[^>]+>/g, '').trim()
    const { ontologyData } = store.getState()
    const existingIds = ontologyData.workflows.map(w => w.id)

    const linkedSystems = Array.from(
      container.querySelectorAll('#wf-system-checkboxes input:checked')
    ).map(cb => cb.value)

    const node = {
      id: generateId('wf', name, existingIds),
      name,
      type: container.querySelector('#wf-type')?.value ?? 'routine',
      description: sanitizeHTML(container.querySelector('#wf-description')?.value.trim() ?? '').replace(/<[^>]+>/g, '').trim(),
      owner: sanitizeHTML(container.querySelector('#wf-owner')?.value.trim() ?? '').replace(/<[^>]+>/g, '').trim(),
      frequency: container.querySelector('#wf-frequency')?.value ?? 'weekly',
      linkedSystems,
    }

    store.dispatch(EVENTS.NODE_ADDED, { nodeType: 'workflow', node })
    showToast(`Node added: ${node.name}`, 'success')
    container.querySelector('#form-add-workflow')?.reset()
  })

  // Clear wf-name error state on input
  container.querySelector('#wf-name')?.addEventListener('input', () => {
    container.querySelector('#wf-name-error')?.classList.add('hidden')
    container.querySelector('#wf-name')?.classList.remove('border-red-500', 'ring-1', 'ring-red-500')
  })

  // --- System form submit ---
  container.querySelector('#form-add-system')?.addEventListener('submit', (e) => {
    e.preventDefault()
    const nameRaw = container.querySelector('#sys-name')?.value.trim() ?? ''
    const nameError = container.querySelector('#sys-name-error')

    if (!nameRaw) {
      nameError?.classList.remove('hidden')
      const input = container.querySelector('#sys-name')
      input?.classList.add('border-red-500', 'ring-1', 'ring-red-500')
      input?.setAttribute('aria-invalid', 'true')
      input?.focus()
      return
    }
    nameError?.classList.add('hidden')
    container.querySelector('#sys-name')?.classList.remove('border-red-500', 'ring-1', 'ring-red-500')
    container.querySelector('#sys-name')?.removeAttribute('aria-invalid')

    const name = sanitizeHTML(nameRaw).replace(/<[^>]+>/g, '').trim()
    const { ontologyData } = store.getState()
    const existingIds = ontologyData.systems.map(s => s.id)

    const checkedIds = Array.from(
      container.querySelectorAll('#sys-link-checkboxes input:checked')
    ).map(cb => cb.value)

    const linkedWorkflows = checkedIds.filter(id => id.startsWith('wf-'))
    const linkedUsers = checkedIds.filter(id => id.startsWith('usr-'))

    const node = {
      id: generateId('sys', name, existingIds),
      name,
      category: container.querySelector('#sys-category')?.value ?? 'storage',
      description: sanitizeHTML(container.querySelector('#sys-description')?.value.trim() ?? '').replace(/<[^>]+>/g, '').trim(),
      linkedWorkflows,
      linkedUsers,
    }

    store.dispatch(EVENTS.NODE_ADDED, { nodeType: 'system', node })
    showToast(`Node added: ${node.name}`, 'success')
    container.querySelector('#form-add-system')?.reset()
  })

  // Clear sys-name error state on input
  container.querySelector('#sys-name')?.addEventListener('input', () => {
    container.querySelector('#sys-name-error')?.classList.add('hidden')
    container.querySelector('#sys-name')?.classList.remove('border-red-500', 'ring-1', 'ring-red-500')
  })

  // --- User form submit ---
  container.querySelector('#form-add-user')?.addEventListener('submit', (e) => {
    e.preventDefault()
    const nameRaw = container.querySelector('#usr-name')?.value.trim() ?? ''
    const nameError = container.querySelector('#usr-name-error')

    if (!nameRaw) {
      nameError?.classList.remove('hidden')
      const input = container.querySelector('#usr-name')
      input?.classList.add('border-red-500', 'ring-1', 'ring-red-500')
      input?.setAttribute('aria-invalid', 'true')
      input?.focus()
      return
    }
    nameError?.classList.add('hidden')
    container.querySelector('#usr-name')?.classList.remove('border-red-500', 'ring-1', 'ring-red-500')
    container.querySelector('#usr-name')?.removeAttribute('aria-invalid')

    const name = sanitizeHTML(nameRaw).replace(/<[^>]+>/g, '').trim()
    const { ontologyData } = store.getState()
    const existingIds = ontologyData.personas.map(p => p.id)

    const node = {
      id: generateId('usr', name, existingIds),
      name,
      state: container.querySelector('#usr-state')?.value ?? 'process-admin',
      description: sanitizeHTML(container.querySelector('#usr-description')?.value.trim() ?? '').replace(/<[^>]+>/g, '').trim(),
    }

    store.dispatch(EVENTS.NODE_ADDED, { nodeType: 'persona', node })
    showToast(`Node added: ${node.name}`, 'success')
    container.querySelector('#form-add-user')?.reset()
  })

  // Clear usr-name error state on input
  container.querySelector('#usr-name')?.addEventListener('input', () => {
    container.querySelector('#usr-name-error')?.classList.add('hidden')
    container.querySelector('#usr-name')?.classList.remove('border-red-500', 'ring-1', 'ring-red-500')
  })

  // --- Export / Import ---
  container.querySelector('#btn-export')?.addEventListener('click', () => {
    exportOntologyData(store.getState())
    showToast('Ontology data exported.', 'success')
  })

  container.querySelector('#import-file-input')?.addEventListener('change', (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    importOntologyData(
      file,
      (ontologyData) => {
        store.dispatch(EVENTS.DATA_RESET, { ontologyData })
        showToast('Data imported successfully.', 'success')
        e.target.value = ''
      },
      (errMsg) => {
        const status = container.querySelector('#import-status')
        if (status) {
          status.textContent = errMsg
          status.classList.remove('hidden')
          setTimeout(() => status.classList.add('hidden'), 5000)
        }
        showToast(errMsg, 'error')
        e.target.value = ''
      }
    )
  })
}
