# Workflow

## TDD Policy

**Strictness: Moderate**

Tests are encouraged for all logic and data transformations. Not blocked on tests for simple UI wiring.

- 91 existing tests across 11 test files
- Test runner: `npx vitest run` (once, no watch) or `npx vitest` (watch mode)
- Coverage: `npx vitest run --coverage`
- Pattern: Arrange-Act-Assert. Test names describe behavior.
- Focus: Pure functions (heuristics, validation, calculations), state mutations, sanitization

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

## Verification Checkpoints

**After each phase completion.**

Before marking a phase complete:
1. All tests pass (`npx vitest run`)
2. Build succeeds (`npm run build`)
3. No lint warnings (when linter is configured)
4. Manual smoke test of affected features
5. Accessibility check on new/modified UI

## Task Lifecycle

```
pending -> in_progress -> completed
                      \-> blocked (create follow-up task)
```

Tasks are tracked per-track via Conductor. Each track has its own implementation plan with phases.
