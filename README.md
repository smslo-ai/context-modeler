# Context-Aware Workplace Modeler

> Map your workplace as a connected system — model workflows, tools, and people to visualize context flow and friction.

**[→ Live Demo](https://smslo-ai.github.io/context-modeler/)**

| | |
|---|---|
| **Author** | [Shane Slosar](https://github.com/shaneslo) |
| **Organization** | [smslo-ai](https://github.com/smslo-ai) |
| **Started** | 2026 |
| **Version** | v1.0 (Portfolio-ready — Phases 1–4D complete) |
| **License** | MIT |

---

## What Is This?

Think of it as a "digital twin" of your work life. You define the workflows you deal with, the tools and systems you use, and the personas of people on your team. The app maps how they connect and shows where cognitive friction lives — where the wrong tool meets the wrong task.

Three simulation modes (Morning Triage, Deep Focus, Firefighting) let you see how the same workplace feels under different conditions. A friction heatmap highlights which workflow-system combinations cause the most pain.

Built as a portfolio project by Shane Slosar — a financial operations professional building AI fluency — demonstrating context engineering and workplace architecture thinking.

---

## Features

- **Ontology Explorer** — Three-column view of Workflows, Systems, and Personas with connection visualization
- **Friction Heatmap** — Semantic `<table>` showing workflow × system cognitive friction scores
- **Simulation Modes** — Morning Triage / Deep Focus / Firefighting context switching
- **Input Studio** — Add your own workflows, systems, and user personas
- **Data Export/Import** — Download and upload your ontology as JSON
- **Onboarding Tour** — 3-step guided intro for first-time visitors (replay with `?`)
- **Fully Accessible** — WCAG 2.1 AA, keyboard navigable, screen reader tested
- **Mobile Responsive** — Tab switcher on mobile, touch-friendly targets

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

| Phase | Status |
|-------|--------|
| Phase 0 — Setup | ✅ Complete |
| Phase 1 — Build from Spec (R1–R6) | ✅ Complete |
| Phase 2 — Interaction Wiring | ✅ Complete |
| Phase 3 — Deployment Pipeline | ✅ Complete — [Live on GitHub Pages](https://smslo-ai.github.io/context-modeler/) |
| Phase 4A — Responsive & Mobile | ✅ Complete |
| Phase 4B — Interaction Feedback | ✅ Complete |
| Phase 4C — Accessibility (WCAG 2.1 AA) | ✅ Complete |
| Phase 4D — Portfolio Story & Onboarding | ✅ Complete |
| Phase 5 — AI Features | 🔜 Planned (see PLAN.md Part 7) |

**Test coverage:** 91 tests passing across 11 test files  
**Bundle size:** 97KB gzipped (300KB JS + 38KB CSS)

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
