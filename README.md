# Context-Aware Workplace Modeler

> An interactive single-page application that models your workplace through three lenses -- Business Workflows, Systems & Infrastructure, and User Personas -- and visualizes how they relate.

| | |
|---|---|
| **Author** | [Shane Slosar](https://github.com/shaneslo) |
| **Organization** | [smslo-ai](https://github.com/smslo-ai) |
| **Started** | 2026 |
| **Version** | v1.0 (Portfolio-Ready) |
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
| **Vanilla JavaScript** | Application logic (no framework) |
| **Vite** | Build tool and dev server |
| **Tailwind CSS v4** | Styling |
| **Chart.js** | Radar and bubble chart visualizations |
| **DOMPurify** | HTML sanitization |

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

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Other Commands

```bash
npm run build     # Production build to dist/
npm run preview   # Preview production build locally
npx vitest        # Run unit tests
```

---

## Project Structure

```
context-modeler/
|-- PLAN.md              # Phased build plan (v3.0)
|-- SPEC.md              # Implementation-ready specification
|-- index.html           # Single HTML entry point
|-- src/
|   |-- main.js          # Entry point
|   |-- style.css        # Global styles + Tailwind
|   |-- constants/       # Event name constants
|   |-- data/            # Default ontology data, context map, friction rules
|   |-- state/           # Central store + localStorage persistence
|   |-- views/           # Dashboard and Input Studio renderers
|   |-- components/      # Triad explorer, heatmap, charts, nav, modals
|   +-- utils/           # Sanitization, validation, friction calculation
|-- OLD_prototype/       # Reference material (screenshots, spec doc, infographic)
+-- .github/workflows/   # GitHub Actions deploy pipeline
```

---

## Project Status

See [PLAN.md](PLAN.md) for the full phased roadmap.

| Phase | Status |
|-------|--------|
| Phase 0 -- Setup | ✅ Complete |
| Phase 1 -- Build from Spec | ✅ Complete |
| Phase 2 -- Wire Interactions | ✅ Complete |
| Phase 3 -- Deployment | ✅ Complete |
| Phase 4A-D -- Polish & Portfolio | ✅ Complete |
| **Portfolio-Ready Milestone** | **✅ 91 tests · WCAG 2.1 AA** |
| Phase 5 -- AI Features | Future (see PLAN.md Part 7) |

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

---

## License

MIT
