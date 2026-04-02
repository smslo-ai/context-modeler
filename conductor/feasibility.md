# Feasibility Assessment

Evaluating three approaches for modeling Shane's 3 Core Workplace Dimensions: Knowledge Graph Ontology, Context Engineering, and supporting Design Principles.

---

## 1. Knowledge Graph Ontology

### Fit: Strong

The triad model (Workflows, Systems, Personas) maps directly to a labeled property graph:

- **Nodes** = entities (workflows, systems, personas)
- **Edges** = relationships (uses, creates-friction, supports, blocks)
- **Properties** = metadata (type, frequency, category, state, friction score)

The codebase already implements a simplified graph. `src/data/defaults.js` defines:
- `contextMap` -- an adjacency list where each node ID maps to an array of connected node IDs
- `frictionRules` -- edge weights keyed by `workflowId::systemId` pairs
- `modeRules` -- context-dependent node visibility rules

### What's Already Built

| Graph Concept | Codebase Implementation | File |
|--------------|------------------------|------|
| Node types | WorkflowNode, SystemNode, PersonaNode with typed prefixes (`wf-`, `sys-`, `usr-`) | `src/data/defaults.js` |
| Adjacency list | `contextMap` object -- bidirectional relationships | `src/data/defaults.js` |
| Edge weights | `frictionRules` object -- friction scores (0.0-1.0) for workflow-system pairs | `src/data/defaults.js` |
| Node traversal | `store.js` NODE_SELECTED handler walks contextMap to find connected nodes | `src/state/store.js` |
| Cascading delete | NODE_REMOVED cleans contextMap, frictionRules, and all linkedArrays | `src/state/store.js` |
| Matrix view | `buildFrictionMatrix()` constructs 2D workflow-system friction grid | `src/utils/heuristics.js` |

### Gaps

1. **No typed edges.** The contextMap stores flat arrays of connected IDs. There's no distinction between "uses," "blocks," "supports," or "creates-friction" relationships. All edges are implicitly "is-connected-to."

2. **Friction scores are separate from the graph.** `frictionRules` is a parallel data structure, not integrated into the edge model. A true knowledge graph would store friction as an edge property.

3. **No graph traversal algorithms.** The codebase does direct lookup (1-hop neighbors) but can't answer multi-hop queries like "show me all systems that create high friction for the Deep Focus persona" without manual chaining.

4. **No inference.** When a user adds a new node, the system doesn't predict relationships. The Gemini prototype had an "Auto-Connect" feature using LLM inference; the production app requires manual linking.

### Upgrade Path

**Phase A (Data model enrichment):** Add edge types and weights to contextMap entries. Change from `{ 'wf-X': ['sys-Y', 'usr-Z'] }` to `{ 'wf-X': [{ target: 'sys-Y', type: 'uses', friction: 0.85 }] }`. This merges frictionRules into the graph.

**Phase B (Query layer):** Add utility functions for multi-hop traversal: `getHighFrictionPaths(personaId)`, `findOrphanedNodes()`, `getBottleneckNodes(threshold)`.

**Phase C (Inference):** Phase 5 AI features could predict edges for new nodes based on existing graph patterns and node metadata.

### Verdict

The existing data model is **80% of the way to a knowledge graph**. The adjacency list + friction rules + mode rules already capture the core ontology. The main gap is structural: edges need types and properties, not just target IDs.

---

## 2. Context Engineering

### Fit: Very Strong

Context engineering is the practice of designing systems that adapt their behavior based on the user's current state, intent, and environment. The Context Modeler already implements this concept directly.

### What's Already Built

| Context Engineering Concept | Codebase Implementation | File |
|---------------------------|------------------------|------|
| Context states | 3 simulation modes: Morning Triage, Deep Focus, Firefighting | `src/data/defaults.js` (modeRules) |
| State-dependent UI | Nodes dim/highlight based on active mode | `src/utils/heuristics.js` (getSimulationVisuals) |
| Persona-state mapping | Each persona has a behavioral state (reactive, flow, routine, social) | `src/data/defaults.js` |
| Context switching cost | Friction heatmap visualizes cognitive load of workflow-system combinations | `src/components/heatmap.js` |
| Mode persistence | Active mode saved to localStorage, restored on reload | `src/state/storage.js` |

