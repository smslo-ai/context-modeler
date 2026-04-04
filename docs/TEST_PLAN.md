> **Note (2026-04-04):** Testing structure has changed. Tests are now co-located with source files in `src/` using React Testing Library + Vitest. 151 tests across 17 files, 90%+ coverage on services/utils. See `vite.config.ts` for current test config.

# Test Plan: Context-Aware Workplace Modeler

**Version:** 1.0
**Date:** 2026-03-29
**Framework:** Vitest (Vite-native, zero additional config)
**Approach:** Test-Driven Development (Red-Green-Refactor)
**Scope:** Planning document only -- specifies what to test and how to organize tests before implementation begins.

---

## 1. Why TDD, Why Vitest, What Scope

### Why TDD

This project has three characteristics that make TDD high-value:

1. **Deterministic logic with known inputs and outputs.** The friction rules, mode rules, and validation schemas are fully defined in SPEC.md. Every function has an unambiguous expected result for every input. Writing tests first locks in correctness before implementation introduces drift.

2. **Cascading delete is the highest-risk operation.** The Engineering Review flagged this explicitly: removing a node must clean references from contextMap, frictionRules, and all linkedSystems/linkedWorkflows/linkedUsers arrays. A test-first approach forces the developer to enumerate every data structure that needs updating before writing the delete logic.

3. **Custom state management has no safety net.** Unlike React or Vue, there is no framework catching subscription errors or stale renders. Tests on the store's notify/subscribe lifecycle catch the class of bugs the Engineering Review rated "High Likelihood / Medium Impact."

### Why Vitest

Vitest is the Vite-native test runner. It uses the same config, transform pipeline, and module resolution as the dev server. Zero additional configuration beyond `npx vitest`. It supports ESM imports natively, which matters because this project uses ES6 modules with no bundler transform for tests.

### Scope Boundaries

**In scope:** All pure logic modules, state management, localStorage persistence, node CRUD operations, sanitization pipeline, AI service client contract.

**Out of scope:** Visual regression testing, Tailwind CSS class correctness, Chart.js rendering output, browser-specific behavior, Vite build configuration. These are verified manually or through the preview build.

---

## 2. Test File Organization

Test files mirror the `src/` directory structure. Every source module gets a co-located `.test.js` file in a parallel `tests/` directory.

```
tests/
  utils/
    friction.test.js          # Friction lookup + color mapping
    sanitize.test.js          # DOMPurify pipeline
  state/
    store.test.js             # Event emitter lifecycle
    storage.test.js           # localStorage round-trip
    validate.test.js          # Schema validation
  data/
    defaults.test.js          # Default data factory
    node-ids.test.js          # ID generation + collision detection
  components/
    node-crud.test.js         # Add/delete with cascading cleanup
    triad-explorer.test.js    # Item click + relationship traversal
    heatmap.test.js           # Grid dimensions + score-to-color mapping
  services/
    ai-service.test.js        # API client contract
  views/
    view-switching.test.js    # Toggle logic (no DOM assertion)
  setup.js                    # Shared test utilities, mocks, fixtures
```

### Vitest Configuration

Add to `vite.config.js`:

```javascript
// No separate vitest.config.js needed
export default defineConfig({
  // ... existing config
  test: {
    include: ['tests/**/*.test.js'],
    environment: 'jsdom',    // Required for DOM-touching tests (Tiers 3-4)
    setupFiles: ['tests/setup.js'],
  }
});
```

### Shared Setup (`tests/setup.js`)

```javascript
// Provides:
// - getDefaultFixture(): returns a deep copy of default OntologyData
// - getMockStore(): returns a fresh store instance for isolated tests
// - localStorage stub (Vitest provides this via jsdom, but reset between tests)
```

---

## 3. Per-Module Test Specifications

### TIER 1: Pure Logic (Target: 100% coverage)

Tier 1 modules are pure functions with no side effects, no DOM access, and no external dependencies. They are the highest-value, lowest-effort tests in the project.

---

#### 3.1 Friction Lookup (`tests/utils/friction.test.js`)

**Source module:** `src/utils/friction.js`
**Functions under test:** `getFrictionScore(workflowId, systemId)`, `frictionToColor(score)`, `frictionToLabel(score)`

The friction system is a deterministic lookup table, not a dynamic heuristic. Every `workflowId::systemId` pair maps to a known coefficient (0.0-1.0). Pairs not in the table default to 0.5.

