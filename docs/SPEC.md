# Context-Aware Workplace Modeler -- Implementation Specification

**Version:** 1.0 (Implementation-Ready)
**Target Repo:** `smslo-ai/context-modeler`
**Date:** 2026-03-29
**Source Materials:** v0 spec doc (RTF), 18 prototype screenshots, infographic HTML (data values only)

---

## 1. ARCHITECTURE OVERVIEW

### 1.1 Application Type

Single-Page Application (SPA) with two views: **Dashboard** and **Input Studio**. No routing library. View switching is handled by toggling CSS `display` properties on two top-level container elements.

### 1.2 Build Tooling

| Tool | Version | Purpose |
|---|---|---|
| Vite | ^8.0.1 | Dev server, bundler, ES module resolution |
| Tailwind CSS | ^4.2.2 | Utility-first styling via `@tailwindcss/vite` plugin |
| Chart.js | ^4.5.1 | Radar chart, bubble chart (replaces Plotly from prototype) |

No framework (React, Vue, etc.). Vanilla JavaScript with ES6 modules.

### 1.3 View Switching Mechanism

Two top-level containers in the DOM:

```
<div id="view-dashboard">...</div>
<div id="view-input-studio" class="hidden">...</div>
```

Switching logic toggles the `hidden` class on each container. The `showView(viewId)` function in `nav.js` handles this.

### 1.4 Module Dependency Graph

```
main.js
  +-- state/store.js
  |     +-- state/storage.js
  |     +-- data/defaults.js
  +-- components/nav.js
  |     +-- state/store.js
  +-- views/dashboard.js
  |     +-- components/triad-explorer.js
  |     |     +-- state/store.js
  |     |     +-- components/insight-panel.js
  |     |     +-- utils/sanitize.js
  |     +-- components/heatmap.js
  |     |     +-- state/store.js
  |     |     +-- utils/friction.js
  |     |     +-- utils/sanitize.js
  |     +-- components/charts.js
  |           +-- state/store.js (read-only)
  +-- views/input-studio.js
        +-- state/store.js
        +-- utils/sanitize.js
```

### 1.5 Initialization Sequence (main.js)

1. Import all modules
2. Call `loadFromStorage()` -- hydrate state from localStorage or fall back to defaults
3. Call `renderNav()` -- mount the global header
4. Call `renderDashboard()` -- build the Dashboard DOM
5. Call `renderInputStudio()` -- build the Input Studio DOM (hidden)
6. Call `initCharts()` -- create Chart.js instances
7. Set default simulation mode to `'morning-triage'`
8. Apply initial simulation mode CSS classes

---

## 2. DATA MODEL

### 2.1 Type Definitions

```typescript
// --- Core Node Types ---

type WorkflowType = 'critical' | 'routine' | 'strategic' | 'operational' | 'ad-hoc';
type Frequency = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'ad-hoc';
type SystemCategory = 'storage' | 'comms' | 'intelligence' | 'tracking' | 'reporting';
type PersonaState = 'reactive-firefighter' | 'deep-focus-architect' | 'process-admin' | 'bridge-builder';
type SimulationMode = 'morning-triage' | 'deep-focus' | 'firefighting';

interface WorkflowNode {
  id: string;          // Format: 'wf-{kebab-name}' e.g. 'wf-mgmt-escalations'
  name: string;        // Display name e.g. 'Management Escalations'
  type: WorkflowType;
  description: string;
  owner: string;       // Role or person name
  frequency: Frequency;
  linkedSystems: string[];  // Array of SystemNode IDs
}

interface SystemNode {
  id: string;          // Format: 'sys-{kebab-name}' e.g. 'sys-sharepoint'
  name: string;        // Display name e.g. 'Shared Sites (SharePoint)'
  category: SystemCategory;
  description: string;
  linkedWorkflows: string[];  // Array of WorkflowNode IDs
  linkedUsers: string[];      // Array of PersonaNode IDs
}

interface PersonaNode {
  id: string;          // Format: 'usr-{kebab-name}' e.g. 'usr-firefighter'
  name: string;        // Display name e.g. 'Reactive Firefighter'
  state: PersonaState;
  description: string;
}

// --- Aggregate Types ---

interface OntologyData {
  workflows: WorkflowNode[];
  systems: SystemNode[];
  personas: PersonaNode[];
}

// Adjacency list: maps a node ID to an array of related node IDs across columns
type ContextMap = Record<string, string[]>;

// Friction compatibility: maps 'workflowId::systemId' to a friction score 0.0-1.0
type FrictionRules = Record<string, number>;

// Per-mode rendering rules
interface ModeRule {
  dimmed: string[];      // Node IDs to reduce opacity
  highlighted: string[]; // Node IDs to emphasize
}
type ModeRules = Record<SimulationMode, ModeRule>;

// Global application state
interface AppState {
  ontologyData: OntologyData;
  currentView: 'dashboard' | 'input-studio';
  currentMode: SimulationMode;
  selectedNode: { id: string; type: 'workflow' | 'system' | 'persona' } | null;
  insightPanelVisible: boolean;
  frictionModalVisible: boolean;
  frictionModalData: { workflow: string; system: string; score: number } | null;
}
```

### 2.2 Default Data (14 Nodes)

The `getDefaultData()` factory function returns a fresh deep copy each time it is called. This prevents shared-reference mutation bugs.

#### 2.2.1 Default Workflows (5)

```javascript
{
  id: 'wf-mgmt-escalations',
  name: 'Management Escalations',
  type: 'critical',
  description: 'Urgent issues requiring immediate decision.',
  owner: 'Director / VP',
  frequency: 'ad-hoc',
  linkedSystems: ['sys-slack-teams', 'sys-exec-dashboard']
}

{
  id: 'wf-admin-deadlines',
  name: 'Admin Deadlines',
  type: 'routine',
  description: 'Recurring compliance and timesheets.',
  owner: 'Operations Manager',
  frequency: 'weekly',
  linkedSystems: ['sys-sharepoint', 'sys-jira']
}

{
  id: 'wf-system-maintenance',
  name: 'System Maintenance',
  type: 'operational',
  description: 'Infrastructure updates and patching.',
  owner: 'IT Lead',
  frequency: 'monthly',
  linkedSystems: ['sys-jira', 'sys-sharepoint']
}

{
  id: 'wf-cross-team-sync',
  name: 'Cross-Team Sync',
  type: 'routine',
  description: 'Status updates and cross-functional alignment.',
  owner: 'Project Manager',
  frequency: 'weekly',
  linkedSystems: ['sys-slack-teams', 'sys-jira']
}

{
  id: 'wf-strategic-planning',
  name: 'Strategic Planning',
  type: 'strategic',
  description: 'Long-term roadmap and OKR setting.',
  owner: 'Executive Team',
  frequency: 'quarterly',
  linkedSystems: ['sys-exec-dashboard', 'sys-ai-engine']
}
```

#### 2.2.2 Default Systems (5)

```javascript
{
  id: 'sys-sharepoint',
  name: 'Shared Sites (SharePoint)',
  category: 'storage',
  description: 'Static knowledge repository.',
  linkedWorkflows: ['wf-admin-deadlines', 'wf-system-maintenance'],
  linkedUsers: ['usr-process-admin']
}

{
  id: 'sys-slack-teams',
  name: 'Comm Hub (Slack/Teams)',
  category: 'comms',
  description: 'Real-time context stream.',
  linkedWorkflows: ['wf-mgmt-escalations', 'wf-cross-team-sync'],
  linkedUsers: ['usr-firefighter', 'usr-bridge-builder']
}

{
  id: 'sys-ai-engine',
  name: 'AI Context Engine',
  category: 'intelligence',
  description: 'Intelligent context routing layer.',
  linkedWorkflows: ['wf-strategic-planning'],
  linkedUsers: ['usr-deep-focus']
}

{
  id: 'sys-jira',
  name: 'Project Tracker (Jira)',
  category: 'tracking',
  description: 'Task and sprint management.',
  linkedWorkflows: ['wf-admin-deadlines', 'wf-system-maintenance', 'wf-cross-team-sync'],
  linkedUsers: ['usr-process-admin', 'usr-firefighter']
}

{
  id: 'sys-exec-dashboard',
  name: 'Exec Dashboard',
  category: 'reporting',
  description: 'KPI visualization and executive summaries.',
  linkedWorkflows: ['wf-mgmt-escalations', 'wf-strategic-planning'],
  linkedUsers: ['usr-deep-focus']
}
```

#### 2.2.3 Default Personas (4)

```javascript
{
  id: 'usr-firefighter',
  name: 'Reactive Firefighter',
  state: 'reactive-firefighter',
  description: 'High stress, rapid switching.'
}

{
  id: 'usr-deep-focus',
  name: 'Deep Focus Architect',
  state: 'deep-focus-architect',
  description: 'Prolonged silence needed.'
}

{
  id: 'usr-process-admin',
  name: 'Process Admin',
  state: 'process-admin',
  description: 'Methodical queue clearing.'
}

{
  id: 'usr-bridge-builder',
  name: 'Bridge Builder',
  state: 'bridge-builder',
  description: 'Connecting teams.'
}
```

