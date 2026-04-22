```markdown
# context-modeler Development Patterns

> Auto-generated skill from repository analysis

## Overview
This skill teaches the core development patterns, coding conventions, and workflows of the `context-modeler` repository. The codebase is a TypeScript project using the Vite framework, with both frontend (React) and backend (serverless API) components. It emphasizes clean code, modular structure, and clear commit conventions, supporting both feature-driven and maintenance-driven workflows.

## Coding Conventions

- **File Naming:**  
  Use `camelCase` for file names.  
  _Example:_  
  ```
  src/services/contextService.ts
  src/hooks/useContextModel.ts
  ```

- **Import Style:**  
  Use alias imports for modules.  
  _Example:_  
  ```typescript
  import { fetchContext } from '@/services/contextService';
  import useContextModel from '@/hooks/useContextModel';
  ```

- **Export Style:**  
  Use named exports.  
  _Example:_  
  ```typescript
  // src/services/contextService.ts
  export function fetchContext() { ... }
  export function saveContext() { ... }
  ```

- **Commit Messages:**  
  Follow [Conventional Commits](https://www.conventionalcommits.org/).  
  Prefixes used: `feat`, `chore`  
  _Example:_  
  ```
  feat: add context summarization endpoint
  chore: update dependencies and fix lint warnings
  ```

## Workflows

### Feature Development with AI or Service Layer
**Trigger:** When adding a new major feature, especially those involving AI or a new service, spanning backend and frontend.  
**Command:** `/new-feature`

1. **Backend:**  
   - Create or update serverless API endpoint files under `api/`.
   - Add supporting utility or prompt files in `api/lib/`.
   - Update or add configuration files as needed:  
     - `api/package.json`  
     - `api/tsconfig.json`  
     - `api/vercel.json`  
     - `.env.example`, `.gitignore`
2. **Frontend:**  
   - Implement new React components in `src/components/`.
   - Add new hooks in `src/hooks/`.
   - Create or update service and types files in `src/services/`.
3. **Testing:**  
   - Write or update tests for new services/components (`*.test.ts`).
4. **Documentation:**  
   - Update documentation or product/tech stack notes:  
     - `CLAUDE.md`  
     - `conductor/product.md`  
     - `conductor/tech-stack.md`
5. **Configuration:**  
   - Update or add Vite/TypeScript config files if needed (`vite-env.d.ts`, `vite.config.ts`).

_Example: Adding a new AI summarization feature_
```typescript
// api/summarizeContext.ts
import { summarize } from './lib/aiUtils';
export default async function handler(req, res) {
  const summary = await summarize(req.body.context);
  res.json({ summary });
}

// src/services/summarizeService.ts
export async function getSummary(context: string) {
  const response = await fetch('/api/summarizeContext', { method: 'POST', body: JSON.stringify({ context }) });
  return response.json();
}

// src/components/SummaryPanel.tsx
import { getSummary } from '@/services/summarizeService';
...
```

### Code Review, Refactor, and Cleanup
**Trigger:** When a code review identifies obsolete code, documentation drift, or redundant logic.  
**Command:** `/review-cleanup`

1. Delete unused or dead service files and their tests in `src/services/`.
2. Update documentation files (e.g., `CLAUDE.md`) to reflect changes or review findings.
3. Update conductor progress tracking files:  
   - `conductor/tracks.md`  
   - `conductor/tracks/*/plan.md`  
   - `conductor/tracks/*/metadata.json`  
   - `conductor/tracks/*/index.md`  
   - `conductor/index.md`
4. Validate that tests pass and that test coverage is not lost.
5. Spot-check or update tests to ensure coverage for logic moved or consolidated.

_Example: Removing a deprecated service_
```typescript
// Remove src/services/oldContextService.ts and its test file
// Update CLAUDE.md to remove references
// Ensure tests still pass: npm test
```

## Testing Patterns

- **Test File Naming:**  
  Test files follow the pattern `*.test.ts`.
  _Example:_  
  ```
  src/services/contextService.test.ts
  ```

- **Test Framework:**  
  The specific framework is not specified, but tests are colocated with services and follow standard TypeScript test file conventions.

- **Test Coverage:**  
  Ensure new and refactored code is covered by tests. Spot-check and update tests as part of code review and cleanup.

## Commands

| Command         | Purpose                                                        |
|-----------------|----------------------------------------------------------------|
| /new-feature    | Start a new feature involving backend/frontend/service changes  |
| /review-cleanup | Perform code review-driven cleanup and documentation updates    |
```