| Test Name | Input | Expected Output | Notes |
|-----------|-------|-----------------|-------|
| returns known friction score for default pair | `('wf-mgmt-escalations', 'sys-sharepoint')` | `0.85` | Exact match from SPEC 2.4 |
| returns known low-friction score | `('wf-admin-deadlines', 'sys-jira')` | `0.15` | Green range |
| returns known high-friction score | `('wf-strategic-planning', 'sys-slack-teams')` | `0.9` | Red range |
| defaults to 0.5 for unknown pair | `('wf-unknown', 'sys-unknown')` | `0.5` | Fallback behavior |
| defaults to 0.5 for valid workflow + unknown system | `('wf-mgmt-escalations', 'sys-custom-tool')` | `0.5` | User-injected system |
| defaults to 0.5 for unknown workflow + valid system | `('wf-custom-process', 'sys-jira')` | `0.5` | User-injected workflow |
| handles null workflow ID | `(null, 'sys-jira')` | `0.5` | Defensive |
| handles null system ID | `('wf-admin-deadlines', null)` | `0.5` | Defensive |
| handles undefined inputs | `(undefined, undefined)` | `0.5` | Defensive |
| handles empty string inputs | `('', '')` | `0.5` | Defensive |

**Color mapping tests (`frictionToColor`):**

| Test Name | Input | Expected Output |
|-----------|-------|-----------------|
| maps score 0.0-0.33 to green hex | `0.15` | `'#22c55e'` (green-500 or equivalent) |
| maps score 0.34-0.66 to yellow hex | `0.5` | `'#eab308'` (yellow-500 or equivalent) |
| maps score 0.67-1.0 to red hex | `0.85` | `'#ef4444'` (red-500 or equivalent) |
| maps exact boundary 0.33 to green | `0.33` | Green range |
| maps exact boundary 0.34 to yellow | `0.34` | Yellow range |
| maps exact boundary 0.67 to red | `0.67` | Red range |

**Label mapping tests (`frictionToLabel`):**

| Test Name | Input | Expected Output |
|-----------|-------|-----------------|
| labels low friction | `0.15` | `'Low'` |
| labels moderate friction | `0.5` | `'Moderate'` |
| labels high friction | `0.85` | `'High'` |

---

#### 3.2 Mode Simulation Rules (`tests/utils/friction.test.js` or `tests/data/modes.test.js`)

**Source data:** `src/data/modes.js` (modeRules object)
**Functions under test:** `getModeRule(modeName)`, `getNodeModeState(nodeId, modeName)`

The mode system applies visual states (dimmed, highlighted, or neutral) to nodes based on the active simulation mode. The rules are defined in SPEC 2.5.

| Test Name | Input | Expected Output |
|-----------|-------|-----------------|
| morning-triage dims strategic-planning | `('wf-strategic-planning', 'morning-triage')` | `'dimmed'` |
| morning-triage dims deep-focus persona | `('usr-deep-focus', 'morning-triage')` | `'dimmed'` |
| morning-triage highlights escalations | `('wf-mgmt-escalations', 'morning-triage')` | `'highlighted'` |
| morning-triage highlights firefighter | `('usr-firefighter', 'morning-triage')` | `'highlighted'` |
| morning-triage neutrals unmentioned node | `('sys-sharepoint', 'morning-triage')` | `'neutral'` |
| deep-focus dims slack-teams | `('sys-slack-teams', 'deep-focus')` | `'dimmed'` |
| deep-focus highlights strategic-planning | `('wf-strategic-planning', 'deep-focus')` | `'highlighted'` |
| deep-focus highlights ai-engine | `('sys-ai-engine', 'deep-focus')` | `'highlighted'` |
| firefighting dims admin-deadlines | `('wf-admin-deadlines', 'firefighting')` | `'dimmed'` |
| firefighting highlights jira | `('sys-jira', 'firefighting')` | `'highlighted'` |
| returns neutral for user-injected node in any mode | `('wf-custom-process', 'morning-triage')` | `'neutral'` |
| returns neutral for unknown mode name | `('wf-mgmt-escalations', 'unknown-mode')` | `'neutral'` |
| handles null mode name | `('wf-mgmt-escalations', null)` | `'neutral'` |

---

#### 3.3 Schema Validation (`tests/state/validate.test.js`)

**Source module:** `src/state/validate.js`
**Function under test:** `validateOntologyData(data)`

