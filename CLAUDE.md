# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Context-Aware Workplace Modeler** -- a public portfolio SPA that models a workplace through three lenses (Business Workflows, Systems & Infrastructure, User Personas) and visualizes their relationships. Vanilla JS + Vite + Tailwind CSS v4 + Chart.js. No framework.

**Owner:** Shane Slosar (@shaneslo) at [smslo-ai](https://github.com/smslo-ai). Shane is a financial operations professional building AI fluency -- explain technical concepts clearly.

## Commands

```bash
npm run dev            # Start Vite dev server (http://localhost:5173)
npm run build          # Production build to dist/
npm run preview        # Preview production build locally
npm test               # Run all tests once
npm run test:watch     # Run tests in watch mode
npm run test:coverage  # Run tests with coverage report
npx vitest run tests/state/store.test.js  # Run a single test file
```

## Testing

Vitest config lives inside `vite.config.js` (no separate vitest.config). Environment is jsdom with globals enabled (describe/it/expect available without imports). Test files mirror `src/` structure under `tests/`.

## Key Documents (read before making changes)

| File | What | When to Read |
|------|------|-------------|
| `PLAN.md` (v3.0) | Phased build plan with 9 phases, pre-flight checklist, PR strategy | Before starting any phase |
| `SPEC.md` | Implementation-ready specification -- every data structure, view, interaction, component | Before building any feature |
| `AUDIT_SECURITY_A11Y.md` | 24 security + accessibility findings with severity ratings | Before any DOM manipulation, form, or modal work |
| `AUDIT_UX.md` | 27 UX findings (4 critical) | Before any responsive, empty state, or onboarding work |
| `TEST_PLAN.md` | Testing strategy and coverage targets | Before writing or restructuring tests |
| `REFACTORING_PLAN.md` | Refactoring roadmap | Before any major restructuring |
| `REVIEW_ENGINEERING.md` | Senior engineer review of the plan | For architectural context |
| `REVIEW_PRODUCT.md` | Product manager review | For prioritization context |

## Architecture

Two-view SPA with no router. Views toggle via CSS `hidden` class on `#view-dashboard` and `#view-input-studio`.

**Module dependency direction:** `main.js` -> `views/` -> `components/` -> `state/store.js` -> `state/storage.js` -> `data/`. Never import upward.

**State management:** Custom event emitter in `store.js`. All state mutations call `notify(eventName)`. Components subscribe to events from `src/constants/events.js`. Event names are constants -- never use string literals for event subscriptions.

**Store public API:** `createStore(initialData)` returns `{ getState(), dispatch(eventName, payload), subscribe(eventName, callback) }`. Subscribers receive a frozen state snapshot.

**Data model:** Three parallel arrays (workflows[], systems[], personas[]) in `ontologyData`, cross-referenced by string ID. The `contextMap` (adjacency list) and `frictionRules` (keyed by `workflowId::systemId`) are separate files in `data/`. Node IDs are restricted to `[a-z0-9-]` with type prefixes: `wf-` (workflows), `sys-` (systems), `usr-` (personas).

**Heatmap:** Rendered as a semantic `<table>` element (not CSS grid divs). Rows = systems, columns = workflows, cells = friction scores.

## Critical Constraints

- **DOMPurify is mandatory** for all dynamic content insertion into the DOM. Use the wrapper in `utils/sanitize.js`. Never set element content directly with user-provided or dynamic strings without sanitizing first.
- **CSP meta tag is production-only.** Injected via Vite plugin (Vite HMR needs inline scripts in dev).
- **`base: '/context-modeler/'` in vite.config.js** is required for GitHub Pages. Change to `'/'` if using a custom domain.
- **localStorage keys are prefixed** `context-modeler:` to avoid collisions with other repos on the same GitHub Pages origin.
- **Chart.js uses tree-shaken imports.** Import only the specific controllers/elements needed (RadarController, BubbleController, etc.), not the full library.
- **AI buttons are locked** (disabled with tooltip) until Phase 5. Do not show "coming soon" toasts -- they harm portfolio impression.
- **Cascading deletes:** When removing a node, clean references from contextMap, frictionRules, and all linked arrays on other nodes. This is the highest-risk logic in the project.
- **Storage saves are debounced** (300ms) to batch rapid mutations. `beforeunload` flushes pending saves synchronously.
- **Node limits:** 100 nodes max per array (enforced in `state/storage.js` validation), 50 nodes max per type on import (enforced in `utils/data-io.js`).

## Branch + Commit Conventions

- Branch: `feature/`, `fix/`, `chore/`, `a11y/`, `docs/` prefixes
- Commits: Start with a verb, keep short ("Add input sanitization to prevent XSS")
- Never push directly to `main` -- always use PRs with squash merge
- PR targets ~9 for portfolio-ready milestone, ~13 with AI features

## OLD_prototype/ Directory

This contains reference material only:
- `Context_Aware_Enterprise_Infographic.html` -- **static infographic** (NOT the interactive SPA). Extractable: chart data values, CSS color palette hex values.
- `context-modeler_v0specDoc.rtf` -- original spec document from Gemini (superseded by `SPEC.md`)
- 18 screenshots of the interactive prototype running in Gemini Canvas

Do NOT attempt to extract or reverse-engineer code from the infographic HTML. Build from `SPEC.md`.

## Phase Awareness

Check `PLAN.md` Part 4 summary table for current phase status before making changes. Each phase has explicit dependencies. Key milestone: **end of Phase 4D = portfolio-ready**. Phase 5 (AI features) requires a separate architecture decision (see PLAN.md Part 7).
