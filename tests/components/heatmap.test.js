import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { initHeatmap } from '../../src/components/heatmap.js'
import { createStore } from '../../src/state/store.js'
import { EVENTS } from '../../src/constants/events.js'
import { getDefaultData } from '../../src/data/defaults.js'

describe('initHeatmap', () => {
  let container, store

  beforeEach(() => {
    container = document.createElement('div')
    container.id = 'heatmap-grid'
    document.body.appendChild(container)
    store = createStore(getDefaultData())
  })

  afterEach(() => {
    document.body.removeChild(container)
  })

  it('renders a <table> element (not divs)', () => {
    initHeatmap(store)
    expect(container.querySelector('table')).toBeTruthy()
    expect(container.querySelector('table').tagName).toBe('TABLE')
  })

  it('has correct number of data rows (systems count)', () => {
    initHeatmap(store)
    const tbody = container.querySelector('tbody')
    expect(tbody.rows.length).toBe(5) // 5 default systems
  })

  it('has correct number of data columns (workflows count + 1 for label)', () => {
    initHeatmap(store)
    const headerRow = container.querySelector('thead tr')
    // 1 corner cell + 5 workflow headers
    expect(headerRow.cells.length).toBe(6)
  })

  it('header cells contain workflow names', () => {
    initHeatmap(store)
    const headerCells = Array.from(container.querySelectorAll('thead th'))
    expect(headerCells.some(th => th.textContent.includes('Management Escalations'))).toBe(true)
  })

  it('row header cells contain system names', () => {
    initHeatmap(store)
    const rowHeaders = Array.from(container.querySelectorAll('tbody th'))
    expect(rowHeaders.some(th => th.textContent.includes('SharePoint'))).toBe(true)
  })

  it('data cells have background color styles', () => {
    initHeatmap(store)
    const dataCells = container.querySelectorAll('tbody td')
    dataCells.forEach(cell => {
      expect(cell.getAttribute('style') || cell.className).toBeTruthy()
    })
  })

  it('re-renders when NODE_REMOVED is dispatched', () => {
    initHeatmap(store)
    const before = container.querySelector('tbody').rows.length
    store.dispatch(EVENTS.NODE_REMOVED, { id: 'sys-sharepoint', nodeType: 'system' })
    const after = container.querySelector('tbody').rows.length
    expect(after).toBe(before - 1)
  })
})