Returns `{ valid: true, data: cleanedData }` on success or `{ valid: false, errors: string[], data: defaultData }` on failure. On failure, `data` is the default dataset (fallback behavior).

**Valid input tests:**

| Test Name | Input | Expected |
|-----------|-------|----------|
| accepts well-formed OntologyData with all fields | Full default fixture | `{ valid: true }` |
| accepts OntologyData with empty arrays | `{ workflows: [], systems: [], personas: [] }` | `{ valid: true }` |
| accepts single node in each array | Minimal valid node per type | `{ valid: true }` |

**Required field rejection tests:**

| Test Name | Input (mutation from valid) | Expected Error Contains |
|-----------|---------------------------|------------------------|
| rejects missing workflows key | `{ systems: [], personas: [] }` | `'workflows'` |
| rejects missing systems key | `{ workflows: [], personas: [] }` | `'systems'` |
| rejects missing personas key | `{ workflows: [], systems: [] }` | `'personas'` |
| rejects workflow missing id | Workflow node without `id` | `'id'` |
| rejects workflow missing name | Workflow node without `name` | `'name'` |
| rejects workflow missing type | Workflow node without `type` | `'type'` |
| rejects system missing category | System node without `category` | `'category'` |
| rejects persona missing state | Persona node without `state` | `'state'` |

**Type rejection tests:**

| Test Name | Input (mutation from valid) | Expected Error Contains |
|-----------|---------------------------|------------------------|
| rejects workflows as string | `{ workflows: 'not-array', ... }` | `'array'` |
| rejects workflows as number | `{ workflows: 42, ... }` | `'array'` |
| rejects workflow id as number | `id: 123` | `'string'` |
| rejects linkedSystems as string | `linkedSystems: 'sys-jira'` | `'array'` |

**Enum validation tests:**

| Test Name | Input | Expected Error Contains |
|-----------|-------|------------------------|
| rejects unknown WorkflowType | `type: 'unknown'` | `'type'` |
| rejects unknown SystemCategory | `category: 'unknown'` | `'category'` |
| rejects unknown PersonaState | `state: 'unknown'` | `'state'` |
| accepts all valid WorkflowType values | Each of `'critical'`, `'routine'`, `'strategic'`, `'operational'`, `'ad-hoc'` | `{ valid: true }` |
| accepts all valid SystemCategory values | Each of `'storage'`, `'comms'`, `'intelligence'`, `'tracking'`, `'reporting'` | `{ valid: true }` |
| accepts all valid PersonaState values | Each of `'reactive-firefighter'`, `'deep-focus-architect'`, `'process-admin'`, `'bridge-builder'` | `{ valid: true }` |

**Size limit tests:**

| Test Name | Input | Expected Error Contains |
|-----------|-------|------------------------|
| rejects more than 100 workflow nodes | 101 valid workflow nodes | `'100'` or `'limit'` |
| rejects more than 100 system nodes | 101 valid system nodes | `'100'` or `'limit'` |
| rejects description over 500 chars | `description` with 501 characters | `'500'` or `'length'` |
| rejects name over 500 chars | `name` with 501 characters | `'500'` or `'length'` |

**Fallback behavior tests:**

| Test Name | Input | Expected |
|-----------|-------|----------|
| returns default data on validation failure | `null` | `{ valid: false, data: <defaults> }` |
| returns default data on empty object | `{}` | `{ valid: false, data: <defaults> }` |
| returned default data matches getDefaultData() shape | Any invalid input | Deep equality check |

---

#### 3.4 Node ID Generation (`tests/data/node-ids.test.js`)

**Source module:** `src/data/node-ids.js` (or utility in `store.js`)
**Function under test:** `generateNodeId(type, existingIds)`

| Test Name | Input | Expected Output Pattern |
|-----------|-------|------------------------|
| generates workflow ID with wf- prefix | `('workflow', [])` | Matches `/^wf-[a-z0-9-]+$/` |
| generates system ID with sys- prefix | `('system', [])` | Matches `/^sys-[a-z0-9-]+$/` |
| generates persona ID with usr- prefix | `('persona', [])` | Matches `/^usr-[a-z0-9-]+$/` |
| generates unique IDs on consecutive calls | Two calls with same type | Different values |
| avoids collision with existing IDs | `('workflow', ['wf-<predicted-id>'])` | Does not match any existing ID |
| rejects reserved DOM element IDs | Generated ID must not equal `'view-dashboard'`, `'view-input-studio'`, `'global-header'`, `'friction-modal'` | Not in reserved set |
| ID contains only allowed characters | Any input | Matches `/^[a-z0-9-]+$/` |

