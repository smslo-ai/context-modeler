# Refactoring Plan: Context-Aware Workplace Modeler

**Version:** 1.0
**Date:** 2026-03-29
**Author:** Software Architect Agent (Claude Opus 4.6)
**Inputs:** ANALYSIS_GEMINI_FEEDBACK.md, REVIEW_ENGINEERING.md, REVIEW_PRODUCT.md, AUDIT_SECURITY_A11Y.md, AUDIT_UX.md, PLAN.md v3.0, SPEC.md v1.0
**Scope:** Refactor Gemini Canvas prototype into modular Vite SPA with corrected data model, architecture, and security posture

---

## How to Read This Document

This plan supersedes the phased approach in PLAN.md v3.0 for implementation sequencing. PLAN.md remains the source of truth for repository setup, hosting decisions, and PR strategy. This document addresses only the code refactoring -- what gets built, in what order, and why.

Each phase lists files, functions, tests (written BEFORE implementation), acceptance criteria, dependencies, and risk flags. Phases are ordered by dependency: nothing in Phase R3 can start until Phase R2 is complete.

**Guiding architectural decision:** Path A (Preserve Prototype Fidelity) with selective improvements, per ANALYSIS_GEMINI_FEEDBACK.md recommendation. The prototype's data schema, heuristic logic, and DOM IDs are the baseline. Targeted improvements (semantic `<table>` heatmap, serverless AI proxy, DOMPurify pipeline) are applied where they improve quality without breaking fidelity.

---

## Part 1: Refactoring Phases

### Phase R1: Foundation

**Goal:** Correct the Vite scaffold so it matches the target architecture. Remove template files, fix configuration, install missing dependencies, create folder structure.

**Files created/modified:**

| File | Action | Notes |
|------|--------|-------|
| `package.json` | Modify | Add `dompurify`, `marked`, `vitest` (dev), `@types/dompurify` (dev). Remove default Vite template metadata. |
| `vite.config.js` | Modify | Add `base: '/context-modeler/'` (RC-1). Add CSP injection plugin for production builds only. |
| `tailwind.config.js` | Remove | Tailwind v4 uses CSS-first config via `@theme` in `style.css` (REC-1). |
| `src/style.css` | Modify | Add `@theme` block with design tokens (colors, fonts, spacing from prototype palette). Add `@font-face` for Inter with `font-display: swap`. |
| `src/counter.js` | Delete | Vite template file. |
| `src/main.js` | Rewrite | Empty entry point with `import './style.css'` only. Populated in R6. |
| `index.html` | Modify | Remove Vite template content. Add semantic shell: `<header>`, `<main>` with `#view-dashboard` and `#view-input` divs, AI container stubs. |
| `src/constants/events.js` | Create | Event name constants (RC-3). |
| `src/utils/sanitize.js` | Create | DOMPurify + marked.js wrapper. |
| `src/data/` | Create dir | Empty, populated in R2. |
| `src/state/` | Create dir | Empty, populated in R3. |
| `src/components/` | Create dir | Empty, populated in R5. |
| `src/views/` | Create dir | Empty, populated in R6. |
| `src/services/` | Create dir | Empty, populated in R7. |
| `src/utils/heuristics.js` | Create | Empty, populated in R4. |
| `api/` | Create dir | Empty, populated in R7. |
| `tests/` | Create dir | Test files added per-phase. |

**Functions implemented:**

- `sanitize.js`: `sanitizeHTML(dirty)` -- wraps `DOMPurify.sanitize()` with an allowlist appropriate for AI markdown output (headings, lists, paragraphs, code blocks, emphasis). No `<script>`, `<iframe>`, `<style>`, event handlers.
- `sanitize.js`: `renderMarkdown(markdownString)` -- pipes `marked.parse(markdownString)` through `sanitizeHTML()`. Single call site for all markdown-to-DOM operations.
- `events.js`: `EVENTS` object with all event name constants.

**Tests to write BEFORE implementation:**

| Test file | What it covers |
|-----------|---------------|
| `tests/utils/sanitize.test.js` | `sanitizeHTML` strips `<script>`, event handlers, `javascript:` URLs. Passes clean HTML through unchanged. `renderMarkdown` converts markdown to sanitized HTML. |
| `tests/constants/events.test.js` | All values in `EVENTS` are unique strings. No duplicates. |

**Acceptance criteria:**

- `npm run dev` starts without errors
- `npm run build` produces a `dist/` folder with correct `base` path in asset URLs
- `npx vitest run` passes all R1 tests
- `src/` contains only the target folder structure -- no Vite template files remain
- CSP meta tag appears in production build HTML but not in dev server HTML

**Dependencies:** None. This is the starting phase.

**Risk flags:**

- Tailwind v4 CSS-first config may behave differently than v3 tutorials suggest. Test that `@theme` tokens are picked up by the Vite plugin before proceeding.
- CSP plugin must not break Vite HMR in dev mode. Verify with `npm run dev` after adding.

---

### Phase R2: Data Model

**Goal:** Implement the corrected data model with prototype-accurate enums, ID format, and relationship schema. This is the single most important phase -- every subsequent phase depends on these types being correct.

**Files created/modified:**

| File | Action | Notes |
|------|--------|-------|
| `src/data/defaults.js` | Create | `getDefaultData()` factory returning the 14-node ontology. |
| `src/state/storage.js` | Create | `loadFromStorage()`, `saveToStorage()`, `validateOntologyData()`. |

**Functions implemented:**

`defaults.js`:
- `getDefaultData()` -- returns a fresh deep copy of the default ontology data. Returns an object with `workflows[]`, `systems[]`, `personas[]`, and `relationships[]`. Every call returns a new object (no shared references).

