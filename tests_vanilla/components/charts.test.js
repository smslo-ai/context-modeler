import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { initCharts } from '../../src/components/charts.js'

describe('initCharts', () => {
  it('does not throw when canvas elements are missing', () => {
    expect(() => initCharts()).not.toThrow()
  })

  it('does not throw when called with canvas elements present', () => {
    const radar = document.createElement('canvas')
    radar.id = 'chart-radar'
    const bubble = document.createElement('canvas')
    bubble.id = 'chart-bubble'
    document.body.appendChild(radar)
    document.body.appendChild(bubble)

    // Chart.js won't actually render in jsdom but should not throw
    expect(() => initCharts()).not.toThrow()

    document.body.removeChild(radar)
    document.body.removeChild(bubble)
  })
})