### 2.3 Context Map (Adjacency List)

Defines bidirectional relationships across the three columns. Used by `handleItemClick()` and the heatmap.

```javascript
const contextMap = {
  // Workflows -> connected Systems and Personas
  'wf-mgmt-escalations':  ['sys-slack-teams', 'sys-exec-dashboard', 'usr-firefighter'],
  'wf-admin-deadlines':   ['sys-sharepoint', 'sys-jira', 'usr-process-admin'],
  'wf-system-maintenance': ['sys-jira', 'sys-sharepoint', 'usr-process-admin'],
  'wf-cross-team-sync':   ['sys-slack-teams', 'sys-jira', 'usr-bridge-builder'],
  'wf-strategic-planning': ['sys-exec-dashboard', 'sys-ai-engine', 'usr-deep-focus'],

  // Systems -> connected Workflows and Personas
  'sys-sharepoint':       ['wf-admin-deadlines', 'wf-system-maintenance', 'usr-process-admin'],
  'sys-slack-teams':      ['wf-mgmt-escalations', 'wf-cross-team-sync', 'usr-firefighter', 'usr-bridge-builder'],
  'sys-ai-engine':        ['wf-strategic-planning', 'usr-deep-focus'],
  'sys-jira':             ['wf-admin-deadlines', 'wf-system-maintenance', 'wf-cross-team-sync', 'usr-process-admin', 'usr-firefighter'],
  'sys-exec-dashboard':   ['wf-mgmt-escalations', 'wf-strategic-planning', 'usr-deep-focus'],

  // Personas -> connected Workflows and Systems
  'usr-firefighter':      ['wf-mgmt-escalations', 'sys-slack-teams', 'sys-jira'],
  'usr-deep-focus':       ['wf-strategic-planning', 'sys-ai-engine', 'sys-exec-dashboard'],
  'usr-process-admin':    ['wf-admin-deadlines', 'wf-system-maintenance', 'sys-sharepoint', 'sys-jira'],
  'usr-bridge-builder':   ['wf-cross-team-sync', 'sys-slack-teams']
};
```

### 2.4 Friction Rules (Deterministic)

Maps every `workflowId::systemId` pair to a friction coefficient. Scale: `0.0` (flow state) to `1.0` (critical mismatch). Values not in the map default to `0.5` (moderate).

```javascript
const frictionRules = {
  // Management Escalations
  'wf-mgmt-escalations::sys-sharepoint':     0.85,  // Red - static docs bad for urgent triage
  'wf-mgmt-escalations::sys-slack-teams':     0.3,   // Green - real-time comms fits urgency
  'wf-mgmt-escalations::sys-ai-engine':       0.2,   // Green - AI can route/prioritize
  'wf-mgmt-escalations::sys-jira':            0.6,   // Yellow - ticket overhead during crisis
  'wf-mgmt-escalations::sys-exec-dashboard':  0.4,   // Yellow-green - visibility helps

  // Admin Deadlines
  'wf-admin-deadlines::sys-sharepoint':       0.3,   // Green - docs/forms align
  'wf-admin-deadlines::sys-slack-teams':       0.5,   // Yellow - chat noise for routine
  'wf-admin-deadlines::sys-ai-engine':         0.4,   // Yellow-green - could automate
  'wf-admin-deadlines::sys-jira':              0.15,  // Green - structured tasks fit perfectly
  'wf-admin-deadlines::sys-exec-dashboard':    0.5,   // Yellow - not primary tool

  // System Maintenance
  'wf-system-maintenance::sys-sharepoint':     0.4,   // Yellow-green - documentation use
  'wf-system-maintenance::sys-slack-teams':     0.55,  // Yellow - alerts yes, chat no
  'wf-system-maintenance::sys-ai-engine':       0.35,  // Green - predictive maintenance
  'wf-system-maintenance::sys-jira':            0.2,   // Green - ticket-driven ops
  'wf-system-maintenance::sys-exec-dashboard':  0.65,  // Yellow-orange - wrong audience

  // Cross-Team Sync
  'wf-cross-team-sync::sys-sharepoint':        0.5,   // Yellow - async docs
  'wf-cross-team-sync::sys-slack-teams':        0.2,   // Green - built for this
  'wf-cross-team-sync::sys-ai-engine':          0.45,  // Yellow - could summarize
  'wf-cross-team-sync::sys-jira':               0.3,   // Green - shared boards
  'wf-cross-team-sync::sys-exec-dashboard':     0.55,  // Yellow - top-down view

  // Strategic Planning
  'wf-strategic-planning::sys-sharepoint':      0.5,   // Yellow - too static
  'wf-strategic-planning::sys-slack-teams':      0.9,   // Red - deep work clashes with interrupts
  'wf-strategic-planning::sys-ai-engine':        0.15,  // Green - pattern analysis
  'wf-strategic-planning::sys-jira':             0.7,   // Orange - too tactical
  'wf-strategic-planning::sys-exec-dashboard':   0.25   // Green - strategic visibility
};
```

### 2.5 Mode Rules (Simulation)

```javascript
const modeRules = {
  'morning-triage': {
    dimmed: ['wf-strategic-planning', 'usr-deep-focus'],
    highlighted: ['wf-mgmt-escalations', 'wf-admin-deadlines', 'sys-slack-teams', 'usr-firefighter']
  },
  'deep-focus': {
    dimmed: ['sys-slack-teams', 'wf-mgmt-escalations', 'usr-firefighter', 'usr-bridge-builder'],
    highlighted: ['wf-strategic-planning', 'sys-ai-engine', 'sys-exec-dashboard', 'usr-deep-focus']
  },
  'firefighting': {
    dimmed: ['wf-admin-deadlines', 'wf-strategic-planning', 'usr-deep-focus', 'usr-process-admin'],
    highlighted: ['wf-mgmt-escalations', 'sys-slack-teams', 'sys-jira', 'usr-firefighter']
  }
};
```

---

## 3. VIEW 1: DASHBOARD

### 3.1 Global Header

**Persistent across both views.** Rendered into `<header id="global-header">`.

#### HTML Structure

```html
<header id="global-header" class="bg-white border-b border-slate-200 sticky top-0 z-50">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">

    <!-- Logo Area -->
    <div class="flex items-center gap-3">
      <div class="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center
                  text-white font-bold text-lg">
        C
      </div>
      <div>
        <h1 class="text-lg font-bold text-slate-900 leading-tight">
          Context-Aware Workplace Modeler
        </h1>
        <p class="text-xs text-slate-500">Ontology Engine & Feasibility Analysis</p>
      </div>
    </div>

    <!-- Navigation Buttons -->
    <nav class="flex items-center gap-2">
      <button id="btn-dashboard" class="nav-btn nav-btn-active" data-view="dashboard">
        Dashboard
      </button>
      <button id="btn-input-studio" class="nav-btn" data-view="input-studio">
        Input Studio
      </button>
      <button id="btn-reset"
              class="text-sm text-slate-500 hover:text-red-600 ml-4 transition-colors">
        Reset data
      </button>
    </nav>

  </div>
</header>
```

#### Data Bindings

- `nav-btn-active` class applied to whichever button matches `state.currentView`
- Active button style: `bg-indigo-600 text-white` (filled)
- Inactive button style: `bg-slate-100 text-slate-700` (muted)

#### Event Handlers

| Element | Event | Handler | Effect |
|---|---|---|---|
| `#btn-dashboard` | `click` | `showView('dashboard')` | Hide Input Studio, show Dashboard, update active button |
| `#btn-input-studio` | `click` | `showView('input-studio')` | Hide Dashboard, show Input Studio, update active button |
| `#btn-reset` | `click` | `resetData()` | Soft reset (see Section 5.5) |

### 3.2 Hero / Introduction Section

**Located at the top of `#view-dashboard`.** Static content, no data bindings.

#### HTML Structure

```html
<section id="hero-section" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">

    <!-- Text content: spans 2 columns on desktop -->
    <div class="lg:col-span-2">
      <h2 class="text-3xl font-extrabold text-slate-900 tracking-tight">
        Modeling the Context-Aware Enterprise
      </h2>
      <p class="mt-4 text-slate-600 text-lg leading-relaxed">
        Traditional workflows are static. A <strong>Context-Aware Workplace</strong>
        dynamically adapts based on the intersection of three dimensions: Business
        Demand, System Capability, and User State.
      </p>
      <p class="mt-3 text-slate-600 leading-relaxed">
        Use the Simulation Controls and Ontology Graph below to explore different
        environmental states and their effects on cognitive load.
      </p>
    </div>

    <!-- Simulation Control Panel: right column on desktop -->
    <div id="simulation-control">
      <!-- See Section 3.3 -->
    </div>

  </div>
</section>
```

### 3.3 Simulation Control Panel

**Positioned in the right column of the hero grid on desktop, or full-width below hero text on mobile.**

#### HTML Structure

