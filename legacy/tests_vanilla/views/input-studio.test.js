import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { initInputStudio } from '../../src/views/input-studio.js'
import { createStore } from '../../src/state/store.js'
import { EVENTS } from '../../src/constants/events.js'
import { getDefaultData } from '../../src/data/defaults.js'

describe('initInputStudio', () => {
  let container, store

  beforeEach(() => {
    container = document.createElement('div')
    container.id = 'view-input-studio'
    document.body.appendChild(container)
    store = createStore(getDefaultData())
    initInputStudio(store)
  })

  afterEach(() => {
    document.body.removeChild(container)
  })

  it('renders three tab buttons', () => {
    expect(container.querySelectorAll('.studio-tab').length).toBe(3)
  })

  it('workflows tab is active by default', () => {
    expect(container.querySelector('[data-tab="tab-workflows"]')?.classList.contains('studio-tab-active')).toBe(true)
  })

  it('clicking systems tab shows systems panel and hides workflows panel', () => {
    const sysTab = container.querySelector('[data-tab="tab-systems"]')
    sysTab.click()
    expect(container.querySelector('#tab-systems')?.classList.contains('hidden')).toBe(false)
    expect(container.querySelector('#tab-workflows')?.classList.contains('hidden')).toBe(true)
  })

  it('workflow form has required fields', () => {
    expect(container.querySelector('#wf-name')).toBeTruthy()
    expect(container.querySelector('#wf-type')).toBeTruthy()
    expect(container.querySelector('#wf-frequency')).toBeTruthy()
  })

  it('submitting workflow form with valid data dispatches NODE_ADDED', () => {
    const cb = vi.fn()
    store.subscribe(EVENTS.NODE_ADDED, cb)

    const nameInput = container.querySelector('#wf-name')
    nameInput.value = 'Test Workflow'

    const form = container.querySelector('#form-add-workflow')
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))

    expect(cb).toHaveBeenCalledOnce()
  })

  it('submitting workflow form with empty name does NOT dispatch NODE_ADDED', () => {
    const cb = vi.fn()
    store.subscribe(EVENTS.NODE_ADDED, cb)

    const nameInput = container.querySelector('#wf-name')
    nameInput.value = ''

    const form = container.querySelector('#form-add-workflow')
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))

    expect(cb).not.toHaveBeenCalled()
  })

  it('submitted workflow appears in store', () => {
    const nameInput = container.querySelector('#wf-name')
    nameInput.value = 'Brand New Workflow'

    const form = container.querySelector('#form-add-workflow')
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))

    const workflows = store.getState().ontologyData.workflows
    expect(workflows.some(w => w.name === 'Brand New Workflow')).toBe(true)
  })

  it('submitting system form with valid data dispatches NODE_ADDED', () => {
    const cb = vi.fn()
    store.subscribe(EVENTS.NODE_ADDED, cb)

    const sysTab = container.querySelector('[data-tab="tab-systems"]')
    sysTab.click()

    const nameInput = container.querySelector('#sys-name')
    nameInput.value = 'Test System'

    const form = container.querySelector('#form-add-system')
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))

    expect(cb).toHaveBeenCalledOnce()
  })

  it('form fields are cleared after successful workflow submission', () => {
    const nameInput = container.querySelector('#wf-name')
    nameInput.value = 'Clearable Workflow'

    const form = container.querySelector('#form-add-workflow')
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))

    expect(nameInput.value).toBe('')
  })
})
