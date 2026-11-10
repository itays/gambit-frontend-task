# React + TypeScript + Vite + shadcn/ui

This is a template for a new Vite project with React, TypeScript, and shadcn/ui.

## Adding components

To add components to your app, run the following command:

```bash
npx shadcn@latest add button
```

This will place the ui components in the `src/components` directory.

## Using components

To use the components in your app, import them as follows:

```tsx
import { Button } from "@/components/ui/button"
```

## Linting and formatting

Biome handles linting, formatting, import sorting, and Tailwind class sorting (`biome.json`). shadcn-generated files are excluded.

```bash
npm run lint      # check
npm run lint:fix  # apply safe fixes and formatting
```

A Husky pre-commit hook runs Biome on staged files via lint-staged, then `typecheck` and unit tests.

## Testing

Unit and component tests use Vitest with jsdom and Testing Library.

```bash
npm test            # run once
npm run test:watch  # watch mode
```

Place tests next to the code they cover as `src/**/*.test.ts(x)`. Shared setup lives in `src/test/setup.ts`.

Browser end-to-end tests use Playwright and live in `e2e/**/*.e2e.ts`. Playwright starts the Vite dev server on `http://127.0.0.1:5180` (reusing one already running there locally).

```bash
npx playwright install chromium  # once
npm run test:e2e                 # headless Chromium (what CI runs)
npm run test:e2e:headed          # headed Chromium
npm run test:e2e:ui              # Playwright UI mode
```
