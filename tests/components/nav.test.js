import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { initNav } from '../../src/components/nav.js'
import { createStore } from '../../src/state/store.js'
import { EVENTS } from '../../src/constants/events.js'
import { getDefaultData } from '../../src/data/defaults.js'

describe('initNav', () => {
  let container, store

  beforeEach(() => {
    container = document.createElement('header')
    container.id = 'app-header'
    document.body.appendChild(container)
    store = createStore(getDefaultData())
  })

  afterEach(() => {
    document.body.removeChild(container)
  })

  it('renders into #app-header', () => {
    initNav(store)
    expect(container.innerHTML).not.toBe('')
  })

  it('contains dashboard and input-studio nav buttons', () => {
    initNav(store)
    expect(container.querySelector('[data-view="dashboard"]')).toBeTruthy()
    expect(container.querySelector('[data-view="input-studio"]')).toBeTruthy()
  })

  it('dispatches VIEW_CHANGED when nav button clicked', () => {
    initNav(store)
    const btn = container.querySelector('[data-view="input-studio"]')
    btn.click()
    expect(store.getState().currentView).toBe('input-studio')
  })

  it('updates active button styling on VIEW_CHANGED', () => {
    initNav(store)
    store.dispatch(EVENTS.VIEW_CHANGED, 'input-studio')
    const btn = container.querySelector('[data-view="input-studio"]')
    expect(btn.classList.contains('nav-btn-active')).toBe(true)
  })
})
