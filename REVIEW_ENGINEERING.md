# Engineering Review: Context-Aware Workplace Modeler

**Reviewer:** Backend Architect Agent
**Date:** 2026-03-29
**Documents Reviewed:** PLAN.md (v2.0), SPEC.md (v1.0), AUDIT_SECURITY_A11Y.md, AUDIT_UX.md, package.json, vite.config.js
**Current Project State:** Scaffolded Vite project with default template files (counter.js, placeholder main.js). No application code written yet.

---

## APPROVAL STATUS: APPROVED WITH CONDITIONS

The plan is thorough, well-phased, and demonstrates strong architectural thinking for a portfolio-scope project. The audit findings have been incorporated intelligently. Three blocking issues must be addressed before implementation begins (see Required Changes below). The remaining recommendations improve implementation speed and reduce rework risk.

---

## ARCHITECTURE ASSESSMENT: Sound

### 1. Vanilla JS vs. Lightweight Framework

**Verdict: Vanilla JS is the right call, with one caveat.**

The project has 14 nodes, 2 views, 3 simulation modes, and a handful of interactive components. This is well within the complexity threshold where vanilla JS stays manageable. A framework would add bundle weight, learning curve overhead, and obscure the "I understand fundamentals" signal that a portfolio project should send.

The caveat: the spec describes ~12 components that all read from and write to a shared store, each re-rendering DOM segments on state change. This is a manual implementation of what React/Preact/Lit do automatically. The risk is not that it cannot work -- it is that the re-render coordination logic in store.js will become the hardest code in the project to debug. If any component forgets to subscribe, or subscribes incorrectly, the UI drifts from state silently.

**Mitigation (not a blocker):** Define a strict convention in store.js: every state mutation calls a `notify(eventName)` function, and every component registers exactly one listener per event it cares about. Document this contract in a code comment at the top of store.js.

### 2. Module Structure and Circular Dependency Risk

The dependency graph in SPEC Section 1.4 is clean and acyclic. Every module flows downward from main.js. The one risk point is store.js being imported by nearly every component -- this is a hub dependency, not a circular one. Acceptable.

**One structural gap:** There is no `events.js` or enum file defining the event names that store.js emits and components listen for. If event names are string literals scattered across files, typos cause silent failures. Define event name constants in a single file.

### 3. Data Model Design

The contextMap adjacency list and frictionRules keyed by `workflowId::systemId` are sound for this scale. The `::` separator is unambiguous because node IDs are restricted to `[a-z0-9-]`. The bidirectional contextMap (each node lists its connections, and the reverse is also listed) is redundant but correct for O(1) lookups in both directions at this scale.

**localStorage vs. IndexedDB:** localStorage is correct here. The data ceiling is ~14-100 nodes (per the validation cap), each under 1KB. Total payload stays well under localStorage's 5MB limit. IndexedDB would add async complexity for zero benefit at this scale.

**One concern:** The data model uses parallel arrays (workflows[], systems[], personas[]) with cross-references by string ID. When a node is deleted (Phase 4B.9), all references to that ID must be cleaned from contextMap, frictionRules, and linkedSystems/linkedWorkflows/linkedUsers arrays on other nodes. The plan does not call out this cascading delete logic. This is the most bug-prone operation in the entire project.

---

## TECHNICAL RISKS (ordered by likelihood x impact)

| # | Risk | Likelihood | Impact | Mitigation |
|---|------|-----------|--------|------------|
| 1 | **Re-render coordination bugs** -- components get out of sync with store state | High | Medium | Strict event contract in store.js. Consider a `renderAll()` fallback for debugging. |
| 2 | **Cascading delete corruption** -- removing a node leaves orphan references | High | High | Build a `removeNode(id)` function that scans all data structures. Write explicit tests for this. |
| 3 | **Vite base URL misconfiguration for GitHub Pages** | Medium | High | See Required Changes #1. |
| 4 | **Tailwind v4 breaking changes** -- v4 is CSS-first, most tutorials/examples online are v3 | Medium | Medium | Pin exact version. Test that `@tailwindcss/vite` plugin works with the classes used in spec. Some v3 config patterns (tailwind.config.js `theme.extend`) work differently in v4. |
| 5 | **Chart.js bundle size bloat** -- importing all of Chart.js for 2 charts | Medium | Low | Tree-shake by importing only needed controllers/elements (see Dependency Recommendations). |
| 6 | **CSP meta tag blocks Chart.js canvas** | Low | High | Test CSP with Chart.js early in Phase 1. Canvas rendering should be fine, but chart tooltip CSS may need `'unsafe-inline'` for style-src. |
| 7 | **DOMPurify not in current package.json** | Certain | Low | Listed in the plan but not yet installed. Add before Phase 1 code begins. |

