# Tech Stack

## Primary Languages

- **TypeScript 5.x** -- strict mode enabled (`strict: true` in tsconfig). No `any` types.
- **TSX** -- React component markup

## Frontend

| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 19 | UI framework (functional components, hooks) |
| Vite | ^8.x | Dev server, bundler, ES module resolution |
| Tailwind CSS | v4 | Utility-first styling via `@tailwindcss/vite` plugin |
| Framer Motion | v12+ | Animation (`motion/react` import path) |
| shadcn/ui | latest | Accessible component primitives (Dialog, Tabs, Select, Button, Input, Toast, Card, Tooltip, Badge) |
| Chart.js | ^4.x | Radar chart (maturity), bubble chart (responsibility mapping) -- tree-shaken imports |
| DOMPurify | ^3.x | XSS sanitization for all dynamic DOM content |
| marked | ^17.x | Markdown-to-HTML rendering (Phase 5 AI responses) |

## State Management

React Context + `useReducer` via single `AppContext`. No external state library. Components consume via `useApp()` hook.

## Backend

None. Frontend-only SPA. Phase 5 may introduce serverless functions for AI proxy.

## Database

None. Browser localStorage via `StorageAdapter` interface (swappable for backend later). Key prefix: `context-modeler:`.

## Infrastructure

| Service | Purpose |
|---------|---------|
| GitHub Pages | Static hosting (free) |
| GitHub Actions | CI/CD -- auto-deploy on push to `main` |

## Quality Tooling

| Tool | Purpose |
|------|---------|
| ESLint v9 (flat config) | `@typescript-eslint`, `react-hooks`, `jsx-a11y`, `react` plugins |
| Prettier | Formatting + `prettier-plugin-tailwindcss` for class sorting |
| Vitest | Unit + component tests with `@testing-library/react` + `@testing-library/jest-dom` |
| Husky + lint-staged | Pre-commit: ESLint + Prettier + `tsc --noEmit` on staged files |
| Playwright | E2E smoke tests |

### Key Lint Rules

- `no-explicit-any` -- error
- `react-hooks/exhaustive-deps` -- error
- `jsx-a11y/no-noninteractive-element-interactions` -- error
- `no-console` -- warn in dev, error in build

## npm Scripts

```json
{
  "dev": "vite",
  "build": "tsc --noEmit && vite build",
  "preview": "vite preview",
  "test": "vitest run",
  "test:watch": "vitest",
  "test:coverage": "vitest run --coverage",
  "lint": "eslint src/",
  "lint:fix": "eslint src/ --fix",
  "format": "prettier --write src/",
  "typecheck": "tsc --noEmit",
  "validate": "npm run typecheck && npm run lint && npm run test"
}
```

## Build Configuration

- `vite.config.ts`: `base: '/context-modeler/'` (required for GitHub Pages subpath)
- CSP meta tag injected via Vite plugin (production only; Vite HMR needs inline scripts in dev)
- Chart.js uses tree-shaken imports (specific controllers/elements, not full library)

## Environment

- Node: v24, npm 11
- Shell: zsh
- Platform: macOS (Darwin)

## Migration Notes

This stack replaces the original vanilla JS implementation. The design spec is at `docs/superpowers/specs/2026-04-02-react-migration-design.md`. Key architectural decisions:

- **Services layer** (`services/`) abstracts data access behind `StorageAdapter` interface -- swap localStorage for Supabase/Firebase later without touching components
- **shadcn/ui** replaces hand-built modals, tabs, toasts, and form inputs
- **Framer Motion** provides entrance animations, hover states, and layout transitions
- **Dark-first design** with navy/amber/teal palette (see design spec for token values)
