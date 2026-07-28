# Eidolon Phase-by-Phase Backlog

This backlog translates the vertical slice plan into implementation-ready user stories.

## Personas
- Contributor: submits knowledge and tracks submission outcomes.
- Reader: searches, browses, and validates source-backed knowledge.
- Curator: reviews quality, moderation status, and publication controls.
- Authority Owner: manages authority identity and endorses with context.

## Story Status Convention
- `READY`: scoped enough to implement now.
- `PLANNED`: depends on earlier phase completion.
- `PLACEHOLDER`: exposed in UI but intentionally not fully wired yet.

## Phase 1 Backlog: UX-Complete Frontend (MSW + Clerk)

### Contributor
1. Story ID: `P1-CON-01` (`READY`)
As a Contributor, I can open a full chunk submission flow with validation so I can practice complete submission behavior before backend wiring.
Acceptance criteria:
- Submission form includes required content, source type, source URL, contributor attribution, and attributed authority inputs.
- Client-side validation prevents submit on missing required fields and shows inline errors.
- Submit action resolves against MSW and displays success, loading, and failure states.

2. Story ID: `P1-CON-02` (`READY`)
As a Contributor, I can view a submissions list with statuses so I can understand moderation and publishing states.
Acceptance criteria:
- List renders `Draft`, `Submitted`, `Pending Review`, `Published`, and `Rejected` mock states.
- Clicking each status opens a details screen with next steps and placeholder actions.
- No dead-end paths exist from list or details screens.

### Reader
1. Story ID: `P1-REA-01` (`READY`)
As a Reader, I can perform search and open results detail pages so I can evaluate discoverability UX.
Acceptance criteria:
- Search page supports query input, empty query state, no-results state, and results pagination UI.
- Result cards display source and attribution fields.
- Detail page includes source panel and placeholders for semantic ranking signals.

2. Story ID: `P1-REA-02` (`PLACEHOLDER`)
As a Reader, I can navigate to graph exploration and see non-implemented paths gracefully handled.
Acceptance criteria:
- Graph entry route exists and clearly shows feature readiness state.
- Unavailable interactions route to explanatory placeholders.
- Navigation back to search or home is always available.

### Curator
1. Story ID: `P1-CUR-01` (`READY`)
As a Curator, I can open moderation queue screens with realistic states so review UX can be tested early.
Acceptance criteria:
- Queue view includes pending, approved, rejected tabs with mock counts.
- Item detail includes publish and reject actions wired to mock responses.
- Error states for moderation actions are rendered with retry options.

2. Story ID: `P1-CUR-02` (`PLACEHOLDER`)
As a Curator, I can access duplicate-check and quality-check surfaces even before the engine exists.
Acceptance criteria:
- Duplicate-check section exists on review screen with placeholder score and explanation.
- Quality checks are visually represented with explicit "not yet implemented" markers.

### Authority Owner
1. Story ID: `P1-AUT-01` (`READY`)
As an Authority Owner, I can access profile management screens so identity UX can be tested.
Acceptance criteria:
- Profile list and profile detail routes exist behind Clerk-authenticated session.
- Create and claim actions are present and return mock success/failure outcomes.
- Endorse-as-profile selector appears in relevant views with placeholder data.

2. Story ID: `P1-AUT-02` (`PLACEHOLDER`)
As an Authority Owner, I can open endorsement history and weighting explanations even if backend scoring is not live.
Acceptance criteria:
- Endorsement history screen exists with mock data and filtering controls.
- Weight explanation references Novice, Practitioner, Veteran model only.

## Phase 2 Backlog: Core API + Persistence

### Contributor
1. Story ID: `P2-CON-01` (`READY`)
As a Contributor, I can submit a chunk and have it persisted in D1 through real API routes.
Acceptance criteria:
- API creates `nodes` and `knowledge_chunks` records with preserved provenance fields.
- Invalid payloads return structured validation errors without server crashes.
- Frontend submission flow uses real API and preserves Phase 1 UX states.

