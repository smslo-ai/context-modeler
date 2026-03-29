# Lessons Learned — Multi-Agent SPA Build Session

**Date:** 2026-03-29  
**Session duration:** ~1 session  
**Starting state:** Vite counter demo scaffold  
**Ending state:** Portfolio-ready SPA, live at https://smslo-ai.github.io/context-modeler/

---

## A. What the Agents Accomplished

| Wave | Agent(s) | Output |
|---|---|---|
| 1 — Foundation | Frontend Developer | Tailwind v4 CSS-first config, DOMPurify wiring, SPA shell, event constants, 11 tests |
| 2 — Data/State | Backend Architect | 14-node ontology, full event-driven store with cascading delete, heuristics engine, 59 tests |
| 3A — Components | Frontend Developer | Semantic heatmap `<table>`, tree-shaken Chart.js, triad explorer, nav — 82 tests |
| 3B — CI/CD | DevOps Automator | GitHub Actions test→build→deploy pipeline, 404 SPA redirect |
| 4 — Views | Frontend Developer | Full dashboard + input studio views, complete app bootstrap — 91 tests |
| 5A — Responsive | Frontend Developer | Mobile tab switcher, toast system, empty states, form validation UX |
| 5B — Accessibility | Accessibility Auditor | WCAG 2.1 AA: focus rings, contrast fixes, dialog roles, ARIA live regions, sr-only chart tables |
| 6 — Portfolio | Frontend Developer | 3-step onboarding tour, About modal, hero rewrite, OG tags, data export/import |
| 7 — QA | task + code-review | 3 real bugs found and fixed (see below) |

**Final metrics:** 91/91 tests ✅ · 97KB gzipped ✅ · Zero build warnings ✅ · Zero hardcoded secrets ✅ · Live on GitHub Pages ✅

---

## B. What Went Well

### Expected wins
- **Parallel wave execution** worked perfectly. Waves 3A+3B, 5A+5B ran concurrently with no conflicts — the module boundary (components never import views) made this safe.
- **TDD discipline held.** Each wave wrote tests before implementation. The 91-test suite caught real regressions when Wave 7 fixes landed.
- **The code-review agent was the highest-value agent in the fleet.** It found 3 bugs that the functional tests missed — exactly what a final code review is for.
- **CSP in production only** (Vite HMR needs inline scripts) — this architectural decision from Wave 1 paid off; no CI failures or console errors.

### Unexpected wins
- **Wave 3B (DevOps) was the fastest wave by far** — clean deploy pipeline in one shot. GitHub Actions just worked.
- **The `buildCheckboxList` XSS fix** was elegant — the code-review agent correctly identified that the bug was latent (only exploitable once the import fix landed) and caught the two-bug chain together.
- **Accessibility wave produced zero test regressions** — the sr-only chart tables and ARIA attributes were additive changes with no side effects.
- **The cascade delete fix** (`includes()` → `startsWith/endsWith`) is a subtle correctness bug that would have only appeared in the wild when a user created a node whose ID was a prefix of a default node's ID. It would have been very hard to debug post-deployment.

### Funny/notable
- The entire project went from "blank Vite counter demo" to "live on GitHub Pages" before the user's session ended — including discovering the GitHub Pages wasn't enabled yet and handling the re-run in real time.
- The Wave 7 code-review agent found that the import feature was completely broken (data validated then silently discarded) — the import button showed a "Data imported successfully" toast while doing nothing. This would have been humiliating to discover in a portfolio demo.

---

## C. What Did Not Go Well

### Expected friction
- **No commits during the build** — all 7 waves were built without a single git commit. This created a large single-session diff that had to be reconstructed into per-wave commits at the end. The commit messages are accurate but not verified against actual diffs. A better process would commit after each wave.
- **jsdom limitations** — Chart.js canvas rendering, `window.scrollIntoView`, and CSS breakpoints cannot be tested in jsdom. This means the responsive behavior, chart rendering, and scroll-to-focus patterns are untested at the unit level. Manual browser testing is required.

### Unexpected friction
- **Branch protection blocked the push to main** — the plan explicitly said "never push directly to main" but the commit strategy assumed a direct push for simplicity. Had to pivot to a feature branch + PR mid-stream. This is correct behavior but wasn't accounted for in the commit workflow.
- **GitHub Pages wasn't enabled in repo settings** — the deploy workflow was perfect, but the deployment target didn't exist. A one-time manual step (Settings → Pages → Source: GitHub Actions) is required before any deploy can succeed. This isn't automatable via CLI.
- **Wave 6 and Wave 7 bugs landed in the same commit** — because `git add -u` staged all tracked modified files at once, the Wave 7 store/input-studio fixes ended up in the Wave 5 commit. The per-wave commit history is approximate, not exact.

### Important gaps remaining
- **AI features (Phase 5) are entirely locked** — all 5 AI buttons are disabled. The architecture decision (client-side vs. serverless proxy, which provider) hasn't been made.
- **Charts show static data** — the radar and bubble charts use hardcoded values from the infographic, not the user's ontology. This is labeled with a disclaimer but still looks disconnected.
- **No node edit capability** — users can add and delete nodes but cannot edit existing ones. A typo requires a reset.
- **No dark mode** — the design assumes light theme throughout.

