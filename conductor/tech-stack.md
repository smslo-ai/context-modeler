# Tech Stack

## Primary Language

- **JavaScript (ES6 modules)** -- Vanilla JS, no TypeScript (type hints via JSDoc where helpful)

## Frontend

| Technology | Version | Purpose |
|-----------|---------|---------|
| Vite | ^8.0.1 | Dev server, bundler, ES module resolution |
| Tailwind CSS | ^4.2.2 | Utility-first styling via `@tailwindcss/vite` plugin |
| Chart.js | ^4.5.1 | Radar chart (maturity), bubble chart (responsibility mapping) |
| DOMPurify | ^3.3.3 | XSS sanitization for all dynamic DOM content |
| marked | ^17.0.5 | Markdown-to-HTML rendering (Phase 5 AI responses) |

## Backend

None. Frontend-only SPA. Phase 5 may introduce serverless functions (Vercel) for AI proxy.

## Database

None. Browser localStorage with `context-modeler:` key prefix and schema validation on load.

## Infrastructure

| Service | Purpose |
|---------|---------|
| GitHub Pages | Static hosting (free) |
| GitHub Actions | CI/CD -- auto-deploy on push to `main` |

## Dev Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| Vitest | ^4.1.2 | Unit test runner (ESM-native) |
| @vitest/coverage-v8 | ^4.1.2 | Code coverage reporting |
| jsdom | ^29.0.1 | DOM environment for tests |
| @types/dompurify | ^3.0.5 | Type definitions for DOMPurify |

## Uncommitted Dependencies (in working tree)

| Package | Version | Notes |
|---------|---------|-------|
| playwright | 1.59.0 | E2E testing -- not yet integrated |

## Build Configuration

- `vite.config.js`: `base: '/context-modeler/'` (required for GitHub Pages subpath)
- CSP meta tag injected via Vite plugin (production only; Vite HMR needs inline scripts in dev)
- Chart.js uses tree-shaken imports (specific controllers/elements, not full library)

## Environment

- Node: v24, npm 11
- Shell: zsh
- Platform: macOS (Darwin)
