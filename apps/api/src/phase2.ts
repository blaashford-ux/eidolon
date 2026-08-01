const supportedSourceTypes = ['reddit', 'discord', 'blog', 'interview', 'manual'] as const;

const seedAuthorityProfiles = [
  {
    displayName: 'Aster Vale',
    authorityLevel: 'Veteran',
    claimed: true,
    topics: ['Writing Craft', 'Reader Psychology']
  },
  {
    displayName: 'Rex Marlowe',
    authorityLevel: 'Practitioner',
    claimed: false,
    topics: ['Marketing', 'Rapid Release']
  },
  {
    displayName: 'Lena Kade',
    authorityLevel: 'Novice',
    claimed: true,
    topics: ['Cover Design']
  }
] as const;

const seedGraphTopics = [
  {
    title: 'Writing Craft',
    description: 'Pacing, scene construction, and prose-level craft guidance.'
  },
  {
    title: 'Reader Psychology',
    description: 'Retention, payoff, and expectation-setting patterns.'
  },
  {
    title: 'Marketing',
    description: 'Discovery, positioning, and conversion tactics.'
  },
  {
    title: 'Rapid Release',
    description: 'Cadence, iteration, and launch rhythm strategies.'
  },
  {
    title: 'Cover Design',
    description: 'Visual hierarchy and genre signaling on covers.'
  },
  {
    title: 'Pacing',
    description: 'Rhythm, tension, and momentum in long-form fiction.'
  },
  {
    title: 'Series Planning',
    description: 'Planning promise, payoff, and installment structure.'
  },
  {
    title: 'Blurbs',
    description: 'Short-form packaging and conversion copy.'
  },
  {
    title: 'Genre Signaling',
    description: 'Instant recognition cues for readers and ads.'
  }
] as const;

const seedSubmissions = [
  {
    title: 'Reader forgiveness on pacing dips in long series',
    content: 'Readers are often more forgiving about pacing dips if promise and payoff stay clear.',
    sourceType: 'reddit',
    sourceUrl: 'https://reddit.com/r/haremlit/example-1',
    contributorName: 'Casey Writer',
    attributedAuthority: 'Aster Vale',
    tags: ['Pacing', 'Reader Psychology', 'Series Planning']
  },
  {
    title: 'Rapid release and blurb iteration playbook',
    content: 'Blurbs can carry most conversion gains before ad scaling if tested in short cycles.',
    sourceType: 'discord',
    sourceUrl: '',
    contributorName: 'Nora Draft',
    attributedAuthority: 'Rex Marlowe',
    tags: ['Marketing', 'Rapid Release', 'Blurbs']
  },
  {
    title: 'Cover typography hierarchy and genre signaling',
    content: 'Title hierarchy often does more work than artwork detail for instant genre read.',
    sourceType: 'blog',
    sourceUrl: 'https://example.com/covers-genre-signaling',
    contributorName: 'Miles Finch',
    attributedAuthority: 'Lena Kade',
    tags: ['Cover Design', 'Genre Signaling']
  }
] as const;

const moderationSeed = [
  {
    id: 'mod-401',
    title: 'Rapid release and blurb iteration playbook',
    status: 'Pending' as const,
    duplicateHint: 'Potential overlap with sub-087 (71%).',
    qualityHint: 'Missing source URL proof context.',
    submittedBy: 'Nora Draft'
  },
  {
    id: 'mod-402',
    title: 'Book cover hierarchy in KU categories',
    status: 'Approved' as const,
    duplicateHint: 'No significant duplicates detected.',
    qualityHint: 'Well-attributed source excerpt.',
    submittedBy: 'Casey Writer'
  }
] as const;

const endorsementSeed = [
  {
    id: 'end-901',
    nodeTitle: 'Reader forgiveness on pacing dips in long series',
    authorityLevelSnapshot: 'Veteran',
    weight: 20,
    timestamp: '2026-07-24T16:12:00Z'
  },
  {
    id: 'end-902',
    nodeTitle: 'Rapid release and blurb iteration playbook',
    authorityLevelSnapshot: 'Practitioner',
    weight: 5,
    timestamp: '2026-07-26T10:40:00Z'
  }
] as const;

let phase2Ready: Promise<void> | null = null;
let phase4Ready: Promise<void> | null = null;

const EMBEDDING_MODEL = '@cf/baai/bge-base-en-v1.5';
const SUMMARY_MODEL = '@cf/facebook/bart-large-cnn';
const PHASE4_EMBEDDING_NAMESPACE = 'knowledge-chunks';

type Phase4Services = {
  AI?: Ai;
  VECTORIZE?: VectorizeIndex;
  semanticEnabled?: boolean;
  enrichmentEnabled?: boolean;
};

function slugify(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/^\.+|\.+$/g, '') || 'user';
}

function prefixedId(prefix: string, value: number | string): string {
  return `${prefix}-${value}`;
}

function splitCsv(value: string | null): string[] {
  return value ? value.split(',').map((part) => part.trim()).filter(Boolean) : [];
}

function tokenizeQuery(query: string): string[] {
  return query
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 2);
}

function normalizedText(...values: Array<string | null | undefined>): string {
  return values.filter(Boolean).join(' ').toLowerCase();
}

function lexicalScore(text: string, tokens: string[]): number {
  if (tokens.length === 0) {
    return 0;
  }

  let score = 0;
  for (const token of tokens) {
    if (text.includes(token)) {
      score += 1;
    }
  }

  if (tokens.length > 1) {
    const phrase = tokens.join(' ');
    if (text.includes(phrase)) {
      score += tokens.length;
    }
  }

  return score;
}

type SearchResultKind = 'chunk' | 'topic';

