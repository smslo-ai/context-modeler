# Implementation Plan: React + TypeScript Migration

**Track ID:** react-migration_20260402
**Spec:** [spec.md](./spec.md)
**Design Spec:** `docs/superpowers/specs/2026-04-02-react-migration-design.md`
**Created:** 2026-04-02
**Status:** [ ] Not Started

## Overview

Full migration from vanilla JS to React 19 + TypeScript in 6 phases. Each phase is independently verifiable. The vanilla JS source is archived for reference; the React app is built from scratch following the design spec's architecture.

---

## Phase 1: Scaffolding & Tooling

Set up the React + TypeScript project, quality tooling, and design system foundation. No features -- just a working skeleton that renders a styled "hello world."

### Tasks

- [ ] Task 1.1: Archive vanilla JS source to `src_vanilla/` (rename `src/` -> `src_vanilla/`, create fresh `src/`)
- [ ] Task 1.2: Install React 19, TypeScript 5.x, `@types/react`, `@types/react-dom`
- [ ] Task 1.3: Create `tsconfig.json` with strict mode, JSX react-jsx, path aliases
- [ ] Task 1.4: Convert `vite.config.js` to `vite.config.ts` (keep `base`, CSP plugin, Tailwind plugin, test config)
- [ ] Task 1.5: Install and configure ESLint v9 flat config (`@typescript-eslint`, `react-hooks`, `jsx-a11y`, `react`)
- [ ] Task 1.6: Install and configure Prettier with `prettier-plugin-tailwindcss`
- [ ] Task 1.7: Install and configure Husky + lint-staged (ESLint + Prettier + `tsc --noEmit` on staged files)
- [ ] Task 1.8: Initialize shadcn/ui (`npx shadcn@latest init`) -- configure for dark theme, New York style
- [ ] Task 1.9: Install Framer Motion (`motion` package, v12+)
- [ ] Task 1.10: Create `src/index.css` with Tailwind imports, design system tokens (palette, typography, utility classes from design spec)
- [ ] Task 1.11: Create entry files: `src/main.tsx` (ReactDOM.createRoot), `src/App.tsx` (placeholder)
- [ ] Task 1.12: Update `index.html` -- replace vanilla JS body with `<div id="root"></div>`, update script to `/src/main.tsx`
- [ ] Task 1.13: Create `src/utils/cn.ts` (clsx + tailwind-merge utility)
- [ ] Task 1.14: Update `package.json` scripts to match design spec (build, lint, format, typecheck, validate)
- [ ] Task 1.15: Install test dependencies (`@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`)

### Verification

- [ ] `npm run dev` starts and renders the App placeholder with dark background + correct fonts
- [ ] `npm run validate` passes (typecheck + lint + test with no tests yet = pass)
- [ ] `npm run build` produces clean output
- [ ] Pre-commit hook fires on `git commit` (test with a dummy commit, then reset)

---

## Phase 2: Types, Services & State

Build the data layer: TypeScript interfaces, services, context provider, and hooks. Fully testable with no UI.

### Tasks