```html
<div id="simulation-control" class="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
  <h3 class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
    Simulation Control
  </h3>

  <div class="space-y-2">
    <!-- Mode Card: Morning Triage (default active) -->
    <button class="mode-card mode-card-active" data-mode="morning-triage">
      <span class="text-lg mr-2">&#9728;&#65039;</span>
      <div>
        <div class="font-semibold text-sm">Morning Triage</div>
        <div class="text-xs text-slate-500">High Speed / Low Depth</div>
      </div>
    </button>

    <!-- Mode Card: Deep Focus -->
    <button class="mode-card" data-mode="deep-focus">
      <span class="text-lg mr-2">&#129504;</span>
      <div>
        <div class="font-semibold text-sm">Deep Focus</div>
        <div class="text-xs text-slate-500">Low Distraction / High Depth</div>
      </div>
    </button>

    <!-- Mode Card: Firefighting -->
    <button class="mode-card" data-mode="firefighting">
      <span class="text-lg mr-2">&#128293;</span>
      <div>
        <div class="font-semibold text-sm">Firefighting</div>
        <div class="text-xs text-slate-500">Critical / Reactive</div>
      </div>
    </button>
  </div>

  <!-- Scenario Simulator Button (AI - stubbed) -->
  <button id="btn-simulate-scenario"
          class="mt-4 w-full text-center text-sm text-indigo-600 hover:text-indigo-800
                 font-medium transition-colors">
    Simulate Scenario
  </button>
</div>
```

#### Mode Card Styling

```css
.mode-card {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid transparent;
  border-radius: 0.75rem;
  background: #f8fafc;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
}

.mode-card:hover {
  background: #f1f5f9;
}

.mode-card-active {
  border-color: #4f46e5;
  background: #eef2ff;
}
```

#### Event Handlers

| Element | Event | Handler |
|---|---|---|
| Each `.mode-card` | `click` | `setSimulationMode(mode)` -- see Section 5.1 |
| `#btn-simulate-scenario` | `click` | `showAIStub('Context Scenario Simulator')` -- Phase 5 stub |

### 3.4 Context Ontology Explorer (The "Context Triad")

**The core interactive visualization.** Three-column layout below the hero section.

#### HTML Structure

```html
<section id="ontology-explorer" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

  <!-- Section Header -->
  <div class="flex items-center justify-between mb-6">
    <div>
      <h2 class="text-2xl font-extrabold text-slate-900 tracking-tight">
        Context Ontology Explorer
      </h2>
      <p class="text-sm text-slate-500 mt-1">
        Interactive mapping of your defined Workflows, Systems, and Users.
      </p>
    </div>
    <!-- Node Counter Badge -->
    <span id="node-counter"
          class="text-sm font-medium text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
      14 Nodes Loaded
    </span>
  </div>

  <!-- Three Columns -->
  <div class="grid grid-cols-1 md:grid-cols-3 gap-6">

    <!-- Column 1: Business Workflows -->
    <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div class="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <h3 class="font-bold text-sm text-slate-800">1. Business Workflows</h3>
        <span class="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5
                     rounded uppercase tracking-wide">Demand</span>
      </div>
      <div id="col-workflows" class="divide-y divide-slate-100">
        <!-- Node cards rendered by renderColumns() -->
      </div>
    </div>

    <!-- Column 2: Systems & Infra -->
    <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div class="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <h3 class="font-bold text-sm text-slate-800">2. Systems & Infra</h3>
        <span class="text-xs font-bold text-blue-700 bg-blue-100 px-2 py-0.5
                     rounded uppercase tracking-wide">Supply</span>
      </div>
      <div id="col-systems" class="divide-y divide-slate-100">
        <!-- Node cards rendered by renderColumns() -->
      </div>
    </div>

    <!-- Column 3: Users & Personas -->
    <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div class="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <h3 class="font-bold text-sm text-slate-800">3. Users & Personas</h3>
        <span class="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5
                     rounded uppercase tracking-wide">State</span>
      </div>
      <div id="col-personas" class="divide-y divide-slate-100">
        <!-- Node cards rendered by renderColumns() -->
      </div>
    </div>

  </div>

  <!-- Insight Panel (hidden by default) -->
  <div id="insight-panel" class="hidden mt-6">
    <!-- See Section 3.5 -->
  </div>

</section>
```

#### Node Card HTML (generated per node by `renderColumns()`)

**Workflow node card:**

```html
<div class="triad-item p-4 cursor-pointer hover:bg-slate-50 transition-all duration-300"
     data-node-id="wf-mgmt-escalations" data-node-type="workflow">
  <div class="flex items-center justify-between">
    <span class="font-medium text-sm text-slate-800">{name}</span>
    <span class="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5
                 rounded uppercase">{frequency}</span>
  </div>
  <p class="text-xs text-slate-400 mt-1">{description}</p>
</div>
```

**System node card:** Same structure but badge shows `{category}` instead of `{frequency}`.

**Persona node card:** Same structure but no badge (description serves as the behavioral state indicator).

#### Data Bindings

- `#node-counter` text content = total count of `workflows.length + systems.length + personas.length`
- Column containers (`#col-workflows`, `#col-systems`, `#col-personas`) are cleared and rebuilt on every `renderColumns()` call
- Each `.triad-item` receives CSS classes based on simulation mode: `.dimmed` or `.highlighted` or `.active-context`
- All dynamic text (name, description) must be passed through `sanitize()` before DOM insertion

#### Event Handlers

| Element | Event | Handler |
|---|---|---|
| Each `.triad-item` | `click` | `handleItemClick(nodeId, nodeType)` -- see Section 5.2 |

### 3.5 Active Context Analysis / Insight Panel

**Appears below the three columns when a node is clicked.** Dark background panel.

#### HTML Structure

```html
<div id="insight-panel"
     class="hidden mt-6 bg-slate-900 text-white rounded-xl p-6 shadow-lg">
  <div class="flex items-start justify-between">
    <div>
      <h3 class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
        Active Context Analysis
      </h3>
      <p class="text-lg font-semibold">
        Selected: <span id="insight-node-name" class="text-indigo-400"></span>
      </p>
      <p class="text-sm text-slate-300 mt-1">
        Detected <span id="insight-connection-count" class="font-bold"></span>
        direct connections in the graph.
      </p>
      <p class="text-xs text-slate-500 mt-2">
        Contact AI agent recommended. Analyzing logic for optimizations.
      </p>
    </div>

    <div class="flex flex-col gap-2">
      <!-- AI Analyze Button (stubbed in Phase 1-4) -->
      <button id="btn-ai-analyze"
              class="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium
                     px-5 py-2.5 rounded-lg transition-colors">
        Analyze Logic
      </button>
      <!-- AI Prompt Generator Button (stubbed) -->
      <button id="btn-ai-prompt"
              class="text-sm text-emerald-400 hover:text-emerald-300 flex items-center
                     gap-1 transition-colors">
        Generate Prompt
      </button>
    </div>
  </div>

  <!-- AI Response Container (Phase 5) -->
  <div id="ai-response-container"
       class="hidden mt-4 bg-slate-800 rounded-lg p-4 text-sm text-slate-200 leading-relaxed">
  </div>
</div>
```

#### Data Bindings

- `#insight-node-name`: the `name` of the selected node (use `textContent`, not HTML insertion)
- `#insight-connection-count`: length of `contextMap[selectedNodeId]`
- `#insight-panel` visibility: toggled by `state.insightPanelVisible`

#### Event Handlers

| Element | Event | Handler |
|---|---|---|
| `#btn-ai-analyze` | `click` | `showAIStub('Node Analyzer')` |
| `#btn-ai-prompt` | `click` | `showAIStub('Prompt Generator')` |

### 3.6 Cognitive Friction Heatmap

**Grid-based visualization.** Y-axis = Systems. X-axis = Workflows. Cell color = friction level.

#### HTML Structure

```html
<section id="friction-heatmap-section"
         class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
  <h2 class="text-2xl font-extrabold text-slate-900 tracking-tight mb-2">
    Cognitive Friction Heatmap
  </h2>
  <p class="text-sm text-slate-500 mb-6">
    Context Engineering analysis of workflow-system compatibility.
  </p>

  <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-6 overflow-x-auto">
    <div id="heatmap-grid" class="heatmap-container">
      <!-- Generated by renderHeatmap() -->
    </div>

    <!-- Legend -->
    <div class="flex items-center gap-4 mt-4 text-xs text-slate-500">
      <div class="flex items-center gap-1">
        <span class="w-4 h-4 rounded" style="background: #10b981;"></span> Low Friction
      </div>
      <div class="flex items-center gap-1">
        <span class="w-4 h-4 rounded" style="background: #f59e0b;"></span> Moderate
      </div>
      <div class="flex items-center gap-1">
        <span class="w-4 h-4 rounded" style="background: #ef4444;"></span> High Friction
      </div>
    </div>
  </div>

  <!-- Friction Modal (hidden by default) -->
  <div id="friction-modal" class="hidden">
    <!-- See below -->
  </div>
</section>
```

#### Heatmap Grid Rendering (`renderHeatmap()`)

