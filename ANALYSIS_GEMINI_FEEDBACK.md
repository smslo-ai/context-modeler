# Gemini Feedback Analysis: Consolidated Gap Report

**Date:** 2026-03-29
**Analyst:** Claude (Opus 4.6)
**Inputs Analyzed:**
- "Spec Doc Analysis and Update" (Gemini, 2026-03-29) -- gap analysis of SPEC.md vs. Canvas prototype
- "Pre-Implementation & Refactoring Plan (v2.0)" (Gemini, 2026-03-29) -- refactoring plan with corrected architecture
- Existing: SPEC.md v1.0, PLAN.md v3.0, REVIEW_ENGINEERING.md, REVIEW_PRODUCT.md, AUDIT_SECURITY_A11Y.md, AUDIT_UX.md

---

## Executive Summary

Gemini analyzed the actual Canvas prototype code (`Context_Aware_Workplace_Modeler.html`) and found **5 categories of misalignment** between the prototype and our SPEC.md. The spec was written from screenshots and an RTF spec doc, not from the running code. Several existing project decisions -- including the Engineering and Product reviews -- were made against the inaccurate spec.

**Impact Level: HIGH** -- The data model, DOM structure, AI integration scope, and core algorithmic architecture are all materially wrong in the current spec. Building from the current SPEC.md would produce an app that doesn't match the prototype's behavior.

---

## Finding 1: AI Integration Is Live, Not Stubbed (CRITICAL)

### What the spec says
Section 7 treats AI as "Phase 5 Placeholders" with a `showAIStub()` function. CLAUDE.md says "AI buttons are locked (disabled with tooltip) until Phase 5."

### What the prototype actually has
Four fully implemented AI call patterns using live Gemini API:
1. `triggerAIAnalysis()` -- Node analysis
2. `triggerAIPromptGen()` -- System prompt generation
3. `analyzeFriction()` -- Friction resolution
4. `generateScenario()` -- Context scenario simulation

Uses `marked.js` for markdown rendering and a client-side `apiKey` variable with `callGemini()`.

### Impact on existing documents

| Document | Affected Section | Required Change |
|----------|-----------------|-----------------|
| SPEC.md | Section 7 (AI Integration) | Rewrite entirely -- document 4 live patterns, prompts, and rendering |
| PLAN.md | Phase 5 scope | Phase 5 becomes "secure existing AI" not "add AI" |
| PLAN.md | Phase 2 scope | Must include AI service extraction into modules |
| CLAUDE.md | "AI buttons are locked" | Incorrect -- update to reflect live AI with security migration needed |
| REVIEW_PRODUCT.md | Concern #3 (Phase 5 scope trap) | Assessment changes -- AI isn't optional scope, it's existing functionality |
| AUDIT_SECURITY_A11Y.md | SEC-02 (AI containers) | Severity escalates -- containers are ACTIVE, not future |

### Security implication
Client-side API key exposure is a **shipping blocker**. The `callGemini()` function passes `apiKey` directly. Migration to serverless proxy is not a "nice-to-have" -- it's a security requirement before any public deployment.

---

## Finding 2: Data Model Enums Are Wrong (HIGH)

### What the spec defines

```
WorkflowType = 'critical' | 'routine' | 'strategic' | 'operational' | 'ad-hoc'
PersonaState = 'reactive-firefighter' | 'deep-focus-architect' | 'process-admin' | 'bridge-builder'
SimulationMode = 'morning-triage' | 'deep-focus' | 'firefighting'
```

### What the prototype actually uses

```
WorkflowType = 'Critical' | 'Routine' | 'Strategic' | 'Collaborative' | 'Technical'
PersonaState = 'High Load' | 'Flow' | 'Routine' | 'Social'
SimulationMode = 'triage' | 'focus' | 'fire'
```

### Specific mismatches

| Field | Spec Value | Prototype Value | Issue |
|-------|-----------|-----------------|-------|
| WorkflowType | `'operational'` | `'Collaborative'` | Different value entirely |
| WorkflowType | `'ad-hoc'` | `'Technical'` | Different value entirely |
| WorkflowType casing | lowercase | Title Case | String comparison failures |
| PersonaState | kebab-case descriptors | Space-separated cognitive states | Completely different schema |
| SimulationMode | `'morning-triage'` | `'triage'` | Prefix mismatch |
| SimulationMode | `'firefighting'` | `'fire'` | Name mismatch |