---

### TIER 2: State Management (Target: 90% coverage)

Tier 2 modules have side effects (events, localStorage writes) but no DOM dependencies. They require test isolation through setup/teardown.

---

#### 3.5 Store Event System (`tests/state/store.test.js`)

**Source module:** `src/state/store.js`
**Functions under test:** `subscribe(eventName, callback)`, `unsubscribe(eventName, callback)`, `notify(eventName)`, state getters/setters

| Test Name | Setup | Action | Expected |
|-----------|-------|--------|----------|
| notify triggers subscribed listener | Subscribe callback to `DATA_CHANGED` | `notify('DATA_CHANGED')` | Callback called once |
| notify does not trigger unrelated listener | Subscribe to `DATA_CHANGED` | `notify('MODE_CHANGED')` | Callback not called |
| multiple subscribers all fire | Subscribe 3 callbacks to same event | `notify(event)` | All 3 called |
| unsubscribe removes listener | Subscribe then unsubscribe | `notify(event)` | Callback not called |
| unsubscribe one does not affect others | Subscribe A and B, unsubscribe A | `notify(event)` | B called, A not called |
| notify with no subscribers does not throw | No subscriptions | `notify('DATA_CHANGED')` | No error |
| event names come from constants module | Import from `events.js` | Used in subscribe/notify | Values match expected strings |
| state mutations trigger notify | Call `setCurrentMode('deep-focus')` | -- | Listener on `MODE_CHANGED` fires |
| getState returns current state snapshot | Set state, then getState | -- | Returns matching values |

**Event name constant tests:**

| Test Name | Expected |
|-----------|----------|
| DATA_CHANGED constant exists | Truthy string |
| MODE_CHANGED constant exists | Truthy string |
| NODE_SELECTED constant exists | Truthy string |
| VIEW_CHANGED constant exists | Truthy string |
| No two event constants share the same value | All values unique |

---

#### 3.6 localStorage Round-Trip (`tests/state/storage.test.js`)

**Source module:** `src/state/storage.js`
**Functions under test:** `saveToStorage(data)`, `loadFromStorage()`

| Test Name | Setup | Action | Expected |
|-----------|-------|--------|----------|
| save then load returns identical data | Default fixture | Save, then load | Deep equality |
| save then load preserves all workflow fields | Fixture with all fields populated | Save, load, check workflow[0] | Every field matches |
| save then load preserves all system fields | Same | Same | Every field matches |
| save then load preserves all persona fields | Same | Same | Every field matches |
| load with no saved data returns defaults | Clear localStorage | `loadFromStorage()` | Returns default data |
| load with corrupted JSON falls back to defaults | Set key to `'{bad json'` | `loadFromStorage()` | Returns default data |
| load with valid JSON but invalid schema falls back | Set key to `'{"foo": "bar"}'` | `loadFromStorage()` | Returns default data (runs through validate) |
| save uses correct key prefix | -- | `saveToStorage(data)` | localStorage key starts with `'context-modeler:'` |
| QuotaExceededError triggers error handling | Mock localStorage.setItem to throw | `saveToStorage(data)` | Does not throw; returns error indicator or calls toast |

---

#### 3.7 Node CRUD Operations (`tests/components/node-crud.test.js`)

**Source module:** `src/state/store.js` (or dedicated `src/state/crud.js`)
**Functions under test:** `addNode(type, data)`, `removeNode(id)`

This is the highest-risk logic in the project. Test exhaustively.

**Add node tests:**

| Test Name | Input | Expected |
|-----------|-------|----------|
| addNode('workflow', data) appends to workflows array | Valid workflow data | `store.workflows.length` increases by 1 |
| added workflow has correct ID format | -- | ID matches `/^wf-/` |
| added workflow appears in ontologyData | -- | Findable by ID |
| addNode triggers DATA_CHANGED event | Subscribe to DATA_CHANGED | Callback fires |
| addNode persists to localStorage | Add, then load from storage | New node present |
| added node's linkedSystems are registered in contextMap | Workflow with `linkedSystems: ['sys-jira']` | contextMap includes bidirectional entry |