The grid is built using CSS Grid:
- Header row: empty corner cell + one cell per workflow name
- Data rows: one per system. First cell = system name. Remaining cells = colored by friction score.
- Grid template columns set dynamically: `grid-template-columns: 160px repeat(N, 1fr)`
- Each cell looks up `frictionRules[wfId + '::' + sysId]` or defaults to `0.5`
- Cell background set to `frictionToColor(score)`
- Each cell gets `data-workflow` and `data-system` attributes for click handling
- All text content uses `textContent` (not HTML insertion) for security

#### Color Mapping Function

```javascript
function frictionToColor(score) {
  if (score <= 0.3) return '#10b981';   // Emerald (green) - flow state
  if (score <= 0.5) return '#f59e0b';   // Amber (yellow) - moderate
  if (score <= 0.7) return '#f97316';   // Orange - elevated
  return '#ef4444';                      // Red - critical mismatch
}

function frictionToLabel(score) {
  if (score <= 0.3) return 'Low Friction';
  if (score <= 0.5) return 'Moderate';
  if (score <= 0.7) return 'Elevated';
  return 'High Friction';
}
```

#### Friction Detail Modal

When a heatmap cell is clicked, a modal overlay appears showing friction details.

```html
<div id="friction-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center">
  <!-- Backdrop -->
  <div class="absolute inset-0 bg-black/50" id="friction-modal-backdrop"></div>
  <!-- Modal Content -->
  <div class="relative bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
    <div class="flex items-start gap-3 mb-4">
      <span class="text-2xl">&#9888;&#65039;</span>
      <div>
        <h3 class="font-bold text-lg text-slate-900">Friction Detected</h3>
        <span id="friction-modal-level"
              class="text-xs font-bold uppercase"></span>
      </div>
      <button id="friction-modal-close"
              class="ml-auto text-slate-400 hover:text-slate-600 text-xl">
        &times;
      </button>
    </div>
    <div class="space-y-1 text-sm text-slate-700 mb-4">
      <p>Workflow: <strong id="friction-modal-workflow"></strong></p>
      <p>System: <strong id="friction-modal-system"></strong></p>
      <p>Friction: <strong id="friction-modal-score"></strong></p>
    </div>
    <!-- AI Resolve Button (stubbed) -->
    <button id="btn-friction-resolve"
            class="text-sm text-indigo-600 hover:text-indigo-800 font-medium
                   flex items-center gap-1">
      Resolve & Assign Friction
    </button>
    <!-- AI Response Container (Phase 5) -->
    <div id="friction-ai-response"
         class="hidden mt-4 text-sm text-slate-600 leading-relaxed bg-slate-50 rounded-lg p-4">
    </div>
  </div>
</div>
```

#### Event Handlers

| Element | Event | Handler |
|---|---|---|
| Each heatmap cell | `click` | `showFrictionDetail(workflowId, systemId)` -- see Section 5.3 |
| `#friction-modal-close` | `click` | `closeFrictionModal()` |
| `#friction-modal-backdrop` | `click` | `closeFrictionModal()` |
| `#btn-friction-resolve` | `click` | `showAIStub('Smart Friction Resolver')` |

### 3.7 Charts Section

**Two charts side by side on desktop, stacked on mobile.**

#### HTML Structure

```html
<section id="charts-section" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">

    <!-- Radar Chart -->
    <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <h3 class="text-lg font-bold text-slate-900 mb-1">Ontology Readiness Score</h3>
      <p class="text-xs text-slate-500 mb-4">
        Current maturity vs. all-software-is-a-semantic-layer target.
      </p>
      <div class="chart-container" style="height: 350px;">
        <canvas id="chart-radar"></canvas>
      </div>
    </div>

    <!-- Bubble Chart -->
    <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <h3 class="text-lg font-bold text-slate-900 mb-1">Responsibility Mapping</h3>
      <p class="text-xs text-slate-500 mb-4">
        Prioritization: Complexity vs. Strategic Value.
      </p>
      <div class="chart-container" style="height: 350px;">
        <canvas id="chart-bubble"></canvas>
      </div>
    </div>

  </div>
</section>
```

#### Chart Data -- see Section 8 for exact values.

#### Responsive Behavior

- Chart containers: `height: 350px` on mobile, `height: 400px` at `min-width: 768px`
- Chart.js `responsive: true`, `maintainAspectRatio: false`

### 3.8 Implementation Roadmap Section

**Static content section with four roadmap steps.** Each step has an AI action plan button (stubbed).

#### HTML Structure

```html
<section id="roadmap-section" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
  <h2 class="text-2xl font-extrabold text-slate-900 tracking-tight mb-6">
    Implementation Roadmap
  </h2>

  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">

    <div class="roadmap-card bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <div class="flex items-center gap-3 mb-3">
        <span class="w-8 h-8 bg-indigo-100 text-indigo-700 rounded-lg flex items-center
                     justify-center font-bold text-sm">1</span>
        <h3 class="font-bold text-slate-900">Define the Schema</h3>
      </div>
      <p class="text-sm text-slate-600 mb-4">
        Map all business workflows, systems, and user personas into a structured
        ontology with explicit relationships.
      </p>
      <button class="btn-roadmap-ai text-sm text-indigo-600 hover:text-indigo-800 font-medium">
        Generate Action Plan
      </button>
      <div class="roadmap-ai-response hidden mt-3 text-sm text-slate-600 bg-slate-50
                  rounded-lg p-3"></div>
    </div>

    <div class="roadmap-card bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <div class="flex items-center gap-3 mb-3">
        <span class="w-8 h-8 bg-emerald-100 text-emerald-700 rounded-lg flex items-center
                     justify-center font-bold text-sm">2</span>
        <h3 class="font-bold text-slate-900">Build Context Gates</h3>
      </div>
      <p class="text-sm text-slate-600 mb-4">
        Create decision points that route information based on user state, workflow
        priority, and system capability.
      </p>
      <button class="btn-roadmap-ai text-sm text-indigo-600 hover:text-indigo-800 font-medium">
        Generate Action Plan
      </button>
      <div class="roadmap-ai-response hidden mt-3 text-sm text-slate-600 bg-slate-50
                  rounded-lg p-3"></div>
    </div>

    <div class="roadmap-card bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <div class="flex items-center gap-3 mb-3">
        <span class="w-8 h-8 bg-amber-100 text-amber-700 rounded-lg flex items-center
                     justify-center font-bold text-sm">3</span>
        <h3 class="font-bold text-slate-900">Deploy Semantic Layer</h3>
      </div>
      <p class="text-sm text-slate-600 mb-4">
        Implement the AI-powered context engine that dynamically adapts the workspace
        based on real-time signals.
      </p>
      <button class="btn-roadmap-ai text-sm text-indigo-600 hover:text-indigo-800 font-medium">
        Generate Action Plan
      </button>
      <div class="roadmap-ai-response hidden mt-3 text-sm text-slate-600 bg-slate-50
                  rounded-lg p-3"></div>
    </div>

    <div class="roadmap-card bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <div class="flex items-center gap-3 mb-3">
        <span class="w-8 h-8 bg-red-100 text-red-700 rounded-lg flex items-center
                     justify-center font-bold text-sm">4</span>
        <h3 class="font-bold text-slate-900">Measure & Iterate</h3>
      </div>
      <p class="text-sm text-slate-600 mb-4">
        Track KPIs like context switching frequency, mean time to triage, and
        cognitive load scores to validate improvements.
      </p>
      <button class="btn-roadmap-ai text-sm text-indigo-600 hover:text-indigo-800 font-medium">
        Generate Action Plan
      </button>
      <div class="roadmap-ai-response hidden mt-3 text-sm text-slate-600 bg-slate-50
                  rounded-lg p-3"></div>
    </div>

  </div>
</section>
```

#### Event Handlers

| Element | Event | Handler |
|---|---|---|
| Each `.btn-roadmap-ai` | `click` | `showAIStub('Roadmap Action Planner')` |

### 3.9 Context Scenario Simulator Button

Already defined in the Simulation Control Panel (Section 3.3) as `#btn-simulate-scenario`. In Phase 1-4, clicking it calls `showAIStub()`.

---

## 4. VIEW 2: INPUT STUDIO

### 4.1 Header Banner

```html
<div id="view-input-studio" class="hidden">
  <!-- Dark header banner -->
  <div class="bg-indigo-900 text-white py-8 px-4 sm:px-6 lg:px-8 text-center">
    <h2 class="text-2xl font-extrabold">Ontology Input Studio</h2>
    <p class="text-sm text-indigo-200 mt-2 max-w-2xl mx-auto">
      Define the nodes of your workplace graph. Explicitly link systems to
      workflows to build the ontology.
    </p>
  </div>

  <!-- Tab Container -->
  <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4">
    <div class="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
      <!-- Tab Navigation: See 4.2 -->
      <!-- Tab Content Panels: See 4.3-4.5 -->
    </div>
  </div>
</div>
```

### 4.2 Tab Navigation

```html
<div class="flex border-b border-slate-200">
  <button class="studio-tab studio-tab-active flex-1 py-3 text-sm font-medium text-center"
          data-tab="tab-workflows">
    1. Workflows
  </button>
  <button class="studio-tab flex-1 py-3 text-sm font-medium text-center"
          data-tab="tab-systems">
    2. Systems & Infra
  </button>
  <button class="studio-tab flex-1 py-3 text-sm font-medium text-center"
          data-tab="tab-users">
    3. Business Users
  </button>
</div>
```