Corrected enum values (from Gemini analysis, NOT from SPEC.md):

```
WorkflowType:  'Critical' | 'Routine' | 'Strategic' | 'Collaborative' | 'Technical'
PersonaState:  'High Load' | 'Flow' | 'Routine' | 'Social'
SimulationMode: 'triage' | 'focus' | 'fire'
SystemCategory: 'Comms' | 'Storage' | 'Tracking' | (others from prototype)
```

Node ID format: `wf_{timestamp}`, `sys_{timestamp}`, `user_{timestamp}` -- matching the prototype's ID generation, not the spec's kebab-case `wf-{name}` format.

Relationship schema (prototype format):
```javascript
relationships: [
  { source: 'wf_1234567890', targets: ['sys_1234567891', 'user_1234567892'] }
]
```

NOT the spec's `contextMap` adjacency list format. See Part 4 for migration documentation.

`storage.js`:
- `loadFromStorage()` -- reads `localStorage.getItem('context-modeler:ontology-data')`, parses JSON, validates via `validateOntologyData()`. Returns parsed data on success, calls `getDefaultData()` on failure.
- `saveToStorage(data)` -- serializes to JSON, writes to localStorage with `context-modeler:` prefix. On `QuotaExceededError`, shows toast notification (SEC-04).
- `validateOntologyData(parsed)` -- checks structure: three arrays present, each node has required fields, all string fields under max length, all enum fields match allowed values, array lengths under 100 (SEC-03).

**Tests to write BEFORE implementation:**

| Test file | What it covers |
|-----------|---------------|
| `tests/data/defaults.test.js` | `getDefaultData()` returns object with three arrays. Returns a fresh copy each call (mutation isolation). All 14 nodes present. All enum values are Title Case (not kebab-case). All IDs match `{prefix}_{digits}` pattern. Relationships use `{source, targets}` format. |
| `tests/state/storage.test.js` | `validateOntologyData` accepts valid data. Rejects missing arrays. Rejects invalid enum values (catches kebab-case). Rejects oversized strings. Rejects arrays over 100 items. `loadFromStorage` falls back to defaults on invalid data. `saveToStorage` handles `QuotaExceededError`. |

**Acceptance criteria:**

- `getDefaultData()` returns data matching the prototype's exact enum values and ID format
- No references to `contextMap`, `frictionRules`, or `modeRules` as static data files
- `validateOntologyData` rejects data with spec-era kebab-case enums
- All R2 tests pass

**Dependencies:** R1 (folder structure, vitest installed).

**Risk flags:**

- The prototype's exact default data values need to be verified against screenshots since the Canvas source is not locally available. Use screenshots as reference for node names, types, and categories.
- The `relationships[]` format is less efficient than an adjacency list for lookups. This is a deliberate fidelity choice -- see Part 4 for the documented trade-off.

---

### Phase R3: State Management

**Goal:** Build the event emitter store that mediates all state mutations. Every component reads from the store and listens for change events. No component mutates state directly.

**Files created/modified:**

| File | Action | Notes |
|------|--------|-------|
| `src/state/store.js` | Create | Event emitter + state holder. Single source of truth. |

**Functions implemented:**

`store.js`:
- `createStore(initialData)` -- factory that returns a store instance. Holds `ontologyData`, `currentView`, `selectedNode`, `simulationMode`, `activeFilters`.
- `store.getState()` -- returns a read-only snapshot of current state (shallow freeze).
- `store.dispatch(eventName, payload)` -- applies a state mutation and calls `notify(eventName)`. All mutations go through dispatch.
- `store.subscribe(eventName, callback)` -- registers a listener. Returns an unsubscribe function.
- `store.notify(eventName)` -- internal. Calls all subscribers for the given event name. Event names must be values from `EVENTS` constants (never raw strings).

