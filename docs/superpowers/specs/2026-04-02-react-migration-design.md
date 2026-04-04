# Context Modeler: React + TypeScript Migration Design

**Date:** 2026-04-02
**Author:** Shane Slosar + Claude
**Status:** Approved
**Branch:** `chore/conductor-setup` (will branch from here)
**Design Preview:** `docs/design-preview.html`

---

## Context

The Context-Aware Workplace Modeler is a public portfolio SPA currently built with vanilla JS + Vite + Tailwind CSS v4. The UI is functional but visually flat: no animations, no dark mode, cold color palette, no glassmorphism, and poor typographic hierarchy. This migration rebuilds the app in React + TypeScript with a modern dark-first design system inspired by the Done & Dusted code-rules doc and two reference color palettes (MP072 by Alex Cristache + Tokyo golden-hour palette).

**Goal:** A polished, portfolio-ready interactive tool that feels as good as Done & Dusted, with strict linting, unit testing, and a services layer ready for a future backend.

---

## Stack

### Core

| Tool | Version | Purpose |
|------|---------|---------|
| React | 19 | UI framework |
| TypeScript | 5.x (strict mode) | Type safety |
| Vite | 8.x | Build tool (carry forward) |
| Tailwind CSS | v4 | Styling via `@tailwindcss/vite` |
| Framer Motion | v12+ | Animation (`motion/react` import) |
| shadcn/ui | latest | Accessible component primitives (Dialog, Tabs, Select, Button, Input, Toast, Card, Tooltip, Badge) |
| Chart.js | 4.x | Radar + bubble charts (carry forward) |
| DOMPurify | 3.x | HTML sanitization (carry forward) |

### Quality Tooling

| Tool | Purpose |
|------|---------|
| ESLint v9 (flat config) | `@typescript-eslint`, `react-hooks`, `jsx-a11y`, `react` plugins |
| Prettier | Formatting + `prettier-plugin-tailwindcss` for class sorting |
| Vitest | Unit + component tests with `@testing-library/react` + `@testing-library/jest-dom` |
| Husky + lint-staged | Pre-commit: ESLint + Prettier + `tsc --noEmit` on staged files |
| Playwright | E2E smoke tests (already a dependency) |

### Key Lint Rules

- `no-explicit-any` -- error
- `react-hooks/exhaustive-deps` -- error
- `jsx-a11y/no-noninteractive-element-interactions` -- error
- `no-console` -- warn in dev, error in build

### npm Scripts

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

---

## Design System

### Dark-First Color Palette

Based on MP072 (Alex Cristache) + Tokyo golden-hour palette. Dark mode is the primary personality; light mode is the variant (to be fully designed later).

**Surfaces**

| Token | Dark Mode | Light Mode (later) |
|-------|-----------|-------------------|
| `--background` | `#1B2632` | `#EEE9DF` |
| `--surface` | `#2C3B4D` | `#FFFFFF` |
| `--surface-elevated` | `#354A61` | `#F8F6F1` |
| `--muted` | `#3D5568` | `#C9C1B1` |

**Text (contrast-corrected)**

| Token | Dark | WCAG on surface |
|-------|------|-----------------|
| `--foreground` | `#EEE9DF` | 11.4:1 |
| `--foreground-muted` | `#B8C5D4` | 7.2:1 (AA) |
| `--foreground-subtle` | `#8A9BB0` | 4.6:1 (AA) |

**Accents**

| Token | Value | Usage |
|-------|-------|-------|
| `--primary` | `#FFB162` | CTAs, active nav, selected states |
| `--primary-hover` | `#FFC480` | Button hover |
| `--secondary` | `#3B9B8F` | Systems, success, low friction |
| `--secondary-hover` | `#4DB8AA` | Hover |
| `--destructive` | `#A35139` | High friction, danger, delete |
| `--destructive-hover` | `#C0624A` | Hover |
| `--accent` | `#317371` | Badges, links, info |