---

## REQUIRED CHANGES (blocking -- fix before implementation)

### RC-1: Add `base` to vite.config.js for GitHub Pages

The current vite.config.js has no `base` property. GitHub Pages serves this project at `https://smslo-ai.github.io/context-modeler/`. Without `base: '/context-modeler/'`, all asset paths in the production build will resolve to the domain root, causing 404s for JS, CSS, and font files.

```javascript
export default defineConfig({
  base: '/context-modeler/',
  plugins: [tailwindcss()],
})
```

This is a silent deployment-breaking bug. The dev server works fine without it (runs at root), so it will not surface until the first GitHub Pages deploy.

**Alternative:** If a custom domain is used (`modeler.smslo.ai`), `base` should be `'/'`. Make this configurable via an environment variable or document the change needed when switching hosting.

### RC-2: Install DOMPurify now, not later

The plan references DOMPurify in Phase 1 (step 1.7: "sanitized output") and the security audit elevates it to Phase 1. But the current `package.json` does not include it. Install it before any component code is written:

```bash
npm install dompurify
```

Also add its type stubs if JSDoc type hints are used: `npm install -D @types/dompurify`.

### RC-3: Define event constants before building components

Before PR #3 (store.js implementation), create an `src/constants/events.js` file that exports all event names as constants:

```javascript
export const EVENTS = {
  STATE_CHANGED: 'state:changed',
  VIEW_CHANGED: 'view:changed',
  MODE_CHANGED: 'mode:changed',
  NODE_SELECTED: 'node:selected',
  NODE_ADDED: 'node:added',
  NODE_REMOVED: 'node:removed',
  DATA_RESET: 'data:reset',
};
```

Without this, string-based event names scattered across 10+ files will produce hard-to-debug subscription misses. This is a 15-minute task that prevents hours of debugging.

---

## RECOMMENDED CHANGES (non-blocking improvements)

### REC-1: Tailwind v4 configuration approach

The project has a `tailwind.config.js` file, but Tailwind v4 uses a CSS-first configuration model. The `@tailwindcss/vite` plugin (v4) reads configuration from the CSS file (`@theme` directive), not from `tailwind.config.js`. The config file is supported via a compatibility layer (`@config` directive in CSS), but relying on it means fighting the v4 grain.

**Recommendation:** Move design tokens (colors, fonts, spacing) into `src/style.css` using `@theme` blocks, and remove `tailwind.config.js` unless the compatibility layer is specifically needed. Test this early -- the spec's color palette, font stack, and custom classes should all be defined in CSS under v4's model.

### REC-2: Chart.js tree-shaking

The full Chart.js bundle is ~200KB minified. For 2 charts (radar + bubble), only a subset of controllers, elements, and plugins is needed. Use the explicit registration pattern:

```javascript
import { Chart, RadarController, BubbleController, RadialLinearScale,
         LinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from 'chart.js';

Chart.register(RadarController, BubbleController, RadialLinearScale,
               LinearScale, PointElement, LineElement, Filler, Tooltip, Legend);
```

This reduces the Chart.js contribution to the bundle by roughly 40-50%. Worth doing in PR #1 since it costs nothing extra.

### REC-3: Lazy-load charts

Charts are below the fold on all viewport sizes. Wrap chart initialization in an IntersectionObserver:

```javascript
const observer = new IntersectionObserver((entries) => {
  if (entries[0].isIntersecting) {
    initCharts();
    observer.disconnect();
  }
}, { rootMargin: '200px' });
observer.observe(document.getElementById('charts-section'));
```

This eliminates Chart.js parse/execute cost from initial page load. Meaningful for a portfolio project where first-paint speed matters.

### REC-4: Heatmap rendering -- use a `<table>` element

The spec describes the heatmap as a CSS Grid of `<div>` elements. A heatmap is semantically a data table (rows = systems, columns = workflows, cells = friction scores). Using `<table>` gives:

- Free keyboard navigation (Tab through cells)
- Screen reader row/column header association
- Simpler accessibility implementation (fewer ARIA attributes needed)
- The table can still be styled with Tailwind -- `border-collapse`, cell padding, background colors all work

This would simplify 3-4 accessibility tasks in Phase 4C (A11Y-01, A11Y-03 for heatmap cells) and produce better HTML semantics for the portfolio.

### REC-5: Add cascading delete logic to the node removal spec

Phase 4B.9 adds node edit/delete. The plan does not specify what happens to:

