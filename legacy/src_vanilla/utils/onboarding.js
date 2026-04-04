const ONBOARDING_KEY = 'context-modeler:onboarding-complete'

const STEPS = [
  {
    targetSelector: '#view-dashboard .grid',  // triad explorer area
    title: 'Your workplace in three dimensions',
    body: 'Workflows (what gets done), Systems (what tools are used), and Personas (who does it) — all connected.',
    position: 'bottom',
  },
  {
    targetSelector: '.mode-card',  // first simulation mode card
    title: 'Simulate different work contexts',
    body: 'Switch between Morning Triage, Deep Focus, and Firefighting to see how work modes affect your context map.',
    position: 'top',
  },
  {
    targetSelector: '#friction-heatmap-section',  // heatmap section
    title: 'Spot workflow-system friction',
    body: 'Each cell shows how well a workflow fits a system. Darker cells = higher friction = more cognitive overhead.',
    position: 'top',
  },
]

export function shouldShowOnboarding() {
  return !localStorage.getItem(ONBOARDING_KEY)
}

export function markOnboardingComplete() {
  localStorage.setItem(ONBOARDING_KEY, '1')
}

export function initOnboarding(onComplete) {
  if (!shouldShowOnboarding()) return

  let currentStep = 0
  let overlayEl = null
  let tooltipEl = null

  function positionTooltip(target, tooltip, position) {
    const rect = target.getBoundingClientRect()
    const ttRect = tooltip.getBoundingClientRect()
    const scrollY = window.scrollY || document.documentElement.scrollTop
    const scrollX = window.scrollX || document.documentElement.scrollLeft

    let top, left
    const GAP = 12

    if (position === 'bottom') {
      top = rect.bottom + scrollY + GAP
      left = rect.left + scrollX + rect.width / 2 - ttRect.width / 2
    } else {
      top = rect.top + scrollY - ttRect.height - GAP
      left = rect.left + scrollX + rect.width / 2 - ttRect.width / 2
    }

    // Clamp to viewport
    left = Math.max(16, Math.min(left, window.innerWidth - ttRect.width - 16))
    tooltip.style.top = `${top}px`
    tooltip.style.left = `${left}px`
  }

  function showStep(index) {
    const step = STEPS[index]
    const target = document.querySelector(step.targetSelector)
    if (!target) { advance(); return }

    // Scroll target into view
    target.scrollIntoView({ behavior: 'smooth', block: 'center' })

    // Create/update tooltip
    if (!tooltipEl) {
      tooltipEl = document.createElement('div')
      tooltipEl.id = 'onboarding-tooltip'
      tooltipEl.setAttribute('role', 'dialog')
      tooltipEl.setAttribute('aria-modal', 'false')
      tooltipEl.setAttribute('aria-labelledby', 'onboarding-tooltip-title')
      document.body.appendChild(tooltipEl)
    }

    const isLast = index === STEPS.length - 1
    tooltipEl.className = 'fixed z-[60] bg-slate-900 text-white rounded-xl shadow-2xl p-4 max-w-xs w-72'
    tooltipEl.innerHTML = `
      <div class="flex items-center justify-between mb-1">
        <span class="text-xs text-slate-400 font-medium">Step ${index + 1} of ${STEPS.length}</span>
        <button id="onboarding-skip" class="text-slate-400 hover:text-white text-xs underline">Skip</button>
      </div>
      <h4 id="onboarding-tooltip-title" class="font-bold text-sm mb-1"></h4>
      <p class="text-xs text-slate-300 mb-3"></p>
      <div class="flex items-center justify-between">
        <div class="flex gap-1">
          ${STEPS.map((_, i) => `<span class="w-2 h-2 rounded-full ${i === index ? 'bg-indigo-400' : 'bg-slate-600'}"></span>`).join('')}
        </div>
        <button id="onboarding-next" class="bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-semibold px-3 py-1.5 rounded-lg focus-visible:ring-2 focus-visible:ring-white">
          ${isLast ? 'Got it ✓' : 'Next →'}
        </button>
      </div>
    `
    // Safe: use textContent for dynamic values
    tooltipEl.querySelector('h4').textContent = step.title
    tooltipEl.querySelector('p').textContent = step.body

    tooltipEl.querySelector('#onboarding-next').addEventListener('click', advance)
    tooltipEl.querySelector('#onboarding-skip').addEventListener('click', finish)

    // Position after a short delay to allow scroll
    setTimeout(() => {
      const fresh = document.querySelector(step.targetSelector)
      if (fresh) positionTooltip(fresh, tooltipEl, step.position)
      tooltipEl.querySelector('#onboarding-next')?.focus()
    }, 400)
  }

  function advance() {
    currentStep++
    if (currentStep >= STEPS.length) { finish(); return }
    showStep(currentStep)
  }

  function finish() {
    tooltipEl?.remove()
    overlayEl?.remove()
    tooltipEl = null
    overlayEl = null
    markOnboardingComplete()
    onComplete?.()
  }

  // Keyboard: Escape to skip
  function handleKey(e) {
    if (e.key === 'Escape') { finish(); document.removeEventListener('keydown', handleKey) }
  }
  document.addEventListener('keydown', handleKey)

  // Dim overlay
  overlayEl = document.createElement('div')
  overlayEl.id = 'onboarding-overlay'
  overlayEl.className = 'fixed inset-0 z-[55] bg-black/40 pointer-events-none'
  overlayEl.setAttribute('aria-hidden', 'true')
  document.body.appendChild(overlayEl)

  // Start
  showStep(0)
}
