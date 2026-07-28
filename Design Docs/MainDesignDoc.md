## Section 1 — Product Design

# Eidolon

## Community Knowledge Graph for Authors

**Document Purpose:** Definitive product architecture, system design, technical specification, implementation guidance, and AI development reference.

**Status:** Source of Truth

**Audience:** Developers, AI Coding Agents, Architects, Product Designers

**Related Documents:**

* [Eidolon 6-Phase Vertical Slice Plan](./Eidolon-Phased-Plan.md)
* [Eidolon Phase Acceptance Criteria](./Eidolon-Phase-Acceptance-Criteria.md)

---

# 1.1 Executive Summary

Eidolon is a provenance-driven, authority-weighted, AI-enhanced knowledge graph designed to preserve and surface the accumulated expertise of a creative community.

The initial implementation focuses on HaremLit authors and publishing professionals, but the architecture is intentionally designed to support future expansion into broader creative domains.

Eidolon captures practical knowledge from sources such as:

* Reddit discussions
* Discord conversations
* Interviews
* Blog posts
* Author discussions
* Industry commentary
* Community submissions
* Original user insights

The platform's primary purpose is to preserve human expertise while making it discoverable through AI-assisted search and graph exploration.

The core artifact is the **Knowledge Chunk**.

A Knowledge Chunk is a piece of original human-created content containing useful information, advice, experience, observations, or discussion.

Knowledge Chunks remain the primary source of truth.

AI is used only to enhance discoverability through:

* Summaries
* Classification
* Tagging
* Relationship discovery
* Semantic search
* Knowledge synthesis

AI does not replace the original source material.

---

# 1.2 Long-Term Vision

Eidolon is designed as a multi-domain knowledge graph.

Phase 1 implements only the Community Knowledge domain.

Future phases may introduce additional domains such as:

* Books
* Series
* Characters
* Locations
* Organizations
* Tropes
* Genres
* Equipment
* Magic Systems
* Publishing Resources

The architecture must support future domains without requiring redesign of:

* Search
* Graph rendering
* Relationships
* Embeddings
* AI pipelines
* API architecture

This requirement drives the platform's node-based design.

---

# 1.3 Core Philosophy

The platform follows five principles.

## Principle 1 — Preserve Human Knowledge

Original human-created content remains the primary artifact.

AI enhances knowledge.

AI does not replace knowledge.

Original wording, nuance, context, and caveats are preserved.

---

## Principle 2 — Provenance Matters

Every piece of knowledge should answer:

* Where did this come from?
* Who contributed it?
* Who originally expressed it?
* What was the source context?

---

## Principle 3 — Expertise Has Context

Authority influences weighting.

Authority does not control access.

Everyone may:

* Contribute
* Endorse
* Participate

Authority affects visibility, not permission.

---

## Principle 4 — Preserve Disagreement

The platform does not attempt to determine truth.

The platform should preserve:

* Consensus
* Minority viewpoints
* Contradictory opinions
* Emerging ideas

Conflicting advice should coexist.

---

## Principle 5 — AI Organizes Knowledge

AI is responsible for:

* Classification
* Retrieval
* Summarization
* Relationship discovery
* Search assistance

AI is not responsible for:

* Determining truth
* Assigning expertise
* Deciding correctness

---

# 1.4 Core Architecture Concept

Everything in Eidolon is ultimately represented as a Node.

Phase 1 primarily uses:

* Knowledge Chunks
* Topics
* Authority Profiles

Future phases may introduce:

* Books
* Series
* Characters
* Tropes
* Locations
* Organizations

The system must never assume all content is a Knowledge Chunk.

The system must assume all content is a Node.

---

# 1.5 User Profile

User Profiles represent private platform accounts.

Users are not public entities.

Responsibilities:

* Authentication
* Permissions
* Personal settings
* Managing authority identities

A user may own:

* Zero Authority Profiles
* One Authority Profile
* Multiple Authority Profiles

Example:

```text
User Account

owns

Author Pen Name A
Author Pen Name B
```

---

# 1.6 Authority Profile

Authority Profiles represent public identities.

Authority Profiles are separate from users.

Examples:

* Authors
* Industry professionals
* Community experts

Authority Profiles may exist before being claimed.

Example:

```text
Name: Example Author

Authority Level: Veteran

Claimed: False
```

---

# 1.7 Authority Levels

Only three levels exist.

## Novice

Examples:

* Aspiring authors
* New authors
* Readers

---

## Practitioner

Examples:

* Published authors
* Active creators

---

## Veteran

Examples:

* Established authors
* Long-term industry contributors

---

Authority level is manually curated.

Authority weighting uses only authority level.

It does not use:

* Sales
* Revenue
* Years active
* Book count
* Popularity

