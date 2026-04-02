# Product Definition

## Project Name

Context Modeler

## Description

A portfolio SPA that models a workplace through Business Workflows, Systems & Infrastructure, and User Personas, then visualizes their relationships.

## Problem Statement

Shane can't make sense of his many workflows, systems, shared sites, administrative deadlines, and management escalations in the AI rush. Context switching between tools and modes destroys productivity. The workplace has no single view connecting how workflows, systems, and personas interact -- friction points are invisible until they cause failures.

## Target Users

- **Primary:** Shane Slosar -- financial ops professional (~5.5 years cost basis/tax ops) building AI fluency, managing dozens of overlapping workflows across multiple enterprise systems
- **Secondary:** Knowledge workers managing complex multi-system workflows who face similar context overload

## Key Goals

1. **Model workplace complexity visually** -- Represent the triad of Workflows, Systems, and Personas as an interactive ontology with explicit relationships and friction scoring
2. **Surface hidden friction** -- Use heuristic analysis to identify where workflows and systems create cognitive load mismatches (e.g., doing deep strategic work inside interrupt-driven communication tools)
3. **Demonstrate context engineering** -- Showcase simulation modes (Morning Triage, Deep Focus, Firefighting) that adapt the UI to the user's current behavioral state, proving the concept of a context-aware workplace

## Origin

Born from a Gemini Canvas prototyping session (Jan-Mar 2026). The prototype was a single-file HTML app with live Gemini API calls. The production codebase is a modular Vite SPA built from a corrected specification, with AI features intentionally deferred to Phase 5.

## Current Status

Migrating from vanilla JS to React 19 + TypeScript (strict mode). The vanilla JS version is portfolio-ready with 91 passing tests and WCAG 2.1 AA compliance. The migration adds a dark-first design system (navy/amber/teal), Framer Motion animations, shadcn/ui components, and a services layer ready for backend integration. Design spec approved at `docs/superpowers/specs/2026-04-02-react-migration-design.md`.
