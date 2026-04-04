# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Context-Aware Workplace Modeler** -- a public portfolio SPA that models a workplace through three lenses (Business Workflows, Systems & Infrastructure, User Personas) and visualizes their relationships. React 19 + TypeScript (strict) + Vite 8 + Tailwind CSS v4 + shadcn/ui + Framer Motion + Chart.js.

**Owner:** Shane Slosar (@shaneslo) at [smslo-ai](https://github.com/smslo-ai). Shane is a financial operations professional building AI fluency -- explain technical concepts clearly.

## Commands

```bash
npm run dev              # Vite dev server (http://localhost:5173)
npm run build            # typecheck + production build to dist/
npm run preview          # Preview production build
npm test                 # Run all tests once (vitest)
npm run test:watch       # Tests in watch mode
npm run test:coverage    # Tests with coverage report
npm run lint             # ESLint check
npm run lint:fix         # ESLint auto-fix
npm run format           # Prettier format
npm run typecheck        # tsc --noEmit
npm run validate         # typecheck + lint + test (use before committing)
npx vitest src/services/storage.service.test.ts   # Run a single test file
npx vitest -t "builds matrix"                      # Run tests matching name
```

## Testing

Vitest config lives inside `vite.config.ts`. Environment is jsdom with globals enabled. Tests are co-located with source files (`*.test.ts` next to `*.ts` in `src/`). 111 tests across 13 files, 90%+ coverage on services/utils.

## Key Documents (read before making changes)

All planning and review docs live in `docs/`.

| File | What | When to Read |
|------|------|-------------|
| `docs/PLAN.md` (v3.0) | Phased build plan with 9 phases, pre-flight checklist, PR strategy | Before starting any phase |
| `docs/SPEC.md` | Implementation-ready specification -- every data structure, view, interaction, component | Before building any feature |
| `docs/AUDIT_SECURITY_A11Y.md` | 24 security + accessibility findings with severity ratings | Before any DOM manipulation, form, or modal work |
| `docs/AUDIT_UX.md` | 27 UX findings (4 critical) | Before any responsive, empty state, or onboarding work |
| `docs/TEST_PLAN.md` | Testing strategy and coverage targets | Before writing or restructuring tests |
| `docs/REFACTORING_PLAN.md` | Refactoring roadmap | Before any major restructuring |
| `docs/REVIEW_ENGINEERING.md` | Senior engineer review of the plan | For architectural context |
| `docs/REVIEW_PRODUCT.md` | Product manager review | For prioritization context |

## Architecture

Two-view SPA with no router. Views toggle via CSS `hidden` class (not conditional rendering -- preserves DOM state).

**Module dependency direction:** `main.tsx` -> `App.tsx` -> `context/` -> `hooks/` -> `services/` -> `data/`. Never import upward.

**Path alias:** `@/*` maps to `./src/*`. Always use `@/` imports, never relative `../` paths.

**TypeScript strictness:** `noUnusedLocals`, `noUnusedParameters`, `noUncheckedIndexedAccess` are all enabled. ESLint bans `any` (`@typescript-eslint/no-explicit-any`). Test files are exempted from non-null assertion warnings.

**Animations:** Framer Motion respects `prefers-reduced-motion`. Components check this and pass empty animation objects when reduced motion is preferred.

**State management:** `useReducer` in `src/context/AppContext.tsx`. `AppProvider` wraps the app; `useApp()` hook exposes state + dispatch. Actions: SET_VIEW, SET_MODE, SELECT_NODE, ADD_NODE, REMOVE_NODE, RESET_DATA, SET_ONTOLOGY_DATA.

**Services layer:** `src/services/` -- storage (localStorage adapter), ontology (CRUD + cascading deletes), friction (heatmap matrix). Services are pure functions, not hooks.

**Hooks:** `src/hooks/` -- useOntology (wraps ontology service + dispatch), useSimulation, useLocalStorage.

**Data model:** Three parallel arrays (workflows[], systems[], personas[]) in `ontologyData`, cross-referenced by string ID. The `contextMap` (adjacency list) and `frictionRules` (keyed by `workflowId::systemId`) live in `src/data/defaults.ts`. Node IDs are restricted to `[a-z0-9-]`.

**Heatmap:** Rendered as a semantic `<table>` element (not CSS grid divs). Rows = systems, columns = workflows, cells = friction scores.

## Critical Constraints

- **DOMPurify is mandatory** for all dynamic content insertion into the DOM. Use the wrapper in `src/utils/sanitize.ts`. Never set element content directly with user-provided or dynamic strings without sanitizing first.
- **CSP meta tag is production-only.** Injected via Vite plugin (Vite HMR needs inline scripts in dev).
- **`base: '/context-modeler/'` in vite.config.ts** is required for GitHub Pages. Change to `'/'` if using a custom domain.
- **localStorage keys are prefixed** `context-modeler:` to avoid collisions with other repos on the same GitHub Pages origin.
- **Chart.js uses tree-shaken imports.** Import only the specific controllers/elements needed (RadarController, BubbleController, etc.), not the full library.
- **AI buttons are locked** (disabled with tooltip) until Phase 5. Do not show "coming soon" toasts -- they harm portfolio impression.
- **Cascading deletes:** When removing a node, clean references from contextMap, frictionRules, and all linked arrays on other nodes. This is the highest-risk logic in the project.
- **Storage saves are debounced** (300ms) to batch rapid mutations. Validation in `src/services/storage.service.ts`.
- **Node limits:** 100 nodes max per array, validated on load.
- **`save-exact=true` in `.npmrc`** -- all dependency versions are pinned exactly. No semver ranges.

## Branch + Commit Conventions

- Branch: `feat/`, `fix/`, `chore/`, `a11y/`, `docs/` prefixes
- Commits: Start with a verb, keep short ("Add input sanitization to prevent XSS")
- Never push directly to `main` -- always use PRs with squash merge
- PR targets ~9 for portfolio-ready milestone, ~13 with AI features
- **CI (GitHub Actions):** Push/PR to `main` triggers: `npm audit --audit-level=high` -> `npm test` -> `vite build`. Node 22. Concurrency limited to one deploy at a time.
- **Formatting:** Prettier (no semicolons, single quotes, trailing commas, 100-char width). Tailwind class sorting via `prettier-plugin-tailwindcss`. Pre-commit hook runs lint-staged on `src/` files.

## legacy/ Directory

Archived code and prototype material. Do NOT import from or build on these files.

- `legacy/OLD_prototype/` -- static infographic HTML, original spec RTF, 18 screenshots from Gemini Canvas
- `legacy/src_vanilla/` -- archived vanilla JS version (reference only)
- `legacy/tests_vanilla/` -- archived vanilla JS tests

## shadcn/ui Gotcha

After `npx shadcn@latest add <component>`:
1. Fix imports: change `@/lib/utils` to `@/utils/cn`. Delete `src/lib/utils.ts` if created.
2. Check for `@/utils` imports (should be `@/utils/cn` -- no barrel export exists).
3. Sonner component imports `next-themes` -- rewrite to hardcode `theme="dark"` and remove the dep.
4. Verify `class-variance-authority` is installed (`npx shadcn add button` may not install it).
5. Restyle default shadcn classes (`bg-background`, `border`, `text-muted-foreground`) to use project tokens (`bg-surface`, `border-white/8`, `text-foreground-muted`).

## Conductor

Project uses Conductor for track management. Active track: `conductor/tracks/react-migration_20260402/`. Check `plan.md` for task status before starting work. `legacy/src_vanilla/` contains the archived vanilla JS version (reference only).

## Migration Status

Phases 1-5 complete (scaffold + data layer + shell & navigation + dashboard view + input studio, 111 tests). Phase 6 (Polish & Verification) is next. Check `conductor/tracks/react-migration_20260402/plan.md` for current task status. Design spec: `docs/superpowers/specs/2026-04-02-react-migration-design.md`. Design preview: `docs/design-preview.html`.
