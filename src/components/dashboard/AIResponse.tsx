import { useState } from 'react'
import { useReducedMotion } from 'motion/react'
import { Copy, ChevronDown, ChevronUp } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { renderMarkdown } from '@/utils/sanitize'
import { cn } from '@/utils/cn'

interface AIResponseProps {
  result: string | null
  loading: boolean
  error: string | null
  onRetry?: () => void
  variant?: 'markdown' | 'json'
}

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  } catch {
    toast.error('Failed to copy')
  }
}

export function AIResponse({
  result,
  loading,
  error,
  onRetry,
  variant = 'markdown',
}: AIResponseProps) {
  const prefersReduced = useReducedMotion()
  const [expanded, setExpanded] = useState(false)

  if (loading) {
    if (prefersReduced) {
      return (
        <p className="text-foreground-muted mt-4 text-sm" role="status">
          Analyzing...
        </p>
      )
    }
    return (
      <div className="mt-4 space-y-3" role="status" aria-label="Loading AI response">
        <div className="h-4 w-3/4 animate-pulse rounded bg-white/10" />
        <div className="h-4 w-1/2 animate-pulse rounded bg-white/10" />
        <div className="h-4 w-5/6 animate-pulse rounded bg-white/10" />
      </div>
    )
  }

  if (error) {
    const rateLimitMatch = error.match(/Rate limited.*?(\d+)\s*s/)
    return (
      <div className="mt-4 space-y-2">
        <p className="text-destructive text-sm">{error}</p>
        {rateLimitMatch && (
          <p className="text-foreground-muted text-xs">Retry after {rateLimitMatch[1]}s</p>
        )}
        {onRetry && (
          <Button variant="secondary" size="xs" onClick={onRetry}>
            Try Again
          </Button>
        )}
      </div>
    )
  }

  if (!result) return null

  if (variant === 'json') {
    return (
      <div className="relative">
        <div className={cn('relative', !expanded && 'max-h-48 overflow-hidden')}>
          <pre className="modern-box text-foreground-muted mt-4 overflow-x-auto p-4 text-xs">
            <code>{result}</code>
          </pre>
          {!expanded && (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/60 to-transparent" />
          )}
        </div>
        <Button
          variant="ghost"
          size="icon-xs"
          className="absolute top-6 right-2"
          onClick={() => copyToClipboard(result)}
          aria-label="Copy to clipboard"
        >
          <Copy className="h-3 w-3" />
        </Button>
        {result.split('\n').length > 8 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-accent mt-1 text-xs hover:underline"
          >
            {expanded ? (
              <>
                <ChevronUp className="mr-1 inline h-3 w-3" />
                Show less
              </>
            ) : (
              <>
                <ChevronDown className="mr-1 inline h-3 w-3" />
                Show more
              </>
            )}
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="relative">
      <div className={cn('relative', !expanded && 'max-h-48 overflow-hidden')}>
        <div
          className="text-foreground-muted [&_h2]:text-foreground [&_strong]:text-foreground [&_a]:text-accent mt-4 space-y-3 text-sm [&_a]:underline [&_code]:rounded [&_code]:bg-white/5 [&_code]:px-1 [&_h2]:mt-4 [&_h2]:mb-2 [&_h2]:text-base [&_h2]:font-bold [&_li]:mb-1 [&_ol]:list-decimal [&_ol]:pl-4 [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-4"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(result) }}
        />
        {!expanded && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/60 to-transparent" />
        )}
      </div>
      {result.split('\n').length > 6 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-accent mt-1 text-xs hover:underline"
        >
          {expanded ? (
            <>
              <ChevronUp className="mr-1 inline h-3 w-3" />
              Show less
            </>
          ) : (
            <>
              <ChevronDown className="mr-1 inline h-3 w-3" />
              Show more
            </>
          )}
        </button>
      )}
    </div>
  )
}