2. Story ID: `P2-CON-02` (`READY`)
As a Contributor, I can read my submitted chunks from persisted data.
Acceptance criteria:
- API returns contributor-filtered list with deterministic sorting.
- Missing resources return explicit not-found payload, not generic 500.

### Reader
1. Story ID: `P2-REA-01` (`READY`)
As a Reader, I can search baseline persisted content by text and tags.
Acceptance criteria:
- Search endpoint supports query and pagination parameters.
- Result payload includes source metadata and attributed authority references.
- If semantic search is unavailable, API clearly indicates baseline mode.

2. Story ID: `P2-REA-02` (`PLACEHOLDER`)
As a Reader, I see explicit placeholders where graph or semantic-only features are not yet implemented.
Acceptance criteria:
- API capability payload indicates unavailable advanced features.
- UI routes unsupported actions to placeholder screens without broken links.

### Curator
1. Story ID: `P2-CUR-01` (`PLANNED`)
As a Curator, I can inspect persisted submission metadata needed for future moderation.
Acceptance criteria:
- Queue endpoint returns enough fields to support moderation in Phase 5.
- Access requires curator role claim; unauthorized requests receive clear 403 payload.

### Authority Owner
1. Story ID: `P2-AUT-01` (`PLANNED`)
As an Authority Owner, I can endorse content and persist authority level snapshot.
Acceptance criteria:
- Endorsement endpoint stores `authority_level_snapshot` and `weight` at write time.
- Endorsement record does not mutate if profile level later changes.

## Phase 3 Backlog: Incremental Graph Exploration

### Contributor
1. Story ID: `P3-CON-01` (`PLANNED`)
As a Contributor, I can open a submitted chunk in graph context to see connected topics and authority nodes.
Acceptance criteria:
- Chunk detail links into graph at related topic node.
- Graph expansion for chunk context is bounded and paginated.

### Reader
1. Story ID: `P3-REA-01` (`READY`)
As a Reader, I can start from Topics and expand graph incrementally.
Acceptance criteria:
- Initial graph load includes Topics only.
- Expanding a Topic loads related chunks and authority profiles on demand.
- No full graph payload is requested on initial page load.

2. Story ID: `P3-REA-02` (`READY`)
As a Reader, I can inspect node provenance and source details from graph interactions.
Acceptance criteria:
- Node details panel shows source context and attribution.
- Unsupported deep-expansion paths show placeholders with recovery actions.

### Curator
1. Story ID: `P3-CUR-01` (`PLANNED`)
As a Curator, I can inspect relationship density to triage potentially noisy metadata.
Acceptance criteria:
- Curator view shows relationship counts and bounded expansion statistics.
- High-density warning state appears for nodes above threshold.

### Authority Owner
1. Story ID: `P3-AUT-01` (`PLANNED`)
As an Authority Owner, I can view where my profile appears in topic and chunk graph neighborhoods.
Acceptance criteria:
- Profile-centric graph view shows associated topics and attributed chunks.
- Empty state explains when profile has no linked public knowledge yet.

## Phase 4 Backlog: AI Enrichment + Semantic Retrieval

### Contributor
1. Story ID: `P4-CON-01` (`READY`)
As a Contributor, I can see AI-generated metadata attached to my submission as editable secondary data.
Acceptance criteria:
- Generated summary, topics, tags, and relationships are visible as editable fields.
- Original chunk content remains immutable and visually distinct from AI metadata.

### Reader
1. Story ID: `P4-REA-01` (`READY`)
As a Reader, I receive semantic results for concept queries.
Acceptance criteria:
- Semantic endpoint returns ranked nodes when embeddings exist.
- UI labels semantic mode and fallback mode clearly.

2. Story ID: `P4-REA-02` (`READY`)
As a Reader, I can still retrieve useful results when AI or Vectorize is unavailable.
Acceptance criteria:
- System falls back to text/tag retrieval without hard failure.
- Fallback result ordering is deterministic and documented.