**Friction Heatmap Gradient (contrast-corrected)**

| Score | Background | Text |
|-------|-----------|------|
| 0-34% Low | `rgba(59,155,143,0.3)` | `#5EECD8` |
| 35-54% Moderate | `rgba(255,177,98,0.3)` | `#FFD09B` |
| 55-74% Elevated | `rgba(212,120,74,0.35)` | `#FFB88A` |
| 75-100% High | `rgba(163,81,57,0.4)` | `#FF9B7A` |

Hover states: cells brighten, scale 1.03, emit colored glow. Click: amber outline ring.

### Typography

| Role | Font | Weight | Size |
|------|------|--------|------|
| Display / Headings | Outfit | 600-700 | `text-2xl` to `text-3xl` |
| Body | Inter | 400-500 | `text-sm` to `text-base` |
| Labels | Inter | 700 | `text-[10px]` uppercase tracking-widest |
| Code / IDs | Mono stack | 400 | `text-xs` |

### Reusable Classes

| Class | Properties |
|-------|-----------|
| `modern-box` | `bg-surface/80 rounded-2xl border border-white/8 shadow-xl backdrop-blur-xl` |
| `modern-box-sm` | `bg-surface/60 rounded-xl shadow-lg backdrop-blur-md` |
| `modern-btn` | `rounded-xl shadow-sm active:scale-[0.98] disabled:opacity-50` |
| `modern-input` | `bg-muted/30 rounded-xl border border-white/10` |

### Background

Subtle multi-gradient on body, not flat:
```css
body {
  background-color: #1B2632;
  background-image:
    radial-gradient(at 0% 0%, rgba(59,155,143,0.08) 0px, transparent 50%),
    radial-gradient(at 100% 0%, rgba(255,177,98,0.06) 0px, transparent 50%),
    radial-gradient(at 100% 100%, rgba(163,81,57,0.05) 0px, transparent 50%);
  background-attachment: fixed;
}
```

---

## Architecture

### Project Structure

```
src/
  App.tsx                    # Root: AppProvider, view routing
  main.tsx                   # Entry: ReactDOM.createRoot
  types.ts                   # All TypeScript interfaces/enums
  index.css                  # Tailwind imports, custom fonts, utility classes

  services/
    ontology.service.ts      # CRUD for workflows, systems, personas
    storage.service.ts       # localStorage adapter (swappable for backend)
    friction.service.ts      # Heatmap computation
    types.ts                 # Service-layer types (separate from UI types)

  context/
    AppContext.tsx            # Global state: ontologyData, currentMode, selectedNode, darkMode

  components/
    ui/                      # shadcn/ui components (Dialog, Tabs, Button, etc.)
    nav/
      Nav.tsx
    dashboard/
      Dashboard.tsx
      TriadExplorer.tsx
      NodeCard.tsx
      Heatmap.tsx
      HeatmapCell.tsx
      FrictionModal.tsx
      SimulationControl.tsx
      InsightPanel.tsx
      Charts.tsx
      Roadmap.tsx
    input-studio/
      InputStudio.tsx
      WorkflowForm.tsx
      SystemForm.tsx
      UserForm.tsx
    shared/
      Toast.tsx              # Sonner wrapper
      Onboarding.tsx

  hooks/
    useOntology.ts           # Hook wrapping ontology service
    useSimulation.ts         # Simulation mode logic
    useLocalStorage.ts       # Typed localStorage hook

  utils/
    heuristics.ts            # Friction scoring, simulation visuals
    sanitize.ts              # DOMPurify wrapper
    cn.ts                    # clsx + tailwind-merge

  data/
    defaults.ts              # Sample ontology data

  constants/
    events.ts                # (Removed -- replaced by React Context)
```

### State Management

Single `AppContext` with React Context (per code-rules doc pattern):