### Impact
Every function that switches on these enums will produce incorrect behavior. The heuristic logic (Finding 3) depends on exact string matches. Building with spec enums means none of the simulation modes, friction calculations, or mode visuals will work correctly.

---

## Finding 3: Heuristic Logic vs. Hardcoded Maps (ARCHITECTURAL)

### What the spec proposes
Static mapping objects:
- `FrictionRules: Record<string, number>` -- keyed by `'workflowId::systemId'`
- `ModeRules: Record<SimulationMode, ModeRule>` -- static lists of dimmed/highlighted node IDs

### What the prototype actually does
Dynamic, algorithmic heuristics that evaluate node PROPERTIES at runtime:

**Friction calculation (`calculateFriction(w, s)`):**
```
if (w.type === 'Strategic' && s.category === 'Comms') return 'high'
if (w.type === 'Critical' && s.category === 'Storage') return 'mod'
if (w.type === 'Routine' && s.category === 'Tracking') return 'low'
```

**Mode simulation (`applyContextVisuals(div, item)`):**
```
Focus Mode: dims items where category === 'Comms' or state === 'High Load'
Fire Mode: pulses items where type === 'Critical'; dims Routine and Strategic
```

### Why this matters
The hardcoded approach **breaks the Input Studio's core value proposition**. When a user adds a new workflow node typed as "Strategic" and a new system categorized as "Comms", the heuristic approach correctly evaluates friction as "high" without any manual mapping. The hardcoded approach requires someone to manually add a `frictionRules` entry for every new node combination -- defeating the purpose of the tool.

### Impact on existing documents

| Document | Section | Required Change |
|----------|---------|-----------------|
| SPEC.md | Section 2.1 (Type Definitions) | Remove `FrictionRules`, `ModeRules` types |
| SPEC.md | Section 6 (Data) | Replace static maps with heuristic function specs |
| PLAN.md | Phase 2.3 | Change from "wire up frictionRules lookup" to "port heuristic functions" |
| REVIEW_ENGINEERING.md | Risk #2 (cascading delete) | Still valid but scope changes -- no frictionRules map to clean |
| CLAUDE.md | "frictionRules (keyed by workflowId::systemId)" | Replace with heuristic function description |

---

## Finding 4: DOM ID and Structure Mismatches (HIGH)

### Incorrect IDs in SPEC.md

| Element | Spec ID | Prototype ID | Impact |
|---------|---------|-------------|--------|
| Input Studio view | `#view-input-studio` | `#view-input` | CSS/JS targeting breaks |
| Input Studio nav | `#btn-input-studio` | `#nav-input` | Navigation breaks |
| Radar chart | `#chart-radar` | `#radarChart` | Chart init fails |
| Bubble chart | `#chart-bubble` | `#bubbleChart` | Chart init fails |
| Insight panel | `#insight-panel` | `#insight-box` | Insight display breaks |
| Insight node name | `#insight-node-name` | (rewritten via `#insight-text` innerHTML) | Different render pattern |

### Form structure mismatch
- **Spec assumes:** Single `addNode()` function with unified form
- **Prototype has:** Three distinct handlers: `submitWorkflow()`, `submitSystem()`, `submitUser()` with specific IDs (`#inp-wf-label`, `#inp-sys-cat`, etc.)

### Heatmap structure mismatch
- **CLAUDE.md says:** "Rendered as a semantic `<table>` element"
- **Spec says:** CSS Grid of divs
- **Prototype says:** CSS Grid (matches spec, contradicts CLAUDE.md)
- **Engineering Review REC-4** recommends `<table>` for a11y -- this is a DESIGN DECISION, not a current-state description

### Impact
Any component code written against the spec DOM IDs will fail immediately when tested against the prototype's structure. This is the most directly observable bug category.

---

## Finding 5: Phantom Features (MEDIUM)

### Spec Section 3.8: "Implementation Roadmap Section"
Describes AI action planner buttons that **do not exist** in the current prototype. This section was replaced by the Input Studio during prototype development. Including it creates scope creep for deprecated features.

