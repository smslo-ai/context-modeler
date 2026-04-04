# Implementation Plan: React + TypeScript Migration

**Track ID:** react-migration_20260402
**Spec:** [spec.md](./spec.md)
**Design Spec:** `docs/superpowers/specs/2026-04-02-react-migration-design.md`
**Created:** 2026-04-02
**Status:** [x] Complete (Phases 1-7)

## Overview

Full migration from vanilla JS to React 19 + TypeScript in 6 phases. Each phase is independently verifiable. The vanilla JS source is archived for reference; the React app is built from scratch following the design spec's architecture.

---

## Phase 1: Scaffolding & Tooling

Set up the React + TypeScript project, quality tooling, and design system foundation. No features -- just a working skeleton that renders a styled "hello world."

### Tasks

- [x] Task 1.1: Archive vanilla JS source to `src_vanilla/` (rename `src/` -> `src_vanilla/`, create fresh `src/`)
- [x] Task 1.2: Install React 19, TypeScript 5.x, `@types/react`, `@types/react-dom`
- [x] Task 1.3: Create `tsconfig.json` with strict mode, JSX react-jsx, path aliases
- [x] Task 1.4: Convert `vite.config.js` to `vite.config.ts` (keep `base`, CSP plugin, Tailwind plugin, test config)
- [x] Task 1.5: Install and configure ESLint v9 flat config (`@typescript-eslint`, `react-hooks`, `jsx-a11y`, `react`)
- [x] Task 1.6: Install and configure Prettier with `prettier-plugin-tailwindcss`
- [x] Task 1.7: Install and configure Husky + lint-staged (ESLint + Prettier + `tsc --noEmit` on staged files)
- [x] Task 1.8: Initialize shadcn/ui (`npx shadcn@latest init`) -- configure for dark theme, New York style
- [x] Task 1.9: Install Framer Motion (`motion` package, v12+)
- [x] Task 1.10: Create `src/index.css` with Tailwind imports, design system tokens (palette, typography, utility classes from design spec)
- [x] Task 1.11: Create entry files: `src/main.tsx` (ReactDOM.createRoot), `src/App.tsx` (placeholder)
- [x] Task 1.12: Update `index.html` -- replace vanilla JS body with `<div id="root"></div>`, update script to `/src/main.tsx`
- [x] Task 1.13: Create `src/utils/cn.ts` (clsx + tailwind-merge utility)
- [x] Task 1.14: Update `package.json` scripts to match design spec (build, lint, format, typecheck, validate)
- [x] Task 1.15: Install test dependencies (`@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`)

### Verification

- [x] `npm run dev` starts and renders the App placeholder with dark background + correct fonts
- [x] `npm run validate` passes (typecheck + lint + test with no tests yet = pass)
- [x] `npm run build` produces clean output
- [x] Pre-commit hook fires on `git commit` (test with a dummy commit, then reset)

---

## Phase 2: Types, Services & State

Build the data layer: TypeScript interfaces, services, context provider, and hooks. Fully testable with no UI.

### Tasks