```typescript
interface AppContextType {
  ontologyData: OntologyData;
  currentMode: SimulationMode;
  selectedNode: SelectedNode | null;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  dispatch: (action: AppAction) => void;
}
```

State mutations go through a `useReducer` inside the provider. Components consume via `useApp()` hook.

### Data Layer (Backend-Ready)

All data access goes through service objects. Components never touch localStorage directly.

```typescript
// services/storage.service.ts
export interface StorageAdapter {
  load(): Promise<OntologyData>;
  save(data: OntologyData): Promise<void>;
}

export const localStorageAdapter: StorageAdapter = { ... };
// Future: export const supabaseAdapter: StorageAdapter = { ... };
```

The `ontology.service.ts` accepts a `StorageAdapter` -- swap localStorage for Supabase/Firebase later without touching components.

### shadcn/ui Components Used

| Component | Replaces |
|-----------|----------|
| Dialog | Hand-built modals (About, Friction) |
| Tabs | Manual tab switching (Input Studio, mobile triad) |
| Select | Native `<select>` dropdowns |
| Button | Inconsistent button styles |
| Input / Textarea | Raw form inputs |
| Toast (Sonner) | Hand-built toast.js |
| Card | Plain div cards |
| Tooltip | `title` attributes |
| Badge | Inline `<span>` badges |

### Hand-Built Components

- Heatmap table (domain-specific)
- Triad explorer cards (custom interaction)
- Chart.js wrappers
- Simulation mode switcher
- Onboarding tour

---

## Features Carried Forward

All existing features migrate 1:1:

1. Dashboard view with hero banner
2. Triad Explorer (3 columns: workflows, systems, personas)
3. Node selection with insight panel
4. Simulation modes (Morning Triage, Deep Focus, Firefighting)
5. Cognitive Friction Heatmap (semantic table)
6. Friction detail modal on cell click
7. Radar chart (Ontology Readiness)
8. Bubble chart (Responsibility Mapping)
9. Implementation Roadmap cards
10. Input Studio with 3-tab form (Workflows, Systems, Users)
11. Export/Import JSON
12. Onboarding tour
13. About modal
14. Toast notifications
15. Mobile triad column tab switcher
16. Welcome banner for first-time visitors
17. AI buttons locked/disabled until Phase 5

---

## Testing Strategy

### Unit Tests (Vitest + Testing Library)

- **Services:** `ontology.service.ts`, `friction.service.ts`, `storage.service.ts` -- pure logic, easy to test
- **Hooks:** `useOntology`, `useSimulation` -- test state transitions
- **Utils:** `heuristics.ts`, `sanitize.ts`, `cn.ts` -- pure functions
- **Components:** Key interactive components (NodeCard, HeatmapCell, SimulationControl) -- render + user event tests

### E2E Tests (Playwright)

- View switching (Dashboard <-> Input Studio)
- Add a workflow node via Input Studio, verify it appears in triad explorer
- Click heatmap cell, verify friction modal opens
- Switch simulation mode, verify node dimming
- Export/Import JSON round-trip
- Reset data confirmation

### Coverage Target

- Services + utils: 90%+
- Components: 70%+ (focus on interaction logic, not layout)
- Overall: 80%+

---

## Verification Plan

After implementation, verify end-to-end:

1. `npm run validate` passes (typecheck + lint + test)
2. `npm run build` produces clean output with no warnings
3. Dev server renders dark-mode dashboard matching `design-preview.html`
4. All 17 features listed above work interactively
5. Lighthouse accessibility score >= 95
6. No `any` types in codebase (grep check)
7. Pre-commit hook blocks bad commits

---

## Out of Scope

- Light mode (architecture supports it, but not designed/built in this migration)
- AI features (Phase 5, unchanged)
- Backend integration (services layer is ready, but no Supabase/Firebase yet)
- Custom private font (will be added separately when font files are ready)
- PLAN.md / README updates (will be done as part of implementation)
