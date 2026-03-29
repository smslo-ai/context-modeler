import { describe, it, expect } from 'vitest'
import { EVENTS } from '../../src/constants/events.js'

describe('EVENTS', () => {
  it('exports an object', () => {
    expect(typeof EVENTS).toBe('object')
  })
  it('all values are strings', () => {
    Object.values(EVENTS).forEach(v => expect(typeof v).toBe('string'))
  })
  it('has no duplicate values', () => {
    const values = Object.values(EVENTS)
    expect(new Set(values).size).toBe(values.length)
  })
  it('contains required event names', () => {
    expect(EVENTS).toHaveProperty('STATE_CHANGED')
    expect(EVENTS).toHaveProperty('VIEW_CHANGED')
    expect(EVENTS).toHaveProperty('NODE_SELECTED')
    expect(EVENTS).toHaveProperty('NODE_ADDED')
    expect(EVENTS).toHaveProperty('NODE_REMOVED')
    expect(EVENTS).toHaveProperty('DATA_RESET')
    expect(EVENTS).toHaveProperty('MODE_CHANGED')
  })
})
