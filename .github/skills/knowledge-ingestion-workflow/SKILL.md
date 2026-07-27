---
name: knowledge-ingestion-workflow
description: 'The Eidolon Knowledge Chunk ingestion pipeline: submission, validation, node/knowledge_chunk creation, Workers AI enrichment (summary/topics/tags/relationships), embedding generation, moderation, and publish. Use when building or modifying content submission, the ingestion API, AI enrichment jobs, or moderation review for Knowledge Chunks.'
---

# Knowledge Ingestion Workflow

Encodes MainDesignDoc.md Section 3.3. This is the pipeline that turns
submitted human content into a searchable, provenance-preserving Knowledge
Chunk node.

## Pipeline Steps

1. **User submits content** — original text plus source metadata (source
   type, source URL) and, separately, who is contributing it vs. who the
   idea is attributed to (see Attribution below).
2. **Validation** — required fields present, content non-empty, source
   metadata well-formed. Reject before any node is created.
3. **Create Node** — insert into `nodes` with `node_type_id` =
   `KNOWLEDGE_CHUNK`.
4. **Create Knowledge Chunk** — insert into `knowledge_chunks`
   (`node_id`, `content`, `source_type`, `source_url`, `contributor_user_id`,
   `attributed_authority_profile_node_id`).
5. **Store original content unmodified.** The `content` field is never
   rewritten, trimmed of nuance, or replaced by an AI summary. It is the
   permanent source of truth.
6. **Workers AI processing** — generate, as editable AI metadata (never
   overwriting `content`):
   - Summary
   - Topics
   - Tags
   - Suggested relationships to other nodes
7. **Generate embedding** for the node's content/summary.
8. **Store in Vectorize**, and record the pointer in
   `node_embeddings.embedding_reference`.
9. **Moderation review** — human review gate before the chunk is publicly
   visible/searchable.
10. **Publish.**

## Attribution Rule (Section 1.10)

Contribution and Attribution are always separate fields:

- `contributor_user_id` — who submitted the chunk.
- `attributed_authority_profile_node_id` — who originally expressed the idea
  (may be a different person, or unclaimed Authority Profile).

Never collapse these into a single "author" field — this is how expert
knowledge is preserved even when submitted by someone else.

## Constraints

- AI-generated fields (summary/topics/tags/relationships) must remain
  editable by moderators/curators after generation — never write them as
  immutable.
- This pipeline must work unchanged for future node types beyond Knowledge
  Chunks; see `node-type-expansion` for how a new type plugs into step 3-8
  without forking the pipeline.
