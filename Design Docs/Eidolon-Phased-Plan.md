# Eidolon 6-Phase Vertical Slice Plan

## Scope and Intent
Build Eidolon in six deployable vertical slices. Each phase must be usable end-to-end from the user perspective, and unfinished capabilities must fail gracefully with click-through placeholders instead of hard failures.

## Decisions Locked
- Total phases: 6
- Phase 1: full UI/UX before backend wiring
- Phase 1 data strategy: MSW contract-driven mocks
- Phase 1 auth strategy: full Clerk integration
- Graceful failure pattern: click-through placeholder pages/states
- Personas testable from Phase 1: Contributor, Reader, Curator, Authority profile owner
- Deployment cadence: deploy at the end of each phase

## Non-Negotiable Architecture Constraints
1. Everything is a Node; avoid Knowledge Chunk-only assumptions.
2. Original content is immutable; AI metadata is secondary/editable.
3. Keep User and Authority Profile separate with many-to-many mapping.
4. Use Authority Level as the only endorsement weighting factor.
5. Preserve provenance: contributor and attributed authority must remain distinct.
6. Keep search, graph, relationships, and embeddings generic for future node types.

## Phase 1: UX-Complete Frontend Slice
Goal: Enable full end-user journey simulation across all personas with production-grade UX states before backend is wired.

Deliverables:
- Information architecture and navigation for all personas.
- Full page set with loading, empty, error, success, unauthorized, and partial states.
- MSW mocks for planned endpoint contracts with pagination, delay, and error variants.
- Clerk sign-in, session handling, and route guard integration in frontend.
- Click-through placeholders for all unimplemented backend-dependent actions.
- Cloudflare Pages deployment for UX validation.

Exit criteria:
- All persona journeys are clickable end-to-end.
- No dead-end links; all unfinished paths explain status and next step.
- Usability testing can run without backend implementation.

## Phase 2: Core API + Persistence Slice
Goal: Replace key mocks with real API and D1 persistence while preserving Phase 1 UX.

Deliverables:
- Hono routes for ingestion, baseline search, and endorsement write path.
- D1-backed node-first writes with provenance separation.
- Contract-compatible responses so frontend remains stable.
- Explicit placeholder responses for still-unimplemented endpoints.
- Cloudflare Workers deployment.

Exit criteria:
- Contributor can submit and retrieve baseline content through real API.
- Reader can execute baseline retrieval without UX regression.

## Phase 3: Incremental Graph Exploration Slice
Goal: Deliver topic-first incremental graph experience end-to-end.

Deliverables:
- Graph API contracts for topic-first expansion with limits and pagination.
- React Flow integration for Topic -> Chunk -> Authority expansion.
- Placeholder handling for advanced graph features not yet live.
- Telemetry and robust empty and fallback graph states.

Exit criteria:
- User can enter graph at Topics and progressively expand without full-graph loads.
- Graph remains responsive under bounded expansion limits.

## Phase 4: AI Enrichment + Semantic Retrieval Slice
Goal: Add Workers AI enrichment and Vectorize search with graceful fallback.

Deliverables:
- Ingestion enrichment for summary, topics, tags, and relationships.
- Embedding generation and storage for semantic retrieval.
- Semantic search ranking with fallback to text and tag retrieval when AI or vector fails.
- Capability-flagged rollout controls.

Exit criteria:
- Reader receives semantic results when available.
- System remains usable with deterministic fallback when AI or vector is unavailable.

## Phase 5: Moderation + Publishing Slice
Goal: Introduce publish gating and curation workflow.

Deliverables:
- Curator moderation queue and approve or reject flow.
- Publish visibility controls for search and graph.
- Duplicate-detection assist and reviewer audit trail.
- Role-safe access with placeholder redirects for non-admin paths.

Exit criteria:
- Curator can govern publication lifecycle end-to-end.
- Unpublished content behavior is consistent across surfaces.

## Phase 6: Authority Identity + Synthesis Slice
Goal: Complete authority identity workflows and knowledge synthesis outcomes.

Deliverables:
- Claim and manage authority profiles and endorse-as-profile flows.
- Authority-weight snapshots persisted at endorsement time.
- Knowledge Synthesis generation with source citations and disagreement preservation.
- Final hardening of authz, retries, observability, and fallback UX.

Exit criteria:
- Authority-driven endorsements and synthesis are user-visible and trustworthy.
- System behavior aligns with domain principles and remains resilient.

## Cross-Phase Delivery Mechanics
- Maintain shared API contracts for frontend and backend parity during partial rollout.
- Expose capabilities metadata to drive real versus placeholder behavior in UI.
- Require per-phase acceptance checks:
  - Workspace checks and type checks
  - Deployed smoke tests
  - Persona walk-through validation

## Out of Scope for This Plan Snapshot
- Detailed sprint task breakdown and exact estimates by engineer-day.
- Final analytics taxonomy and dashboard implementation details.
- CI/CD pipeline deep hardening beyond phase-level deploy checks.

## Related Planning Documents
- [Eidolon Phase Acceptance Criteria](./Eidolon-Phase-Acceptance-Criteria.md)
- [Eidolon Phase-by-Phase Backlog](./Eidolon-Phase-Backlog.md)