**Tab styling:**
- Active: `border-b-2 border-indigo-600 text-indigo-700`
- Inactive: `text-slate-500 hover:text-slate-700`

**Tab switching:** Click handler toggles visibility of `#tab-workflows`, `#tab-systems`, `#tab-users` containers and updates active tab styling.

### 4.3 Tab 1: Add Workflow Form

```html
<div id="tab-workflows" class="p-6">
  <div class="flex items-center justify-between mb-4">
    <h3 class="text-lg font-bold text-slate-900">Add New Business Workflow</h3>
    <span class="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5
                 rounded uppercase">Demand Node</span>
  </div>

  <form id="form-add-workflow" class="space-y-4">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- Workflow Name -->
      <div>
        <label class="block text-xs font-medium text-slate-500 mb-1">Workflow Name</label>
        <input type="text" id="wf-name" required maxlength="100"
               class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm
                      focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
               placeholder="e.g. Q3 Financial Reporting">
      </div>

      <!-- Type / Category -->
      <div>
        <label class="block text-xs font-medium text-slate-500 mb-1">Type / Category</label>
        <select id="wf-type"
                class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm
                       focus:ring-2 focus:ring-indigo-500 outline-none">
          <option value="critical">Critical (High Urgency)</option>
          <option value="routine">Routine</option>
          <option value="strategic">Strategic</option>
          <option value="operational">Operational</option>
          <option value="ad-hoc">Ad-hoc</option>
        </select>
      </div>
    </div>

    <!-- Description -->
    <div>
      <label class="block text-xs font-medium text-slate-500 mb-1">Description</label>
      <textarea id="wf-description" rows="2" maxlength="500"
                class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm
                       focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                placeholder="Brief description of this workflow"></textarea>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- Business Owner -->
      <div>
        <label class="block text-xs font-medium text-slate-500 mb-1">Business Owner</label>
        <input type="text" id="wf-owner" maxlength="100"
               class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm
                      focus:ring-2 focus:ring-indigo-500 outline-none"
               placeholder="e.g. VP of Operations">
      </div>

      <!-- Frequency -->
      <div>
        <label class="block text-xs font-medium text-slate-500 mb-1">Frequency</label>
        <select id="wf-frequency"
                class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm
                       focus:ring-2 focus:ring-indigo-500 outline-none">
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="quarterly">Quarterly</option>
          <option value="ad-hoc">Ad-hoc</option>
        </select>
      </div>
    </div>

    <!-- Link to Systems (Checkboxes) -->
    <div>
      <label class="block text-xs font-medium text-slate-500 mb-2">
        Link to Supporting Systems
      </label>
      <div id="wf-system-checkboxes" class="grid grid-cols-2 gap-2">
        <!-- Generated dynamically from state.ontologyData.systems -->
        <!-- Each checkbox: <label class="flex items-center gap-2 text-sm text-slate-700">
               <input type="checkbox" value="{sys.id}"> {sys.name}
             </label> -->
      </div>
    </div>

    <!-- Submit -->
    <button type="submit"
            class="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3
                   rounded-lg transition-colors text-sm">
      + Add Workflow Node
    </button>
  </form>
</div>
```

#### Validation Rules

| Field | Required | Validation |
|---|---|---|
| `wf-name` | Yes | Non-empty string, max 100 chars, sanitized |
| `wf-type` | Yes | Must be one of the 5 enum values |
| `wf-description` | No | Max 500 chars, sanitized |
| `wf-owner` | No | Max 100 chars, sanitized |
| `wf-frequency` | Yes | Must be one of the 5 enum values |
| System checkboxes | No | Zero or more checked |

#### Submit Handler

See Section 5.4 for the full `addNode('workflow', formData)` flow.

### 4.4 Tab 2: Add System Form

```html
<div id="tab-systems" class="hidden p-6">
  <div class="flex items-center justify-between mb-4">
    <h3 class="text-lg font-bold text-slate-900">Add New System / Infrastructure</h3>
    <span class="text-xs font-bold text-blue-700 bg-blue-100 px-2 py-0.5
                 rounded uppercase">Supply Node</span>
  </div>

  <form id="form-add-system" class="space-y-4">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- System Name -->
      <div>
        <label class="block text-xs font-medium text-slate-500 mb-1">System Name</label>
        <input type="text" id="sys-name" required maxlength="100"
               class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm
                      focus:ring-2 focus:ring-indigo-500 outline-none"
               placeholder="e.g. Finance Power BI Dashboard">
      </div>

      <!-- Category -->
      <div>
        <label class="block text-xs font-medium text-slate-500 mb-1">Category</label>
        <select id="sys-category"
                class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm
                       focus:ring-2 focus:ring-indigo-500 outline-none">
          <option value="reporting">Power BI / Tableau / Dashboard</option>
          <option value="storage">SharePoint / Drive</option>
          <option value="comms">Communication</option>
          <option value="intelligence">AI / Intelligence</option>
          <option value="tracking">Project Management</option>
        </select>
      </div>
    </div>

    <!-- Description -->
    <div>
      <label class="block text-xs font-medium text-slate-500 mb-1">Description</label>
      <textarea id="sys-description" rows="2" maxlength="500"
                class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm
                       focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                placeholder="Describe purpose or function"></textarea>
    </div>

    <!-- Link to Workflows & Users (Checkboxes) -->
    <div>
      <label class="block text-xs font-medium text-slate-500 mb-2">
        Link to Existing Workflows & Users
      </label>
      <div id="sys-link-checkboxes" class="grid grid-cols-2 gap-2">
        <!-- Generated dynamically: all workflows + all personas as checkboxes -->
      </div>
    </div>

    <!-- Submit -->
    <button type="submit"
            class="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3
                   rounded-lg transition-colors text-sm">
      + Add System Node
    </button>
  </form>
</div>
```

#### Validation Rules

| Field | Required | Validation |
|---|---|---|
| `sys-name` | Yes | Non-empty string, max 100 chars, sanitized |
| `sys-category` | Yes | Must be one of the 5 enum values |
| `sys-description` | No | Max 500 chars, sanitized |
| Link checkboxes | No | Zero or more checked |

### 4.5 Tab 3: Add User Form

```html
<div id="tab-users" class="hidden p-6">
  <div class="flex items-center justify-between mb-4">
    <h3 class="text-lg font-bold text-slate-900">Add Business User</h3>
    <span class="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5
                 rounded uppercase">State Node</span>
  </div>

  <form id="form-add-user" class="space-y-4">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- Name / Role -->
      <div>
        <label class="block text-xs font-medium text-slate-500 mb-1">Name / Role</label>
        <input type="text" id="usr-name" required maxlength="100"
               class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm
                      focus:ring-2 focus:ring-indigo-500 outline-none"
               placeholder="e.g. Sarah (Finance Analyst)">
      </div>

      <!-- Primary Persona State -->
      <div>
        <label class="block text-xs font-medium text-slate-500 mb-1">
          Primary Persona State
        </label>
        <select id="usr-state"
                class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm
                       focus:ring-2 focus:ring-indigo-500 outline-none">
          <option value="reactive-firefighter">Reactive Firefighter (High Stress)</option>
          <option value="deep-focus-architect">Deep Focus Architect (Low Distraction)</option>
          <option value="process-admin">Process Admin (Methodical)</option>
          <option value="bridge-builder">Bridge Builder (Collaborative)</option>
        </select>
      </div>
    </div>

    <!-- Role Description -->
    <div>
      <label class="block text-xs font-medium text-slate-500 mb-1">Role Description</label>
      <textarea id="usr-description" rows="2" maxlength="500"
                class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm
                       focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                placeholder="What is their primary responsibility?"></textarea>
    </div>

    <!-- Submit -->
    <button type="submit"
            class="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3
                   rounded-lg transition-colors text-sm">
      + Add User Node
    </button>
  </form>
</div>
```

#### Validation Rules

| Field | Required | Validation |
|---|---|---|
| `usr-name` | Yes | Non-empty string, max 100 chars, sanitized |
| `usr-state` | Yes | Must be one of the 4 enum values |
| `usr-description` | No | Max 500 chars, sanitized |

---

## 5. INTERACTION SPECIFICATIONS

### 5.1 Simulation Mode Toggle

**Trigger:** Click on a `.mode-card` button in the Simulation Control Panel.

**Handler: `setSimulationMode(mode)`**

```
1. Update state.currentMode = mode
2. Remove 'mode-card-active' from all .mode-card elements
3. Add 'mode-card-active' to the clicked .mode-card
4. Get modeRules[mode]
5. For every .triad-item in the DOM:
   a. Remove classes: 'dimmed', 'highlighted'
   b. If nodeId is in modeRules[mode].dimmed -> add class 'dimmed'
   c. If nodeId is in modeRules[mode].highlighted -> add class 'highlighted'
6. If insight panel is visible, leave it as-is (mode change does not close it)
```

