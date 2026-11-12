# Frontend architecture

Approved scope: refactor code for readability, maintenance and extension. Preserve routes, API contracts, visual layout, CSS and existing UI work. UI/UX redesign comes later.

## Structure and ownership

- `app`: application composition, providers, routing and layouts.
- `pages`: route parameters, navigation and composition of feature interfaces.
- `features/<name>/api`: HTTP functions, backend request/response contracts and DTO mapping.
- `features/<name>/hooks`: React orchestration, query keys, queries and mutations.
- `features/<name>/model`: feature types, form schemas and data transformations.
- `features/<name>/mocks`: explicit mock data and implementations.
- `features/<name>/components`: feature UI and form interaction.
- `features/<name>/index.ts`: explicit public exports consumed outside the feature.
- `shared`: feature-independent HTTP infrastructure, configuration, hooks, form primitives, UI and utilities.

Create directories only when needed. Internals use relative imports; pages and other features consume public feature exports. `shared` never imports features/pages/app. Features never import pages/app. Avoid feature dependency cycles.

## Data flow

Page -> feature component/hook -> feature API -> shared HTTP client -> backend.

TanStack Query owns server data; React Hook Form owns form state; local React state owns local interaction. Preserve current in-memory sessions and manual refresh. HTTP functions validate backend responses with Zod, preserve null/unknown values and map DTOs only when the UI needs a different shape. Business results and authorization remain owned by the backend.

Use named exports, PascalCase component files, kebab-case other files and `use` prefixes for hooks. Keep tests beside the behavior they exercise. Preserve mock/API separation and unavailable-backend guards. No automatic fallback from a failed API to mock success.

## Auth and diagnostics

Authentication owns its API functions, contracts, forms, session transitions and hooks in `features/auth`. Auth routes consume this feature, independently of `features/live-api`. The diagnostics workbench retains its 18 implemented operations and delegates authentication to the same auth feature. Generic form rendering may be shared; backend paths and session semantics remain in features.

## Validation

`npm run check` runs lint, TypeScript, all Vitest tests and production build. Test actual request/response handling and session changes. Keep all current CSS and JSX layout intact during this refactor. Live database/email QA is separate from local checks.
