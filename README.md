# Context-Aware Workplace Modeler

> An interactive single-page application that models your workplace through three lenses -- Business Workflows, Systems & Infrastructure, and User Personas -- and visualizes how they relate.

| | |
|---|---|
| **Author** | [Shane Slosar](https://github.com/shaneslo) |
| **Organization** | [smslo-ai](https://github.com/smslo-ai) |
| **Started** | 2026 |
| **Version** | v2.0 (React Migration) |
| **License** | MIT |
| **Live Site** | [smslo-ai.github.io/context-modeler](https://smslo-ai.github.io/context-modeler/) |

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
| **Motion** | Entrance animations with reduced-motion support |
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
|   |   |-- input-studio/    # Input Studio (forms, CRUD, import/export)
|   |   |-- nav/             # Navigation header
|   |   |-- shared/          # Toast, AboutModal
|   |   +-- ui/              # shadcn primitives (Button, Dialog, Badge, etc.)
|   +-- utils/               # Sanitization, heuristics, class merging
|-- docs/                    # Planning docs, specs, audits, reviews
|-- legacy/                  # Archived vanilla JS + prototype (reference only)
+-- .github/workflows/       # GitHub Actions deploy pipeline
```

---

## Project Status

Migrating from vanilla JS to React 19 + TypeScript. See [docs/PLAN.md](docs/PLAN.md) for the full roadmap.

| Phase | Description | Status |
|-------|-------------|--------|
| Phase 1 | Scaffold (React 19, Vite 8, TypeScript, Tailwind v4) | Complete |
| Phase 2 | Data layer (types, services, context, hooks) | Complete |
| Phase 3 | App shell (nav, view routing, toast, about modal) | Complete |
| Phase 4 | Dashboard view (triad explorer, heatmap, charts, simulation) | Complete |
| Phase 5 | Input Studio (forms, validation, CRUD) | Complete (verified) |
| Phase 6 | Polish & Verification | Next |
| Phase 7+ | AI features, onboarding | Future |

**Current:** 151 tests passing across 17 files. Phase 6 complete -- React migration verified against live deployment.

---

## Documentation

| Document | Purpose |
|----------|---------|
| [docs/PLAN.md](docs/PLAN.md) | Build roadmap, phasing, PR strategy, risk register |
| [docs/SPEC.md](docs/SPEC.md) | Complete implementation spec -- data model, views, interactions, CSS system |
| [docs/AUDIT_SECURITY_A11Y.md](docs/AUDIT_SECURITY_A11Y.md) | Security and accessibility audit findings |
| [docs/AUDIT_UX.md](docs/AUDIT_UX.md) | UX review findings |
| [docs/REVIEW_PRODUCT.md](docs/REVIEW_PRODUCT.md) | Product manager review of the plan |
| [docs/REVIEW_ENGINEERING.md](docs/REVIEW_ENGINEERING.md) | Senior engineer review of the plan |
| [docs/TEST_PLAN.md](docs/TEST_PLAN.md) | Testing strategy and coverage targets |

---

## License

MIT