- [x] Task 2.1: Create `src/types.ts` -- all interfaces/enums (OntologyData, Workflow, System, Persona, FrictionRule, ContextMap, SimulationMode, SelectedNode, AppAction)
- [x] Task 2.2: Create `src/services/types.ts` -- service-layer types (StorageAdapter interface, service return types)
- [x] Task 2.3: Create `src/services/storage.service.ts` -- localStorage adapter implementing StorageAdapter, same `context-modeler:` key prefix and schema
- [x] Task 2.4: Create `src/services/ontology.service.ts` -- CRUD for workflows, systems, personas (add, update, delete with cascading cleanup)
- [x] Task 2.5: Create `src/services/friction.service.ts` -- heatmap computation, friction scoring
- [x] Task 2.6: Create `src/utils/heuristics.ts` -- port friction scoring and simulation visual logic from `src_vanilla/utils/heuristics.js`
- [x] Task 2.7: Create `src/utils/sanitize.ts` -- DOMPurify wrapper (port from `src_vanilla/utils/sanitize.js`)
- [x] Task 2.8: Create `src/data/defaults.ts` -- sample ontology data (port from `src_vanilla/data/defaults.js`)
- [x] Task 2.9: Create `src/context/AppContext.tsx` -- AppProvider with useReducer, useApp() hook
- [x] Task 2.10: Create `src/hooks/useOntology.ts` -- hook wrapping ontology service
- [x] Task 2.11: Create `src/hooks/useSimulation.ts` -- simulation mode logic
- [x] Task 2.12: Create `src/hooks/useLocalStorage.ts` -- typed localStorage hook
- [x] Task 2.13: Write unit tests for services (storage, ontology, friction) -- target 90%+ coverage
- [x] Task 2.14: Write unit tests for utils (heuristics, sanitize, cn)
- [x] Task 2.15: Write unit test verifying localStorage data round-trip compatibility with vanilla JS format

### Verification

- [x] `npm run validate` passes
- [x] Services tests cover CRUD, cascading deletes, friction computation
- [x] Data round-trip test confirms vanilla JS localStorage data loads correctly in React

---

## Phase 3: Shell & Navigation

Build the app shell: Nav, view routing (Dashboard <-> Input Studio), toast system, and the overall layout. Renders the skeleton with working navigation but no feature content.

### Tasks

- [x] Task 3.1: Install shadcn/ui components: Button, Dialog, Toast (Sonner)
- [x] Task 3.2: Create `src/components/nav/Nav.tsx` -- top nav with view switcher, about button
- [x] Task 3.3: Create `src/components/shared/Toast.tsx` -- Sonner wrapper
- [x] Task 3.4: Update `src/App.tsx` -- AppProvider wrapping Nav + view routing (CSS `hidden` toggle on Dashboard/InputStudio placeholders)
- [x] Task 3.5: Wire dark-mode background gradient from design spec onto body (already done in Phase 1)
- [x] Task 3.6: Add Outfit + Inter font imports (already done in Phase 1)
- [x] Task 3.7: Implement About modal using shadcn Dialog

### Verification

- [x] Dev server shows nav bar with dark theme
- [x] Clicking Dashboard / Input Studio toggles views
- [x] Toast notifications appear on actions
- [x] About modal opens and closes

---

## Phase 4: Dashboard View

Build all dashboard components: hero banner, triad explorer, heatmap, charts, insight panel, simulation controls, roadmap.

### Tasks

- [x] Task 4.1: Install shadcn/ui components: Card, Tooltip, Badge, Dialog, Tabs
- [x] Task 4.2: Create `src/components/dashboard/Dashboard.tsx` -- layout container
- [x] Task 4.3: Create `src/components/dashboard/TriadExplorer.tsx` -- 3-column layout (workflows, systems, personas) with mobile tab switcher
- [x] Task 4.4: Create `src/components/dashboard/NodeCard.tsx` -- individual node card with selection, badges, linked items
- [x] Task 4.5: Create `src/components/dashboard/Heatmap.tsx` -- semantic `<table>` with friction gradient
- [x] Task 4.6: Create `src/components/dashboard/HeatmapCell.tsx` -- individual cell with hover glow, click handler
- [x] Task 4.7: Create `src/components/dashboard/FrictionModal.tsx` -- detail modal on cell click (shadcn Dialog)
- [x] Task 4.8: Create `src/components/dashboard/SimulationControl.tsx` -- mode switcher (Morning Triage, Deep Focus, Firefighting)
- [x] Task 4.9: Create `src/components/dashboard/InsightPanel.tsx` -- node detail panel (sidebar)
- [x] Task 4.10: Create `src/components/dashboard/Charts.tsx` -- Chart.js wrappers (Radar + Bubble)
- [x] Task 4.11: Create `src/components/dashboard/Roadmap.tsx` -- implementation roadmap cards
- [x] Task 4.12: Add hero banner with welcome state for first-time visitors
- [x] Task 4.13: Add locked AI buttons (disabled, tooltip: "Coming in Phase 5")
- [x] Task 4.14: Add Framer Motion entrance animations to cards, panels, and modals
- [x] Task 4.15: Write component tests for NodeCard, HeatmapCell, SimulationControl interactions

