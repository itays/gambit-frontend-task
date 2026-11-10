# Cloud Inventory

A client-side UI for browsing an organization's monitored cloud Resources, grouping them into Applications, and viewing each Application as a graph.

## Running it

Requires Node.js 24 (the version CI uses).

```bash
npm install && npm run dev
```

Vite prints the local URL (by default `http://localhost:5173`).

## What was built

One page with two tabs. Domain terms (Resource, Provider, Environment, Criticality, Application, and so on) are defined in [`GLOSSARY.md`](GLOSSARY.md).

**Resources**: the full inventory of about 12 sample Resources across AWS, GCP, and Azure.

- Columns: name, Resource Type, Provider, Environment, Criticality (color-coded badge), and Open Issues.
- Case-insensitive name search, plus Provider, Environment, and Criticality filters that each accept several values. A match count, a "Clear filters" action, and an empty state when nothing matches.
- Sort by name, Criticality (critical, high, medium, low, not alphabetically), or Open Issues. The default is Criticality descending, then name.
- Row checkboxes and a header checkbox that toggles every row matching the current filters. A sticky bar shows "N selected" with "Clear" and "Create Application".
- The create dialog lists the selected Resources and asks for a required name (trimmed, unique ignoring case) and an optional description. Creating one clears the selection, shows a toast, and opens the new Application.

**Applications**: a master–detail view.

- The list shows each Application's name, description, Resource count, highest member Criticality, and Providers. The first Application is selected by default. With no Applications, an empty state links back to Resources.
- The detail is an interactive graph: the Application node in the center with an edge to each member Resource, laid out evenly on a circle. Resource nodes show Resource Type, Provider, Criticality, Region, Owner, and tags, colored by Criticality. Pan, zoom, and drag are on. Connecting and deleting are off.

Light and dark themes switch from the header button or the `d` key.

## Key decisions and tradeoffs

- **Multi-value filters.** Values within one attribute combine with OR, and different attributes combine with AND, so "AWS or GCP, in production" works as expected. The cost is a custom "includes any of" filter function and a dropdown per attribute instead of a single select.
- **Selection survives filtering.** Rows are keyed by Resource id, so selection is keyed by id too. Changing the search or filters never drops selected Resources, and hidden ones still count in the selection bar. The header checkbox only toggles rows that match, so the visible state and what gets selected never disagree. The tradeoff is that you can have selected Resources you can't currently see. The bar's count makes that visible.
- **Many-to-many membership.** A Resource can belong to any number of Applications, because shared infrastructure such as a common IAM Role really does serve several Applications. Nothing flags overlap, and the table doesn't yet show which Applications a Resource belongs to.
- **In-memory state.** There is no backend and no persistence; a reload starts over. `App` owns the Applications, the selected Application, and the active tab, and passes them down as props. There's no Context or reducer because the state is small and only one level deep. The Resources tab owns its own table state. Only the theme choice is saved, in `localStorage`.
- **React Flow** (`@xyflow/react`) for the graph. It provides pan, zoom, drag, controls, and `fitView` out of the box. Layout is a few lines of our own math (a radial arrangement scaled to member count) rather than an auto-layout library, since a star graph doesn't need one. React Flow measures the DOM, so jsdom tests stub `ResizeObserver` and element sizes, and Playwright checks the graph in a real browser.
- **TanStack Table** for the Resources table. Headless, so it renders with the shadcn Table primitives and the app's styling. It handles sorting, filtering, and row selection, including toggle-all over filtered rows. The cost is a learning curve and some typing ceremony for custom filter and sort functions.

## What I'd do next

1. **Edit Applications.** Add an edit form (rename, change description, add or remove Resources). At that point, move name validation into one Zod schema shared by the create and edit dialogs, with TanStack Form handling form state. This was deferred from the create dialog because one two-field form with one rule didn't justify two new dependencies. The schema has to be built from the current Applications, and the edit form must skip its own name in the duplicate check.
2. **Delete Applications**, with a confirmation.
3. **Persistence**: `localStorage` first, then a real backend.
4. **Show Application membership in the Resources table**, so overlap between Applications is visible where Resources are picked.
5. **Routing**: deep links to a tab and to a specific Application.

## Where AI was used

AI (Claude, through a coding-agent harness) was used throughout, with me steering and reviewing each step:

- **Design interview**: the agent interviewed me about requirements, edge cases, and tradeoffs before any code was written.
- **Spec**: the interview produced the spec in GitHub issue #1 (user stories, implementation decisions, testing decisions, out of scope).
- **Tickets**: the spec was split into vertical-slice GitHub issues (#2–#6), each with acceptance criteria.
- **Implementation**: each ticket was implemented by an agent in its own git worktree and branch, test-first where there was a clear seam.
- **Review**: each branch was code-reviewed by an agent before merging, and the review findings were addressed in follow-up commits on the same PR.

## Tests

```bash
npm run lint        # Biome: lint, format, import and Tailwind class order
npm run typecheck   # tsc -b
npm test            # Vitest + Testing Library in jsdom
npm run test:e2e    # Playwright in headless Chromium
```

Run `npx playwright install chromium` once before the first e2e run. Playwright starts the Vite dev server on `http://127.0.0.1:5180`, or reuses one already running there.

- **App tests** (`src/App.test.tsx`) render the whole app in jsdom and drive it like a user: search, filters, sorting, selection across filter changes, name validation, creating Applications, and the Application detail.
- **Layout unit tests** (`src/lib/application-graph.test.ts`) check the radial graph layout.
- **End-to-end tests** (`e2e/*.e2e.ts`) cover the flows that need a real browser, including the Application graph.

A Husky pre-commit hook runs Biome on staged files, then typecheck and unit tests. CI runs lint, typecheck, unit tests, build, and e2e on every pull request.