- contextMap entries referencing the deleted node
- frictionRules entries containing the deleted node's ID
- linkedSystems/linkedWorkflows/linkedUsers arrays on other nodes

Define a `removeNode(id)` function that:
1. Removes the node from its array (workflows/systems/personas)
2. Removes the node's key from contextMap
3. Removes the node's ID from all other contextMap value arrays
4. Removes any frictionRules entries containing the node's ID (split on `::`)
5. Removes the node's ID from all linked arrays on other nodes
6. Persists to localStorage
7. Triggers full re-render

This is the highest-risk logic in the project. Spec it before building it.

### REC-6: Self-host the Inter font with `font-display: swap`

The plan shows `public/fonts/inter-var.woff2` which is correct. Verify the `@font-face` declaration in style.css includes `font-display: swap` and a `unicode-range` subset if only Latin characters are needed. This prevents the font from blocking first paint.

### REC-7: GitHub Actions deploy.yml specifics

The deploy.yml needs these Vite-specific settings:

```yaml
- name: Build
  run: npm run build
  env:
    NODE_ENV: production

- name: Upload artifact
  uses: actions/upload-pages-artifact@v3
  with:
    path: dist  # Vite outputs to dist/, not build/
```

Common mistake: using `build/` (CRA convention) instead of `dist/` (Vite convention). Also ensure the workflow uses `actions/deploy-pages@v4` and has the `id-token: write` permission for Pages deployment.

---

## DEPENDENCY RECOMMENDATIONS

| Dependency | Action | Rationale |
|---|---|---|
| `chart.js ^4.5.1` | **Keep** -- use tree-shaken imports | Adequate for radar + bubble. No lighter alternative covers both chart types with comparable quality. |
| `@tailwindcss/vite ^4.2.2` | **Keep** -- pin in package-lock.json | v4 is stable enough. The CSS-first config is actually simpler for this project. Monitor for minor version fixes. |
| `tailwindcss ^4.2.2` | **Keep** | Required peer of `@tailwindcss/vite`. |
| `vite ^8.0.1` | **Keep** | Correct build tool choice. |
| `dompurify` | **Add immediately** | Referenced in plan Phase 1 but missing from package.json. Security-critical. |
| `marked` (Phase 5) | **Replace with `marked` + strict config, or consider `markdown-it`** | `marked` is fine if configured with DOMPurify. `markdown-it` offers plugin-based control but similar bundle size. Either works. The key control is the DOMPurify allowlist, not the parser choice. |
| Testing library | **Add `vitest`** | See Testing Recommendations. Vitest integrates natively with Vite -- zero config overhead. |

---

## TESTING RECOMMENDATIONS

### "Manual testing sufficient" -- partially disagree

Manual testing is adequate for visual layout, responsive behavior, and subjective UX quality. It is **not** adequate for:

1. **Data integrity during node add/delete operations** -- The cascading reference updates across contextMap, frictionRules, and linked arrays are the highest-risk logic in the project. A manual tester cannot verify that all cross-references were updated correctly without inspecting localStorage JSON.

2. **State management event subscriptions** -- If a component stops receiving updates after a refactor, the bug is silent. Manual testing only catches it if someone happens to test that exact interaction sequence.

3. **Schema validation on localStorage load** -- The validate.js function is a security boundary. It must reject malformed data and accept valid data. This is pure logic with zero UI -- perfect for unit tests.

4. **Friction score calculation** -- The `frictionRules` lookup with default fallback is deterministic math. One test file ensures it stays correct through refactors.

### Recommended testing scope

Install `vitest` (already Vite-native, zero additional config):

```bash
npm install -D vitest
```

Write tests for these 4 modules only (~50-80 lines total):

| Module | What to test | Est. effort |
|---|---|---|
| `utils/validate.js` | Accepts valid schema, rejects missing fields, rejects oversized strings, rejects unknown enum values | 30 min |
| `utils/friction.js` | Returns correct score for known pair, returns 0.5 default for unknown pair, handles edge cases | 15 min |
| `state/store.js` | addNode updates all data structures, removeNode cascades correctly, state reset returns to defaults | 45 min |
| `data/context-map.js` | Bidirectional consistency -- if A lists B, B lists A | 15 min |

Total investment: ~2 hours. Return: catches the two most likely production bugs (corrupted data after delete, invalid localStorage causing crash on load).

---

## PR GRANULARITY ASSESSMENT

### Current plan: 14 PRs -- verdict: well-scoped

The PR breakdown is reasonable. Each PR has a clear goal and testable deliverable. A few observations:

