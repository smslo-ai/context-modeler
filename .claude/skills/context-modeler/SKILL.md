```markdown
# context-modeler Development Patterns

> Auto-generated skill from repository analysis

## Overview
This skill teaches the development patterns and conventions used in the `context-modeler` repository, a TypeScript codebase with no detected framework. You'll learn how to structure files, write imports/exports, follow commit message conventions, and implement and test new features in a consistent manner.

## Coding Conventions

### File Naming
- Use **camelCase** for file names.
  - Example: `contextModeler.ts`, `userContext.test.ts`

### Import Style
- Use **relative imports** for referencing other modules within the codebase.
  - Example:
    ```typescript
    import { getUserContext } from './userContext';
    ```

### Export Style
- Use **named exports** for all modules.
  - Example:
    ```typescript
    export function getUserContext() { /* ... */ }
    ```

### Commit Message Patterns
- Mixed commit types, often prefixed with `chore`.
- Keep commit messages concise (average ~41 characters).
  - Example: `chore: update dependencies`

## Workflows

### Adding a New Feature
**Trigger:** When implementing a new functionality.
**Command:** `/add-feature`

1. Create a new file using camelCase naming.
2. Write your TypeScript code, using named exports.
3. Use relative imports to include dependencies.
4. Add a corresponding test file with the `.test.ts` suffix.
5. Commit your changes with a concise message, e.g., `chore: add feature X`.

### Running Tests
**Trigger:** When validating code changes.
**Command:** `/run-tests`

1. Identify test files matching the `*.test.*` pattern.
2. Use the project's test runner (unspecified; check project docs or scripts).
3. Review test results and fix any failures.

### Refactoring Code
**Trigger:** When improving or restructuring existing code.
**Command:** `/refactor`

1. Update file and variable names to follow camelCase.
2. Ensure all imports are relative.
3. Use named exports throughout.
4. Update or add tests as needed.
5. Commit with a message like `chore: refactor module X`.

## Testing Patterns

- Test files are named with the `*.test.*` pattern (e.g., `contextModeler.test.ts`).
- The testing framework is not specified; check for scripts or documentation.
- Tests should cover new and updated features.

**Example test file:**
```typescript
import { getUserContext } from './userContext';

describe('getUserContext', () => {
  it('should return the correct context', () => {
    // test implementation
  });
});
```

## Commands
| Command       | Purpose                                 |
|---------------|-----------------------------------------|
| /add-feature  | Scaffold and implement a new feature    |
| /run-tests    | Run all test suites                     |
| /refactor     | Refactor code to match conventions      |
```
