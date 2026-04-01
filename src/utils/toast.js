let toastContainer = null

function getContainer() {
  if (!toastContainer) {
    toastContainer = document.createElement('div')
    toastContainer.id = 'toast-container'
    toastContainer.className = 'fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none'
    toastContainer.setAttribute('aria-live', 'polite')
    toastContainer.setAttribute('aria-atomic', 'false')
    document.body.appendChild(toastContainer)
  }
  return toastContainer
}

export function showToast(message, type = 'success', duration = 3000) {
  const container = getContainer()

  const toast = document.createElement('div')
  toast.setAttribute('role', 'status')

  const toastColorClasses = {
    success: 'bg-emerald-600 text-white',
    error: 'bg-red-600 text-white',
    info: 'bg-indigo-600 text-white',
    warning: 'bg-amber-500 text-white',
  }
  const toastIconSymbols = { success: '✓', error: '✕', info: 'ℹ', warning: '⚠' }

  toast.className = `
    pointer-events-auto flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg
    text-sm font-medium max-w-xs transform transition-all duration-300 translate-y-2 opacity-0
    ${toastColorClasses[type] ?? toastColorClasses.success}
  `
  toast.innerHTML = `<span aria-hidden="true">${toastIconSymbols[type] ?? toastIconSymbols.success}</span><span></span>`
  toast.querySelector('span:last-child').textContent = message  // safe: textContent

  container.appendChild(toast)

  // Animate in
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      toast.classList.remove('translate-y-2', 'opacity-0')
    })
  })

  // Auto-dismiss
  setTimeout(() => {
    toast.classList.add('translate-y-2', 'opacity-0')
    setTimeout(() => toast.remove(), 300)
  }, duration)

  return toast
}
