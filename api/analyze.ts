import type { VercelRequest, VercelResponse } from '@vercel/node'
import Anthropic from '@anthropic-ai/sdk'
import { checkRateLimit } from './lib/rate-limit.js'
import {
  getNodeAnalyzerPrompt,
  getFrictionResolverPrompt,
  getPromptGeneratorPrompt,
} from './lib/prompts.js'

type Feature = 'node-analyzer' | 'friction-resolver' | 'prompt-generator'

const VALID_FEATURES: ReadonlySet<Feature> = new Set([
  'node-analyzer',
  'friction-resolver',
  'prompt-generator',
])

const ALLOWED_ORIGINS = [
  'https://smslo-ai.github.io',
  'http://localhost:5173',
]

function getSystemPrompt(feature: Feature): string {
  switch (feature) {
    case 'node-analyzer':
      return getNodeAnalyzerPrompt()
    case 'friction-resolver':
      return getFrictionResolverPrompt()
    case 'prompt-generator':
      return getPromptGeneratorPrompt()
  }
}

function setCorsHeaders(req: VercelRequest, res: VercelResponse): void {
  const origin = req.headers.origin
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  setCorsHeaders(req, res)

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  // Rate limit check
  const ip =
    (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ??
    req.socket.remoteAddress ??
    'unknown'
  const rateCheck = checkRateLimit(ip)
  if (!rateCheck.allowed) {
    res.status(429).json({
      error: 'Rate limit exceeded',
      retryAfter: rateCheck.retryAfter,
    })
    return
  }

  // Validate request body
  const { feature, context } = req.body as { feature?: unknown; context?: unknown }

  if (
    typeof feature !== 'string' ||
    !VALID_FEATURES.has(feature as Feature)
  ) {
    res.status(400).json({
      error: 'Invalid feature. Must be one of: node-analyzer, friction-resolver, prompt-generator',
    })
    return
  }

  if (!context || typeof context !== 'object' || Array.isArray(context)) {
    res.status(400).json({ error: 'Missing or invalid context object' })
    return
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    res.status(500).json({ error: 'Server configuration error' })
    return
  }

  try {
    const client = new Anthropic({ apiKey })

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: getSystemPrompt(feature as Feature),
      messages: [
        {
          role: 'user',
          content: JSON.stringify(context),
        },
      ],
    })

    const textBlock = message.content.find((block) => block.type === 'text')
    const content = textBlock && 'text' in textBlock ? textBlock.text : ''

    res.status(200).json({
      content,
      model: message.model,
      usage: {
        input_tokens: message.usage.input_tokens,
        output_tokens: message.usage.output_tokens,
      },
    })
  } catch (err: unknown) {
    const isApiError =
      err instanceof Error && 'status' in err && typeof (err as Record<string, unknown>).status === 'number'

    if (isApiError) {
      const status = (err as Record<string, unknown>).status as number
      res.status(status >= 400 && status < 600 ? status : 500).json({
        error: `Claude API error: ${err instanceof Error ? err.message : 'Unknown error'}`,
      })
      return
    }

    res.status(500).json({
      error: 'Internal server error',
    })
  }
}