### Data structure: `relationships` vs. `contextMap`
The spec proposes an adjacency list (`ContextMap`). The prototype uses `relationships: [{source, targets}]`. While an adjacency list is architecturally better for lookups, the spec doesn't acknowledge this is a **deviation** from the source data. The migration path needs explicit documentation.

---

## Cross-Reference: How Findings Affect Existing Reviews

### Engineering Review (Backend Architect Agent)

| Review Item | Status After Gemini Findings |
|-------------|------------------------------|
| RC-1: Vite base URL | **Still valid** -- unchanged |
| RC-2: Install DOMPurify | **ESCALATED** -- needed immediately for live AI output, not just future-proofing |
| RC-3: Event constants | **Still valid** -- unchanged |
| Risk #1: Re-render coordination | **Still valid** -- unchanged |
| Risk #2: Cascading delete | **Modified** -- no frictionRules map, but relationships array needs cleanup |
| REC-4: Use `<table>` for heatmap | **Design decision** -- prototype uses CSS Grid; table is an improvement, not a correction |
| Testing recommendations | **EXPANDED** -- heuristic functions need unit tests (pure logic, perfect for TDD) |

### Product Review (Alex, PM Agent)

| Review Item | Status After Gemini Findings |
|-------------|------------------------------|
| Concern #1: Phase 4D too late | **Still valid** -- unchanged |
| Concern #2: 14 PRs too many | **Still valid** -- unchanged |
| Concern #3: Phase 5 scope trap | **REFRAMED** -- AI isn't additive scope, it's existing functionality that needs securing |
| Concern #4: Dark mode ambiguity | **Still valid** -- unchanged |
| Concern #5: No definition of done | **Still valid** -- unchanged |

### Security Audit

| Finding | Status After Gemini Findings |
|---------|------------------------------|
| SEC-01: innerHTML sanitization | **ESCALATED** -- prototype actively uses innerHTML for AI markdown output |
| SEC-02: AI response containers | **ESCALATED** -- containers are live with unsanitized marked.js output |
| SEC-03: localStorage validation | **Modified** -- validate `relationships` array, not `contextMap` |
| SEC-08: marked.js + DOMPurify | **ESCALATED from Phase 5 to Phase 2** -- marked.js is already in use |

---

## Recommended Architecture Decision

**Two paths forward:**

### Path A: Preserve Prototype Fidelity (Recommended)
- Use Gemini's corrected spec (UPDATE_SPEC.md) as the source of truth
- Port prototype's exact data schema, DOM IDs, and heuristic logic
- Refactor for modularity and security, but don't redesign

**Pros:** Lowest risk, screenshots remain valid reference, preserves dynamic heuristics
**Cons:** Some IDs/patterns may not be optimal

### Path B: Redesign with Improvements
- Use prototype as feature reference but improve data structures
- Adopt `<table>` heatmap, adjacency list, kebab-case enums
- Break compatibility with prototype screenshots

**Pros:** Cleaner architecture, better a11y
**Cons:** Higher risk, screenshots lose value as reference, more work

### Recommendation
**Path A with selective improvements.** Preserve the prototype's data schema, heuristic logic, and DOM IDs as the baseline. Apply targeted improvements where they don't break fidelity:
- Adopt `<table>` heatmap (Engineering REC-4) -- improves a11y without changing data model
- Extract heuristic functions into testable modules (Engineering recommendation)
- Add serverless proxy for AI calls (Security requirement)
- Add DOMPurify pipeline for AI output (Security requirement)

---

## Action Items (Priority Order)

1. **Update SPEC.md** with correct enums, DOM IDs, data structure, and AI integration reality
2. **Update CLAUDE.md** with corrected data model description and AI integration status
3. **Rewrite PLAN.md Phase 2** to include heuristic function extraction and AI service modularization
4. **Rewrite PLAN.md Phase 5** scope from "add AI" to "secure AI" (serverless proxy + sanitization)
5. **Create TEST_PLAN.md** with TDD strategy targeting heuristic functions, state management, and data integrity
6. **Create BUILD_SPEC.md** as the unified, ralph-ready build document incorporating all corrections
