# Frontend Feature Refactor Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task-by-task. Preserve the user's existing work; do not commit or push.

**Goal:** Apply the agreed feature structure without redesigning the UI or changing backend behavior.

**Architecture:** Keep app/pages/features/shared. Separate API contracts, UI models/form validation, mocks and React query orchestration. Auth becomes an independent feature; live-api remains a diagnostic consumer.

**Tech Stack:** Existing React, TypeScript, Vite, TanStack Query, Ant Design, React Hook Form, Zod and Vitest; no new dependencies.

**Spec:** `docs/frontend-architecture.md`, approved design in this chat.

## Global Constraints

- Preserve routes, API contracts, visual layout, CSS and existing UI work. UI/UX redesign comes later.
- Keep changes from the previous API compatibility fix and concurrent admin UI work.
- Work in the existing feature checkout; no commits, pushes or dependency changes.
- Maintain same-origin HTTP, cancellation, in-memory tokens, manual refresh and unsupported-endpoint guards.

## Review Focus

- Auth login/refresh must retain tokens internally and redact them from displayed results.
- Failed logout must retain the session; successful logout/password reset/change clears session and cached private data.
- Email verification/reset tokens must still reach the form and be removed from the URL.
- DTO nullability, generated slugs and explicit mock/API separation must survive moves.
- Existing admin UI changes must remain intact; import rewrites must not remove concurrent content.

## Task 1: Normalize feature structure

Files: hotels model/form schemas/mocks/hooks; contracts and finance model/form schemas/mocks/hooks; discovery model/mocks; system-status contracts; feature public indexes and consuming imports.

Interfaces: preserve existing exported behavior names and signatures. Split hotels query keys and focused hook modules; use direct relative imports internally and public feature exports externally.

- [x] Preserve the current source snapshot and capture baseline checks.
- [x] Move model and mock code, separate form schemas, split query orchestration and add explicit public exports.
- [x] Update consumers without editing visual markup or CSS.
- [x] Run typecheck and existing behavior tests; moves reuse the existing tests rather than add tests for filenames.

## Task 2: Separate auth from diagnostics

Files: `features/auth/{api,model,hooks,components}`, auth pages, router, generic shared form primitives, live-api adapter and tests.

Interfaces: explicit auth HTTP functions; `runAuthAction(actionId, values, signal?)`; auth form metadata; public `AuthPanel`. `runOperation` keeps existing diagnostics compatibility and delegates auth actions.

- [x] Add behavioral tests for independent auth login/rotation/redaction, failed/successful logout, password operations and validation; run to observe the missing interface.
- [x] Implement auth contracts/API/hooks and share the existing form renderer without moving backend concerns into shared.
- [x] Route auth pages through auth; retain email-token handling and all 18 diagnostic operations.
- [x] Run the full test suite and typecheck.

## Task 3: Finish conventions and composition

Files: public exports, discovery logic, stable user module imports if compatible with concurrent changes, README and ESLint restrictions.

- [x] Extract reusable discovery filtering to model/hooks without changing its visible behavior.
- [x] Enforce shared/feature dependency direction with existing ESLint capabilities; scope restrictions to avoid pretending unfinished UI work is integrated.
- [x] Document actual architecture and update stale integration guidance relevant to this refactor.
- [x] Run `npm run check` and inspect all results.

## Task 4: Review and complete

- [x] Request one fresh, read-only review of the refactor with explicit preservation requirements.
- [x] Resolve substantive findings with regression evidence; rerun affected and full checks when changes require it.
- [x] Inspect diff and status, preserve unrelated work and report limitations without claiming live E2E.

## Progress

- Initial inspection: current checkout is `features/ui-ux`, not an isolated worktree. Existing API fix and concurrent admin UI work are uncommitted. Refactor proceeds in place to preserve this working state.
- Baseline first check found an admin ChangeRoleModal lint error; that file changed concurrently and the error was already corrected outside this task. Do not overwrite its updated implementation.
- Task 1 complete: TypeScript and all 62 existing tests passed after relocation, including the newly available user validation tests. Snapshot: the task visualization directory's frontend-refactor-baseline.json.
- Task 2 complete: the new auth behavior tests failed before auth existed, then passed; full suite 70/70. Auth routes retain their current form layout with account-only actions; diagnostics retains 18 actions.
- Task 3 verification so far: full check passed at 73 tests before adding four more auth contract cases and five auth rendering cases; all 17 auth cases then passed. Seven ESLint probes confirmed prohibited/allowed import directions. Final full check follows documentation and import cleanup.
- Final review found relative imports bypassing the first ESLint restriction and diagnostics inadvertently narrowing raw status strings. Both were reproduced in five failing cases, corrected, and verified green. Ownership-aware ESLint now resolves relative and alias imports; wire hotel status remains a string and management UI validates its own supported enum.
- Diagnostics metadata now lives in `features/live-api/model/operations.ts`; execution and its tests live in `api/run-operation.ts` / `api/run-operation.test.ts`.
- Final verification: `npm run check` passed lint, TypeScript, 94 tests in 11 files and production build. Existing large-chunk warning remains. Source comparison preserved 39 existing component/page return trees; no feature dependency cycles. No CSS, dependency, backend, commit or push changes were made by this refactor. Live browser/database/SMTP QA was not performed.
- Review exclusions accepted within scope: live browser, SMTP and backend verification are outside this structural refactor; existing mock admin actions remain mock. Both reported source findings were fixed; no review findings remain deferred.