### Verification

- [x] Dashboard renders with sample data, matches docs/design-preview.html palette
- [x] Triad explorer shows 3 columns (tabs on mobile)
- [x] Clicking a node selects it and shows insight panel
- [x] Heatmap cells show friction gradient, click opens modal
- [x] Simulation modes dim/highlight appropriate nodes
- [x] Charts render with correct data
- [x] AI buttons are visible but disabled

---

## Phase 5: Input Studio View

Build the Input Studio: 3-tab form (Workflows, Systems, Users), export/import JSON, data reset.

### Tasks

- [x] Task 5.1: Install shadcn/ui components: Input, Textarea, Select, Tabs
- [x] Task 5.2: Create `src/components/input-studio/InputStudio.tsx` -- tab container
- [x] Task 5.3: Create `src/components/input-studio/WorkflowForm.tsx` -- add/edit workflow form
- [x] Task 5.4: Create `src/components/input-studio/SystemForm.tsx` -- add/edit system form
- [x] Task 5.5: Create `src/components/input-studio/PersonaForm.tsx` -- add/edit persona form
- [x] Task 5.6: Implement export JSON (download file)
- [x] Task 5.7: Implement import JSON (file picker, validation)
- [x] Task 5.8: Implement data reset with confirmation dialog
- [x] Task 5.9: Write component tests for form validation, export/import, integration

### Verification

- [x] Can add a workflow in Input Studio, see it appear in Dashboard triad explorer
- [x] Can edit and delete nodes
- [x] Export produces valid JSON, import restores it
- [x] Reset clears data after confirmation
- [x] Form validation prevents invalid submissions

---

## Phase 6: Polish & Verification

Onboarding tour, accessibility audit, final visual QA, coverage check, and build verification.

### Tasks

- [x] Task 6.1: Create `src/components/shared/Onboarding.tsx` -- multi-step tour for first-time visitors
- [x] Task 6.2: Accessibility audit -- keyboard navigation, ARIA labels, focus trapping in modals, screen reader testing
- [x] Task 6.3: Visual QA -- compare every view against docs/design-preview.html, fix discrepancies
- [x] Task 6.4: Responsive QA -- test at mobile, tablet, desktop breakpoints
- [x] Task 6.5: Run `npm run test:coverage` -- verify 80%+ overall, 90%+ services/utils. Write additional tests if needed.
- [x] Task 6.6: Run Lighthouse -- verify accessibility score >= 95. Fix any issues.
- [x] Task 6.7: Grep for `any` types -- zero tolerance. Fix any found.
- [x] Task 6.8: Clean up: remove `src_vanilla/` if no longer needed, update `.gitignore` if needed
- [x] Task 6.9: Final `npm run validate` + `npm run build` -- clean output, no warnings

### Verification

- [x] All 17 features work per acceptance criteria
- [x] `npm run validate` passes
- [x] `npm run build` clean
- [x] Lighthouse a11y >= 95
- [x] No `any` types
- [x] 80%+ coverage
- [x] Pre-commit hooks block bad commits

---

## Final Verification

- [x] All acceptance criteria from spec.md met
- [x] All tests passing (`npm run validate`)
- [x] Build clean (`npm run build`)
- [x] Visual match to docs/design-preview.html
- [x] localStorage data from vanilla JS loads correctly
- [x] Ready for PR to `main`

---

_Generated by Conductor. Tasks will be marked [~] in progress and [x] complete._
