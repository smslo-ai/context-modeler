import { EVENTS } from '../constants/events.js'
import { initOnboarding } from '../utils/onboarding.js'

export function initNav(store) {
  const header = document.getElementById('app-header')
  if (!header) return

  header.innerHTML = `
    <div class="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg" aria-hidden="true">C</div>
          <div>
            <p class="text-lg font-bold text-slate-900 leading-tight">Context-Aware Workplace Modeler</p>
            <p class="text-xs text-slate-500">A portfolio project by Shane Slosar — mapping how workflows, tools, and people interact</p>
          </div>
        </div>
        <nav aria-label="Main navigation" class="flex items-center gap-2">
          <button class="nav-btn nav-btn-active px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-indigo-600 text-white" data-view="dashboard">Dashboard</button>
          <button class="nav-btn px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-slate-100 text-slate-700 hover:bg-slate-200" data-view="input-studio">Input Studio</button>
          <button id="btn-reset" class="text-sm text-slate-500 hover:text-red-600 ml-4 transition-colors">Reset data</button>
        </nav>
      </div>
    </div>
  `

  // Nav button click handlers
  header.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      store.dispatch(EVENTS.VIEW_CHANGED, btn.dataset.view)
    })
  })

  // Reset button
  const resetBtn = header.querySelector('#btn-reset')
  resetBtn?.addEventListener('click', () => {
    if (window.confirm('Reset all data to defaults?')) {
      store.dispatch(EVENTS.DATA_RESET)
    }
  })

  // --- About button ---
  const nav = header.querySelector('nav')
  const aboutBtn = document.createElement('button')
  aboutBtn.id = 'btn-about'
  aboutBtn.className = 'nav-btn hidden sm:flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500'
  aboutBtn.setAttribute('aria-label', 'About this project')
  aboutBtn.textContent = 'About'
  nav?.appendChild(aboutBtn)

  // --- "?" onboarding replay button ---
  const helpBtn = document.createElement('button')
  helpBtn.id = 'btn-help'
  helpBtn.className = 'nav-btn p-2 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors text-sm font-bold focus-visible:ring-2 focus-visible:ring-indigo-500'
  helpBtn.setAttribute('aria-label', 'Replay onboarding tour')
  helpBtn.setAttribute('title', 'Replay tour')
  helpBtn.textContent = '?'
  nav?.appendChild(helpBtn)

  helpBtn.addEventListener('click', () => {
    // Clear flag so it shows again
    localStorage.removeItem('context-modeler:onboarding-complete')
    initOnboarding(() => {
      // Re-mark after replayed tour
    })
  })

  // --- About modal ---
  const aboutModal = document.createElement('div')
  aboutModal.id = 'about-modal'
  aboutModal.className = 'hidden fixed inset-0 z-50 flex items-center justify-center'
  aboutModal.setAttribute('role', 'dialog')
  aboutModal.setAttribute('aria-modal', 'true')
  aboutModal.setAttribute('aria-labelledby', 'about-modal-title')
  aboutModal.innerHTML = `
    <div class="absolute inset-0 bg-black/50" id="about-backdrop" aria-hidden="true"></div>
    <div class="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden">
      <div class="bg-gradient-to-r from-indigo-600 to-indigo-800 px-6 py-5 text-white">
        <div class="flex items-start justify-between">
          <div>
            <h3 id="about-modal-title" class="font-bold text-xl">Context-Aware Workplace Modeler</h3>
            <p class="text-indigo-200 text-sm mt-1">A portfolio project by Shane Slosar</p>
          </div>
          <button id="about-modal-close" class="text-indigo-200 hover:text-white text-2xl leading-none ml-4" aria-label="Close about dialog">&times;</button>
        </div>
      </div>
      <div class="px-6 py-5 space-y-4 text-sm text-slate-700">
        <div>
          <h4 class="font-semibold text-slate-900 mb-1">What is this?</h4>
          <p>An interactive tool for mapping how your workplace actually works — by modeling three dimensions: what gets done (Workflows), what tools are involved (Systems), and who does it (Personas).</p>
        </div>
        <div>
          <h4 class="font-semibold text-slate-900 mb-1">What is context engineering?</h4>
          <p>Context engineering is the practice of designing what information reaches a person (or AI agent) at the right time. This tool visualizes how context flows through a workplace — and where friction occurs when workflows and systems don't align.</p>
        </div>
        <div>
          <h4 class="font-semibold text-slate-900 mb-1">Why I built this</h4>
          <p>I'm a financial operations professional building AI fluency. I built this to explore how workplaces can be modeled as knowledge graphs — and to demonstrate that thinking in structured, connected data is a transferable skill.</p>
        </div>
        <div>
          <h4 class="font-semibold text-slate-900 mb-1">Tech stack</h4>
          <p class="text-slate-600">Vanilla JS · Vite · Tailwind CSS v4 · Chart.js · DOMPurify · No frameworks · No backend</p>
        </div>
        <div class="pt-2 border-t border-slate-100">
          <p class="text-xs text-slate-400">All data is stored locally in your browser. Nothing is sent to any server. <a href="https://github.com/smslo-ai/context-modeler" target="_blank" rel="noopener noreferrer" class="text-indigo-600 hover:underline">View source on GitHub ↗</a></p>
        </div>
      </div>
    </div>
  `
  document.body.appendChild(aboutModal)

  // Wire About modal open/close
  aboutBtn.addEventListener('click', () => {
    aboutModal.classList.remove('hidden')
    document.getElementById('about-modal-close')?.focus()
  })

  aboutModal.addEventListener('click', (e) => {
    if (e.target.id === 'about-backdrop' || e.target.id === 'about-modal-close') {
      aboutModal.classList.add('hidden')
      aboutBtn.focus()
    }
  })

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !aboutModal.classList.contains('hidden')) {
      aboutModal.classList.add('hidden')
      aboutBtn.focus()
    }
  })

  // Subscribe to VIEW_CHANGED to update active button
  // Cache view-nav button refs once so the subscribe callback skips DOM queries on every call
  const viewNavBtns = Array.from(header.querySelectorAll('.nav-btn[data-view]'))
  store.subscribe(EVENTS.VIEW_CHANGED, (state) => {
    viewNavBtns.forEach(btn => {
      const isActive = btn.dataset.view === state.currentView
      btn.classList.toggle('nav-btn-active', isActive)
      btn.classList.toggle('bg-indigo-600', isActive)
      btn.classList.toggle('text-white', isActive)
      btn.classList.toggle('bg-slate-100', !isActive)
      btn.classList.toggle('text-slate-700', !isActive)
    })

    // Toggle view visibility
    const dashboard = document.getElementById('view-dashboard')
    const inputStudio = document.getElementById('view-input-studio')
    if (dashboard) dashboard.classList.toggle('hidden', state.currentView !== 'dashboard')
    if (inputStudio) inputStudio.classList.toggle('hidden', state.currentView !== 'input-studio')
    window.scrollTo(0, 0)

    // A11Y-08: Move focus to first heading of the newly visible view
    requestAnimationFrame(() => {
      const activeView = document.getElementById(
        state.currentView === 'dashboard' ? 'view-dashboard' : 'view-input-studio'
      )
      const heading = activeView?.querySelector('h2, h3')
      if (heading) {
        if (!heading.hasAttribute('tabindex')) heading.setAttribute('tabindex', '-1')
        heading.focus({ preventScroll: false })
      }
    })
  })
}
