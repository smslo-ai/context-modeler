---
name: feature-development-with-ai-or-service-layer
description: Workflow command scaffold for feature-development-with-ai-or-service-layer in context-modeler.
allowed_tools: ["Bash", "Read", "Write", "Grep", "Glob"]
---

# /feature-development-with-ai-or-service-layer

Use this workflow when working on **feature-development-with-ai-or-service-layer** in `context-modeler`.

## Goal

Implements a new major feature, especially those involving AI or a new service, including backend (API/serverless), frontend components, hooks, types, and tests.

## Common Files

- `api/*.ts`
- `api/lib/*.ts`
- `api/package.json`
- `api/tsconfig.json`
- `api/vercel.json`
- `.env.example`

## Suggested Sequence

1. Understand the current state and failure mode before editing.
2. Make the smallest coherent change that satisfies the workflow goal.
3. Run the most relevant verification for touched files.
4. Summarize what changed and what still needs review.

## Typical Commit Signals

- Create or update serverless API endpoint files under api/
- Add supporting utility or prompt files under api/lib/
- Update or add configuration files (e.g., api/package.json, api/tsconfig.json, api/vercel.json, .env.example, .gitignore)
- Implement new frontend components in src/components/
- Add new React hooks in src/hooks/

## Notes

- Treat this as a scaffold, not a hard-coded script.
- Update the command if the workflow evolves materially.