**Remove node tests (cascading deletes):**

| Test Name | Setup | Action | Expected |
|-----------|-------|--------|----------|
| removeNode removes from workflows array | Default data | `removeNode('wf-admin-deadlines')` | Not in workflows array |
| removeNode removes from contextMap as source | Default data | Remove workflow | Key gone from contextMap |
| removeNode removes from contextMap as target | Default data | Remove workflow | ID gone from all contextMap value arrays |
| removeNode removes from frictionRules | Default data | Remove workflow | No frictionRules key starts with removed ID |
| removeNode cleans linkedWorkflows on systems | Default data | Remove `wf-admin-deadlines` | `sys-sharepoint.linkedWorkflows` no longer contains `'wf-admin-deadlines'` |
| removeNode cleans linkedSystems on workflows | Default data | Remove `sys-jira` | No workflow's `linkedSystems` contains `'sys-jira'` |
| removeNode cleans linkedUsers on systems | Default data | Remove persona | No system's `linkedUsers` contains removed persona ID |
| removeNode triggers DATA_CHANGED | Subscribe | Remove any node | Callback fires |
| removeNode persists to localStorage | Remove, then load from storage | Removed node absent |
| removeNode with non-existent ID does not throw | Default data | `removeNode('wf-does-not-exist')` | No error, data unchanged |
| removeNode does not corrupt unrelated nodes | Default data (5 workflows) | Remove one workflow | Remaining 4 workflows unchanged (deep equality) |
| sequential removes work correctly | Default data | Remove 2 nodes in sequence | Both gone, remaining data intact |

---

### TIER 3: Component Behavior (Target: 80% coverage)

Tier 3 tests require `jsdom` environment and may query DOM elements. Keep assertions focused on data correctness, not CSS class names.

---

#### 3.8 Triad Explorer Interactions (`tests/components/triad-explorer.test.js`)

**Source module:** `src/components/triad-explorer.js`
**Functions under test:** `handleItemClick(nodeId)`, `getRelatedNodes(nodeId)`, `getRelatedCount(nodeId)`

| Test Name | Input | Expected |
|-----------|-------|----------|
| handleItemClick sets selectedNode in store | `'wf-mgmt-escalations'` | `store.selectedNode.id === 'wf-mgmt-escalations'` |
| getRelatedNodes returns all contextMap targets | `'wf-mgmt-escalations'` | Array matches contextMap entry for that ID |
| getRelatedCount returns correct count | `'wf-mgmt-escalations'` | Number matches contextMap entry length |
| getRelatedNodes returns empty array for unlinked node | User-injected node with no contextMap entry | `[]` |
| clicking same node twice toggles selection off | Click `'wf-mgmt-escalations'` twice | `store.selectedNode === null` |

---

#### 3.9 Heatmap Rendering (`tests/components/heatmap.test.js`)

**Source module:** `src/components/heatmap.js`
**Functions under test:** `buildHeatmapData(workflows, systems)`, `getHeatmapDimensions(workflows, systems)`

| Test Name | Input | Expected |
|-----------|-------|----------|
| grid has correct dimensions for default data | 5 workflows, 5 systems | 5 columns, 5 rows |
| grid dimensions update with added nodes | 6 workflows, 5 systems | 6 columns, 5 rows |
| each cell contains correct friction score | Default data | Cell at (wf-mgmt-escalations, sys-sharepoint) = 0.85 |
| unknown pair cell defaults to 0.5 | User-injected workflow + default system | Cell value = 0.5 |
| empty workflows array produces empty grid | 0 workflows, 5 systems | 0 columns |

---

#### 3.10 Sanitization Pipeline (`tests/utils/sanitize.test.js`)

**Source module:** `src/utils/sanitize.js`
**Function under test:** `sanitizeHTML(rawHTML)`, `sanitizeMarkdown(markdownString)` (Phase 5)