interface SearchCandidate {
  id: string;
  title: string;
  snippet: string;
  sourceType: string;
  attributedAuthority: string;
  kind: SearchResultKind;
  authorityLevel?: string;
  lexicalScore: number;
}

function compact<T>(values: Array<T | null | undefined>): T[] {
  return values.filter((value): value is T => value != null);
}

function isEnabled(value: string | undefined, fallback = true): boolean {
  if (value === undefined) {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();
  return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on';
}

function authorityWeight(level: string | null): number {
  if (level === 'Veteran') {
    return 20;
  }
  if (level === 'Practitioner') {
    return 5;
  }
  if (level === 'Novice') {
    return 1;
  }
  return 1;
}

function toVectorId(nodeId: number): string {
  return `node-${nodeId}`;
}

function parseVectorNodeId(value: string): number | null {
  const match = value.match(/^node-(\d+)$/);
  if (!match) {
    return null;
  }

  const parsed = Number.parseInt(match[1] ?? '', 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function inferTagsFromText(title: string, content: string): string[] {
  const text = `${title} ${content}`.toLowerCase();
  const inferred = new Set<string>();

  for (const topic of seedGraphTopics) {
    const normalized = topic.title.toLowerCase();
    if (text.includes(normalized)) {
      inferred.add(topic.title);
    }
  }

  const keywords = ['pacing', 'reader', 'series', 'rapid', 'release', 'marketing', 'blurb', 'cover', 'genre'];
  for (const keyword of keywords) {
    if (text.includes(keyword)) {
      const label = keyword
        .split(' ')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
      inferred.add(label);
    }
  }

  return [...inferred].slice(0, 8);
}

function bestEffortSummary(content: string): string {
  const trimmed = content.trim();
  if (trimmed.length <= 220) {
    return trimmed;
  }

  const breakpoint = trimmed.slice(0, 220).lastIndexOf(' ');
  if (breakpoint > 80) {
    return `${trimmed.slice(0, breakpoint)}...`;
  }

  return `${trimmed.slice(0, 220)}...`;
}

async function tableHasColumn(db: D1Database, table: string, column: string): Promise<boolean> {
  const result = await db.prepare(`PRAGMA table_info(${table})`).all<{ name: string }>();
  return result.results.some((row) => row.name === column);
}

async function ensureUsersDisplayName(db: D1Database): Promise<void> {
  const tableInfo = await db.prepare('PRAGMA table_info(users)').all<{ name: string }>();

  if (tableInfo.results.length === 0) {
    await db.exec('CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, clerk_id TEXT NOT NULL UNIQUE, email TEXT NOT NULL, display_name TEXT NOT NULL, created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000));');
    return;
  }

  if (!tableInfo.results.some((row) => row.name === 'display_name')) {
    await db.exec('ALTER TABLE users ADD COLUMN display_name TEXT');
  }
}

async function getNodeTypeId(db: D1Database, name: string): Promise<number> {
  const row = await db.prepare('SELECT id FROM node_types WHERE name = ?').bind(name).first<{ id: number }>();
  if (!row) {
    throw new Error(`Missing node type: ${name}`);
  }
  return row.id;
}

async function getOrCreateUserId(db: D1Database, displayName: string): Promise<number> {
  const clerkId = `phase2:${slugify(displayName)}`;
  const email = `${slugify(displayName)}@contributors.local`;

  const existing = await db.prepare('SELECT id FROM users WHERE clerk_id = ?').bind(clerkId).first<{ id: number }>();
  if (existing) {
    return existing.id;
  }

  const result = await db
    .prepare('INSERT INTO users (clerk_id, email, display_name) VALUES (?, ?, ?)')
    .bind(clerkId, email, displayName)
    .run();
  return result.meta.last_row_id as number;
}

async function ensureTagId(db: D1Database, name: string): Promise<number> {
  const existing = await db.prepare('SELECT id FROM tags WHERE name = ?').bind(name).first<{ id: number }>();
  if (existing) {
    return existing.id;
  }

  const result = await db.prepare('INSERT INTO tags (name) VALUES (?)').bind(name).run();
  return result.meta.last_row_id as number;
}

async function seedAuthorityProfilesIfNeeded(db: D1Database): Promise<void> {
  const count = await db.prepare('SELECT COUNT(*) AS count FROM authority_profiles').first<{ count: number }>();
  if ((count?.count || 0) > 0) {
    return;
  }

  const nodeTypeId = await getNodeTypeId(db, 'AUTHORITY_PROFILE');

  for (const profile of seedAuthorityProfiles) {
    const nodeResult = await db
      .prepare('INSERT INTO nodes (node_type_id, title, summary) VALUES (?, ?, ?)')
      .bind(nodeTypeId, profile.displayName, profile.authorityLevel)
      .run();
    const nodeId = nodeResult.meta.last_row_id as number;

    await db
      .prepare('INSERT INTO authority_profiles (node_id, display_name, authority_level, claimed) VALUES (?, ?, ?, ?)')
      .bind(nodeId, profile.displayName, profile.authorityLevel, profile.claimed ? 1 : 0)
      .run();

    for (const topic of profile.topics) {
      const tagId = await ensureTagId(db, topic);
      await db.prepare('INSERT INTO node_tags (node_id, tag_id) VALUES (?, ?)').bind(nodeId, tagId).run();
    }
  }
}

async function seedKnowledgeChunksIfNeeded(db: D1Database): Promise<void> {
  const count = await db.prepare('SELECT COUNT(*) AS count FROM knowledge_chunks').first<{ count: number }>();
  if ((count?.count || 0) > 0) {
    return;
  }

  const nodeTypeId = await getNodeTypeId(db, 'KNOWLEDGE_CHUNK');

  for (const item of seedSubmissions) {
    const contributorUserId = await getOrCreateUserId(db, item.contributorName);
    const attributedAuthority = await db
      .prepare('SELECT node_id AS nodeId FROM authority_profiles WHERE display_name = ?')
      .bind(item.attributedAuthority)
      .first<{ nodeId: number }>();

    if (!attributedAuthority) {
      throw new Error(`Missing authority profile seed: ${item.attributedAuthority}`);
    }

    const nodeResult = await db
      .prepare('INSERT INTO nodes (node_type_id, title, summary) VALUES (?, ?, ?)')
      .bind(nodeTypeId, item.title, item.content.slice(0, 160))
      .run();
    const nodeId = nodeResult.meta.last_row_id as number;

    await db
      .prepare(
        'INSERT INTO knowledge_chunks (node_id, content, source_type, source_url, contributor_user_id, attributed_authority_profile_node_id) VALUES (?, ?, ?, ?, ?, ?)'
      )
      .bind(nodeId, item.content, item.sourceType, item.sourceUrl || null, contributorUserId, attributedAuthority.nodeId)
      .run();

    for (const tagName of item.tags) {
      const tagId = await ensureTagId(db, tagName);
      await db.prepare('INSERT INTO node_tags (node_id, tag_id) VALUES (?, ?)').bind(nodeId, tagId).run();
    }
  }
}

async function seedGraphTopicsIfNeeded(db: D1Database): Promise<void> {
  const count = await db.prepare('SELECT COUNT(*) AS count FROM topics').first<{ count: number }>();
  if ((count?.count || 0) > 0) {
    return;
  }

  const nodeTypeId = await getNodeTypeId(db, 'TOPIC');

  for (const topic of seedGraphTopics) {
    const nodeResult = await db
      .prepare('INSERT INTO nodes (node_type_id, title, summary) VALUES (?, ?, ?)')
      .bind(nodeTypeId, topic.title, topic.description)
      .run();
    const nodeId = nodeResult.meta.last_row_id as number;

    await db
      .prepare('INSERT INTO topics (node_id, description) VALUES (?, ?)')
      .bind(nodeId, topic.description)
      .run();
  }
}

export async function ensurePhase2Data(db: D1Database): Promise<void> {
  phase2Ready ??= (async () => {
    await ensureUsersDisplayName(db);
    await seedAuthorityProfilesIfNeeded(db);
    await seedKnowledgeChunksIfNeeded(db);
    await seedGraphTopicsIfNeeded(db);
  })();

  await phase2Ready;
}

async function generateEmbedding(ai: Ai | undefined, text: string): Promise<number[] | null> {
  if (!ai) {
    return null;
  }

  const response = (await ai.run(EMBEDDING_MODEL, { text: [text] })) as {
    data?: number[][];
    shape?: number[];
  };

  const vector = response.data?.[0];
  return Array.isArray(vector) ? vector : null;
}

async function generateSummary(ai: Ai | undefined, content: string): Promise<string> {
  if (!ai) {
    return bestEffortSummary(content);
  }

  try {
    const response = (await ai.run(SUMMARY_MODEL, {
      input_text: content,
      max_length: 140
    })) as { summary?: string };
    if (response.summary && response.summary.trim().length > 0) {
      return response.summary.trim();
    }
  } catch (error) {
    console.warn('Summary generation fallback:', error);
  }

  return bestEffortSummary(content);
}

async function upsertNodeTags(db: D1Database, nodeId: number, tags: string[]): Promise<void> {
  for (const tagName of tags) {
    const normalized = tagName.trim();
    if (!normalized) {
      continue;
    }

    const tagId = await ensureTagId(db, normalized);
    await db.prepare('INSERT OR IGNORE INTO node_tags (node_id, tag_id) VALUES (?, ?)').bind(nodeId, tagId).run();
  }
}

async function upsertSuggestedRelationships(db: D1Database, nodeId: number): Promise<void> {
  const related = await db
    .prepare(
      `SELECT nt2.node_id AS relatedNodeId, COUNT(*) AS overlap
      FROM node_tags nt1
      JOIN node_tags nt2 ON nt2.tag_id = nt1.tag_id
      WHERE nt1.node_id = ? AND nt2.node_id != ?
      GROUP BY nt2.node_id
      HAVING overlap > 0
      ORDER BY overlap DESC, nt2.node_id ASC
      LIMIT 5`
    )
    .bind(nodeId, nodeId)
    .all<{ relatedNodeId: number; overlap: number }>();

  for (const row of related.results) {
    await db
      .prepare(
        `INSERT INTO relationships (source_node_id, target_node_id, relationship_type, strength)
         SELECT ?, ?, 'RELATED', ?
         WHERE NOT EXISTS (
           SELECT 1 FROM relationships
           WHERE source_node_id = ? AND target_node_id = ? AND relationship_type = 'RELATED'
         )`
      )
      .bind(nodeId, row.relatedNodeId, row.overlap, nodeId, row.relatedNodeId)
      .run();
  }
}

async function upsertVectorRecord(db: D1Database, services: Phase4Services, nodeId: number, embedding: number[]): Promise<void> {
  const vectorId = toVectorId(nodeId);
  const vectorize = services.VECTORIZE;

  if (vectorize) {
    await vectorize.upsert([
      {
        id: vectorId,
        namespace: PHASE4_EMBEDDING_NAMESPACE,
        values: embedding,
        metadata: {
          nodeId,
          nodeType: 'KNOWLEDGE_CHUNK'
        }
      }
    ]);
  }

  await db
    .prepare('INSERT OR REPLACE INTO node_embeddings (node_id, embedding_reference) VALUES (?, ?)')
    .bind(nodeId, vectorId)
    .run();
}

async function enrichAndIndexChunk(db: D1Database, services: Phase4Services, nodeId: number): Promise<void> {
  const row = await db
    .prepare(
      `SELECT
        n.id AS nodeId,
        n.title AS title,
        n.summary AS summary,
        k.content AS content
      FROM nodes n
      JOIN knowledge_chunks k ON k.node_id = n.id
      WHERE n.id = ?`
    )
    .bind(nodeId)
    .first<{ nodeId: number; title: string; summary: string | null; content: string }>();

  if (!row) {
    return;
  }

  const shouldEnrich = services.enrichmentEnabled !== false;
  const ai = services.AI;

  if (shouldEnrich) {
    const summary = await generateSummary(ai, row.content);
    await db.prepare('UPDATE nodes SET summary = ?, updated_at = (unixepoch() * 1000) WHERE id = ?').bind(summary, row.nodeId).run();

    const inferredTags = inferTagsFromText(row.title, `${row.content} ${summary}`);
    await upsertNodeTags(db, row.nodeId, inferredTags);
    await upsertSuggestedRelationships(db, row.nodeId);
  }

  const embedding = await generateEmbedding(ai, `${row.title}\n\n${row.content}`);
  if (embedding && embedding.length > 0) {
    await upsertVectorRecord(db, services, row.nodeId, embedding);
  }
}

export async function ensurePhase4Data(db: D1Database, services: Phase4Services): Promise<void> {
  const shouldRun = services.semanticEnabled !== false || services.enrichmentEnabled !== false;
  if (!shouldRun) {
    return;
  }

  phase4Ready ??= (async () => {
    const rows = await db
      .prepare(
        `SELECT n.id AS nodeId
         FROM nodes n
         JOIN knowledge_chunks k ON k.node_id = n.id
         ORDER BY n.id ASC`
      )
      .all<{ nodeId: number }>();

    for (const row of rows.results) {
      try {
        await enrichAndIndexChunk(db, services, row.nodeId);
      } catch (error) {
        console.warn(`Phase 4 enrichment skipped for node ${row.nodeId}:`, error);
      }
    }
  })();

  await phase4Ready;
}

export async function getCapabilities(env?: Partial<Env>) {
  const semanticEnabled = isEnabled(env?.SEMANTIC_SEARCH_ENABLED, true);

  return {
    graph: true,
    semanticSearch: semanticEnabled,
    moderationAutomation: false,
    synthesis: false
  };
}

async function searchNodeCandidates(db: D1Database, query: string): Promise<SearchCandidate[]> {
  const tokens = tokenizeQuery(query);
  if (tokens.length === 0) {
    return [];
  }

  const chunkRows = await db
    .prepare(
      `SELECT
        n.id AS nodeId,
        n.title AS title,
        COALESCE(n.summary, substr(k.content, 1, 180)) AS snippet,
        k.source_type AS sourceType,
        COALESCE(ap.display_name, 'Unattributed') AS attributedAuthority,
        COALESCE(ap.authority_level, 'Novice') AS authorityLevel,
        COALESCE(GROUP_CONCAT(DISTINCT t.name), '') AS tags,
        COALESCE(tp.description, '') AS topicDescription
      FROM nodes n
      JOIN knowledge_chunks k ON k.node_id = n.id
      LEFT JOIN authority_profiles ap ON ap.node_id = k.attributed_authority_profile_node_id
      LEFT JOIN node_tags nt ON nt.node_id = n.id
      LEFT JOIN tags t ON t.id = nt.tag_id
      LEFT JOIN topics tp ON tp.node_id = n.id
      GROUP BY n.id`
    )
    .all<{
      nodeId: number;
      title: string;
      snippet: string;
      sourceType: string;
      attributedAuthority: string;
      authorityLevel: string;
      tags: string;
      topicDescription: string;
    }>();

  const topicRows = await db
    .prepare(
      `SELECT
        n.id AS nodeId,
        n.title AS title,
        COALESCE(tp.description, n.summary, 'Topic entry point') AS snippet
      FROM topics tp
      JOIN nodes n ON n.id = tp.node_id`
    )
    .all<{ nodeId: number; title: string; snippet: string }>();

  const chunkCandidates = chunkRows.results
    .map((row) => {
      const text = normalizedText(row.title, row.snippet, row.sourceType, row.attributedAuthority, row.tags, row.topicDescription);
      const score = lexicalScore(text, tokens);
      if (score === 0) {
        return null;
      }

      return {
        id: prefixedId('sub', row.nodeId),
        title: row.title,
        snippet: row.snippet,
        sourceType: row.sourceType,
        attributedAuthority: row.attributedAuthority,
        kind: 'chunk' as const,
        authorityLevel: row.authorityLevel,
        lexicalScore: score
      } satisfies SearchCandidate;
    });

  const topicCandidates = topicRows.results
    .map((row) => {
      const text = normalizedText(row.title, row.snippet);
      const score = lexicalScore(text, tokens);
      if (score === 0) {
        return null;
      }

      return {
        id: prefixedId('topic', row.nodeId),
        title: row.title,
        snippet: row.snippet,
        sourceType: 'topic',
        attributedAuthority: '',
        kind: 'topic' as const,
        lexicalScore: score
      } satisfies SearchCandidate;
    });

  return compact([...chunkCandidates, ...topicCandidates]);
}

function parseGraphNodeId(rawId: string): { kind: 'topic' | 'chunk' | 'authority'; nodeId: number } | null {
  const match = rawId.match(/^(topic|sub|auth)-(\d+)$/);
  if (!match) {
    return null;
  }

  return {
    kind: match[1] === 'sub' ? 'chunk' : match[1] === 'auth' ? 'authority' : 'topic',
    nodeId: Number.parseInt(match[2] ?? '', 10)
  };
}

export async function listGraphTopics(db: D1Database, page: number, pageSize: number) {
  const offset = (page - 1) * pageSize;

  const total = await db.prepare('SELECT COUNT(*) AS total FROM topics').first<{ total: number }>();
  const rows = await db
    .prepare(
      `SELECT
        n.id AS nodeId,
        n.title AS title,
        n.summary AS summary,
        COUNT(DISTINCT nt.node_id) AS chunkCount
      FROM topics tp
      JOIN nodes n ON n.id = tp.node_id
      LEFT JOIN tags t ON t.name = n.title
      LEFT JOIN node_tags nt ON nt.tag_id = t.id
      GROUP BY n.id
      ORDER BY chunkCount DESC, n.title COLLATE NOCASE
      LIMIT ? OFFSET ?`
    )
    .bind(pageSize, offset)
    .all<{ nodeId: number; title: string; summary: string | null; chunkCount: number }>();

  return {
    nodes: rows.results.map((row) => ({
      id: prefixedId('topic', row.nodeId),
      role: 'topic' as const,
      title: row.title,
      summary: row.summary || 'Topic entry point',
      subtitle: `${row.chunkCount} linked chunk${row.chunkCount === 1 ? '' : 's'}`,
      expandable: true,
      chunkCount: row.chunkCount,
      kind: 'topic' as const
    })),
    edges: [],
    pagination: {
      page,
      pageSize,
      total: total?.total || 0
    }
  };
}

async function expandTopicNode(db: D1Database, nodeId: number, limit: number) {
  const topic = await db
    .prepare(
      `SELECT
        n.id AS nodeId,
        n.title AS title,
        n.summary AS summary
      FROM topics tp
      JOIN nodes n ON n.id = tp.node_id
      WHERE n.id = ?`
    )
    .bind(nodeId)
    .first<{ nodeId: number; title: string; summary: string | null }>();

  if (!topic) {
    return null;
  }

  const rows = await db
    .prepare(
      `SELECT DISTINCT
        n.id AS nodeId,
        n.title AS title,
        COALESCE(n.summary, substr(k.content, 1, 180)) AS summary,
        k.source_type AS sourceType,
        COALESCE(ap.display_name, 'Unattributed') AS attributedAuthority,
        COALESCE(ap.authority_level, 'Unknown') AS authorityLevel
      FROM nodes n
      JOIN knowledge_chunks k ON k.node_id = n.id
      JOIN node_tags nt ON nt.node_id = n.id
      JOIN tags t ON t.id = nt.tag_id
      LEFT JOIN authority_profiles ap ON ap.node_id = k.attributed_authority_profile_node_id
      WHERE t.name = ?
      ORDER BY n.created_at DESC, n.id DESC
      LIMIT ?`
    )
    .bind(topic.title, limit)
    .all<{
      nodeId: number;
      title: string;
      summary: string;
      sourceType: string;
      attributedAuthority: string;
      authorityLevel: string;
    }>();

  const nodes = rows.results.map((row, index) => ({
    id: prefixedId('sub', row.nodeId),
    role: 'chunk' as const,
    title: row.title,
    summary: row.summary,
    subtitle: `${row.sourceType} • ${row.attributedAuthority}`,
    expandable: true,
    parentId: prefixedId('topic', nodeId),
    kind: 'chunk' as const,
    sourceType: row.sourceType,
    attributedAuthority: row.attributedAuthority,
    authorityLevel: row.authorityLevel,
    siblingIndex: index
  }));

  return {
    nodes,
    edges: nodes.map((child) => ({
      id: `edge-${prefixedId('topic', nodeId)}-${child.id}`,
      source: prefixedId('topic', nodeId),
      target: child.id,
      relationshipType: 'RELATED'
    })),
    centerId: prefixedId('topic', nodeId)
  };
}

async function expandChunkNode(db: D1Database, nodeId: number, limit: number, excludeTopicNodeId?: number | null) {
  const chunk = await db
    .prepare(
      `SELECT
        n.id AS nodeId,
        n.title AS title,
        COALESCE(n.summary, substr(k.content, 1, 180)) AS summary,
        k.source_type AS sourceType,
        COALESCE(ap.display_name, 'Unattributed') AS attributedAuthority,
        COALESCE(ap.authority_level, 'Unknown') AS authorityLevel,
        COALESCE(ap.claimed, 0) AS authorityClaimed
      FROM nodes n
      JOIN knowledge_chunks k ON k.node_id = n.id
      LEFT JOIN authority_profiles ap ON ap.node_id = k.attributed_authority_profile_node_id
      WHERE n.id = ?`
    )
    .bind(nodeId)
    .first<{
      nodeId: number;
      title: string;
      summary: string | null;
      sourceType: string;
      attributedAuthority: string;
      authorityLevel: string;
      authorityClaimed: number;
    }>();

  if (!chunk) {
    return null;
  }

  const authority = await db
    .prepare(
      `SELECT
        ap.node_id AS nodeId,
        ap.display_name AS displayName,
        ap.authority_level AS authorityLevel,
        ap.claimed AS claimed,
        COALESCE(GROUP_CONCAT(DISTINCT t.name), '') AS topics
      FROM knowledge_chunks k
      JOIN authority_profiles ap ON ap.node_id = k.attributed_authority_profile_node_id
      LEFT JOIN node_tags nt ON nt.node_id = ap.node_id
      LEFT JOIN tags t ON t.id = nt.tag_id
      WHERE k.node_id = ?
      GROUP BY ap.node_id`
    )
    .bind(nodeId)
    .first<{ nodeId: number; displayName: string; authorityLevel: string; claimed: number; topics: string }>();

  const relatedTopicRows = await db
    .prepare(
      `SELECT DISTINCT
        n.id AS nodeId,
        n.title AS title,
        n.summary AS summary
      FROM node_tags nt
      JOIN tags t ON t.id = nt.tag_id
      JOIN nodes n ON n.title = t.name
      JOIN topics tp ON tp.node_id = n.id
      WHERE nt.node_id = ?
        AND n.id != ?
      ORDER BY n.title COLLATE NOCASE
      LIMIT ?`
    )
    .bind(nodeId, excludeTopicNodeId || -1, limit)
    .all<{ nodeId: number; title: string; summary: string | null }>();

  const nodes = [
    ...(authority
      ? [
          {
            id: prefixedId('auth', authority.nodeId),
            role: 'authority' as const,
            title: authority.displayName,
            summary: `Authority level: ${authority.authorityLevel}`,
            subtitle: authority.claimed ? 'Claimed profile' : 'Unclaimed profile',
            expandable: false,
            parentId: prefixedId('sub', nodeId),
            kind: 'authority' as const,
            authorityLevel: authority.authorityLevel,
            claimed: !!authority.claimed,
            topics: splitCsv(authority.topics)
          }
        ]
      : []),
    ...relatedTopicRows.results.map((row, index) => ({
      id: prefixedId('topic', row.nodeId),
      role: 'related-topic' as const,
      title: row.title,
      summary: row.summary || 'Related topic',
      subtitle: 'Shared topic tag',
      expandable: true,
      parentId: prefixedId('sub', nodeId),
      kind: 'topic' as const,
      siblingIndex: index
    }))
  ];

  const edges = [
    ...(authority
      ? [
          {
            id: `edge-${prefixedId('sub', nodeId)}-${prefixedId('auth', authority.nodeId)}`,
            source: prefixedId('sub', nodeId),
            target: prefixedId('auth', authority.nodeId),
            relationshipType: 'DERIVED_FROM' as const
          }
        ]
      : []),
    ...relatedTopicRows.results.map((row) => ({
      id: `edge-${prefixedId('sub', nodeId)}-${prefixedId('topic', row.nodeId)}`,
      source: prefixedId('sub', nodeId),
      target: prefixedId('topic', row.nodeId),
      relationshipType: 'RELATED' as const
    }))
  ];

  return {
    nodes,
    edges,
    centerId: prefixedId('sub', nodeId)
  };
}

export async function expandGraphNode(db: D1Database, rawId: string, limit: number, excludeTopicNodeId?: number | null) {
  const parsed = parseGraphNodeId(rawId);
  if (!parsed) {
    return null;
  }

  if (parsed.kind === 'topic') {
    return expandTopicNode(db, parsed.nodeId, limit);
  }

  if (parsed.kind === 'chunk') {
    return expandChunkNode(db, parsed.nodeId, limit, excludeTopicNodeId);
  }

  return {
    nodes: [],
    edges: [],
    centerId: prefixedId('auth', parsed.nodeId)
  };
}

export async function listAuthorityProfiles(db: D1Database) {
  const rows = await db
    .prepare(
      `SELECT
        ap.node_id AS nodeId,
        ap.display_name AS displayName,
        ap.authority_level AS authorityLevel,
        ap.claimed AS claimed,
        COALESCE(GROUP_CONCAT(DISTINCT t.name), '') AS topics
      FROM authority_profiles ap
      LEFT JOIN node_tags nt ON nt.node_id = ap.node_id
      LEFT JOIN tags t ON t.id = nt.tag_id
      GROUP BY ap.node_id
      ORDER BY ap.display_name COLLATE NOCASE`
    )
    .all<{ nodeId: number; displayName: string; authorityLevel: string; claimed: number; topics: string }>();

  return rows.results.map((row) => ({
    id: prefixedId('auth', row.nodeId),
    displayName: row.displayName,
    authorityLevel: row.authorityLevel,
    claimed: !!row.claimed,
    topics: splitCsv(row.topics)
  }));
}

export async function getAuthorityProfile(db: D1Database, rawId: string) {
  const nodeId = Number.parseInt(rawId.replace(/^auth-/, ''), 10);
  if (!Number.isFinite(nodeId)) {
    return null;
  }

  const row = await db
    .prepare(
      `SELECT
        ap.node_id AS nodeId,
        ap.display_name AS displayName,
        ap.authority_level AS authorityLevel,
        ap.claimed AS claimed,
        COALESCE(GROUP_CONCAT(DISTINCT t.name), '') AS topics
      FROM authority_profiles ap
      LEFT JOIN node_tags nt ON nt.node_id = ap.node_id
      LEFT JOIN tags t ON t.id = nt.tag_id
      WHERE ap.node_id = ?
      GROUP BY ap.node_id`
    )
    .bind(nodeId)
    .first<{ nodeId: number; displayName: string; authorityLevel: string; claimed: number; topics: string }>();

  if (!row) {
    return null;
  }

  return {
    id: prefixedId('auth', row.nodeId),
    displayName: row.displayName,
    authorityLevel: row.authorityLevel,
    claimed: !!row.claimed,
    topics: splitCsv(row.topics)
  };
}

export async function claimAuthorityProfile(db: D1Database, rawId: string) {
  const nodeId = Number.parseInt(rawId.replace(/^auth-/, ''), 10);
  if (!Number.isFinite(nodeId)) {
    return null;
  }

  const existing = await db.prepare('SELECT node_id AS nodeId FROM authority_profiles WHERE node_id = ?').bind(nodeId).first<{ nodeId: number }>();
  if (!existing) {
    return null;
  }

  await db.prepare('UPDATE authority_profiles SET claimed = 1 WHERE node_id = ?').bind(nodeId).run();
  return getAuthorityProfile(db, rawId);
}

export async function createSubmission(
  db: D1Database,
  payload: {
    title: string;
    content: string;
    sourceType: (typeof supportedSourceTypes)[number];
    sourceUrl?: string;
    contributor: string;
    attributedAuthority: string;
  },
  services?: Phase4Services
) {
  const nodeTypeId = await getNodeTypeId(db, 'KNOWLEDGE_CHUNK');
  const contributorUserId = await getOrCreateUserId(db, payload.contributor);
  const authority = await db
    .prepare('SELECT node_id AS nodeId FROM authority_profiles WHERE display_name = ?')
    .bind(payload.attributedAuthority)
    .first<{ nodeId: number }>();

  if (!authority) {
    throw new Error('Select a valid attribution profile before submitting.');
  }

  const nodeResult = await db
    .prepare('INSERT INTO nodes (node_type_id, title, summary) VALUES (?, ?, ?)')
    .bind(nodeTypeId, payload.title, payload.content.slice(0, 160))
    .run();
  const nodeId = nodeResult.meta.last_row_id as number;

  await db
    .prepare(
      'INSERT INTO knowledge_chunks (node_id, content, source_type, source_url, contributor_user_id, attributed_authority_profile_node_id) VALUES (?, ?, ?, ?, ?, ?)'
    )
    .bind(nodeId, payload.content, payload.sourceType, payload.sourceUrl || null, contributorUserId, authority.nodeId)
    .run();

  if (services) {
    try {
      await enrichAndIndexChunk(db, services, nodeId);
    } catch (error) {
      console.warn(`Submission enrichment fallback for node ${nodeId}:`, error);
    }
  }

  return getSubmission(db, prefixedId('sub', nodeId));
}

export async function listSubmissions(db: D1Database) {
  const rows = await db
    .prepare(
      `SELECT
        n.id AS nodeId,
        n.title AS title,
        n.summary AS summary,
        k.content AS content,
        k.source_type AS sourceType,
        k.source_url AS sourceUrl,
        COALESCE(u.display_name, 'Unknown contributor') AS contributor,
        COALESCE(ap.display_name, 'Unattributed') AS attributedAuthority,
        n.created_at AS createdAt
      FROM nodes n
      JOIN knowledge_chunks k ON k.node_id = n.id
      LEFT JOIN users u ON u.id = k.contributor_user_id
      LEFT JOIN authority_profiles ap ON ap.node_id = k.attributed_authority_profile_node_id
      ORDER BY n.created_at DESC, n.id DESC`
    )
    .all<{
      nodeId: number;
      title: string;
      summary: string | null;
      content: string;
      sourceType: string;
      sourceUrl: string | null;
      contributor: string;
      attributedAuthority: string;
      createdAt: number;
    }>();

  return rows.results.map((row) => ({
    id: prefixedId('sub', row.nodeId),
    title: row.title,
    content: row.content,
    sourceType: row.sourceType as (typeof supportedSourceTypes)[number],
    sourceUrl: row.sourceUrl || undefined,
    contributor: row.contributor,
    attributedAuthority: row.attributedAuthority,
    status: 'Submitted' as const,
    summary: row.summary || undefined,
    createdAt: new Date(row.createdAt).toISOString()
  }));
}

export async function getSubmission(db: D1Database, rawId: string) {
  const nodeId = Number.parseInt(rawId.replace(/^sub-/, ''), 10);
  if (!Number.isFinite(nodeId)) {
    return null;
  }

  const row = await db
    .prepare(
      `SELECT
        n.id AS nodeId,
        n.title AS title,
        n.summary AS summary,
        k.content AS content,
        k.source_type AS sourceType,
        k.source_url AS sourceUrl,
        COALESCE(u.display_name, 'Unknown contributor') AS contributor,
        COALESCE(ap.display_name, 'Unattributed') AS attributedAuthority,
        n.created_at AS createdAt
      FROM nodes n
      JOIN knowledge_chunks k ON k.node_id = n.id
      LEFT JOIN users u ON u.id = k.contributor_user_id
      LEFT JOIN authority_profiles ap ON ap.node_id = k.attributed_authority_profile_node_id
      WHERE n.id = ?`
    )
    .bind(nodeId)
    .first<{
      nodeId: number;
      title: string;
      summary: string | null;
      content: string;
      sourceType: string;
      sourceUrl: string | null;
      contributor: string;
      attributedAuthority: string;
      createdAt: number;
    }>();

  if (!row) {
    return null;
  }

  return {
    id: prefixedId('sub', row.nodeId),
    title: row.title,
    content: row.content,
    sourceType: row.sourceType as (typeof supportedSourceTypes)[number],
    sourceUrl: row.sourceUrl || undefined,
    contributor: row.contributor,
    attributedAuthority: row.attributedAuthority,
    status: 'Submitted' as const,
    summary: row.summary || undefined,
    createdAt: new Date(row.createdAt).toISOString()
  };
}

export async function searchBaseline(db: D1Database, query: string, page: number, pageSize: number) {
  const needle = query.trim();
  const offset = (page - 1) * pageSize;

  const candidates = needle ? await searchNodeCandidates(db, needle) : [];
  const ordered = candidates.sort((a, b) => {
    if (b.lexicalScore !== a.lexicalScore) {
      return b.lexicalScore - a.lexicalScore;
    }

    if (a.kind !== b.kind) {
      return a.kind === 'topic' ? -1 : 1;
    }

    return a.title.localeCompare(b.title);
  });

  const total = ordered.length;
  const rows = ordered.slice(offset, offset + pageSize);

  return {
    mode: 'baseline' as const,
    results: rows.map((row) => ({
      id: row.id,
      title: row.title,
      snippet: row.snippet,
      sourceType: row.sourceType,
      attributedAuthority: row.attributedAuthority,
      kind: row.kind
    })),
    pagination: {
      page,
      pageSize,
      total
    }
  };
}

async function searchSemantic(
  db: D1Database,
  services: Phase4Services,
  query: string,
  page: number,
  pageSize: number
) {
  const vectorize = services.VECTORIZE;
  const ai = services.AI;

  if (!vectorize || !ai) {
    return null;
  }

  const embedding = await generateEmbedding(ai, query);
  if (!embedding || embedding.length === 0) {
    return null;
  }

  const topK = Math.min(Math.max(pageSize * 4, 12), 48);
  const matches = await vectorize.query(embedding, {
    topK,
    namespace: PHASE4_EMBEDDING_NAMESPACE,
    returnMetadata: 'indexed'
  });

  const rankedIds: number[] = [];
  const scoreByNode = new Map<number, number>();

  for (const match of matches.matches) {
    const parsedId = parseVectorNodeId(match.id);
    if (!parsedId) {
      continue;
    }

    if (!scoreByNode.has(parsedId)) {
      rankedIds.push(parsedId);
    }

    scoreByNode.set(parsedId, match.score);
  }

  const lexicalCandidates = await searchNodeCandidates(db, query);

  const chunkRows = rankedIds.length > 0
    ? await db
        .prepare(
          `SELECT
            n.id AS nodeId,
            n.title AS title,
            COALESCE(n.summary, substr(k.content, 1, 180)) AS snippet,
            k.source_type AS sourceType,
            COALESCE(ap.display_name, 'Unattributed') AS attributedAuthority,
            COALESCE(ap.authority_level, 'Novice') AS authorityLevel,
            COALESCE(GROUP_CONCAT(DISTINCT t.name), '') AS tags,
            COALESCE(tp.description, '') AS topicDescription
          FROM nodes n
          JOIN knowledge_chunks k ON k.node_id = n.id
          LEFT JOIN authority_profiles ap ON ap.node_id = k.attributed_authority_profile_node_id
          LEFT JOIN node_tags nt ON nt.node_id = n.id
          LEFT JOIN tags t ON t.id = nt.tag_id
          LEFT JOIN topics tp ON tp.node_id = n.id
          WHERE n.id IN (${rankedIds.map(() => '?').join(', ')})
          GROUP BY n.id`
        )
        .bind(...rankedIds)
        .all<{
          nodeId: number;
          title: string;
          snippet: string;
          sourceType: string;
          attributedAuthority: string;
          authorityLevel: string;
          tags: string;
          topicDescription: string;
        }>()
    : { results: [] as Array<{ nodeId: number; title: string; snippet: string; sourceType: string; attributedAuthority: string; authorityLevel: string; tags: string; topicDescription: string }> };

  const chunkScored = chunkRows.results.map((row) => {
    const rawScore = scoreByNode.get(row.nodeId) || 0;
    const combinedLexical = lexicalScore(normalizedText(row.title, row.snippet, row.sourceType, row.attributedAuthority, row.tags, row.topicDescription), tokenizeQuery(query));
    const weighted = rawScore * authorityWeight(row.authorityLevel) + combinedLexical * 2;
    return {
      id: prefixedId('sub', row.nodeId),
      title: row.title,
      snippet: row.snippet,
      sourceType: row.sourceType,
      attributedAuthority: row.attributedAuthority,
      kind: 'chunk' as const,
      lexicalScore: combinedLexical,
      score: weighted
    } satisfies SearchCandidate & { score: number };
  }).filter((candidate) => candidate.lexicalScore > 0 || (scoreByNode.get(Number.parseInt(candidate.id.replace(/^sub-/, ''), 10)) || 0) >= 0.78);

  const topicScored = lexicalCandidates
    .filter((candidate) => candidate.kind === 'topic')
    .map((candidate) => ({
      ...candidate,
      score: candidate.lexicalScore * 10
    }));

  const merged = [...chunkScored, ...topicScored]
    .map((candidate) => ({
      ...candidate,
      score: candidate.score + (candidate.id.startsWith('sub-') ? (scoreByNode.get(Number.parseInt(candidate.id.replace(/^sub-/, ''), 10)) || 0) * 10 : 0)
    }))
    .filter((candidate) => candidate.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      if (a.kind !== b.kind) {
        return a.kind === 'topic' ? -1 : 1;
      }
      return a.title.localeCompare(b.title);
    });

  const total = merged.length;
  const offset = (page - 1) * pageSize;
  const paged = merged.slice(offset, offset + pageSize);

  return {
    mode: 'semantic' as const,
    results: paged.map((row) => ({
      id: row.id,
      title: row.title,
      snippet: row.snippet,
      sourceType: row.sourceType,
      attributedAuthority: row.attributedAuthority,
      kind: row.kind
    })),
    pagination: {
      page,
      pageSize,
      total
    }
  };
}

export async function searchWithFallback(
  db: D1Database,
  query: string,
  page: number,
  pageSize: number,
  services: Phase4Services
) {
  const semanticEnabled = services.semanticEnabled !== false;
  const trimmed = query.trim();

  if (!semanticEnabled || trimmed.length === 0) {
    return searchBaseline(db, query, page, pageSize);
  }

  try {
    const semantic = await searchSemantic(db, services, trimmed, page, pageSize);
    if (semantic) {
      return semantic;
    }
  } catch (error) {
    console.warn('Semantic search fallback:', error);
  }

  return searchBaseline(db, query, page, pageSize);
}

export function getModerationQueue() {
  return moderationSeed;
}

export function getEndorsements() {
  return endorsementSeed;
}