# Testing

## Setup

- Framework: Vitest 3.2
- Config: inherits from `vite.config.ts`
- Test files: `src/test/` directory, `*.test.ts` pattern
- Setup file: `src/test/setup.ts`

## Commands

```bash
npm test           # Run all tests once
npm test:watch     # Watch mode (re-runs on file changes)
```

## Current State

Minimal test coverage. `src/test/example.test.ts` contains a basic example.

## Writing Tests

```typescript
import { describe, it, expect } from 'vitest';

describe('MyFeature', () => {
  it('should work', () => {
    expect(true).toBe(true);
  });
});
```

### Testing React Components

Use `@testing-library/react` (add if needed):

```bash
npm install -D @testing-library/react @testing-library/jest-dom
```

### Testing API Hooks

Mock the API client in `src/lib/api.ts` or use MSW for request interception.
React Query hooks need a `QueryClientProvider` wrapper in tests.

## Conventions

- Co-locate tests near source when test directory grows
- Name: `ComponentName.test.tsx` or `hookName.test.ts`
- Test behavior, not implementation details
