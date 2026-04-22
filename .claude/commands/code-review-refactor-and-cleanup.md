---
name: code-review-refactor-and-cleanup
description: Workflow command scaffold for code-review-refactor-and-cleanup in context-modeler.
allowed_tools: ["Bash", "Read", "Write", "Grep", "Glob"]
---

# /code-review-refactor-and-cleanup

Use this workflow when working on **code-review-refactor-and-cleanup** in `context-modeler`.

## Goal

Performs code review-driven cleanup: deletes dead code/services, updates documentation and metadata, and ensures test coverage is maintained.

## Common Files

- `src/services/*.ts`
- `src/services/*.test.ts`
- `CLAUDE.md`
- `conductor/tracks.md`
- `conductor/tracks/*/plan.md`
- `conductor/tracks/*/metadata.json`

## Suggested Sequence

1. Understand the current state and failure mode before editing.
2. Make the smallest coherent change that satisfies the workflow goal.
3. Run the most relevant verification for touched files.
4. Summarize what changed and what still needs review.

## Typical Commit Signals

- Delete unused or dead service files and their tests in src/services/
- Update documentation files (e.g., CLAUDE.md) to reflect changes or review findings
- Update conductor progress tracking files (conductor/tracks.md, conductor/tracks/*/plan.md, metadata.json, index.md)
- Validate that tests pass and that test coverage is not lost
- Spot-check or update tests to ensure coverage for logic moved or consolidated

## Notes

- Treat this as a scaffold, not a hard-coded script.
- Update the command if the workflow evolves materially.