### Curator
1. Story ID: `P4-CUR-01` (`PLANNED`)
As a Curator, I can review and adjust AI-generated relationships before publication impact.
Acceptance criteria:
- Curation view supports accept, edit, or ignore actions per suggested relationship.
- Changes are auditable with actor and timestamp.

### Authority Owner
1. Story ID: `P4-AUT-01` (`PLANNED`)
As an Authority Owner, I can see how semantic ranking reflects authority context without replacing source evidence.
Acceptance criteria:
- Result view exposes authority-weight context and source citations.
- Ranking explanation never implies popularity-based weighting.

## Phase 5 Backlog: Moderation + Publishing

### Contributor
1. Story ID: `P5-CON-01` (`READY`)
As a Contributor, I can track moderation outcomes and receive clear feedback.
Acceptance criteria:
- Submission status updates from pending to approved/rejected with timestamps.
- Rejection includes reason code and guidance.

### Reader
1. Story ID: `P5-REA-01` (`READY`)
As a Reader, I only see published content in default search and graph views.
Acceptance criteria:
- Unpublished items are excluded from public endpoints.
- If a previously seen item is unpublished, details view explains unavailability.

### Curator
1. Story ID: `P5-CUR-01` (`READY`)
As a Curator, I can approve or reject queued chunks and control publish visibility.
Acceptance criteria:
- Moderation action writes are atomic and auditable.
- Queue reflects real-time status changes after actions.

2. Story ID: `P5-CUR-02` (`READY`)
As a Curator, I can use duplicate detection assistance in review workflow.
Acceptance criteria:
- Queue item shows duplicate candidates with confidence indicator.
- Curator can override duplicate suggestions with documented rationale.

### Authority Owner
1. Story ID: `P5-AUT-01` (`PLANNED`)
As an Authority Owner, I can view whether attributed chunks are published and how that affects my profile visibility.
Acceptance criteria:
- Profile view differentiates published and pending attribution links.
- Private moderation details are hidden from non-curator authority owners.

## Phase 6 Backlog: Authority Identity + Synthesis

### Contributor
1. Story ID: `P6-CON-01` (`PLANNED`)
As a Contributor, I can reference synthesis artifacts generated from published knowledge.
Acceptance criteria:
- Chunk detail links to related synthesis nodes where applicable.
- Synthesis cards include source citation counts.

### Reader
1. Story ID: `P6-REA-01` (`READY`)
As a Reader, I can consume synthesis that preserves consensus and disagreement with source citations.
Acceptance criteria:
- Synthesis view contains consensus points, disagreement points, and linked sources.
- Clicking citation opens underlying node detail with provenance fields.

### Curator
1. Story ID: `P6-CUR-01` (`READY`)
As a Curator, I can trigger or schedule synthesis generation for a topic.
Acceptance criteria:
- Synthesis job request validates topic scope and published-source minimums.
- Job status and output are trackable in curator surfaces.

### Authority Owner
1. Story ID: `P6-AUT-01` (`READY`)
As an Authority Owner, I can claim or manage authority identities and endorse as selected profile.
Acceptance criteria:
- Claim flow enforces user-to-authority many-to-many boundaries.
- Endorsement as profile writes immutable snapshot weight data.

2. Story ID: `P6-AUT-02` (`READY`)
As an Authority Owner, I can audit endorsements made under my profile context.
Acceptance criteria:
- Audit view shows node, timestamp, authority level snapshot, and weight.
- Unauthorized users cannot access profile endorsement audit data.

## Phase Exit Checklist Template
- All `READY` stories for the phase pass acceptance criteria.
- `PLACEHOLDER` stories have explicit UX and routing behavior.
- Persona walkthrough recorded for Contributor, Reader, Curator, and Authority Owner.
- Deployment smoke checks pass for web and API slices in Cloudflare.