---

# 1.8 User ↔ Authority Relationship

Users and Authority Profiles are many-to-many.

Example:

```text
User

owns

John Smith
J.S. Raven
Night Raven
```

Authority Profiles may exist without ownership.

---

# 1.9 Knowledge Chunk

The Knowledge Chunk is the primary content type in Phase 1.

Examples:

* Reddit comment
* Discord discussion
* Interview excerpt
* Blog paragraph
* Personal insight

Each chunk contains:

```text
Original Content

Source Metadata

Attribution

AI Metadata
```

Example:

```text
Content:
"Readers are much more forgiving of..."

Source:
Reddit

Attributed To:
Author X

Summary:
Discussion of reader expectations...
```

---

# 1.10 Attribution

Contribution and Attribution are separate.

Example:

```text
Contributor:
Person who submitted the chunk

Attributed To:
Person who originally expressed the idea
```

This allows expert knowledge to be preserved even when submitted by others.

---

# 1.11 Endorsements

An endorsement means:

```text
This appears useful.
```

An endorsement does not mean:

```text
This is proven true.
```

No downvotes exist.

No negative reputation exists.

---

## Endorsement Weighting

Initial weights:

```text
Novice       1
Practitioner 5
Veteran      20
```

Values may change.

The principle remains fixed.

---

## Endorsement Identity

Users choose which authority profile they represent when endorsing.

Example:

```text
Endorse As:

Personal Account
John Smith (Veteran)
J.S. Raven (Practitioner)
```

Endorsements snapshot authority state at time of endorsement.

---

# 1.12 Topics

Topics are broad organizational categories.

Examples:

* Writing Craft
* Publishing
* Marketing
* Reader Psychology
* Covers
* Story Structure

---

# 1.13 Tags

Tags are narrow descriptors.

Examples:

* rapid release
* blurbs
* tropes
* genre expectations
* amazon ads

Topics organize knowledge.

Tags describe knowledge.

---

# 1.14 Knowledge Syntheses

Knowledge Syntheses are AI-generated summaries derived from groups of related knowledge.

They contain:

* Consensus viewpoints
* Common advice
* Contradictions
* Supporting evidence
* Source references

They remain secondary to original content.

Example:

```text
Book Covers

Consensus:
Genre signaling matters.

Disagreement:
Custom art versus market conformity.

Sources:
43 chunks
12 authors
```

---

# 1.15 Node-Based Future Expansion

Future content types should be implemented as new Node types.

Examples:

```text
BOOK
SERIES
CHARACTER
LOCATION
TROPE
ORGANIZATION
```

Future expansion must be additive.

No redesign of core systems should be required.

---

# Section 2 — Technical Stack

# 2.1 System Architecture

```text
Users

↓

React Web Application

↓

Cloudflare Pages

↓

Cloudflare Workers API

↓

D1
Vectorize
R2

↓

Workers AI
```

---

# 2.2 Frontend

## Framework

React + TypeScript

Reasons:

* Excellent AI coding support
* Large ecosystem
* Strong graph tooling
* Cloudflare compatibility

---

## Build Tool

Vite

Reasons:

* Fast development
* Simple deployment
* Low complexity

---

## UI Framework

Tailwind CSS

shadcn/ui

Reasons:

* Rapid development
* Consistent design
* AI-friendly component generation

---

# 2.3 Graph Visualization

## React Flow

Purpose:

Interactive graph exploration.

Nodes represent:

* Knowledge Chunks
* Topics
* Authority Profiles

Future:

* Books
* Series
* Characters
* Tropes

Edges represent:

* Related
* Supports
* Contradicts
* Derived From
* References

---

# 2.4 Backend

## Cloudflare Workers

Responsibilities:

* API layer
* Business logic
* AI orchestration
* Authentication validation

---

## API Framework

Hono

Reasons:

* Lightweight
* Type-safe
* Cloudflare-native

---

# 2.5 Database

## Cloudflare D1

Stores:

* Users
* Nodes
* Relationships
* Authority Profiles
* Knowledge Chunks
* Topics
* Endorsements

---

## ORM

Drizzle ORM

Reasons:

* Type safety
* Migration support
* Excellent AI compatibility

---

# 2.6 Vector Search

## Cloudflare Vectorize

Purpose:

Semantic retrieval.

Stores:

* Node embeddings

Supports:

* Search
* Similarity matching
* Related content discovery

---

# 2.7 AI

## Cloudflare Workers AI

Responsibilities:

### Ingestion

Generate:

* Summaries
* Topics
* Tags
* Relationships

### Search

Generate:

* Query embeddings
* Search assistance
* Knowledge synthesis

---

# 2.8 Storage

## Cloudflare R2