**State changes:** `state.currentMode`

**DOM updates:** CSS classes on `.triad-item` elements change, producing opacity/emphasis transitions.

**Side effects:** None. Mode is not persisted to localStorage (resets to `'morning-triage'` on page load).

### 5.2 Node Click -> Relationship Highlighting -> Insight Panel

**Trigger:** Click on any `.triad-item` element.

**Handler: `handleItemClick(nodeId, nodeType)`**

```
1. Update state.selectedNode = { id: nodeId, type: nodeType }
2. Look up connectedIds = contextMap[nodeId]
3. For every .triad-item in the DOM:
   a. Remove class 'active-context'
   b. If item's nodeId === nodeId -> add class 'active-context' (selected item)
   c. If item's nodeId is in connectedIds -> add class 'active-context' (connected items)
4. Set state.insightPanelVisible = true
5. Update insight panel content:
   a. Set #insight-node-name textContent to node.name
   b. Set #insight-connection-count textContent to connectedIds.length
6. Show #insight-panel (remove 'hidden' class)
7. Scroll insight panel into view with smooth behavior
```

**State changes:** `state.selectedNode`, `state.insightPanelVisible`

**DOM updates:**
- `.active-context` class added to selected + connected nodes (elevated visual treatment)
- Non-connected, non-dimmed nodes remain neutral
- Insight panel becomes visible with connection summary

**CSS behavior of `.active-context`:**
```css
.triad-item.active-context {
  background-color: #eef2ff;  /* indigo-50 */
  border-left: 3px solid #4f46e5;
  font-weight: 600;
}
```

### 5.3 Heatmap Cell Click -> Friction Analysis

**Trigger:** Click on any cell in the heatmap grid.

**Handler: `showFrictionDetail(workflowId, systemId)`**

```
1. Look up score = frictionRules[`${workflowId}::${systemId}`] || 0.5
2. Find workflow name and system name from ontologyData
3. Determine severity label using frictionToLabel(score)
4. Update modal content:
   a. Set #friction-modal-workflow textContent to workflow.name
   b. Set #friction-modal-system textContent to system.name
   c. Set #friction-modal-score textContent to score.toFixed(2)
   d. Set #friction-modal-level textContent to severity label
   e. Set #friction-modal-level color based on frictionToColor(score)
5. Set state.frictionModalVisible = true
6. Show #friction-modal (remove 'hidden')
```

**Closing the modal:** `closeFrictionModal()` adds `'hidden'` back and sets `state.frictionModalVisible = false`.

### 5.4 Add Node (Form Submit -> Validate -> Persist -> Re-render)

**Trigger:** Submit event on `#form-add-workflow`, `#form-add-system`, or `#form-add-user`.

**Handler: `addNode(type, formElement)`**

```
 1. event.preventDefault()
 2. Read all form field values
 3. Sanitize all text inputs via sanitize(value) (see Section 9)
 4. Validate:
    a. Name field must be non-empty after sanitization
    b. Name field must be <= 100 characters
    c. Description must be <= 500 characters
    d. If validation fails: show inline error message, return early
 5. Generate node ID:
    a. prefix = 'wf' | 'sys' | 'usr' based on type
    b. slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    c. id = `${prefix}-${slug}`
    d. If ID already exists in ontologyData, append '-2', '-3', etc.
 6. Build node object with all fields
 7. For workflows: linkedSystems = array of checked system checkbox values
 8. For systems: split checked values into linkedWorkflows and linkedUsers by ID prefix
 9. Push node to appropriate ontologyData array
10. Update contextMap with new edges (bidirectional)
11. Save to localStorage via saveToStorage()
12. Re-render:
    a. renderColumns()  -- updates all three ontology columns
    b. renderHeatmap()  -- adds row/column for new workflow or system
    c. Update #node-counter text
    d. Regenerate checkbox lists in Input Studio forms (new node appears as linkable)
13. Reset form fields
14. Show success feedback:
    a. Brief green toast: "Node added: {name}"
    b. Auto-dismiss after 3 seconds
```

**State changes:** `state.ontologyData` (new node added), localStorage updated.

**DOM updates:** Ontology columns rebuilt, heatmap rebuilt, node counter updated, Input Studio checkboxes refreshed.

### 5.5 Reset (Soft Reset)

**Trigger:** Click on `#btn-reset`.

**Handler: `resetData()`**

```
 1. Show confirmation: "Reset all data to defaults?" (window.confirm)
 2. If confirmed:
    a. Call clearStorage() -- removes localStorage key
    b. Set state.ontologyData = getDefaultData() -- fresh deep copy
    c. Set state.selectedNode = null
    d. Set state.insightPanelVisible = false
    e. Set state.frictionModalVisible = false
    f. Set state.currentMode = 'morning-triage'
    g. Hide #insight-panel (add 'hidden')
    h. Hide #friction-modal (add 'hidden')
    i. Hide all .roadmap-ai-response containers
    j. Hide #ai-response-container
    k. Call renderColumns()
    l. Call renderHeatmap()
    m. Call setSimulationMode('morning-triage') -- re-apply default mode styling
    n. Update #node-counter
    o. Regenerate Input Studio checkbox lists
 3. Charts are NOT re-rendered (they use static data)
```

### 5.6 View Switching (Dashboard <-> Input Studio)

**Trigger:** Click on `#btn-dashboard` or `#btn-input-studio`.

**Handler: `showView(viewId)`**

```
1. Set state.currentView = viewId
2. Toggle visibility:
   a. #view-dashboard: visible if viewId === 'dashboard', hidden otherwise
   b. #view-input-studio: visible if viewId === 'input-studio', hidden otherwise
3. Update nav button styles:
   a. Remove 'nav-btn-active' from all .nav-btn elements
   b. Add 'nav-btn-active' to the button matching viewId
4. If switching TO Input Studio:
   a. Regenerate all checkbox lists (in case new nodes were added on dashboard)
5. If switching TO Dashboard:
   a. Re-render columns (in case new nodes were added in Input Studio)
   b. Re-render heatmap
   c. Re-apply simulation mode CSS
6. Scroll to top of page
```

---

## 6. CSS DESIGN SYSTEM

### 6.1 Color Palette

| Token | Hex | Tailwind Class | Usage |
|---|---|---|---|
| Primary | `#4F46E5` | `indigo-600` | Buttons, active states, selected borders, logo |
| Primary Light | `#EEF2FF` | `indigo-50` | Active node background, hover states |
| Secondary | `#10B981` | `emerald-500` | Success states, low-friction, demand badges |
| Accent | `#F59E0B` | `amber-500` | Warnings, state badges, CTA buttons |
| Danger | `#EF4444` | `red-500` | High friction, destructive actions |
| Background | `#F8FAFC` | `slate-50` | Page background |
| Surface | `#FFFFFF` | `white` | Card backgrounds |
| Text Primary | `#0F172A` | `slate-900` | Headings |
| Text Secondary | `#475569` | `slate-600` | Body text |
| Text Tertiary | `#94A3B8` | `slate-400` | Descriptions, labels |
| Border | `#E2E8F0` | `slate-200` | Card borders, dividers |

### 6.2 CSS Custom Properties

```css
:root {
  --color-primary: #4f46e5;
  --color-secondary: #10b981;
  --color-accent: #f59e0b;
  --color-danger: #ef4444;
  --color-dark: #0f172a;
}
```

### 6.3 Typography

**Font:** Inter (self-hosted as `inter-var.woff2` in `public/fonts/`).

```css
@font-face {
  font-family: 'Inter';
  src: url('/fonts/inter-var.woff2') format('woff2');
  font-weight: 100 900;
  font-display: swap;
}

body {
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
}
```

**Scale:**

| Element | Size | Weight | Tracking |
|---|---|---|---|
| Page title (h1) | `text-lg` (1.125rem) | 700 (bold) | normal |
| Section heading (h2) | `text-2xl` to `text-3xl` | 800 (extrabold) | `-0.025em` (tight) |
| Card heading (h3) | `text-lg` | 700 (bold) | normal |
| Body text | `text-base` (1rem) | 400 (normal) | normal |
| Small text / descriptions | `text-sm` (0.875rem) | 400 | normal |
| Labels / badges | `text-xs` (0.75rem) | 600-700 | `0.05em` (wide) uppercase |

### 6.4 Component Patterns

#### Cards

```css
.info-card {
  background: white;
  border-radius: 1rem;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
              0 2px 4px -1px rgba(0, 0, 0, 0.06);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  overflow: hidden;
}

.info-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1),
              0 10px 10px -5px rgba(0, 0, 0, 0.04);
}
```

#### Badges

```css
/* Demand badge (emerald) */
.badge-demand {
  font-size: 0.75rem;
  font-weight: 700;
  color: #047857;
  background: #d1fae5;
  padding: 0.125rem 0.5rem;
  border-radius: 0.25rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Supply badge (blue) */
.badge-supply { color: #1d4ed8; background: #dbeafe; }

/* State badge (amber) */
.badge-state { color: #b45309; background: #fef3c7; }
```

#### Buttons

