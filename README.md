# Context-Aware Workplace Modeler

> An interactive single-page application that models your workplace through three lenses -- Business Workflows, Systems & Infrastructure, and User Personas -- and visualizes how they relate.

| | |
|---|---|
| **Author** | [Shane Slosar](https://github.com/shaneslo) |
| **Organization** | [smslo-ai](https://github.com/smslo-ai) |
| **Started** | 2026 |
| **Version** | v2.0 (React Migration) |
| **License** | MIT |

---

## What Is This?

Think of it as a "digital twin" of your work life. You define the workflows you deal with, the tools and systems you use, and the personas of people on your team. The app maps how they connect and shows where cognitive friction lives -- where the wrong tool meets the wrong task.

Three simulation modes (Morning Triage, Deep Focus, Firefighting) let you see how the same workplace feels under different conditions. A friction heatmap highlights which workflow-system combinations cause the most pain.

Built as a portfolio project demonstrating context engineering and workplace architecture thinking.

---

## Tech Stack

| Tool | Purpose |
|------|---------|
| **React 19** | UI framework |
| **TypeScript** | Type safety (strict mode) |
| **Vite 8** | Build tool and dev server |
| **Tailwind CSS v4** | Styling with custom design tokens |
| **shadcn/ui** | Accessible component primitives (Dialog, Tabs, Badge, Tooltip) |
| **Chart.js 4** | Radar and bubble chart visualizations (tree-shaken) |
| **Framer Motion** | Entrance animations with reduced-motion support |
| **DOMPurify** | HTML sanitization |
| **Vitest + Testing Library** | Unit and component testing |

---

## Getting Started

```bash
# Clone the repo
git clone https://github.com/smslo-ai/context-modeler.git
cd context-modeler

# Install dependencies
npm install

# Start the dev server
npm run dev
```

Open [http://localhost:5173/context-modeler/](http://localhost:5173/context-modeler/) in your browser.

### Other Commands

```bash
npm run build        # Typecheck + production build to dist/
npm run preview      # Preview production build locally
npm test             # Run all tests once
npm run test:watch   # Tests in watch mode
npm run test:coverage # Tests with coverage report
npm run lint         # ESLint check
npm run typecheck    # TypeScript type check
npm run validate     # Typecheck + lint + test (use before committing)
```

---

## Project Structure

```
context-modeler/
|-- PLAN.md                  # Phased build plan (v3.0)
|-- SPEC.md                  # Implementation-ready specification
|-- index.html               # Single HTML entry point
|-- src/
|   |-- main.tsx             # React entry point
|   |-- App.tsx              # Shell with view routing
|   |-- types.ts             # All TypeScript type definitions
|   |-- index.css            # Global styles + Tailwind
|   |-- context/             # AppContext (useReducer state management)
|   |-- hooks/               # useOntology, useSimulation, useLocalStorage
|   |-- services/            # Pure functions: ontology, friction, storage
|   |-- data/                # Default ontology data, context map, friction rules
|   |-- components/
|   |   |-- dashboard/       # Dashboard view (12 components)
|   |   |-- nav/             # Navigation header
|   |   |-- shared/          # Toast, AboutModal
|   |   +-- ui/              # shadcn primitives (Button, Dialog, Badge, etc.)
|   +-- utils/               # Sanitization, heuristics, class merging
|-- src_vanilla/             # Archived vanilla JS version (reference only)
|-- OLD_prototype/           # Reference material (screenshots, spec doc)
+-- .github/workflows/       # GitHub Actions deploy pipeline
```

---

## Project Status

Migrating from vanilla JS to React 19 + TypeScript. See [PLAN.md](PLAN.md) for the full roadmap.

| Phase | Description | Status |
|-------|-------------|--------|
| Phase 1 | Scaffold (React 19, Vite 8, TypeScript, Tailwind v4) | Complete |
| Phase 2 | Data layer (types, services, context, hooks) | Complete |
| Phase 3 | App shell (nav, view routing, toast, about modal) | Complete |
| Phase 4 | Dashboard view (triad explorer, heatmap, charts, simulation) | Complete |
| Phase 5 | Input Studio (forms, validation, CRUD) | Next |
| Phase 6+ | AI features, onboarding, polish | Future |

**Current:** 77 tests passing, 12 dashboard components, full interactive dashboard.

---

## Documentation

| Document | Purpose |
|----------|---------|
| [PLAN.md](PLAN.md) | Build roadmap, phasing, PR strategy, risk register |
| [SPEC.md](SPEC.md) | Complete implementation spec -- data model, views, interactions, CSS system |
| [AUDIT_SECURITY_A11Y.md](AUDIT_SECURITY_A11Y.md) | Security and accessibility audit findings |
| [AUDIT_UX.md](AUDIT_UX.md) | UX review findings |
| [REVIEW_PRODUCT.md](REVIEW_PRODUCT.md) | Product manager review of the plan |
| [REVIEW_ENGINEERING.md](REVIEW_ENGINEERING.md) | Senior engineer review of the plan |
| [TEST_PLAN.md](TEST_PLAN.md) | Testing strategy and coverage targets |

---

## License

MIT
