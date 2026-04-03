import DOMPurify from 'dompurify'
import { marked } from 'marked'

const ALLOWED_TAGS = [
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'p',
  'ul',
  'ol',
  'li',
  'strong',
  'em',
  'code',
  'pre',
  'blockquote',
  'a',
  'br',
  'hr',
]
const ALLOWED_ATTR = ['href', 'class']

export function sanitizeHTML(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    FORCE_BODY: true,
  })
}

export function renderMarkdown(markdownString: string): string {
  const rawHTML = marked.parse(markdownString) as string
  return sanitizeHTML(rawHTML)
}