---

## D. Top 3 Improvements for Next Session

### 1. Commit after every wave (not at the end)
The current commit history is reconstructed approximations. A better workflow:
- After each wave agent completes and tests pass, immediately run the commit before dispatching the next wave.
- The orchestrator (Copilot CLI) should add this as a mandatory step between waves.
- This also creates natural checkpoints to catch problems early.

### 2. Pre-enable GitHub Pages before any CI/CD wave
Add a pre-flight check to the orchestration plan: verify GitHub Pages is configured before Wave 3B runs. Or add a step to the deploy workflow that outputs a clear diagnostic if Pages isn't configured, rather than a cryptic 404.

### 3. Browser-level integration test (Playwright/Puppeteer) for one happy-path flow
jsdom cannot test the most important user flows: adding a node and seeing it appear in the heatmap, switching simulation modes, or the onboarding tour. A single Playwright test file covering:
- Add workflow → appears in explorer and heatmap
- Switch mode → explorer cards update
- Export JSON → re-import → data matches  
...would give the same confidence level for UI behavior that vitest gives for logic.

---

## E. Feedback for Shane

### What you did well in preparation
- **The spec documents were exceptional.** `SPEC.md`, `PLAN.md` (v3.0), `AUDIT_SECURITY_A11Y.md`, and `AUDIT_UX.md` were the most complete pre-work I've seen. Agents could make decisions independently because the spec answered nearly every "what should this do?" question without needing to ask. This is the single biggest reason the session moved fast.
- **You pre-defined the architecture constraints** (DOMPurify mandatory, heatmap must be `<table>`, Chart.js tree-shaken, no framework). These non-negotiables prevented agents from going off in wrong directions.
- **You had already done the multi-agent audit cycle** (product review, engineering review, UX review, security review) before the build started. Agents didn't need to do discovery — they executed against known findings.
- **Autopilot / fleet mode** — letting the orchestration run without interrupting between waves was the right call. The agents moved faster with no back-and-forth.

### What you can do better next time
- **Decide the Phase 5 architecture before the session ends.** The 5 architecture questions (provider, key security, which features first, streaming, cost guardrail) are blocking. A 10-minute decision now saves a full planning wave later.
- **Provide one canonical "current state" description at the start.** The session recovered context from PLAN.md, SPEC.md, and scattered audit docs — but a single `CURRENT-STATE.md` with "here's what's built, here's what's broken, here's what I personally observed in browser testing" would let agents skip the discovery phase entirely.
- **Do the manual testing checklist before the next session.** The items listed in the Phase 7 handoff (onboarding tour, heatmap clicking, mobile, export/import, reset) need a human in a browser. Agent output is only as good as the feedback loop — and right now we don't know if the friction modal works or if the simulation mode visuals look right.
- **Add screenshots to the README** before sharing the live link. A portfolio without a screenshot depends on the viewer clicking through. Most won't.

### How to help agents be more successful
- **MCP tools that would have helped:**
  - A browser automation tool (Playwright MCP) would let agents verify their own work in a real browser. Currently agents finish "blind" — they can run unit tests but can't see what the page looks like.
  - A GitHub Pages status check tool would have caught the missing Pages configuration before deployment.
- **Better prompts:** Each wave prompt was comprehensive but could benefit from a "Definition of Done" checklist at the top (not just at the bottom). Agents occasionally missed steps because they were buried after 500 words of context.
- **Explicit "don't do this" constraints in agent prompts** work better than "prefer X." "Never use `innerHTML` with user data" is more actionable than "use sanitization where appropriate."

### Questions for Shane
1. **How did the live site feel to you as a user?** Did the onboarding tour fire correctly? Did clicking heatmap cells do anything visible? Your browser observations are the ground truth that agents can't provide.
2. **What's your timeline for Phase 5?** The AI features are the differentiator that makes this more than a generic dashboard. Is this weeks or months away?
3. **Do you want the charts to reflect real ontology data before Phase 5?** It's possible to wire the radar/bubble to calculate values from the actual node data (not hardcoded). This would make the charts feel alive without needing AI.
4. **How are you thinking about the "Shane's actual workplace" version?** Right now the default data is a fictional generic workplace. Replacing it with your real workflows, systems, and personas would make the portfolio story much more personal and compelling.
5. **Did anything in the app feel wrong or off to you?** Something looked beautiful but felt broken, or something you expected to be interactive wasn't?

---

## F. User Feedback (Session Close, 2026-03-29)

> *"The live site feels excellent. The debugging/iterating is not (to my 'feel') performance related. Super smooth."*

**Interpretation:** Performance is not the issue with the add/edit/iterate UX — the app feels fast. The friction is in the *workflow* of debugging and iterating (no node edit, no undo, reset is all-or-nothing). This confirms the gap is **CRUD completeness**, not rendering speed.

**Implication for Phase 5 planning:**
- Prioritize **node edit capability** (UX-7.3) before AI features — it affects every demo interaction
- The smooth performance baseline means AI streaming responses (token-by-token) will feel natural, not laggy
- No need to optimize bundle size or add lazy loading before Phase 5

---

*This document was generated at session close on 2026-03-29. User feedback appended same session.*