- [ ] Task 2.1: Create `src/types.ts` -- all interfaces/enums (OntologyData, Workflow, System, Persona, FrictionRule, ContextMap, SimulationMode, SelectedNode, AppAction)
- [ ] Task 2.2: Create `src/services/types.ts` -- service-layer types (StorageAdapter interface, service return types)
- [ ] Task 2.3: Create `src/services/storage.service.ts` -- localStorage adapter implementing StorageAdapter, same `context-modeler:` key prefix and schema
- [ ] Task 2.4: Create `src/services/ontology.service.ts` -- CRUD for workflows, systems, personas (add, update, delete with cascading cleanup)
- [ ] Task 2.5: Create `src/services/friction.service.ts` -- heatmap computation, friction scoring
- [ ] Task 2.6: Create `src/utils/heuristics.ts` -- port friction scoring and simulation visual logic from `src_vanilla/utils/heuristics.js`
- [ ] Task 2.7: Create `src/utils/sanitize.ts` -- DOMPurify wrapper (port from `src_vanilla/utils/sanitize.js`)
- [ ] Task 2.8: Create `src/data/defaults.ts` -- sample ontology data (port from `src_vanilla/data/defaults.js`)
- [ ] Task 2.9: Create `src/context/AppContext.tsx` -- AppProvider with useReducer, useApp() hook
- [ ] Task 2.10: Create `src/hooks/useOntology.ts` -- hook wrapping ontology service
- [ ] Task 2.11: Create `src/hooks/useSimulation.ts` -- simulation mode logic
- [ ] Task 2.12: Create `src/hooks/useLocalStorage.ts` -- typed localStorage hook
- [ ] Task 2.13: Write unit tests for services (storage, ontology, friction) -- target 90%+ coverage
- [ ] Task 2.14: Write unit tests for utils (heuristics, sanitize, cn)
- [ ] Task 2.15: Write unit test verifying localStorage data round-trip compatibility with vanilla JS format

### Verification

- [ ] `npm run validate` passes
- [ ] Services tests cover CRUD, cascading deletes, friction computation
- [ ] Data round-trip test confirms vanilla JS localStorage data loads correctly in React

---

## Phase 3: Shell & Navigation

Build the app shell: Nav, view routing (Dashboard <-> Input Studio), toast system, and the overall layout. Renders the skeleton with working navigation but no feature content.

### Tasks

- [ ] Task 3.1: Install shadcn/ui components: Button, Toast (Sonner)
- [ ] Task 3.2: Create `src/components/nav/Nav.tsx` -- top nav with view switcher, about button, simulation mode selector
- [ ] Task 3.3: Create `src/components/shared/Toast.tsx` -- Sonner wrapper
- [ ] Task 3.4: Update `src/App.tsx` -- AppProvider wrapping Nav + view routing (CSS `hidden` toggle on Dashboard/InputStudio placeholders)
- [ ] Task 3.5: Wire dark-mode background gradient from design spec onto body
- [ ] Task 3.6: Add Outfit + Inter font imports (Google Fonts)
- [ ] Task 3.7: Implement About modal using shadcn Dialog

### Verification

- [ ] Dev server shows nav bar with dark theme
- [ ] Clicking Dashboard / Input Studio toggles views
- [ ] Toast notifications appear on actions
- [ ] About modal opens and closes

---

## Phase 4: Dashboard View

Build all dashboard components: hero banner, triad explorer, heatmap, charts, insight panel, simulation controls, roadmap.

### Tasks

- [ ] Task 4.1: Install shadcn/ui components: Card, Tooltip, Badge, Dialog, Tabs
- [ ] Task 4.2: Create `src/components/dashboard/Dashboard.tsx` -- layout container
- [ ] Task 4.3: Create `src/components/dashboard/TriadExplorer.tsx` -- 3-column layout (workflows, systems, personas) with mobile tab switcher
- [ ] Task 4.4: Create `src/components/dashboard/NodeCard.tsx` -- individual node card with selection, badges, linked items
- [ ] Task 4.5: Create `src/components/dashboard/Heatmap.tsx` -- semantic `<table>` with friction gradient
- [ ] Task 4.6: Create `src/components/dashboard/HeatmapCell.tsx` -- individual cell with hover glow, click handler
- [ ] Task 4.7: Create `src/components/dashboard/FrictionModal.tsx` -- detail modal on cell click (shadcn Dialog)
- [ ] Task 4.8: Create `src/components/dashboard/SimulationControl.tsx` -- mode switcher (Morning Triage, Deep Focus, Firefighting)
- [ ] Task 4.9: Create `src/components/dashboard/InsightPanel.tsx` -- node detail panel (sidebar)
- [ ] Task 4.10: Create `src/components/dashboard/Charts.tsx` -- Chart.js wrappers (Radar + Bubble)
- [ ] Task 4.11: Create `src/components/dashboard/Roadmap.tsx` -- implementation roadmap cards
- [ ] Task 4.12: Add hero banner with welcome state for first-time visitors
- [ ] Task 4.13: Add locked AI buttons (disabled, tooltip: "Coming in Phase 5")
- [ ] Task 4.14: Add Framer Motion entrance animations to cards, panels, and modals
- [ ] Task 4.15: Write component tests for NodeCard, HeatmapCell, SimulationControl interactions

