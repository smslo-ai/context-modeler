# Spec Drift Record

Documents the 5 categories of divergence between SPEC.md v1.0 and the Gemini Canvas prototype, identified during the Gemini analysis session (Mar 29, 2026). Notes which issues were resolved during implementation and which remain as intentional design decisions.

---

## 1. AI Integration Reality vs. Spec

**Gemini finding:** SPEC.md Section 7 described all AI features as "Phase 5 placeholders" relying on a `showAIStub()` function. The prototype had live, fully implemented Gemini API calls (`triggerAIAnalysis()`, `triggerAIPromptGen()`, `analyzeFriction()`, `generateScenario()`) with client-side API keys.

**Resolution:** The production codebase correctly deferred AI to Phase 5. AI buttons exist in the dashboard but are disabled with "AI -- Phase 5" tooltips. No API calls, no client-side keys, no `showAIStub()`. The `marked` dependency is installed but the rendering pipeline (`sanitize.js:renderMarkdown`) is ready for Phase 5 integration.

**Status:** Resolved. Intentional design decision to ship portfolio-ready without AI, then decide on architecture (pre-written responses vs. serverless proxy) based on real feedback.

---

## 2. Data Model Enums

**Gemini finding:** The spec used `operational` and `ad-hoc` as WorkflowType values and kebab-case PersonaState strings (`reactive-firefighter`, `deep-focus-architect`). The prototype used different casing: `Technical`, `Collaborative`, `Critical`, `Routine`, `Strategic` (title case) and persona states like `High Load`, `Flow`, `Routine`, `Social`.

**Resolution:** The codebase uses **lowercase** enum values matching the spec's intent but with consistent casing:
- WorkflowTypes: `critical`, `routine`, `strategic`, `operational`, `ad-hoc`
- PersonaStates: `reactive-firefighter`, `deep-focus-architect`, `process-admin`, `bridge-builder`
- SystemCategories: `storage`, `comms`, `intelligence`, `tracking`, `reporting`

The prototype's title-case values were a Gemini Canvas convention, not a deliberate schema choice.

**Status:** Resolved. Codebase uses spec-aligned lowercase/kebab-case consistently.

---

## 3. Heuristic Logic: Declarative vs. Dynamic

**Gemini finding:** The prototype used dynamic, algorithmic heuristics -- `calculateFriction(w, s)` evaluated combinations on the fly (e.g., `if (w.type === 'Strategic' && s.category === 'Comms') return 'high'`). The spec proposed hardcoded mapping objects (`frictionRules`, `modeRules`). Gemini argued that hardcoding was a regression that would break user-injected nodes.

**Resolution:** The codebase uses **declarative friction rules** (hardcoded `frictionRules` table in `defaults.js`). This was an **intentional design choice** for the following reasons:

1. **Determinism:** A lookup table produces the same score every time. Dynamic heuristics based on type/category matching could produce unexpected scores for edge cases.
2. **Testability:** The `heuristics.test.js` suite (20 tests) validates specific friction scores. Table lookup is trivially testable; pattern-matching heuristics require combinatorial test cases.
3. **Transparency:** Users can see and eventually edit friction scores. A rule like "0.85" is more understandable than "the system determined this is high because your workflow type is Strategic and system category is Comms."
4. **Default fallback:** `calculateFriction()` returns 0.5 for any pair not in the table, handling user-injected nodes gracefully.

**Trade-off:** User-injected nodes get a neutral 0.5 score until manually tuned. The Gemini prototype's dynamic heuristics would have auto-scored them, but with less predictability.

**Status:** Intentional divergence. The prototype's approach is noted as a valid alternative for Phase 5 if AI-assisted scoring is implemented.

---

## 4. DOM ID Mismatches

**Gemini finding:** The spec invented DOM IDs that didn't match the prototype:
- Spec: `#view-input-studio` / Prototype: `#view-input`
- Spec: `#btn-input-studio` / Prototype: `#nav-input`
- Spec: `#chart-radar`, `#chart-bubble` / Prototype: `#radarChart`, `#bubbleChart`
- Spec: `#insight-panel`, `#insight-node-name` / Prototype: `#insight-box`, innerHTML rewrite

**Resolution:** The codebase uses the **spec's** DOM IDs (e.g., `#view-input-studio`, `#chart-radar`). The spec was treated as the canonical reference for the modular refactor; the prototype's IDs were artifacts of its single-file origin.

**Status:** Resolved. All DOM IDs follow the spec, which was designed for the modular Vite architecture.

---

## 5. Phantom Features

**Gemini finding:** SPEC.md Section 3.8 described a detailed "Implementation Roadmap Section" with AI action planner buttons (`triggerRoadmapAI`). This feature existed in an early prototype iteration but was replaced by the Input Studio. Including it in the spec created scope for a deprecated feature.

**Resolution:** The codebase includes a static "Implementation Roadmap" section in the dashboard (4 cards showing Define Schema, Map Edges, Friction Scoring, AI Layer). The cards have locked AI buttons with "Phase 5" tooltips. The `triggerRoadmapAI` function does not exist.

The roadmap section serves a portfolio purpose: it communicates the project's technical vision to viewers without requiring functional AI.

**Status:** Resolved. Feature is present as a static portfolio element, not a functional prototype artifact.