| Test Name | Input | Expected Output |
|-----------|-------|-----------------|
| strips script tags | `'<script>alert("xss")</script><p>safe</p>'` | `'<p>safe</p>'` |
| strips onerror handler | `'<img onerror="alert(1)" src="x">'` | `'<img src="x">'` (or empty img) |
| strips onclick handler | `'<button onclick="steal()">Click</button>'` | `'<button>Click</button>'` |
| preserves p tags | `'<p>Hello</p>'` | `'<p>Hello</p>'` |
| preserves heading tags h1-h6 | `'<h3>Title</h3>'` | `'<h3>Title</h3>'` |
| preserves list tags | `'<ul><li>Item</li></ul>'` | `'<ul><li>Item</li></ul>'` |
| preserves code and pre tags | `'<pre><code>const x = 1;</code></pre>'` | `'<pre><code>const x = 1;</code></pre>'` |
| preserves em and strong | `'<em>italic</em> <strong>bold</strong>'` | `'<em>italic</em> <strong>bold</strong>'` |
| strips iframe | `'<iframe src="evil.com"></iframe>'` | `''` |
| strips style tags | `'<style>body{display:none}</style><p>ok</p>'` | `'<p>ok</p>'` |
| handles empty string | `''` | `''` |
| handles null input | `null` | `''` |

---

### TIER 4: Integration (Deferred -- manual + smoke tests until components stabilize)

Tier 4 tests are written after Tiers 1-3 pass. They verify cross-module behavior and external API contracts.

---

#### 3.11 AI Service Client (`tests/services/ai-service.test.js`)

**Source module:** `src/services/ai-service.js`
**Approach:** Mock `fetch` globally. Never make real API calls in tests.

| Test Name | Setup | Expected |
|-----------|-------|----------|
| sends correct endpoint for friction resolver | Mock fetch | `fetch` called with `/api/friction-resolve` (or proxy URL) |
| sends correct payload shape | Mock fetch | Body contains `{ workflowId, systemId, score }` |
| returns parsed response on 200 | Mock fetch returning `{ suggestion: '...' }` | Resolved value matches |
| throws/returns error on 500 | Mock fetch returning status 500 | Error object returned, no unhandled rejection |
| throws/returns error on network timeout | Mock fetch rejecting with TypeError | Error handled gracefully |
| throws/returns error on 429 rate limit | Mock fetch returning status 429 | Error includes rate limit indication |
| response passes through sanitization | Mock fetch returning HTML with script tag | Final output has no script tag |

---

#### 3.12 View Switching (`tests/views/view-switching.test.js`)

**Source module:** `src/components/nav.js`
**Function under test:** `showView(viewId)`

| Test Name | Setup | Expected |
|-----------|-------|----------|
| showView('dashboard') adds hidden to input-studio | jsdom with both view divs | `#view-input-studio` has class `hidden` |
| showView('input-studio') adds hidden to dashboard | jsdom with both view divs | `#view-dashboard` has class `hidden` |
| showView updates store currentView | -- | `store.currentView === viewId` |
| showView triggers VIEW_CHANGED event | Subscribe | Callback fires |
| switching views preserves ontologyData | Modify data, switch views, switch back | Data unchanged |

---

## 4. TDD Workflow Instructions

### Running Tests

```bash
# Watch mode (re-runs on file change) -- use during development
npx vitest

# Single run (CI or before commit)
npx vitest run

# Run specific test file
npx vitest tests/utils/friction.test.js

# Run tests matching a name pattern
npx vitest -t "cascading delete"

# Coverage report
npx vitest run --coverage
```

### The Red-Green-Refactor Cycle

**Step 1: Red.** Write the test first. Run it. It must fail. The failure message should describe the missing behavior clearly.

What "red" looks like:
```
FAIL  tests/utils/friction.test.js
  getFrictionScore
    x returns known friction score for default pair
      Error: getFrictionScore is not a function
```

If the test passes on the first run, either the test is wrong (testing something that already works by accident) or the implementation already exists. Investigate before proceeding.

**Step 2: Green.** Write the minimum code to make the test pass. Do not add features, handle edge cases, or refactor. Just make the red test turn green.

What "green" looks like:
```
PASS  tests/utils/friction.test.js
  getFrictionScore
    + returns known friction score for default pair (2ms)
```

**Step 3: Refactor.** With all tests green, improve the implementation. Extract functions, rename variables, simplify conditionals. Run tests after every change. If a test goes red during refactor, undo the last change.

### Implementation Order

Follow this order. Each tier builds on the one before it.

