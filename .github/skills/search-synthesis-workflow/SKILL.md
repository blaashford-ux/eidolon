---
name: search-synthesis-workflow
description: 'The Eidolon search pipeline: query embedding, Vectorize similarity search, node retrieval, relationship expansion, authority-weighted context, and LLM synthesis with cited sources. Use when building or modifying the search API, question-answering endpoint, Knowledge Synthesis generation, or ranking/weighting logic.'
---

# Search & Synthesis Workflow

Encodes MainDesignDoc.md Section 3.4. Search always operates on **Nodes**,
not only Knowledge Chunks — results and expansion must stay type-agnostic.

## Pipeline Steps

1. **User question** — free-text query.
2. **Embedding generation** — embed the query with Workers AI.
3. **Vector search** — similarity search against Vectorize.
4. **Node retrieval** — resolve matched vectors back to `nodes` rows (any
   node type, not just Knowledge Chunks).
5. **Relationship expansion** — traverse `relationships` (RELATED, SUPPORTS,
   CONTRADICTS, DERIVED_FROM, REFERENCES) from the retrieved nodes to pull in
   connected context.
6. **Authority context retrieval** — join to `authority_profiles` for
   attributed nodes; weight/order using `authority_level` only (Novice /
   Practitioner / Veteran) — never sales, revenue, years active, book count,
   or popularity (Section 1.7).
7. **LLM synthesis** — Workers AI produces a synthesized answer from the
   retrieved nodes and their relationships.
8. **Response with sources** — every synthesized answer must cite the
   originating nodes (so provenance is never lost behind an AI answer).

## Knowledge Syntheses (Section 1.14)

When a synthesis is persisted as a `KNOWLEDGE_SYNTHESIS` node (not just an
ephemeral chat answer), it must:

- Stay secondary to original content — never replace or hide the source
  chunks it was derived from.
- Preserve disagreement: capture consensus AND minority/contradictory
  viewpoints, not just a single "truth" (Principle 4 — do not resolve
  disagreement).
- Record source counts/references (e.g. "43 chunks, 12 authors").

## Constraints

- Do not rank or filter purely by AI confidence — authority weighting and
  endorsement weighting (Section 1.11: Novice 1 / Practitioner 5 / Veteran
  20) are the community-facing signals, not model confidence scores.
- Do not silently drop contradictory chunks from results; conflicting advice
  must be able to coexist in the response.
