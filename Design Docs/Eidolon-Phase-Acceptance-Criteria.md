# Eidolon Phase Acceptance Criteria

This document defines quality gates for each delivery phase in the vertical-slice plan.

## Global Criteria for Every Phase
- Build passes workspace checks (`npm run check`).
- Deployed slice is reachable in Cloudflare environment for that phase.
- Contributor, Reader, Curator, and Authority Owner journeys are testable at least at placeholder level.
- Unfinished features fail gracefully with click-through placeholders and explanatory messaging.
- No violation of core principles: node-first design, provenance preservation, user and authority separation, and authority-only weighting.

## Phase 1 Acceptance: UX-Complete Frontend
Functional:
- All primary app routes are implemented with final-intent UX.
- Clerk login/logout/session is functional in frontend.
- MSW covers expected API contracts with success, loading, empty, and failure responses.

Quality:
- No dead-end navigation.
- Every major screen has loading, empty, error, and retry patterns.
- Placeholder pages include clear status and expected future behavior.

Evidence:
- Recorded persona walkthrough for all four personas.
- Route map and API contract map documented.

## Phase 2 Acceptance: Core API + Persistence
Functional:
- Ingestion baseline endpoint stores node + knowledge chunk with provenance fields.
- Baseline retrieval endpoint serves content from D1.
- Endorsement write path stores authority-level snapshot.

Quality:
- API returns contract-compatible responses expected by Phase 1 UI.
- Unsupported endpoints return explicit not-yet-implemented payloads, not opaque 404/500.

Evidence:
- API smoke tests against deployed Worker.
- D1 verification queries proving persisted rows and relationships.

## Phase 3 Acceptance: Incremental Graph Exploration
Functional:
- Graph entry starts from Topics only.
- Expansion path supports Topic -> Chunk -> Authority.
- Pagination and limit controls prevent unbounded graph expansion.

Quality:
- No full-graph preload behavior.
- Graph remains responsive during expansion and collapse operations.

Evidence:
- Demo walkthrough of three-level expansion with sample data.
- Telemetry or logs showing bounded query sizes.

## Phase 4 Acceptance: AI Enrichment + Semantic Retrieval
Functional:
- AI enrichment produces summary, topics, tags, and suggested relationships.
- Embeddings are generated and linked for semantic retrieval.
- Semantic search works for indexed data.

Quality:
- Fallback to text/tag retrieval activates when AI or Vectorize is unavailable.
- Metadata remains editable and does not overwrite original content.

Evidence:
- Before and after examples of enriched ingestion.
- Search comparison showing semantic and fallback behavior.

## Phase 5 Acceptance: Moderation + Publishing
Functional:
- Curator can review pending submissions and approve or reject.
- Publish state controls visibility in search and graph.
- Duplicate-assist signal is visible to curator during review.

Quality:
- Non-curators cannot execute moderation actions.
- Rejected and unpublished states are consistently represented in UI and API.

Evidence:
- Moderation workflow runbook with at least one full approve and one reject scenario.
- Access-control validation for role-based restrictions.

## Phase 6 Acceptance: Authority Identity + Synthesis
Functional:
- Users can claim/manage authority profiles and endorse as selected profile.
- Endorsement scoring reflects authority snapshot.
- Knowledge Synthesis generation produces consensus, disagreement, and source citation output.

Quality:
- Identity boundaries remain intact (user account never merged with authority profile record).
- Synthesis output always links to source nodes and preserves disagreement.

Evidence:
- End-to-end scenario: claim profile, endorse content, generate synthesis, verify citations.
- Final beta readiness checklist signed off.

## Release Gate
A phase is complete only when all relevant criteria above pass in deployed environment and the persona walkthrough for that phase is approved.

## Related Planning Documents
- [Eidolon 6-Phase Vertical Slice Plan](./Eidolon-Phased-Plan.md)
- [Eidolon Phase-by-Phase Backlog](./Eidolon-Phase-Backlog.md)