```css
/* Primary button */
.btn-primary {
  background: #4f46e5;
  color: white;
  font-weight: 600;
  padding: 0.625rem 1.25rem;
  border-radius: 0.5rem;
  transition: background-color 0.2s ease;
}
.btn-primary:hover { background: #4338ca; }

/* Nav button */
.nav-btn {
  font-size: 0.875rem;
  font-weight: 500;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  transition: all 0.2s ease;
  background: #f1f5f9;
  color: #475569;
}
.nav-btn-active {
  background: #4f46e5;
  color: white;
}
```

#### Form Inputs

```css
.form-input {
  width: 100%;
  border: 1px solid #cbd5e1;
  border-radius: 0.5rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.form-input:focus {
  border-color: #4f46e5;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
}
```

### 6.5 Animations

#### Fade In Up (entry animation)

```css
.fade-in-up {
  animation: fadeInUp 0.8s ease-out forwards;
  opacity: 0;
  transform: translateY(20px);
}

@keyframes fadeInUp {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.delay-100 { animation-delay: 0.1s; }
.delay-200 { animation-delay: 0.2s; }
.delay-300 { animation-delay: 0.3s; }
```

#### Triad Item Transitions

```css
.triad-item {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.triad-item.dimmed {
  opacity: 0.35;
  filter: grayscale(0.5);
}

.triad-item.highlighted {
  border-left: 3px solid #4f46e5;
  background: #f8faff;
}

.triad-item.active-context {
  background: #eef2ff;
  border-left: 3px solid #4f46e5;
}
```

#### Custom Scrollbar

```css
::-webkit-scrollbar { width: 8px; }
::-webkit-scrollbar-track { background: #f1f1f1; }
::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
```

### 6.6 Responsive Breakpoints

| Breakpoint | Tailwind Prefix | Layout Behavior |
|---|---|---|
| < 640px (mobile) | default | Single column. Stacked cards. Charts 350px height. |
| >= 640px (sm) | `sm:` | Minor padding adjustments. |
| >= 768px (md) | `md:` | Ontology explorer goes 3-column. Form fields go 2-column. Charts 400px height. |
| >= 1024px (lg) | `lg:` | Hero grid 3-column. Charts side by side. Max-width containers. |

---

## 7. AI INTEGRATION (Phase 5 Placeholder)

### 7.1 AI Stub Function (Phases 1-4)

Every AI button in the app calls the same stub function:

```javascript
function showAIStub(featureName) {
  showToast(`"${featureName}" -- AI features coming in Phase 5.`, 'info');
}
```

### 7.2 Five API Call Patterns (Phase 5)

When AI is implemented, these are the five distinct call patterns:

#### 7.2.1 Node Analyzer (`triggerAIAnalysis`)

- **Input:** Selected node name, type, description, and array of connected node names
- **Prompt pattern:** "Act as the Ontology Engine. Analyze how a Knowledge Graph would optimize the node '{name}' given its connections to {connections}. Explain cognitive load reduction opportunities."
- **Output:** Markdown text rendered into `#ai-response-container`
- **Triggered by:** `#btn-ai-analyze` in insight panel

#### 7.2.2 Roadmap Action Planner (`triggerRoadmapAI`)

- **Input:** Roadmap step title and description
- **Prompt pattern:** "Generate a concrete 3-step implementation checklist for: {stepDescription}. Focus on actionable technical steps."
- **Output:** Markdown rendered into the adjacent `.roadmap-ai-response` container
- **Triggered by:** Each `.btn-roadmap-ai` button

#### 7.2.3 Prompt Artifact Generator (`triggerAIPromptGen`)

- **Input:** Selected triad combination (workflow + system + persona)
- **Prompt pattern:** "Write an actual system_instruction JSON that configures an LLM agent for the operational mode defined by: Workflow={workflow}, System={system}, Persona={persona}."
- **Output:** Markdown (including code block) rendered into `#ai-response-container`
- **Triggered by:** `#btn-ai-prompt` in insight panel

#### 7.2.4 Smart Friction Resolver (`analyzeFriction`)

- **Input:** Workflow name, system name, friction score
- **Prompt pattern:** "Explain why {workflow} and {system} have a friction score of {score}. Propose a Context Engineering fix."
- **Output:** Markdown rendered into `#friction-ai-response`
- **Triggered by:** `#btn-friction-resolve` in friction modal

#### 7.2.5 Context Scenario Simulator (`generateScenario`)

- **Input:** Current simulation mode name, list of highlighted/active node names
- **Prompt pattern:** "Write a vivid first-person narrative of what a user's workday feels like in {mode} mode. Reference these active tools and workflows: {nodes}."
- **Output:** Markdown rendered into a scenario output container
- **Triggered by:** `#btn-simulate-scenario`

### 7.3 Phase 5 Architecture

```
Browser (client)
  |
  | POST /api/analyze { prompt, context }
  |
  v
Vercel Serverless Function (/api/analyze.js)
  |
  | API key from process.env.AI_API_KEY
  | Rate limiting (10 requests/minute per IP)
  |
  v
AI Provider API (Gemini / OpenAI / Anthropic -- TBD)
  |
  | Response: { text: "markdown content..." }
  |
  v
Client renders response after sanitization
```

### 7.4 marked.js Integration (Phase 5)

- Add `marked` as npm dependency
- Import in relevant component files
- All AI response containers render sanitized markdown output
- DOMPurify applied AFTER markdown parsing to prevent XSS from AI-generated content

---

## 8. CHART SPECIFICATIONS

### 8.1 Radar Chart: Ontology Readiness Score

**Canvas ID:** `#chart-radar`
**Chart.js type:** `'radar'`

**Labels (5 dimensions):**

```javascript
['Workflow Def', 'Sys Integration', 'Persona Aware', 'Data Struct', 'Automation']
```

**Dataset 1: Current Maturity**

```javascript
{
  label: 'Current Maturity',
  data: [40, 85, 30, 60, 45],
  fill: true,
  backgroundColor: 'rgba(99, 102, 241, 0.2)',
  borderColor: 'rgb(99, 102, 241)',
  pointBackgroundColor: 'rgb(99, 102, 241)',
  pointBorderColor: '#fff',
  pointHoverBackgroundColor: '#fff',
  pointHoverBorderColor: 'rgb(99, 102, 241)'
}
```

**Dataset 2: Target State**

```javascript
{
  label: 'Target State',
  data: [90, 95, 90, 90, 85],
  fill: true,
  backgroundColor: 'rgba(16, 185, 129, 0.1)',
  borderColor: 'rgb(16, 185, 129)',
  borderDash: [5, 5]
}
```

**Options:**

```javascript
{
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    r: {
      angleLines: { color: '#e2e8f0' },
      grid: { color: '#e2e8f0' },
      pointLabels: {
        font: { family: "'Inter', sans-serif", size: 11, weight: '600' },
        color: '#475569'
      },
      suggestedMin: 0,
      suggestedMax: 100,
      ticks: { display: false }
    }
  },
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        usePointStyle: true,
        font: { family: "'Inter', sans-serif" }
      }
    }
  }
}
```

### 8.2 Bubble Chart: Responsibility Mapping

**Canvas ID:** `#chart-bubble`
**Chart.js type:** `'bubble'`

Replaces the Plotly.js scatter plot from the infographic. Same data, rendered with Chart.js.

**Data (7 data points):**

```javascript
{
  datasets: [{
    label: 'Workflow Items',
    data: [
      { x: 80, y: 90, r: 17, label: 'Mgmt Escalations' },
      { x: 20, y: 30, r: 10, label: 'Timesheets' },
      { x: 60, y: 70, r: 12, label: 'System Maint' },
      { x: 90, y: 85, r: 22, label: 'Strat Planning' },
      { x: 40, y: 60, r: 8,  label: 'Email Triage' },
      { x: 75, y: 20, r: 15, label: 'Legacy Migration' },
      { x: 15, y: 10, r: 5,  label: 'Password Reset' }
    ],
    backgroundColor: 'rgba(16, 185, 129, 0.5)',
    borderColor: 'rgb(16, 185, 129)',
    borderWidth: 1
  }]
}
```

Note: Bubble `r` values are Plotly `size` values divided by 2 (Plotly sizes are diameters; Chart.js `r` is radius). The mapping: `[35,20,25,45,15,30,10]` from Plotly becomes `[17,10,12,22,8,15,5]`.

**Options:**

```javascript
{
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    x: {
      title: {
        display: true,
        text: 'Contextual Complexity',
        font: { family: "'Inter', sans-serif" }
      },
      min: 0,
      max: 100,
      grid: { color: '#f1f5f9' }
    },
    y: {
      title: {
        display: true,
        text: 'Strategic Value',
        font: { family: "'Inter', sans-serif" }
      },
      min: 0,
      max: 100,
      grid: { color: '#f1f5f9' }
    }
  },
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        usePointStyle: true,
        font: { family: "'Inter', sans-serif" }
      }
    },
    tooltip: {
      callbacks: {
        label: function(context) {
          const point = context.raw;
          return point.label + ': Complexity ' + point.x + ', Value ' + point.y;
        }
      }
    }
  }
}
```

### 8.3 Chart Instance Management

