---
name: incremental-graph-rendering
description: 'Rules for the Eidolon graph exploration UI (React Flow): never load the full graph, start from Topics, and expand incrementally (Topic to Knowledge Chunks to Authority Profiles to Related Topics). Use when building or modifying the graph view, node expansion/click behavior, or adding a renderer for a new node type.'
---

# Incremental Graph Rendering

Encodes MainDesignDoc.md Section 3.5. The knowledge graph can grow
unboundedly, so the UI must never attempt to fetch/render the entire graph
at once.

## Rules

1. **Never load the entire graph.** Every graph API call must be scoped
   (by topic, by node, by depth-limited expansion) — no "get all nodes"
   endpoint backing the graph view.
2. **Initial load = Topics only.** The graph view opens showing Topic nodes
   as the entry points into the graph.
3. **Expansion path**, triggered by user interaction (e.g. clicking/
   expanding a node):
   - Topic → Knowledge Chunks (chunks tagged/associated with that topic)
   - Knowledge Chunk → Authority Profiles (attributed authors/contributors)
   - → Related Topics (via `relationships`)
4. **Future node types must render without renderer changes.** Implement a
   node-type → component/icon **registry** keyed by `node_type_id`
   (e.g. a `Record<NodeTypeId, NodeRendererConfig>` lookup) so adding BOOK,
   TROPE, etc. (see `node-type-expansion`) only means adding a registry
   entry, not branching core graph logic.

## Implementation Notes (React Flow)

- Fetch node expansions lazily per-click via the search/graph API — do not
  pre-fetch neighbors beyond one hop.
- Cache already-expanded nodes/edges client-side to avoid re-fetching on
  re-expansion within a session.
- Edge labels should reflect `relationship_type` (RELATED, SUPPORTS,
  CONTRADICTS, DERIVED_FROM, REFERENCES) so users can visually distinguish
  agreement from contradiction — this supports Principle 4 (preserve
  disagreement) at the UI level.
