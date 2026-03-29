# 🗺️ Context-Aware Workplace Modeler — Project Plan

## Document Info

| | |
|---|---|
| **Project** | Context-Aware Workplace Modeler |
| **Organization** | [smslo-ai](https://github.com/smslo-ai) |
| **Author** | @shaneslo |
| **Plan Version** | v1.0 |
| **Date** | 2026-03-29 |
| **Source Material** | `Context_Aware_Workplace_Modeler.html` (Gemini output) |

---

## Part 0: What We're Building (The North Star)

A **public, interactive, single-page web application** that models your workplace through three lenses — *Business Workflows*, *Systems & Infrastructure*, and *User Personas* — and visualizes how they relate to each other. Think of it as a personal "digital twin" of your work life that you can share in conversations, interviews, and with friends as a portfolio piece.

**What it is NOT:** A production SaaS app. It doesn't need user accounts, a database, or enterprise-grade infrastructure. It's a polished, public portfolio project that demonstrates your thinking about context engineering and workplace architecture.

---

## Part 1: Organization & Repository Setup

### 1.1 — Organization-Level Checklist

| Setting | Where to Find It | What to Do | Why |
|---|---|---|---|
| **GitHub Pages publishing** | Settings → Member Privileges → Pages creation | Ensure "Public" is checked | Allows repos to publish GitHub Pages sites |
| **Default repository permissions** | Settings → Member Privileges | Set to "Read" | Security habit — grant more on a per-repo basis |
| **Organization profile** | Settings → General → Profile | Add a description, URL, and avatar | Makes `github.com/smslo-ai` look professional |

### 1.2 — Create the New Repository

| Setting | Value | Why |
|---|---|---|
| **Name** | `context-modeler` | Short, descriptive, lowercase with hyphens |
| **Template** | `smslo-ai/zero-repo` | Inherits `.gitignore`, `LICENSE`, and `README` |
| **Visibility** | Public | Portfolio project |
| **License** | MIT (from template) | Already handled |

### 1.3 — Repository Settings After Creation

| Setting | Where | What to Do | Why |
|---|---|---|---|
| **Default branch** | Settings → General | Confirm `main` | Industry standard |
| **Features** | Settings → General | Enable Issues, disable Wiki & Projects | Issues = task tracker. Wiki/Projects add clutter. |
| **Branch protection** | Settings → Branches/Rulesets | Require PR before merging, restrict deletions, block force pushes | Forces the PR workflow habit |
| **GitHub Pages** | Settings → Pages | Source: "GitHub Actions" (configured in Phase 3) | Automated build-and-deploy pipeline |
| **Topics** | Repo page → About gear icon | `portfolio`, `context-engineering`, `workplace-modeling`, `dashboard` | Discoverability |
| **Description** | Repo page → About gear icon | "Interactive workplace ontology modeler — mapping workflows, systems, and user personas" | Shows in search results |

---

## Part 2: Tech Stack Decision

### 2.1 — Core Stack: Vanilla HTML/CSS/JS + Vite

| Tool | Purpose | Why This Choice |
|---|---|---|
| **Vite** | Build tool & dev server | Fast, minimal config, lets you split code into files and `import` them |
| **Tailwind CSS** | Styling (via npm, not CDN) | Already used in Gemini prototype; utility-first CSS |
| **Chart.js** | Charts (radar, bubble, doughnut) | Already used in prototype; covers all our chart needs |
| **Vanilla JavaScript** | Application logic | No framework to learn — just organized JS files |

### 2.2 — Libraries Removed from Gemini Prototype

| Library | Why Removed |
|---|---|
| **Plotly.js** | ~3MB overhead; Chart.js can do everything Plotly was doing |
| **marked.js** | Deferred to Phase 5 (AI features) |

### 2.3 — Hosting: GitHub Pages

- Free for public repos
- Code already on GitHub
- Custom domain support (e.g., `modeler.smslo.ai` later)
- If we need serverless functions (Phase 5), migrate to Vercel

---

## Part 3: Project Structure

```
context-modeler/
├── README.md                  ← Project documentation
├── PLAN.md                    ← This file — the master plan
├── LICENSE                    ← MIT
├── .gitignore                 ← From template + additions
├── package.json               ← Dependencies (Tailwind, Chart.js, etc.)
├── vite.config.js             ← Vite build configuration
├── tailwind.config.js         ← Tailwind customization
│
├── index.html                 ← Single HTML entry point
│
├── src/
│   ├── main.js                ← Entry point: imports everything, runs init
│   ├── style.css              ← Global styles + Tailwind directives
│   │
│   ├── data/
│   │   └── defaults.js        ← Default ontology data
│   │
│   ├── state/
│   │   ├── store.js           ← Central state management
│   │   └── storage.js         ← localStorage save/load
│   │
│   ├── views/
│   │   ├── dashboard.js       ← Dashboard view renderer
│   │   └── input-studio.js    ← Input Studio view renderer
│   │
│   ├── components/
│   │   ├── triad-explorer.js  ← Three-column ontology explorer
│   │   ├── heatmap.js         ← Cognitive friction heatmap
│   │   ├── charts.js          ← Chart.js setup (radar + bubble)
│   │   ├── insight-panel.js   ← "Active Context Analysis" panel
│   │   └── nav.js             ← Header navigation + view switching
│   │
│   └── utils/
│       ├── sanitize.js        ← Input sanitization (security)
│       └── friction.js        ← Deterministic friction calculation
│
├── public/
│   └── fonts/
│       └── inter-var.woff2    ← Self-hosted Inter font
│
└── .github/
    └── workflows/
        └── deploy.yml         ← GitHub Actions: build → deploy to Pages
```

---

## Part 4: Phased Build Plan

### Phase 0 — Local Environment Setup ✅ COMPLETE

| Step | Tool | Status |
|---|---|---|
| 0.1 | VS Code | ✅ Done |
| 0.2 | GitHub Desktop | ✅ Done |
| 0.3 | Node.js v24 via nvm | ✅ Done |
| 0.4 | Sign into GitHub Desktop | ✅ Done |
| 0.5 | Create repo from template | ✅ Done |
| 0.6 | Configure repo settings (features, merge, branch protection, topics) | ✅ Done |
| 0.7 | Clone repo & open in VS Code | ✅ Done |

### Phase 1 — Scaffolding & Recovery *(~1-2 PRs)*

**Goal:** Working project skeleton with extracted Gemini prototype code, rendering in the browser.

| Step | What | Deliverable | Status |
|---|---|---|---|
| 1.1 | ~~Create repo from template~~ | ~~Repo with `.gitignore`, `LICENSE`, `README`~~ | ✅ Done (Phase 0) |
| 1.2 | Initialize Vite + Tailwind + Chart.js | `package.json`, `vite.config.js`, `tailwind.config.js` | ⬜ Next |
| 1.3 | Extract clean HTML from Cocoa-encoded file | `index.html` with proper structure | ⬜ |
| 1.4 | Split monolith into file structure (Part 3) | All files in `src/` | ⬜ |
| 1.5 | Verify it runs locally with `npm run dev` | Working app in browser | ⬜ |
| 1.6 | Update `README.md` with real content | Professional README | ⬜ |

**PR #1:** "Initialize project with Vite, Tailwind, and Chart.js"
**PR #2:** "Extract and organize Gemini prototype into project structure"

### Phase 2 — Fix Bugs & Security *(~2-3 PRs)*

**Goal:** Fix everything broken or dangerous in the original code.

| Step | What | Why | Priority | Status |
|---|---|---|---|---|
| 2.1 | Add input sanitization to all `innerHTML` | XSS vulnerability | 🔴 Critical | ⬜ |
| 2.2 | Remove `apiKey` variable from client-side code | API key exposure | 🔴 Critical | ⬜ |
| 2.3 | Replace `Math.random()` in heatmap with deterministic scoring | Data is meaningless with random values | 🟡 Important | ⬜ |
| 2.4 | Implement `updateCharts()` (currently empty) | Charts never update from Input Studio | 🟡 Important | ⬜ |
| 2.5 | Fix context mode simulation (Triage/Focus/Fire) | Filtering logic incomplete | 🟡 Important | ⬜ |
| 2.6 | Add error handling to localStorage operations | App crashes if storage full/disabled | 🟢 Suggestion | ⬜ |

**PR #3:** "Fix XSS vulnerability and remove client-side API key"
**PR #4:** "Implement deterministic heatmap and wire up chart updates"
**PR #5:** "Complete context mode simulation logic"

### Phase 3 — Deployment Pipeline *(~1 PR)*

**Goal:** Auto-deploy to GitHub Pages on every push to `main`.

| Step | What | Status |
|---|---|---|
| 3.1 | Create `.github/workflows/deploy.yml` | ⬜ |
| 3.2 | Enable GitHub Pages (Source: GitHub Actions) | ⬜ |
| 3.3 | Verify site is live at `smslo-ai.github.io/context-modeler` | ⬜ |
| 3.4 | (Optional) Configure custom domain | ⬜ |

**PR #6:** "Add GitHub Actions deployment pipeline for Pages"

### Phase 4 — Polish & Portfolio Quality *(~2-3 PRs)*

**Goal:** Make it portfolio-worthy.

| Step | What | Status |
|---|---|---|
| 4.1 | Responsive design audit (mobile/tablet/desktop) | ⬜ |
| 4.2 | Loading states and empty states | ⬜ |
| 4.3 | Accessibility pass (keyboard nav, ARIA labels, contrast) | ⬜ |
| 4.4 | Performance audit (Lighthouse, lazy-load charts, font optimization) | ⬜ |
| 4.5 | "About" section or modal (project story, link to Gemini concept) | ⬜ |
| 4.6 | Data export/import (download/upload ontology as JSON) | ⬜ |
| 4.7 | Page metadata (Open Graph tags for social sharing) | ⬜ |

**PR #7:** "Responsive design and empty states"
**PR #8:** "Accessibility, performance, and social meta tags"
**PR #9:** "Add about section and data export/import"

### Phase 5 — AI Features *(~2-3 PRs, optional)*

**Goal:** Bring back AI analysis securely (requires backend).

**Recommended approach:** Migrate hosting to Vercel. Use serverless functions as a proxy to the AI API. API key lives in Vercel's encrypted environment variables.

| Step | What | Status |
|---|---|---|
| 5.1 | Set up Vercel project linked to repo | ⬜ |
| 5.2 | Create serverless function `/api/analyze` | ⬜ |
| 5.3 | Re-enable "✨ Analyze Logic" button | ⬜ |
| 5.4 | Re-enable "📜 Generate Prompt" button | ⬜ |
| 5.5 | Add `marked.js` for AI markdown rendering | ⬜ |
| 5.6 | Add rate limiting to serverless function | ⬜ |

**PR #10:** "Add Vercel serverless proxy for AI analysis"
**PR #11:** "Implement AI-powered context analysis and prompt generation"

---

## Part 5: Development Workflow

### The Golden Rule: Never Push Directly to `main`

Every change follows this cycle:

```
1. Create a branch    →  e.g., feature/heatmap-fix
2. Make your changes  →  edit files in VS Code
3. Commit often       →  in GitHub Desktop
4. Push the branch    →  in GitHub Desktop
5. Open a Pull Request on GitHub
6. Review the PR (read your own diff)
7. Merge the PR (squash merge)
8. GitHub Actions auto-deploys to Pages (Phase 3+)
```

### Branch Naming Convention

| Type | Pattern | Example |
|---|---|---|
| New feature | `feature/short-description` | `feature/data-export` |
| Bug fix | `fix/short-description` | `fix/heatmap-random` |
| Setup/infra | `chore/short-description` | `chore/vite-setup` |
| Documentation | `docs/short-description` | `docs/update-readme` |

### Commit Message Convention

Start with a verb. Keep it short.

- ✅ `Add input sanitization to prevent XSS`
- ✅ `Fix heatmap using random values`
- ✅ `Remove hardcoded API key from client-side code`
- ❌ `stuff`
- ❌ `updated things`

---

## Part 6: Risks & Open Questions

| # | Item | Status | Notes |
|---|---|---|---|
| 1 | Gemini shared links not accessible to Copilot | 🟡 Open | If those chats contain workflow data to model, paste the relevant parts into chat |
| 2 | Custom domain (`modeler.smslo.ai`) | 🟡 Open | Not blocking — using `smslo-ai.github.io/context-modeler` for now |
| 3 | AI provider choice (Gemini, OpenAI, Anthropic) | 🟡 Deferred | Phase 5 decision |
| 4 | Infographic file (`Context_Aware_Enterprise_Infographic.html`) | ⏸️ Parked | Can revisit as a separate "report" view later |
| 5 | Automated testing | 🟢 Accepted | Manual testing sufficient for portfolio scope |

---

## Summary: What Gets Built When

| Phase | Goal | PRs | Depends On | Status |
|---|---|---|---|---|
| **0 — Setup** | Tools + repo | — | — | ✅ Complete |
| **1 — Scaffolding** | Working project structure | #1, #2 | Phase 0 | ⬜ In Progress |
| **2 — Bug Fixes** | Secure, correct, complete | #3, #4, #5 | Phase 1 | ⬜ |
| **3 — Deployment** | Live on the internet | #6 | Phase 1 | ⬜ |
| **4 — Polish** | Portfolio-quality | #7, #8, #9 | Phase 2 | ⬜ |
| **5 — AI Features** | Smart analysis | #10, #11 | Phase 4 | ⬜ |

Phases 2 and 3 can happen **in parallel**.
