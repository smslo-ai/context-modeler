import { describe, it, expect } from 'vitest'
import { sanitizeHTML, renderMarkdown } from './sanitize'

describe('sanitizeHTML', () => {
  it('strips script tags', () => {
    expect(sanitizeHTML('<script>alert("xss")</script>')).toBe('')
  })

  it('preserves allowed tags', () => {
    const input = '<p>Hello <strong>world</strong></p>'
    expect(sanitizeHTML(input)).toBe(input)
  })

  it('strips disallowed attributes', () => {
    const result = sanitizeHTML('<p onclick="hack()">text</p>')
    expect(result).not.toContain('onclick')
    expect(result).toContain('text')
  })

  it('preserves href on anchor tags', () => {
    const input = '<a href="https://example.com">link</a>'
    expect(sanitizeHTML(input)).toContain('href="https://example.com"')
  })
})

describe('renderMarkdown', () => {
  it('converts markdown to sanitized HTML', () => {
    const result = renderMarkdown('**bold text**')
    expect(result).toContain('<strong>bold text</strong>')
  })

  it('strips dangerous tags from markdown output', () => {
    const result = renderMarkdown('text <script>alert("xss")</script>')
    expect(result).not.toContain('<script>')
  })
})