1. `tests/data/defaults.test.js` -- Verify the fixture factory works
2. `tests/utils/friction.test.js` -- Pure lookup logic
3. `tests/state/validate.test.js` -- Schema validation (used by storage)
4. `tests/data/node-ids.test.js` -- ID generation (used by CRUD)
5. `tests/state/store.test.js` -- Event system
6. `tests/state/storage.test.js` -- Persistence (depends on validate)
7. `tests/components/node-crud.test.js` -- CRUD (depends on store + IDs)
8. `tests/utils/sanitize.test.js` -- DOMPurify wrapper
9. `tests/components/triad-explorer.test.js` -- Component logic
10. `tests/components/heatmap.test.js` -- Grid data construction
11. `tests/services/ai-service.test.js` -- API client (Phase 5)
12. `tests/views/view-switching.test.js` -- View toggle

---

## 5. Coverage Targets

| Tier | Modules | Line Coverage Target | Branch Coverage Target |
|------|---------|---------------------|----------------------|
| 1 -- Pure Logic | friction.js, modes, validate.js, node-ids.js | 100% | 100% |
| 2 -- State Management | store.js, storage.js, CRUD operations | 90% | 85% |
| 3 -- Component Behavior | triad-explorer.js, heatmap.js, sanitize.js | 80% | 75% |
| 4 -- Integration | ai-service.js, view-switching | Manual + smoke | Manual + smoke |

**Overall project target:** 90% line coverage across Tiers 1-3 before the project is considered portfolio-ready (end of Phase 4D per PLAN.md).

### What Counts Toward Coverage

- Branches inside pure functions (every `if`, `switch`, `??`, `||` path)
- Error handling paths (catch blocks, fallback returns)
- Every enum value exercised at least once

### What Does Not Need Coverage

- `main.js` initialization sequence (integration, not unit)
- Chart.js configuration objects (library concern)
- CSS class toggling (visual, not logic)
- HTML template strings (structure, not behavior)

---

## 6. Anti-Patterns to Avoid

### Do not mock the store in component tests
The store is 50 lines of code with no external dependencies. Mocking it replaces the thing you are trying to test. Use a fresh store instance per test instead.

### Do not test CSS classes in unit tests
The test `expect(element.classList.contains('dimmed')).toBe(true)` couples the test to a Tailwind implementation detail. Test the data: `expect(getNodeModeState('wf-strategic-planning', 'morning-triage')).toBe('dimmed')`. Let the component apply whatever class it wants.

### Do not test DOM structure in pure logic tests
Tier 1 tests should never import `document`, create elements, or query the DOM. If a Tier 1 test needs jsdom, the function under test has a side effect that should be extracted.

### Do not test Chart.js output
Chart.js renders to canvas. Canvas content is not queryable via DOM APIs. Do not attempt to assert pixel values, label positions, or chart colors. Test the data you pass to Chart.js, not what Chart.js does with it.

### Do not use string literals for event names in tests
Import event constants from `src/constants/events.js`. If you misspell an event name in a test, the test should fail at import time, not silently pass because nothing subscribes to a misspelled string.

### Do not test localStorage directly in component tests
Components call `store.save()`. The store calls `storage.saveToStorage()`. Test the store's save behavior in `store.test.js` and the storage round-trip in `storage.test.js`. Do not have component tests reaching into localStorage.

### Do not share state between tests
Every test starts with a fresh store and fresh fixture data. Use `beforeEach` to reset. Never rely on test execution order.

### Do not test private functions
If a function is not exported, it is an implementation detail. Test the public API that uses it. If you find yourself wanting to test a private function, extract it and export it.

---

## 7. Fixture Data Reference

All tests that need OntologyData should use `getDefaultFixture()` from `tests/setup.js`, which returns a deep copy of the SPEC 2.2 default data. Key values for quick reference:

**Default node counts:** 5 workflows, 5 systems, 4 personas = 14 total.

**Enum values (from SPEC 2.1):**
- WorkflowType: `'critical'` | `'routine'` | `'strategic'` | `'operational'` | `'ad-hoc'`
- SystemCategory: `'storage'` | `'comms'` | `'intelligence'` | `'tracking'` | `'reporting'`
- PersonaState: `'reactive-firefighter'` | `'deep-focus-architect'` | `'process-admin'` | `'bridge-builder'`
- SimulationMode: `'morning-triage'` | `'deep-focus'` | `'firefighting'`

**ID formats:** `wf-{kebab-name}`, `sys-{kebab-name}`, `usr-{kebab-name}`. Character set: `[a-z0-9-]`.

**Friction score range:** 0.0 (flow state) to 1.0 (critical mismatch). Default for unknown pairs: 0.5.

**localStorage key prefix:** `'context-modeler:'`
