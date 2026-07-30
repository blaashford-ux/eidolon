# Eidolon Phase 2 Task Breakdown

This document turns Phase 2, Core API + Persistence, into an implementation order that can be executed without widening scope beyond the Phase 2 backlog.

## Goal

Replace the highest-value Phase 1 mocks with real Workers + D1 behavior while keeping the Phase 1 UI contract stable.

## Phase 2 Delivery Rules

- Preserve the current frontend routes, loading states, and placeholder flows.
- Keep contributor, authority, and content provenance distinct in every write path.
- Implement the smallest real API surface that satisfies the Phase 2 backlog.
- Return explicit capability or placeholder payloads for anything still deferred to later phases.

## Execution Order

### Task 1: Lock the API contracts for Phase 2 routes

Scope:
- Confirm request and response shapes for chunk submission, contributor reads, baseline search, and capabilities.
- Define validation error payloads and not-found payloads so the UI can handle them consistently.
- Keep the existing MSW contract shapes aligned with the real API shapes.

Depends on:
- Phase 1 UI contract shapes already in use by the frontend.

Done when:
- The submission, list, and search routes have stable payload definitions.
- Capability responses clearly separate live vs placeholder features.

### Task 2: Add the D1 persistence path for chunk submission

Scope:
- Implement the Workers route that accepts a chunk submission.
- Create the `nodes` and `knowledge_chunks` records in one write path.
- Preserve provenance fields for contributor, source, and attributed authority.
- Validate required fields before writing and return structured validation errors.

Depends on:
- Task 1 API contract definitions.

Done when:
- A valid submission persists to D1 without manual database intervention.
- Invalid payloads return a predictable client-safe error response.

### Task 3: Add contributor readback for persisted submissions

Scope:
- Implement contributor-filtered list and detail retrieval.
- Return deterministic ordering so the UI can render stable lists.
- Use explicit not-found payloads for missing records.

Depends on:
- Task 2 write path, so there is persisted data to read.

Done when:
- A contributor can submit and then see the stored chunk again through the real API.
- Missing records do not degrade into generic server errors.

### Task 4: Implement baseline text-and-tag search

Scope:
- Add the baseline search route for query + pagination.
- Return source metadata and attributed authority references alongside results.
- Clearly signal when the system is operating in baseline mode instead of semantic mode.

Depends on:
- Task 2 persisted content and the shared response contract.

Done when:
- Reader search works against persisted content without relying on vector search or AI enrichment.
- Pagination remains stable across repeated requests.

### Task 5: Wire the frontend Phase 2 routes to the real API

Scope:
- Swap the submission page from mock writes to the real Worker route.
- Point readback and baseline search screens at the live API.
- Preserve loading, empty, error, and placeholder states already established in Phase 1.

Depends on:
- Tasks 2 through 4.

Done when:
- The user-facing submission and search flows work against the real backend with no UX regressions.

### Task 6: Add explicit capability and placeholder responses

Scope:
- Return capability metadata for not-yet-live Phase 3+ features.
- Keep graph, semantic, curator, and authority-only paths explicit about what is unavailable.
- Ensure unsupported actions route to placeholders instead of dead ends.

Depends on:
- Task 1 contract shape for capability metadata.

Done when:
- The frontend can reliably show “not yet implemented” states without guessing.

### Task 7: Validate the slice end to end

Scope:
- Run workspace checks against the touched packages.
- Smoke test submission, contributor readback, and baseline search through the Worker.
- Confirm the deployed Worker and local frontend still preserve Phase 1 behavior.

Depends on:
- Tasks 1 through 6.

Done when:
- A contributor can submit and retrieve content through D1-backed routes.
- A reader can execute baseline search successfully.
- The app still degrades gracefully for deferred capabilities.

## Suggested Implementation Breakdown by Code Area

- API routes: submission write, contributor readback, baseline search, capability metadata.
- Database layer: D1 schema usage, write transaction helpers, query helpers.
- Frontend integration: submission form, submissions list/detail, search page API binding.
- Shared contract layer: request/response types and error payload shapes.
- Validation: workspace checks plus API smoke tests.

## Exit Criteria for Phase 2

- Real D1 persistence backs the core submission flow.
- Baseline search returns persisted content through the Workers API.
- The frontend remains contract-compatible and keeps all placeholder behavior intact for later phases.

## Related Documents

- [Eidolon 6-Phase Vertical Slice Plan](./Eidolon-Phased-Plan.md)
- [Eidolon Phase Acceptance Criteria](./Eidolon-Phase-Acceptance-Criteria.md)
- [Eidolon Phase-by-Phase Backlog](./Eidolon-Phase-Backlog.md)