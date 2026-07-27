# Eidolon — Project Guidelines

Eidolon is a provenance-driven, authority-weighted, AI-enhanced knowledge graph
that preserves and surfaces the accumulated expertise of a creative community
(initially HaremLit authors and publishing professionals). Full spec:
[Design Docs/MainDesignDoc.md](../Design%20Docs/MainDesignDoc.md).

## Architecture

- Everything is ultimately a **Node** (`nodes` table + `node_type_id`). Never
  assume all content is a Knowledge Chunk — always design for "some Node type".
  New content types (Book, Series, Character, Trope, ...) are added by
  registering a `node_types` row and an extension table keyed by `node_id`,
  never by adding columns to `nodes` or forking core systems. See the
  `node-type-expansion` skill before adding any new node type.
- Search, graph rendering, embeddings, and relationships must stay generic
  across node types — see the `incremental-graph-rendering`,
  `knowledge-ingestion-workflow`, and `search-synthesis-workflow` skills.

## Development Rules (must follow for every change)

1. Preserve separation between Users (private accounts) and Authority Profiles
   (public identities) — many-to-many, never merge these concepts.
2. Never overwrite original Knowledge Chunk content. Original wording, nuance,
   context, and caveats are preserved permanently.
3. Preserve provenance: source, contributor, and attributed authority must
   always be recoverable and distinct (contributor ≠ attributed author).
4. AI-generated metadata (summaries, topics, tags, relationships) is always
   secondary and editable — never authoritative, never replaces source content.
5. Authority Level (Novice / Practitioner / Veteran) is the ONLY endorsement
   weighting factor. Never weight by sales, revenue, years active, book count,
   or popularity.
6. Build all systems around Nodes, not specific content types.
7. Ensure future node types can be added without redesigning search, graph
   rendering, embeddings, relationships, or the API.

## Tech Stack

| Layer | Choice |
|---|---|
| Frontend | React + TypeScript, Vite, Tailwind CSS, shadcn/ui |
| Graph UI | React Flow (incremental loading only, see graph-rendering skill) |
| API | Hono on Cloudflare Workers |
| Database | Cloudflare D1 + Drizzle ORM |
| Vector search | Cloudflare Vectorize |
| AI | Cloudflare Workers AI (ingestion + search-time synthesis) |
| File storage | Cloudflare R2 |
| Auth | Clerk (Google OAuth now, Discord planned) |

For any generic Cloudflare/Workers/D1/Vectorize/Wrangler question not specific
to Eidolon's domain model, defer to the existing `cloudflare`, `wrangler`, and
`workers-best-practices` skills rather than re-deriving guidance here.

## Routing Hints

Default orchestration entry point: use the **Eidolon Architect** agent for most
requests, especially when the task touches multiple layers.

Use these intent mappings for reliable routing:

- "add node type", "book/series/character/trope model", "schema change",
   "migration", "query" -> **Database Agent** + `node-type-expansion`
- "build ingestion", "submit chunk", "source metadata", "moderation publish",
   "AI metadata generation" -> **AI Pipeline Agent** +
   `knowledge-ingestion-workflow`
- "search API", "answer synthesis", "vector retrieval", "ranking", "citation
   in response" -> **AI Pipeline Agent** + `search-synthesis-workflow`
- "graph UI", "React Flow", "topic-first expansion", "node renderer" ->
   **Frontend Agent** + `incremental-graph-rendering`
- "duplicate detection", "metadata review", "relationship triage",
   "curation/moderation review" -> **Knowledge Curation Agent**

If a request includes two or more mapped areas, route through **Eidolon
Architect** and delegate in dependency order: database -> AI pipeline ->
frontend -> curation.

## Schema

Full schema lives in Section 3.2 of the design doc — do not duplicate table
definitions here. Key tables: `users`, `node_types`, `nodes`,
`authority_profiles`, `user_authority_profiles`, `knowledge_chunks`, `topics`,
`tags`, `node_tags`, `node_embeddings`, `endorsements`, `relationships`.

## Build and Test

Project is not yet scaffolded (no `package.json`/`wrangler.jsonc` exist yet).
Once scaffolding lands, replace this section with the real install/dev/test/
migrate commands (e.g. `npm install`, `wrangler dev`, `drizzle-kit generate`,
`npm test`).
