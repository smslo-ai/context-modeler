# Workflow

## TDD Policy

**Strictness: Moderate**

Tests are encouraged for all logic and data transformations. Not blocked on tests for simple UI wiring.

- Test runner: `npm run test` (once) or `npm run test:watch` (watch mode)
- Coverage: `npm run test:coverage`
- Coverage targets: 90%+ for services/utils, 70%+ for components, 80%+ overall
- Libraries: Vitest + `@testing-library/react` + `@testing-library/jest-dom`
- Pattern: Arrange-Act-Assert. Test names describe behavior.
- Focus: Services (ontology, friction, storage), hooks, pure utility functions, key interactive components

## Commit Strategy

**Conventional Commits**

Format: `type: short description` (lowercase, no period)

| Prefix | Use |
|--------|-----|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `refactor:` | Code restructure, no behavior change |
| `docs:` | Documentation only |
| `test:` | Adding or fixing tests |
| `chore:` | Tooling, deps, config |
| `a11y:` | Accessibility improvements |

One logical change per commit. Don't bundle unrelated changes.

## Branch Strategy

Format: `type/short-description`

Examples: `feat/add-auth`, `fix/navbar-overflow`, `docs/update-spec`

Never push directly to `main` -- always use PRs with squash merge.

## Code Review

**Required for non-trivial changes.**

- PR title matches the primary commit
- PR body explains *why*, not *what*
- Self-review acceptable for trivial fixes (typos, config)

## Pre-Commit Hooks

**Husky + lint-staged** runs on every commit:

1. ESLint on staged `.ts`/`.tsx` files
2. Prettier on staged files
3. `tsc --noEmit` type-check

Commits are blocked if any check fails.

## Verification Checkpoints

**After each phase completion.**

Before marking a phase complete:

1. `npm run validate` passes (typecheck + lint + test)
2. `npm run build` produces clean output with no warnings
3. Manual smoke test of affected features
4. Accessibility check on new/modified UI
5. No `any` types in codebase (grep check)

## Task Lifecycle

```
pending -> in_progress -> completed
                      \-> blocked (create follow-up task)
```

Tasks are tracked per-track via Conductor. Each track has its own implementation plan with phases.

## TypeScript Conventions

- Strict mode (`strict: true`)
- No `any` -- use `unknown` + type narrowing when needed
- Interfaces for object shapes, types for unions/intersections
- All component props typed explicitly
- Service functions return typed promises
