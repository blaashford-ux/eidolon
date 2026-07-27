---
name: node-type-expansion
description: 'Checklist and procedure for adding a new Eidolon node type (e.g. BOOK, SERIES, CHARACTER, TROPE, LOCATION, ORGANIZATION, ITEM) without redesigning search, graph rendering, embeddings, relationships, or the API. Use when asked to add a new content/entity type, extend the knowledge graph beyond Knowledge Chunks/Topics/Authority Profiles, or design an extension table.'
---

# Node Type Expansion

Eidolon's core architecture (MainDesignDoc.md Sections 1.4 and 3.7) requires
every future content type to be added as a new **Node Type**, additively,
without touching core systems.

## When to Use

- Adding a new domain entity (Book, Series, Character, Location, Trope,
  Organization, Item, or any future type).
- Reviewing a PR/diff that introduces a new content type, to confirm it
  follows this pattern instead of a bespoke table/API.

## Procedure

1. **Register the node type.** Insert a row into `node_types` (e.g.
   `BOOK`, `TROPE`). Do not add new columns to the core `nodes` table for
   type-specific data.
2. **Create an extension table** keyed by `node_id` (foreign key to
   `nodes.id`), mirroring the pattern used by `authority_profiles`,
   `knowledge_chunks`, and `topics`. Type-specific fields live only here.
3. **Reuse `relationships`.** New node types participate in the existing
   `relationships` table (`RELATED`, `SUPPORTS`, `CONTRADICTS`,
   `DERIVED_FROM`, `REFERENCES`, ...) — never create a parallel
   relationship/edge table for the new type.
4. **Reuse `node_embeddings` / Vectorize.** Embeddings for the new type are
   stored the same way as existing nodes (`node_embeddings.embedding_reference`
   pointing into Vectorize). No new vector index or storage mechanism.
5. **Reuse graph rendering.** The React Flow renderer must pick up the new
   type via a node-type → component/icon registry (see
   `incremental-graph-rendering` skill), not a one-off renderer branch baked
   into core graph code.
6. **Reuse the ingestion and search pipelines.** The new type flows through
   the same ingestion workflow (see `knowledge-ingestion-workflow`) and the
   same search/synthesis pipeline (see `search-synthesis-workflow`) as
   existing node types — parameterized by `node_type_id`, not forked.
7. **Reuse tags/topics.** `node_tags` and topic associations work unchanged
   for the new type.

## Definition of Done

A new node type is done correctly only if ALL of the following are true —
these are explicit non-goals from Section 3.7:

- [ ] No redesign of search.
- [ ] No redesign of graph rendering.
- [ ] No redesign of embeddings.
- [ ] No redesign of relationships.
- [ ] No redesign of the API surface (new type reuses existing endpoints,
      parameterized by node type, rather than adding parallel endpoints).

If any of these were touched beyond adding a case in a registry/lookup, stop
and reconsider the design — it likely violates the node-based architecture.
