import './style.css'
import { loadFromStorage } from './state/storage.js'
import { createStore } from './state/store.js'
import { initNav } from './components/nav.js'
import { initDashboard } from './views/dashboard.js'
import { initInputStudio } from './views/input-studio.js'
import { showToast } from './utils/toast.js'
import { initOnboarding } from './utils/onboarding.js'

function init() {
  const initialData = loadFromStorage()
  const store = createStore(initialData)

  initNav(store)
  initDashboard(store)
  initInputStudio(store)

  window.addEventListener('storage-quota-exceeded', () => {
    showToast('Storage full — data could not be saved.', 'error', 5000)
  })

  window.addEventListener('data-saved', () => {
    const indicator = document.getElementById('storage-status')
    if (!indicator) return
    indicator.classList.remove('hidden')
    clearTimeout(indicator._hideTimer)
    indicator._hideTimer = setTimeout(() => indicator.classList.add('hidden'), 2000)
  })

  // Small delay so DOM renders first
  setTimeout(() => initOnboarding(), 800)
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
}