```javascript
// charts.js exports
let radarChart = null;
let bubbleChart = null;

export function initCharts() {
  radarChart = new Chart(
    document.getElementById('chart-radar'),
    radarConfig
  );
  bubbleChart = new Chart(
    document.getElementById('chart-bubble'),
    bubbleConfig
  );
}

// Charts use static data -- no updateCharts() needed in Phases 1-4
// Phase 5: updateCharts() could refresh radar data based on ontologyData composition
```

---

## 9. SECURITY REQUIREMENTS

### 9.1 Input Sanitization

**File:** `src/utils/sanitize.js`

Every string that is inserted into the DOM must be sanitized. Use safe DOM APIs (`textContent`, `createElement`, `setAttribute`) wherever possible. When building complex HTML strings for batch rendering (e.g., column cards), sanitize each interpolated value.

**Implementation (zero-dependency approach for Phase 1):**

```javascript
export function sanitize(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.textContent;
}
```

**Where to apply:**
- All user-provided text from Input Studio forms before DOM insertion
- All node `name` and `description` fields when rendering columns
- All dynamic text in the heatmap grid (workflow names, system names)
- All AI response text (in Phase 5, apply DOMPurify AFTER markdown parsing)

**Phase 5 upgrade:** Replace the manual sanitize function with DOMPurify for comprehensive HTML sanitization of AI-generated markdown content.

### 9.2 No Client-Side API Keys

- No `apiKey` variable anywhere in client-side code
- Phase 5 AI calls go through a serverless proxy (`/api/analyze`)
- API key lives in Vercel environment variables only

### 9.3 Form Validation

- Required fields checked before submission
- Maximum length enforcement (100 chars for names, 500 for descriptions)
- Select/dropdown values validated against known enum arrays
- ID generation strips all characters except `[a-z0-9-]`

### 9.4 localStorage Error Handling

```javascript
export function saveToStorage(data) {
  try {
    localStorage.setItem('context-modeler-data', JSON.stringify(data));
  } catch (e) {
    console.warn('localStorage save failed:', e.message);
    // Silently fail -- app continues with in-memory data
  }
}

export function loadFromStorage() {
  try {
    const raw = localStorage.getItem('context-modeler-data');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.warn('localStorage load failed:', e.message);
    return null;
  }
}

export function clearStorage() {
  try {
    localStorage.removeItem('context-modeler-data');
  } catch (e) {
    console.warn('localStorage clear failed:', e.message);
  }
}
```

---

## 10. FILE-TO-FEATURE MAP

### `index.html`
- **Features:** Single HTML entry point. Contains `<div id="app">` mount point and module script tag pointing to `/src/main.js`.
- **Exports:** None (static file).
- **Imported by:** Vite dev server / build.

### `src/main.js`
- **Features:** Application initialization. Imports all modules. Runs init sequence (load state, render nav, render views, init charts, set default mode).
- **Exports:** None (entry point).
- **Imports:** `state/store.js`, `components/nav.js`, `views/dashboard.js`, `views/input-studio.js`, `components/charts.js`.

### `src/style.css`
- **Features:** Tailwind directives (`@import "tailwindcss"`), custom CSS properties (`:root` palette), `@font-face` for Inter, custom component classes (`.info-card`, `.mode-card`, `.triad-item`, `.badge-*`, `.nav-btn`, `.fade-in-up`, scrollbar styles, heatmap grid styles, modal overlay styles, toast notification styles).
- **Exports:** None (CSS).
- **Imported by:** `main.js` via `import './style.css'`.

### `src/data/defaults.js`
- **Features:** `getDefaultData()` factory function, `contextMap` adjacency list, `frictionRules` compatibility mapping, `modeRules` simulation rules.
- **Exports:** `getDefaultData`, `contextMap`, `frictionRules`, `modeRules`.
- **Imported by:** `state/store.js`, `utils/friction.js`, `components/triad-explorer.js`.

### `src/state/store.js`
- **Features:** Central state management. Holds `appState` object. Provides getters/setters. Initializes state from localStorage or defaults.
- **Exports:** `getState`, `setState`, `initState`, `getOntologyData`, `addWorkflow`, `addSystem`, `addPersona`, `setCurrentMode`, `setSelectedNode`.
- **Imports:** `state/storage.js`, `data/defaults.js`.

### `src/state/storage.js`
- **Features:** localStorage wrapper with try/catch error handling.
- **Exports:** `saveToStorage`, `loadFromStorage`, `clearStorage`.
- **Imported by:** `state/store.js`.

### `src/views/dashboard.js`
- **Features:** Renders the entire Dashboard view DOM into `#view-dashboard`. Calls component renderers. Sets up event delegation for Dashboard interactions.
- **Exports:** `renderDashboard`.
- **Imports:** `components/triad-explorer.js`, `components/heatmap.js`, `components/insight-panel.js`, `state/store.js`.

### `src/views/input-studio.js`
- **Features:** Renders the Input Studio view DOM into `#view-input-studio`. Builds all three tab forms. Handles tab switching. Handles form submission (validation, node creation, re-rendering).
- **Exports:** `renderInputStudio`, `refreshCheckboxes`.
- **Imports:** `state/store.js`, `utils/sanitize.js`.

### `src/components/nav.js`
- **Features:** Renders the global header. Handles view switching button clicks. Handles reset button click.
- **Exports:** `renderNav`, `showView`.
- **Imports:** `state/store.js`, `views/dashboard.js` (for re-render on switch), `views/input-studio.js` (for re-render on switch).

### `src/components/triad-explorer.js`
- **Features:** Renders the three-column ontology explorer. Handles node click events. Manages `.dimmed` / `.highlighted` / `.active-context` class application. Updates node counter badge.
- **Exports:** `renderColumns`, `handleItemClick`, `applySimulationMode`.
- **Imports:** `state/store.js`, `data/defaults.js` (for `contextMap`, `modeRules`), `components/insight-panel.js`, `utils/sanitize.js`.

### `src/components/heatmap.js`
- **Features:** Renders the cognitive friction heatmap grid. Handles cell click events. Manages the friction detail modal (show/hide/populate).
- **Exports:** `renderHeatmap`, `showFrictionDetail`, `closeFrictionModal`.
- **Imports:** `state/store.js`, `utils/friction.js`, `utils/sanitize.js`.

### `src/components/charts.js`
- **Features:** Creates and manages Chart.js instances (radar + bubble). Static data from infographic. Holds chart configuration objects.
- **Exports:** `initCharts`.
- **Imports:** `chart.js` (npm package).

### `src/components/insight-panel.js`
- **Features:** Shows/hides the Active Context Analysis panel. Populates node name, connection count. Handles AI button stubs. Contains `showAIStub()` and `showToast()` utility functions.
- **Exports:** `showInsightPanel`, `hideInsightPanel`, `showAIStub`, `showToast`.
- **Imports:** `state/store.js`, `utils/sanitize.js`.

### `src/utils/sanitize.js`
- **Features:** Text sanitization to prevent XSS. Escapes HTML entities in user-provided strings using safe DOM `createTextNode` technique.
- **Exports:** `sanitize`.
- **Imported by:** `views/input-studio.js`, `components/triad-explorer.js`, `components/heatmap.js`, `components/insight-panel.js`.

### `src/utils/friction.js`
- **Features:** Deterministic friction score lookup. Color mapping function. Label mapping function.
- **Exports:** `getFrictionScore`, `frictionToColor`, `frictionToLabel`.
- **Imports:** `data/defaults.js` (for `frictionRules`).

---

## Appendix A: Toast Notification System

A lightweight toast/notification system for user feedback (node added, AI stub, reset confirmation).

```javascript
export function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = 'toast toast-' + type;
  toast.textContent = message;
  document.body.appendChild(toast);

  // Trigger entrance animation
  requestAnimationFrame(() => toast.classList.add('toast-visible'));

  // Auto-dismiss after 3 seconds
  setTimeout(() => {
    toast.classList.remove('toast-visible');
    toast.addEventListener('transitionend', () => toast.remove());
  }, 3000);
}
```

```css
.toast {
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  padding: 0.75rem 1.25rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  z-index: 100;
  transform: translateY(1rem);
  opacity: 0;
  transition: all 0.3s ease;
}
.toast-visible {
  transform: translateY(0);
  opacity: 1;
}
.toast-info { background: #1e293b; color: white; }
.toast-success { background: #10b981; color: white; }
.toast-error { background: #ef4444; color: white; }
```

---

## Appendix B: Heatmap Grid CSS

```css
.heatmap-container {
  display: grid;
  gap: 2px;
  /* grid-template-columns set dynamically via JS:
     160px repeat(workflowCount, 1fr) */
}

.heatmap-label {
  padding: 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: #475569;
  display: flex;
  align-items: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.heatmap-header {
  padding: 0.5rem;
  font-size: 0.65rem;
  font-weight: 600;
  color: #475569;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
}

.heatmap-cell {
  padding: 0.5rem;
  border-radius: 0.25rem;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  min-height: 2.5rem;
}

.heatmap-cell:hover {
  transform: scale(1.05);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 1;
}
```