Specific dispatch handlers:
- `EVENTS.NODE_ADDED` -- adds node to appropriate array, updates relationships if needed, persists to storage.
- `EVENTS.NODE_REMOVED` -- removes node, cascading cleanup of relationships array (remove entries where node is `source`, remove node from all `targets` arrays). Persists to storage. This is the highest-risk operation (Engineering Review Risk #2).
- `EVENTS.VIEW_CHANGED` -- toggles `currentView` between `'dashboard'` and `'input'`.
- `EVENTS.MODE_CHANGED` -- sets `simulationMode` to one of `'triage' | 'focus' | 'fire' | null`.
- `EVENTS.NODE_SELECTED` -- sets `selectedNode` for insight panel.
- `EVENTS.DATA_RESET` -- replaces state with `getDefaultData()`, persists, notifies all.

Contract (document in a code comment at top of store.js per Engineering Review mitigation):
> Every state mutation calls `dispatch(eventName, payload)`. Every component registers exactly one listener per event it cares about. Components never mutate state directly -- they call `dispatch()`.

**Tests to write BEFORE implementation:**

| Test file | What it covers |
|-----------|---------------|
| `tests/state/store.test.js` | `createStore` initializes with provided data. `getState` returns frozen snapshot (mutations to returned object do not affect store). `subscribe` + `dispatch` triggers callback. `unsubscribe` stops callbacks. `NODE_ADDED` adds to correct array. `NODE_REMOVED` cascades: removes from source relationships, removes from all targets arrays, removes orphaned relationship entries. `DATA_RESET` restores defaults. Dispatch with unknown event name throws (catches typos). |

**Acceptance criteria:**

- All state mutations go through `dispatch()`
- `NODE_REMOVED` cascading logic is covered by at least 3 test cases (remove source, remove target, remove node with no relationships)
- No string literals used for event names -- all references use `EVENTS.*`
- All R3 tests pass

**Dependencies:** R2 (data model, storage, defaults).

**Risk flags:**

- Re-render coordination is the hardest debugging problem in this architecture (Engineering Review Risk #1). The strict contract (one listener per event per component) must be enforced by code review, not by runtime checks. A `renderAll()` fallback function is recommended for debugging but should not be the primary mechanism.
- The cascading delete in `NODE_REMOVED` is the highest-risk logic in the project. Write tests first. Get the tests passing before writing any component code.

---

### Phase R4: Heuristic Engine

**Goal:** Port the prototype's dynamic friction calculation and mode simulation logic as pure, testable functions. These are the intellectual core of the application -- the logic that makes the tool genuinely useful rather than a static display.

**Files created/modified:**

| File | Action | Notes |
|------|--------|-------|
| `src/utils/heuristics.js` | Implement | Pure functions, no DOM access, no side effects. |

**Functions implemented:**

`heuristics.js`:
- `calculateFriction(workflow, system)` -- evaluates workflow type and system category to return a friction level. This is a DYNAMIC heuristic, not a static lookup table. The function evaluates properties at runtime:

```
If workflow.type === 'Strategic' AND system.category === 'Comms' -> 'high'
If workflow.type === 'Critical' AND system.category === 'Storage' -> 'mod'
If workflow.type === 'Routine' AND system.category === 'Tracking' -> 'low'
Default -> 'none'
```

This replaces the spec's `frictionRules: Record<string, number>` keyed by `workflowId::systemId`. The dynamic approach means new nodes added through Input Studio automatically participate in friction calculations without manual mapping -- which is the entire point of the tool.

- `getSimulationVisuals(item, mode)` -- returns visual state for a node under a simulation mode. Property-based evaluation, not ID-based:

```
'focus' mode: dim if item.category === 'Comms' OR item.state === 'High Load'
'fire' mode: pulse if item.type === 'Critical'; dim if item.type === 'Routine' OR 'Strategic'
'triage' mode: (evaluate based on prototype behavior from screenshots)
null mode: all nodes normal
```

Returns `{ opacity, animation, className }` for use by rendering components.

- `getFrictionColor(frictionLevel)` -- maps `'high' | 'mod' | 'low' | 'none'` to CSS classes/colors for heatmap cells.

- `buildFrictionMatrix(workflows, systems)` -- generates the complete friction matrix by calling `calculateFriction` for every workflow-system pair. Returns a 2D array suitable for heatmap rendering. Pure function -- no DOM, no state mutation.

**Tests to write BEFORE implementation:**

| Test file | What it covers |
|-----------|---------------|
| `tests/utils/heuristics.test.js` | `calculateFriction` returns `'high'` for Strategic+Comms. Returns `'mod'` for Critical+Storage. Returns `'low'` for Routine+Tracking. Returns `'none'` for unknown combinations. Handles missing properties gracefully (no throw). `getSimulationVisuals` returns dim state for Comms nodes in focus mode. Returns pulse for Critical nodes in fire mode. Returns normal for all nodes when mode is null. `buildFrictionMatrix` returns correct dimensions (workflows.length x systems.length). Matrix values match individual `calculateFriction` calls. |

**Acceptance criteria:**

- All heuristic functions are pure -- no imports from `state/`, no DOM access, no side effects
- `calculateFriction` operates on node properties, not node IDs
- `getSimulationVisuals` operates on node properties, not node IDs
- No references to `frictionRules` or `modeRules` static maps anywhere in codebase
- All R4 tests pass

**Dependencies:** R2 (needs correct enum values for type/category/state matching).

**Risk flags:**

- The exact heuristic rules in the prototype may not be fully captured by the Gemini analysis. The three rules documented (Strategic+Comms, Critical+Storage, Routine+Tracking) may not cover all combinations present in the prototype. Use screenshots to verify behavior and add rules as discovered. The function structure supports adding new rules without architectural changes.
- `'triage'` mode behavior is the least documented of the three modes. May require additional screenshot analysis or Gemini confirmation.

---

### Phase R5: Component Decomposition

**Goal:** Build the visual components that render DOM from state. Each component subscribes to relevant store events and re-renders its section when data changes. Components never mutate state -- they call `store.dispatch()`.

**Files created/modified:**

| File | Action | Notes |
|------|--------|-------|
| `src/components/nav.js` | Create | Header navigation, view switching. |
| `src/components/triad-explorer.js` | Create | Three-column ontology explorer (workflows, systems, personas). |
| `src/components/heatmap.js` | Create | Cognitive friction heatmap. Uses `<table>` (REC-4), not CSS Grid. |
| `src/components/charts.js` | Create | Chart.js radar + bubble with tree-shaken imports (REC-2). |

**Functions implemented:**

`nav.js`:
- `initNav(store)` -- renders header, binds nav buttons (`#nav-input`, `#nav-dashboard` -- prototype IDs, not spec IDs). Dispatches `EVENTS.VIEW_CHANGED` on click. Subscribes to `EVENTS.VIEW_CHANGED` to update active nav state.

`triad-explorer.js`:
- `initTriadExplorer(store)` -- renders three columns of node cards. Each card is clickable, dispatching `EVENTS.NODE_SELECTED`. Subscribes to `EVENTS.NODE_ADDED`, `EVENTS.NODE_REMOVED`, `EVENTS.DATA_RESET` to re-render. All dynamic content passes through `sanitizeHTML()`.
- `renderNodeCard(node, type)` -- builds a single card element. Uses `document.createElement` + `textContent` for user-provided strings. Returns a DOM element, not an HTML string.

`heatmap.js`:
- `initHeatmap(store)` -- renders a `<table>` element with system rows, workflow columns, friction score cells. Calls `buildFrictionMatrix()` from heuristics. Each cell gets a background color from `getFrictionColor()`. Subscribes to `EVENTS.NODE_ADDED`, `EVENTS.NODE_REMOVED`, `EVENTS.MODE_CHANGED` to re-render.
- Cell click dispatches `EVENTS.NODE_SELECTED` with the workflow-system pair for the insight panel.

Architectural decision: the prototype uses CSS Grid `<div>` elements for the heatmap. This plan adopts a semantic `<table>` per Engineering Review REC-4. The `<table>` approach provides free keyboard navigation, screen reader row/column header association, and simpler ARIA implementation. This is a deliberate improvement over the prototype. See Part 4 for documentation.

`charts.js`:
- `initCharts(store)` -- registers only needed Chart.js components (tree-shaken per REC-2). Creates radar and bubble chart instances on `#radarChart` and `#bubbleChart` (prototype IDs, not spec IDs). Wrapped in `IntersectionObserver` for lazy initialization (REC-3). Subscribes to `EVENTS.NODE_ADDED`, `EVENTS.NODE_REMOVED`, `EVENTS.MODE_CHANGED` to update chart data.

Chart.js tree-shaken imports (specific list):
```javascript
import {
  Chart,
  RadarController,
  BubbleController,
  RadialLinearScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
} from 'chart.js';
```

**Tests to write BEFORE implementation:**

| Test file | What it covers |
|-----------|---------------|
| `tests/components/heatmap.test.js` | `initHeatmap` renders a `<table>` (not divs). Table has correct number of rows (systems) and columns (workflows). Cell colors match `getFrictionColor` output. Re-renders on store events. |
| `tests/components/triad-explorer.test.js` | `renderNodeCard` returns a DOM element with correct text content. All user-provided text is sanitized (verify no raw unsanitized content on user strings). Re-renders when nodes are added/removed. |

Note: Chart.js tests require a canvas mock. Consider testing chart data preparation logic separately from Chart.js rendering. Nav tests are thin -- visual behavior is better verified manually or via integration tests in R8.

**Acceptance criteria:**

- All components import from `state/store.js` and `constants/events.js` -- never from each other
- No component mutates state directly -- all user actions go through `store.dispatch()`
- All dynamic content uses `sanitizeHTML()` or `textContent` -- zero raw unsanitized dynamic content
- Heatmap renders as `<table>` with `<th>` headers for rows and columns
- Chart.js uses explicit registration (tree-shaken), not `import 'chart.js/auto'`
- `#radarChart` and `#bubbleChart` IDs match prototype (not spec's `#chart-radar`, `#chart-bubble`)
- All R5 tests pass

**Dependencies:** R3 (store), R4 (heuristics for heatmap and simulation visuals).

**Risk flags:**

- Chart.js v4 tree-shaking can be fragile. If a required component is missing from the registration, the chart silently fails to render. Test chart rendering early with the exact import set.
- The `IntersectionObserver` lazy-load for charts must handle the case where charts are already visible on initial load (above the fold on large screens). Use `{ threshold: 0 }` to trigger immediately if visible.
- Heatmap `<table>` styling with Tailwind requires attention -- `border-collapse`, cell padding, and hover states need explicit classes. The prototype's CSS Grid styles do not transfer.

---

### Phase R6: View Assembly

**Goal:** Wire components into views, implement form handlers, and connect main.js as the application entry point. After this phase, the app is functionally complete (minus AI and polish).

**Files created/modified:**

| File | Action | Notes |
|------|--------|-------|
| `src/views/dashboard.js` | Create | Composes triad-explorer, heatmap, charts, insight panel into dashboard view. |
| `src/views/input-studio.js` | Create | Three-tab form interface with separate submit handlers. |
| `src/main.js` | Implement | Application entry point. Creates store, initializes views, loads persisted data. |

**Functions implemented:**

`dashboard.js`:
- `initDashboard(store)` -- mounts all dashboard components into `#view-dashboard`. Manages simulation mode controls. Subscribes to `EVENTS.VIEW_CHANGED` to show/hide.
- Insight panel renders into `#insight-box` (prototype ID, not spec's `#insight-panel`). Updates on `EVENTS.NODE_SELECTED`.

`input-studio.js`:
- `initInputStudio(store)` -- mounts three-tab form into `#view-input` (prototype ID, not spec's `#view-input-studio`). Manages tab switching between workflow, system, and user persona forms.
- `submitWorkflow(formData, store)` -- validates form input, generates ID as `wf_${Date.now()}`, dispatches `EVENTS.NODE_ADDED`. Separate function from system/user submission.
- `submitSystem(formData, store)` -- validates, generates `sys_${Date.now()}` ID, dispatches `EVENTS.NODE_ADDED`.
- `submitUser(formData, store)` -- validates, generates `user_${Date.now()}` ID, dispatches `EVENTS.NODE_ADDED`.

Three separate form handlers match the prototype's architecture. The spec's unified `addNode()` function does not exist in the prototype. Form field IDs match prototype: `#inp-wf-label`, `#inp-sys-cat`, etc.

`main.js`:
- `init()` -- called on `DOMContentLoaded`. Creates store with `loadFromStorage()` data (falls back to `getDefaultData()`). Calls `initNav(store)`, `initDashboard(store)`, `initInputStudio(store)`. Sets initial view to dashboard.

**Tests to write BEFORE implementation:**

| Test file | What it covers |
|-----------|---------------|
| `tests/views/input-studio.test.js` | `submitWorkflow` generates ID in `wf_{digits}` format. Dispatches `NODE_ADDED` with correct payload. Rejects empty labels. `submitSystem` and `submitUser` follow same patterns with their respective prefixes. Form fields are cleared after successful submission. |

**Acceptance criteria:**

- Application loads, shows dashboard, allows view switching to input studio and back
- All three form types (workflow, system, user persona) create nodes that appear in the triad explorer
- Node deletion removes the node and updates the heatmap, charts, and relationships
- `#view-input` and `#nav-input` IDs are used (not `#view-input-studio` / `#btn-input-studio`)
- `#insight-box` is used (not `#insight-panel`)
- Simulation mode toggle affects visual state of all components
- Data persists across page reloads via localStorage
- All R6 tests pass

**Dependencies:** R5 (all components), R3 (store), R4 (heuristics).

**Risk flags:**

- Three separate submit handlers increase surface area for inconsistency. Each must follow the same validation, ID generation, dispatch, and form-clear pattern. Extract shared logic into a helper if the pattern diverges.
- `Date.now()` for ID generation can produce collisions if two nodes are added in the same millisecond (unlikely but possible in tests). Consider `Date.now() + Math.random().toString(36).slice(2, 7)` for uniqueness.

---

### Phase R7: AI Service Migration

**Goal:** Migrate the four live AI call patterns from client-side `callGemini()` with exposed API key to serverless functions with sanitized responses. This is a security requirement (SEC-07, SEC-08), not a feature addition. The AI functionality already exists in the prototype.

**Files created/modified:**

| File | Action | Notes |
|------|--------|-------|
| `src/services/ai-service.js` | Create | Client-side wrappers that call serverless endpoints instead of Gemini directly. |
| `api/analyze.js` | Create | Vercel Serverless Function for `triggerAIAnalysis`. |
| `api/prompt.js` | Create | Vercel Serverless Function for `triggerAIPromptGen`. |
| `api/friction.js` | Create | Vercel Serverless Function for `analyzeFriction`. |
| `api/scenario.js` | Create | Vercel Serverless Function for `generateScenario`. |

**Functions implemented:**

`ai-service.js` (client-side):
- `analyzeNode(nodeData)` -- calls `/api/analyze` with node context, returns sanitized response via `renderMarkdown()`.
- `generatePrompt(nodeData)` -- calls `/api/prompt`, returns sanitized response.
- `analyzeFriction(workflowData, systemData)` -- calls `/api/friction`, returns sanitized response.
- `generateScenario(contextData)` -- calls `/api/scenario`, returns sanitized response.

Every response from every endpoint passes through `renderMarkdown()` from `sanitize.js` before touching the DOM. No exceptions.

Each serverless function (`api/*.js`):
- Reads API key from `process.env.GEMINI_API_KEY` (never client-side).
- Validates request origin (SEC-07: origin check against allowed domains).
- Rate limits via request IP using `request.headers.get('x-real-ip')` (Vercel-provided, not spoofable). Implementation options: Vercel KV, Upstash Redis, or simple in-memory with awareness of serverless statelessness (SEC-07).
- Calls Gemini API with the appropriate prompt pattern.
- Returns JSON response.

Rate limit: 10 requests/minute per IP (matching spec).

**Tests to write BEFORE implementation:**

| Test file | What it covers |
|-----------|---------------|
| `tests/services/ai-service.test.js` | Each client function calls the correct endpoint. All responses pass through `renderMarkdown` (mock sanitize and verify it was called). Handles fetch errors gracefully (shows user-facing error, does not throw). Handles non-JSON responses. |

Note: Serverless functions are tested via integration tests against a local Vercel dev server (`vercel dev`), not unit tests. Unit-testable logic (prompt construction, response parsing) should be extracted into pure functions.

**Acceptance criteria:**

- No API key appears anywhere in client-side code, HTML, or built assets
- All four AI patterns work through serverless proxy
- Every AI response is sanitized through `renderMarkdown()` before DOM insertion
- Rate limiting returns 429 with human-readable message on excessive requests
- Origin check rejects requests from unauthorized domains
- Monthly spend cap is configured on Gemini provider dashboard (manual step, documented)
- Hosting migrated from GitHub Pages to Vercel (required for serverless functions)

**Dependencies:** R6 (functional app), R1 (sanitize.js).

**Risk flags:**

- This phase requires a hosting migration from GitHub Pages to Vercel. The `base` config in `vite.config.js` must change from `'/context-modeler/'` to `'/'` if using a Vercel domain. Document this switch.
- Serverless cold starts may cause the first AI request to feel slow (1-3 seconds). Consider adding a loading indicator in the AI response containers.
- Rate limiting in serverless functions is nontrivial because functions are stateless. In-memory rate limiting resets on every cold start. Upstash Redis is the recommended approach for persistent rate state.
- Gemini API rate limits and pricing may change. The serverless proxy isolates the client from these changes -- the proxy can switch AI providers without client code changes.

---

### Phase R8: Polish and Accessibility

**Goal:** Responsive layout, keyboard navigation, ARIA attributes, focus management, and final UX polish. This phase makes the app portfolio-ready.

**Files created/modified:**

| File | Action | Notes |
|------|--------|-------|
| `src/style.css` | Modify | Add responsive breakpoints, focus-visible styles, reduced-motion media query. |
| `src/components/*.js` | Modify | Add ARIA attributes, keyboard handlers, focus management. |
| `index.html` | Modify | Add `lang="en"`, skip-nav link, landmark roles if not implicit. |

**Functions implemented:**

Accessibility additions across components:
- `nav.js`: Arrow key navigation between nav items. `aria-current="page"` on active view.
- `triad-explorer.js`: Node cards are focusable (`tabindex="0"`), activate on Enter/Space. Column headings use appropriate heading level.
- `heatmap.js`: `<table>` already provides baseline a11y. Add `<caption>`, `scope` attributes on `<th>` elements. Cell values announced by screen reader via `aria-label` or visible text.
- `charts.js`: `role="img"` + `aria-label` with text description of chart data on `<canvas>` elements. Consider a visually-hidden data table as chart alternative for screen readers.
- Simulation mode controls: `role="radiogroup"` with `aria-checked` state.
- Focus trap in any modal/dialog (friction detail modal from AUDIT A11Y-07).
- Skip-nav link as first focusable element.

Responsive targets:
- Mobile (375px): single-column layout, stacked components, horizontal scroll for heatmap table.
- Tablet (768px): two-column layout where appropriate.
- Desktop (1024px+): full three-column triad explorer.

**Tests to write BEFORE implementation:**

| Test file | What it covers |
|-----------|---------------|
| `tests/a11y/keyboard.test.js` | Tab order follows logical reading order. Enter/Space activates focused node card. Escape closes any open modal. Arrow keys navigate within nav and radio groups. |

Note: Automated a11y testing with a tool like `axe-core` via `vitest-axe` is recommended but not required for portfolio scope. Manual testing with VoiceOver is the minimum bar.

**Acceptance criteria:**

- App is usable at 375px viewport width without horizontal scrollbar (except heatmap table)
- All interactive elements are keyboard-accessible
- All interactive elements have visible focus indicators
- Screen reader can navigate all content and announce node names, friction scores, and chart summaries
- `prefers-reduced-motion` media query disables animations (simulation mode pulse, transitions)
- Lighthouse accessibility score >= 90

**Dependencies:** R6 (functional app with all components).

**Risk flags:**

- Retrofitting a11y onto existing components is harder than building it in. Consider adding `tabindex`, `role`, and `aria-*` attributes during R5/R6 even if full keyboard handling comes in R8.
- VoiceOver testing on macOS is the primary screen reader target. NVDA on Windows is desirable but not required for portfolio scope.

---

## Part 2: Per-Phase Checklist Summary

| Phase | Files | Functions | Tests First | Depends On | Primary Risk |
|-------|-------|-----------|-------------|------------|-------------|
| R1 | 10+ created/modified | 3 (sanitize, renderMarkdown, EVENTS) | 2 test files | None | Tailwind v4 config, CSP + HMR |
| R2 | 2 created | 4 (getDefaultData, load, save, validate) | 2 test files | R1 | Enum accuracy vs. prototype |
| R3 | 1 created | 6 (createStore, getState, dispatch, subscribe, notify, handlers) | 1 test file | R2 | Cascading delete, re-render coordination |
| R4 | 1 implemented | 4 (calculateFriction, getSimulationVisuals, getFrictionColor, buildFrictionMatrix) | 1 test file | R2 | Incomplete heuristic rules |
| R5 | 4 created | 6+ (init functions, renderNodeCard) | 2 test files | R3, R4 | Chart.js tree-shaking, table styling |
| R6 | 3 created/implemented | 5+ (initDashboard, initInputStudio, 3 submit handlers) | 1 test file | R5 | Form handler consistency |
| R7 | 5 created | 8+ (4 client wrappers, 4 serverless functions) | 1 test file | R6, R1 | Hosting migration, rate limiting |
| R8 | 3+ modified | Distributed across components | 1 test file | R6 | Retrofit difficulty |

**Total test files: 11.** Estimated test writing time: 4-6 hours. This is the minimum viable test suite -- each file targets the highest-risk logic in its phase.

---

## Part 3: Code Review Criteria

Every PR must pass these checks. These are non-negotiable architectural constraints.

### 3.1 Module Dependency Direction

```
main.js -> views/ -> components/ -> state/store.js -> state/storage.js -> data/
                                  -> utils/heuristics.js
                                  -> utils/sanitize.js
         -> services/ai-service.js -> utils/sanitize.js
```

**Rule:** Never import upward. A component never imports from a view. A utility never imports from a component. The store never imports from a component or view. Violations indicate a design problem -- solve with events or parameter passing, not reverse imports.

**Enforcement:** Manual review. Consider adding an ESLint rule via `eslint-plugin-import` with `no-restricted-paths` if the team grows beyond one person.

### 3.2 Event System Contract

- All state mutations go through `store.dispatch(eventName, payload)`
- All event names are references to `EVENTS.*` constants from `src/constants/events.js`
- No string literal event names anywhere in the codebase
- Components subscribe in their `init*()` function and nowhere else
- Each component subscribes to exactly the events it needs -- no "subscribe to everything" patterns

**Red flags in review:**
- `store.state.workflows.push(...)` -- direct mutation, must use dispatch
- `store.subscribe('node:added', ...)` -- string literal, must use `EVENTS.NODE_ADDED`
- `import { EVENTS } from '../constants/events.js'` in a test file is fine

### 3.3 Sanitization Requirement

- All dynamic content inserted into the DOM passes through either `sanitizeHTML()` or uses `element.textContent` (which is inherently safe)
- Direct element content assignment is permitted ONLY when the content has been through `sanitizeHTML()` or `renderMarkdown()`
- AI responses ALWAYS go through `renderMarkdown()` -- no exceptions, no shortcuts
- Template literals used for HTML structure may contain dynamic values only if those values are sanitized first

**Red flags in review:**
- Unsanitized user input assigned to element content
- `marked.parse(response)` output assigned without DOMPurify step
- Unsanitized interpolation in template literals used for HTML

### 3.4 No String Literal Event Names

Enforced by test in R1 (`events.test.js` verifies uniqueness) and by review. Grep for quoted strings matching `state:`, `view:`, `mode:`, `node:`, `data:` patterns -- these indicate a string literal event name that should be an `EVENTS.*` reference.

### 3.5 No Direct DOM Manipulation Outside Components

Views compose components. Components own their DOM subtree. Utilities and services never touch the DOM. The store never touches the DOM.

**The only files that call `document.getElementById`, `document.createElement`, `element.appendChild`, etc.:**
- `src/components/*.js`
- `src/views/*.js`
- `src/main.js` (only for initial mount points)

If `store.js`, `heuristics.js`, `storage.js`, `ai-service.js`, or `defaults.js` contains any DOM API call, that is a design violation.

---

## Part 4: Migration Notes

### 4.1 Data Structure: `relationships[]` vs. `contextMap` Adjacency List

**Current (prototype fidelity):**
```javascript
relationships: [
  { source: 'wf_1711234567890', targets: ['sys_1711234567891', 'user_1711234567892'] }
]
```

**Alternative (spec proposal):**
```javascript
contextMap: {
  'wf_1711234567890': ['sys_1711234567891', 'user_1711234567892'],
  'sys_1711234567891': ['wf_1711234567890']
}
```

**Why we chose `relationships[]` for now:** Prototype fidelity. The prototype uses this format, and changing it introduces risk of data migration bugs with no user-facing benefit.

**Why `contextMap` is architecturally better:** O(1) lookup by node ID. The `relationships[]` format requires a linear scan to find all connections for a given node. At 14-100 nodes, this performance difference is immeasurable. At 1000+ nodes, it would matter.

**Migration path if needed later:**
```javascript
function relationshipsToContextMap(relationships) {
  const contextMap = {};
  for (const rel of relationships) {
    if (!contextMap[rel.source]) contextMap[rel.source] = [];
    contextMap[rel.source].push(...rel.targets);
    for (const target of rel.targets) {
      if (!contextMap[target]) contextMap[target] = [];
      if (!contextMap[target].includes(rel.source)) {
        contextMap[target].push(rel.source);
      }
    }
  }
  return contextMap;
}
```

This transform is a one-time migration applied in `loadFromStorage()` with a schema version check. Add a `version` field to stored data to detect and migrate old formats.

### 4.2 Node ID Format: Timestamp vs. Kebab

**Current (prototype fidelity):** `wf_1711234567890` -- prefix + underscore + timestamp.

**Spec proposal:** `wf-budget-review` -- prefix + hyphen + slugified name.

**Why timestamp IDs:** The prototype generates them this way. Timestamp IDs are guaranteed unique without collision detection logic. Kebab IDs from user input require collision detection (the spec's `-2`, `-3` suffix logic) and interaction with a reserved ID list (SEC-06).

**Trade-off:** Timestamp IDs are opaque -- they carry no human-readable meaning. Kebab IDs are debuggable in localStorage inspection. For a portfolio project where the developer is also the user, this trade-off favors simplicity (timestamps) over debuggability (kebab).

**If changing later:** This is a straightforward find-and-replace in the ID generation functions. No architectural changes needed. The rest of the system treats IDs as opaque strings.

### 4.3 Heatmap: `<table>` vs. CSS Grid

**Prototype:** CSS Grid of `<div>` elements.

**This plan:** Semantic `<table>` element (Engineering Review REC-4).

**Why the change:** A heatmap is semantically a data table. `<table>` provides free keyboard navigation (Tab through cells), screen reader row/column header association via `<th scope="col|row">`, and eliminates 3-4 ARIA-related tasks from the accessibility phase. The table is styled with Tailwind utility classes -- `border-collapse`, cell padding, background colors all work identically.

**What this means for prototype fidelity:** The visual output is identical. The underlying HTML structure changes from `<div>` grid items to `<td>` cells. No screenshot will show a difference. The improvement is in the accessibility tree, not the visual tree.

### 4.4 Chart.js Tree-Shaking: Specific Imports

The project uses two chart types: radar and bubble. The full Chart.js bundle is approximately 200KB minified. Tree-shaken imports reduce this by 40-50%.

Required registrations:

| Component | Used By |
|-----------|---------|
| `RadarController` | Radar chart |
| `BubbleController` | Bubble chart |
| `RadialLinearScale` | Radar chart axes |
| `LinearScale` | Bubble chart axes |
| `PointElement` | Both charts (data points) |
| `LineElement` | Radar chart (connecting lines) |
| `Filler` | Radar chart (area fill) |
| `Tooltip` | Both charts (hover info) |
| `Legend` | Both charts (legend display) |

If a chart fails to render silently after tree-shaking, the first debugging step is to check whether a required component is missing from the registration. Chart.js does not throw on missing components -- it simply does not render.

### 4.5 Hosting Migration: GitHub Pages to Vercel

Phase R7 (AI service migration) requires serverless functions, which means migrating from GitHub Pages to Vercel.

**Changes required:**
- `vite.config.js`: change `base` from `'/context-modeler/'` to `'/'`
- Remove GitHub Pages deploy workflow (`.github/workflows/deploy.yml`)
- Add `vercel.json` if custom configuration is needed (not required for basic Vite deploys)
- Environment variables: set `GEMINI_API_KEY` in Vercel project settings
- CSP meta tag: consider migrating to Vercel response headers via `vercel.json` for stronger enforcement

**What does NOT change:** All application code, module structure, and test suite remain identical. The migration is purely a deployment configuration change.

---

## Part 5: Risk Register

### Active Risks (ordered by likelihood x impact)

| # | Risk | Likelihood | Impact | Source | Mitigation | Phase |
|---|------|-----------|--------|--------|------------|-------|
| 1 | **Cascading delete corrupts data** -- removing a node leaves orphan references in relationships array | High | High | Eng Review Risk #2 | TDD: write delete tests before implementation. Test 3 cases: remove source node, remove target node, remove node with no relationships. | R3 |
| 2 | **Re-render coordination bugs** -- components get out of sync with store state | High | Medium | Eng Review Risk #1 | Strict event contract (one listener per event per component). Add `renderAll()` debug fallback. | R3 |
| 3 | **Enum mismatch causes silent failures** -- using spec enums instead of prototype enums | High | High | Gemini Finding 2 | Validate function in storage.js rejects kebab-case enums. Tests assert Title Case. | R2 |
| 4 | **Client-side API key exposure** -- shipping with `callGemini()` and exposed key | Certain (if shipped before R7) | Critical | Gemini Finding 1 | R7 is a hard prerequisite before any public deployment with AI features. AI buttons are disabled until R7 completes. | R7 |
| 5 | **DOM ID mismatch breaks component wiring** -- using spec IDs instead of prototype IDs | Medium | High | Gemini Finding 4 | Prototype ID reference table in this document (Appendix A). Code review checklist item. | R5, R6 |
| 6 | **Tailwind v4 config mismatch** -- tutorials reference v3 patterns that break in v4 | Medium | Medium | Eng Review Risk #4 | Pin exact version. Test `@theme` directive early in R1. | R1 |
| 7 | **Incomplete heuristic rules** -- friction/mode logic missing combinations from prototype | Medium | Medium | Gemini Finding 3 | Structure `calculateFriction` to support adding rules without refactoring. Use screenshots to verify. | R4 |
| 8 | **Chart.js tree-shaking failure** -- missing component causes silent render failure | Medium | Low | Eng Review Risk #5 | Test chart rendering immediately after tree-shaken import setup. Add all components from the registration table in Part 4.4. | R5 |
| 9 | **Serverless rate limiting resets on cold start** -- in-memory state lost | Medium | Medium | SEC-07 | Use Upstash Redis or Vercel KV for persistent rate state. Document that in-memory is insufficient. | R7 |
| 10 | **CSP meta tag breaks Vite HMR** -- dev server fails with strict CSP | Low | High | Eng Review Security section | CSP plugin only injects in production builds. Verified in R1 acceptance criteria. | R1 |

### Retired/Modified Risks from Engineering Review

| Original Risk | Status | Reason |
|---------------|--------|--------|
| Eng Risk #2: Cascading delete across frictionRules map | **Modified** | No `frictionRules` map exists. Risk persists but scope changes to `relationships[]` cleanup. |
| Eng REC-5: Define `removeNode()` spec | **Absorbed** into R3 store.js `NODE_REMOVED` handler. |
| Eng Risk #5: Chart.js bundle size | **Retained** but severity lowered. Tree-shaking is specified in R5. |

### Risks Deferred (not relevant until post-portfolio)

| Risk | Why Deferred |
|------|-------------|
| Migration to React/Next.js | Clean module boundaries make this moderate effort (Eng Review assessment). No action needed now. |
| IndexedDB migration from localStorage | Data ceiling is 14-100 nodes, well under 5MB. Not a concern at portfolio scale. |
| Multi-user / authentication | Out of scope. This is a single-user portfolio tool. |

---

## Appendix A: DOM ID Reference Table

Use prototype IDs, not spec IDs. This table is the authoritative reference for all component wiring.

| Element | Spec ID (WRONG) | Prototype ID (CORRECT) | Used In |
|---------|-----------------|----------------------|---------|
| Input Studio view container | `#view-input-studio` | `#view-input` | `input-studio.js`, `nav.js` |
| Input Studio nav button | `#btn-input-studio` | `#nav-input` | `nav.js` |
| Radar chart canvas | `#chart-radar` | `#radarChart` | `charts.js` |
| Bubble chart canvas | `#chart-bubble` | `#bubbleChart` | `charts.js` |
| Insight panel container | `#insight-panel` | `#insight-box` | `dashboard.js` |
| Dashboard view container | `#view-dashboard` | `#view-dashboard` | Same in both |
| Dashboard nav button | `#btn-dashboard` | `#nav-dashboard` | `nav.js` |

---

## Appendix B: Corrected Enum Reference

Use prototype enums, not spec enums. This table is the authoritative reference for all data model code.

| Field | Spec Value (WRONG) | Prototype Value (CORRECT) |
|-------|--------------------|-----------------------------|
| WorkflowType | `'critical'` | `'Critical'` |
| WorkflowType | `'routine'` | `'Routine'` |
| WorkflowType | `'strategic'` | `'Strategic'` |
| WorkflowType | `'operational'` | `'Collaborative'` |
| WorkflowType | `'ad-hoc'` | `'Technical'` |
| PersonaState | `'reactive-firefighter'` | `'High Load'` |
| PersonaState | `'deep-focus-architect'` | `'Flow'` |
| PersonaState | `'process-admin'` | `'Routine'` |
| PersonaState | `'bridge-builder'` | `'Social'` |
| SimulationMode | `'morning-triage'` | `'triage'` |
| SimulationMode | `'deep-focus'` | `'focus'` |
| SimulationMode | `'firefighting'` | `'fire'` |