### Gaps

1. **Static context detection.** Modes are manually toggled via buttons. Real context engineering would infer the mode from signals: calendar events, time of day, notification volume, active applications.

2. **No context gating.** In Deep Focus mode, all distracting nodes are equally dimmed. There's no threshold system where only "Critical"-tagged items break the focus barrier. The Gemini analysis specifically recommended this.

3. **No temporal context.** The system doesn't model time-dependent changes. For example, friction scores may differ at 9 AM (triage time) vs. 2 PM (deep work window).

4. **No context history.** The system doesn't track mode switches over time. Knowing that Shane switches to Firefighting mode 4 times per day is a valuable signal that the Gemini analysis identified.

### Upgrade Path

**Phase A (Context gating):** Add a `priority` field to nodes (or edge properties). In Deep Focus mode, only nodes with `priority: 'critical'` break through the dim filter.

**Phase B (Signal integration):** Phase 5 AI features could accept external signals (calendar API, manual tags) to suggest mode transitions.

**Phase C (Context analytics):** Track mode switches in localStorage. Surface insights like "you spent 60% of today in Firefighting mode" to validate the model's predictions.

### Verdict

The codebase **already demonstrates context engineering principles**. The simulation modes are the proof of concept. The main gap is that context detection is manual rather than signal-driven -- which is appropriate for a portfolio piece but would need signals integration for production use.

---

## 3. Design Principles Applied

### Information Architecture

The triad model provides 3 orthogonal lenses on the same workplace. This mirrors established enterprise architecture frameworks (TOGAF's Business/Application/Technology layers) but simplifies them for individual knowledge worker use.

**Strength:** The three dimensions are exhaustive for the problem scope -- every workplace friction point involves a workflow, a system, and a person.

**Risk:** The model assumes friction is pairwise (workflow + system). In reality, friction can be three-way (a specific persona doing a specific workflow on a specific system). The current heatmap only shows 2D.

### Progressive Disclosure

- **Dashboard:** Overview visualization (heatmap, charts, triad explorer)
- **Input Studio:** Detailed data entry with explicit linking
- **Simulation modes:** Filter noise by dimming irrelevant nodes
- **Insight panel:** Shows connection details on demand, not by default

This layering prevents cognitive overload -- ironic and intentional for a tool that models cognitive overload.

### Cognitive Load Reduction

The simulation modes are the core innovation. By dimming irrelevant nodes, the UI demonstrates the very principle it models: context-aware information filtering reduces cognitive load.

**Quantified in the Gemini analysis:**
- Deep Focus mode suppresses Slack node (interrupt-driven) and highlights AI Engine + Exec Dashboard (deep work tools)
- Morning Triage mode suppresses Strategic Planning (wrong time for deep work) and highlights Escalations + Slack (where urgent signals live)

### Data Sovereignty

All data stays in localStorage. This is a hard constraint because the modeled workflows may reference confidential enterprise systems, org structures, and personnel. No data leaves the browser.

**Implication for Phase 5:** If AI features are added, they must either:
1. Use pre-written responses (no data leaves the client), or
2. Route through a serverless proxy where the user controls the API key and data retention

---

## Summary

| Approach | Fit | Already Built | Key Gap | Upgrade Effort |
|----------|-----|--------------|---------|---------------|
| Knowledge Graph | Strong | Adjacency list, friction scores, cascading delete, matrix view | No typed edges, no multi-hop traversal | Medium -- data model refactor |
| Context Engineering | Very Strong | 3 simulation modes, persona states, mode-dependent UI | Static detection, no context gating | Low-Medium -- additive features |
| Design Principles | Applied | Progressive disclosure, cognitive load reduction, data sovereignty | 2D friction only (no 3-way persona+workflow+system) | Low -- UI enhancement |

**Bottom line:** The Context Modeler already implements simplified versions of all three approaches. The architecture supports the upgrade path without a rewrite. The main evolution is enriching the graph model (typed edges, multi-hop queries) and making context detection signal-driven rather than manual.
