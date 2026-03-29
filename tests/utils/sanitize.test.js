import { describe, it, expect } from 'vitest'
import { sanitizeHTML, renderMarkdown } from '../../src/utils/sanitize.js'

describe('sanitizeHTML', () => {
  it('strips <script> tags', () => {
    expect(sanitizeHTML('<script>alert("xss")</script>hello')).not.toContain('<script>')
  })
  it('strips event handlers', () => {
    expect(sanitizeHTML('<div onclick="evil()">text</div>')).not.toContain('onclick')
  })
  it('strips javascript: URLs', () => {
    expect(sanitizeHTML('<a href="javascript:evil()">link</a>')).not.toContain('javascript:')
  })
  it('passes clean headings through', () => {
    expect(sanitizeHTML('<h2>Title</h2>')).toContain('<h2>')
  })
  it('passes clean lists through', () => {
    expect(sanitizeHTML('<ul><li>item</li></ul>')).toContain('<li>')
  })
})

describe('renderMarkdown', () => {
  it('converts markdown to HTML', () => {
    const result = renderMarkdown('# Hello')
    expect(result).toContain('<h1')
    expect(result).toContain('Hello')
  })
  it('strips script tags from markdown output', () => {
    const result = renderMarkdown('<script>evil()</script>')
    expect(result).not.toContain('<script>')
  })
})