**PR #1 and #2 (Phase 1) could merge into one PR.** PR #1 is "init project with config files and data model" -- this is a handful of static JS files with no UI. PR #2 is "build both views." Neither is meaningful without the other. Combined, this would be a medium-sized PR (maybe 15-20 files) that delivers the first visual milestone. Merging avoids a PR that is just config + data with nothing to visually review.

**PRs #3, #4, #5 (Phase 2) are well-split.** State management (#3) must land before interactions (#4, #5). Good dependency ordering.

**PRs #7-#10 (Phase 4A-4D) are correctly granular.** The audit recommended splitting Phase 4 into sub-phases, and the plan adopted this. Each PR has a focused theme (responsive, feedback, accessibility, story). Correct call.

**PRs #11-#14 (Phase 5) may be premature to spec at this granularity.** Phase 5 depends on AI provider choice, Vercel setup, and API design decisions that will be clearer after Phase 4. Recommend keeping Phase 5 as "3-4 PRs, scope TBD" rather than locking in the exact split now.

---

## MIGRATION PATH ASSESSMENT (to framework / Vercel)

### Vanilla JS to React/Next.js -- moderate difficulty

The plan's module structure (components/, views/, state/, utils/, data/) maps cleanly to a React project structure. Each component file renders a DOM subtree from state -- converting to a React component means wrapping the render logic in JSX and replacing event listener wiring with React event handlers.

**What helps migration:**
- Clean separation of data (data/), state (state/), and rendering (components/, views/)
- Centralized store pattern -- maps to React Context or Zustand
- Deterministic rendering from state -- same mental model as React

**What complicates migration:**
- Direct DOM manipulation (`document.getElementById`, `innerHTML`) must be replaced with refs or state-driven rendering
- Event listener registration patterns differ fundamentally
- Chart.js integration needs `react-chartjs-2` wrapper or ref-based approach

**Recommendation:** No changes needed to the current architecture to facilitate migration. The clean module boundaries are sufficient. If migration is likely, avoid deeply nested DOM manipulation chains in component code -- prefer building HTML strings from data and assigning to a single container (which is what the spec already does).

### GitHub Pages to Vercel -- straightforward

Phase 5 already plans this. The only preparation needed in Phases 1-4:
- Use relative asset paths (Vite handles this with `base` config)
- Keep the CSP meta tag approach flexible (will switch to response headers on Vercel)
- Do not hardcode `smslo-ai.github.io` anywhere in the application code

---

## SECURITY IMPLEMENTATION ASSESSMENT

### DOMPurify + CSP + schema validation -- is it complete?

For a portfolio project with no user accounts, no server-side data, and no third-party scripts, this security stack is **complete and appropriate**. The audit was thorough.

**One gap the audit did not call out:** The CSP meta tag specifies `script-src 'self'`, which is correct. But Vite in development mode injects inline scripts for HMR (hot module replacement). The dev server will break with this CSP.

**Fix:** Only apply the CSP meta tag in production builds. Use a Vite plugin or conditional HTML:

```javascript
// vite.config.js
export default defineConfig({
  plugins: [
    tailwindcss(),
    {
      name: 'inject-csp',
      transformIndexHtml(html, ctx) {
        if (ctx.server) return html; // skip in dev
        return html.replace(
          '</head>',
          `<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self';">\n</head>`
        );
      }
    }
  ],
})
```

This ensures CSP protects the production site without breaking the dev workflow.

### Phase 5 security -- adequately specified

Rate limiting via Upstash Redis, origin checks, DOMPurify allowlist for AI responses, and spend caps cover the attack surface for a portfolio project's serverless AI proxy. The audit's recommendations are solid. No additional gaps identified.

---

## SUMMARY

| Category | Verdict |
|---|---|
| Architecture | Sound -- vanilla JS is correct for scope, module structure is clean |
| State Management | Adequate with the event constants addition (RC-3) |
| Build & Deploy | Blocked by missing `base` config (RC-1) |
| Dependencies | DOMPurify must be installed (RC-2); Chart.js tree-shaking recommended |
| Performance | Acceptable; lazy-load charts for polish |
| Data Model | Sound for current scale; cascading delete needs explicit spec (REC-5) |
| Testing | Add vitest with ~4 targeted test files (~2 hours investment) |
| Migration Path | Clean separation makes framework migration moderate effort |
| PR Granularity | Well-scoped; consider merging PRs #1 and #2 |
| Security | Complete for portfolio scope; add dev-mode CSP bypass |

**Bottom line:** Fix the three required changes (vite base URL, install DOMPurify, define event constants), then proceed with Phase 1 implementation. The plan is solid.