### Verification

- [ ] Dashboard renders with sample data, matches design-preview.html palette
- [ ] Triad explorer shows 3 columns (tabs on mobile)
- [ ] Clicking a node selects it and shows insight panel
- [ ] Heatmap cells show friction gradient, click opens modal
- [ ] Simulation modes dim/highlight appropriate nodes
- [ ] Charts render with correct data
- [ ] AI buttons are visible but disabled

---

## Phase 5: Input Studio View

Build the Input Studio: 3-tab form (Workflows, Systems, Users), export/import JSON, data reset.

### Tasks

- [ ] Task 5.1: Install shadcn/ui components: Input, Textarea, Select, Tabs
- [ ] Task 5.2: Create `src/components/input-studio/InputStudio.tsx` -- tab container
- [ ] Task 5.3: Create `src/components/input-studio/WorkflowForm.tsx` -- add/edit workflow form
- [ ] Task 5.4: Create `src/components/input-studio/SystemForm.tsx` -- add/edit system form
- [ ] Task 5.5: Create `src/components/input-studio/UserForm.tsx` -- add/edit persona form
- [ ] Task 5.6: Implement export JSON (download file)
- [ ] Task 5.7: Implement import JSON (file picker, validation, merge/replace)
- [ ] Task 5.8: Implement data reset with confirmation dialog
- [ ] Task 5.9: Write component tests for form validation, export/import round-trip

### Verification

- [ ] Can add a workflow in Input Studio, see it appear in Dashboard triad explorer
- [ ] Can edit and delete nodes
- [ ] Export produces valid JSON, import restores it
- [ ] Reset clears data after confirmation
- [ ] Form validation prevents invalid submissions

---

## Phase 6: Polish & Verification

Onboarding tour, accessibility audit, final visual QA, coverage check, and build verification.

### Tasks

- [ ] Task 6.1: Create `src/components/shared/Onboarding.tsx` -- multi-step tour for first-time visitors
- [ ] Task 6.2: Accessibility audit -- keyboard navigation, ARIA labels, focus trapping in modals, screen reader testing
- [ ] Task 6.3: Visual QA -- compare every view against design-preview.html, fix discrepancies
- [ ] Task 6.4: Responsive QA -- test at mobile, tablet, desktop breakpoints
- [ ] Task 6.5: Run `npm run test:coverage` -- verify 80%+ overall, 90%+ services/utils. Write additional tests if needed.
- [ ] Task 6.6: Run Lighthouse -- verify accessibility score >= 95. Fix any issues.
- [ ] Task 6.7: Grep for `any` types -- zero tolerance. Fix any found.
- [ ] Task 6.8: Clean up: remove `src_vanilla/` if no longer needed, update `.gitignore` if needed
- [ ] Task 6.9: Final `npm run validate` + `npm run build` -- clean output, no warnings

### Verification

- [ ] All 17 features work per acceptance criteria
- [ ] `npm run validate` passes
- [ ] `npm run build` clean
- [ ] Lighthouse a11y >= 95
- [ ] No `any` types
- [ ] 80%+ coverage
- [ ] Pre-commit hooks block bad commits

---

## Final Verification

- [ ] All acceptance criteria from spec.md met
- [ ] All tests passing (`npm run validate`)
- [ ] Build clean (`npm run build`)
- [ ] Visual match to design-preview.html
- [ ] localStorage data from vanilla JS loads correctly
- [ ] Ready for PR to `main`

---

_Generated by Conductor. Tasks will be marked [~] in progress and [x] complete._