Stores:

* Attachments
* Images
* Cached source material
* Export files

---

# 2.9 Authentication

## Clerk

Required:

* Google OAuth

Future:

* Discord OAuth

User identity remains separate from Authority Profiles.

---

# Section 3 — Implementation Specification

# 3.1 Development Rules

AI development agents must:

1. Preserve separation between Users and Authority Profiles.
2. Never overwrite original content.
3. Preserve provenance.
4. Treat AI metadata as editable.
5. Use Authority Level as the only endorsement weighting factor.
6. Build all systems around Nodes, not specific content types.
7. Ensure future node types can be added without redesign.

---

# 3.2 Core Schema

## users

```sql
id
clerk_id
email
created_at
```

---

## node_types

```sql
id
name
```

Initial values:

```text
KNOWLEDGE_CHUNK
TOPIC
AUTHORITY_PROFILE
KNOWLEDGE_SYNTHESIS
```

Reserved for future:

```text
BOOK
SERIES
CHARACTER
LOCATION
TROPE
ORGANIZATION
ITEM
```

---

## nodes

```sql
id
node_type_id

title
summary

created_at
updated_at
```

This table represents every graph node.

---

## authority_profiles

```sql
node_id

display_name

authority_level

first_year_published

total_books_published

claimed

created_at
```

---

## user_authority_profiles

```sql
id

user_id

authority_profile_node_id

relationship_type
```

---

## knowledge_chunks

```sql
node_id

content

source_type

source_url

contributor_user_id

attributed_authority_profile_node_id
```

---

## topics

```sql
node_id

description
```

---

## tags

```sql
id

name
```

---

## node_tags

```sql
node_id

tag_id
```

---

## node_embeddings

```sql
node_id

embedding_reference
```

---

## endorsements

```sql
id

node_id

user_id

authority_profile_node_id

authority_level_snapshot

weight

created_at
```

Phase 1 limits endorsements to Knowledge Chunks and Knowledge Syntheses.

Schema remains future-proof.

---

## relationships

```sql
id

source_node_id

target_node_id

relationship_type

strength

created_at
```

Examples:

```text
RELATED

SUPPORTS

CONTRADICTS

DERIVED_FROM

REFERENCES
```

---

# 3.3 Knowledge Ingestion Workflow

```text
User submits content

↓

Validation

↓

Create Node

↓

Create Knowledge Chunk

↓

Store Original Content

↓

Workers AI Processing

↓

Generate

Summary
Topics
Tags
Relationships

↓

Generate Embedding

↓

Store in Vectorize

↓

Moderation Review

↓

Publish
```

---

# 3.4 Search Workflow

```text
User Question

↓

Embedding Generation

↓

Vector Search

↓

Node Retrieval

↓

Relationship Expansion

↓

Authority Context Retrieval

↓

LLM Synthesis

↓

Response with Sources
```

Search operates on Nodes, not Knowledge Chunks.

---

# 3.5 Graph Rendering

Graph loading must be incremental.

Never load the entire graph.

Initial load:

```text
Topics
```

Expansion:

```text
Topic

↓

Knowledge Chunks

↓

Authority Profiles

↓

Related Topics
```

Future node types must work without renderer changes.

---

# 3.6 AI Metadata Generation

Generated metadata should include:

```text
Summary

Topics

Tags

Key Concepts

Related Nodes

Suggested Relationships
```

All generated metadata remains editable.

---

# 3.7 Future Expansion Requirements

Future node types must:

1. Register a Node Type.
2. Create an extension table.
3. Reuse existing relationships.
4. Reuse embeddings.
5. Reuse graph rendering.
6. Reuse search pipeline.

Future phases must not require:

* Search redesign
* Graph redesign
* Embedding redesign
* Relationship redesign
* API redesign

---

# 3.8 Future AI Agent Roles

## Database Agent

Responsible for:

* Schema
* Migrations
* Queries

---

## Frontend Agent

Responsible for:

* React components
* Search UX
* Graph interface

---

## AI Pipeline Agent

Responsible for:

* Embeddings
* Summaries
* Retrieval
* Synthesis

---

## Knowledge Curation Agent

Responsible for:

* Duplicate detection
* Metadata review
* Relationship suggestions

---

# Final Product Definition

Eidolon is a provenance-driven, authority-weighted, AI-enhanced knowledge graph designed to preserve and organize human expertise.

Its foundation is a generic node-based architecture that supports both present and future knowledge domains without requiring architectural redesign.

Its value is derived from:

```text
Human Experience

+

Source Preservation

+

Authority Context

+

Community Endorsement

+

AI Organization

=

A Living Knowledge Graph
```

This document serves as the source of truth for all future implementation and architectural decisions.
