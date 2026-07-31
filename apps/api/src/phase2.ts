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

function slugify(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/^\.+|\.+$/g, '') || 'user';
}

function prefixedId(prefix: string, value: number | string): string {
  return `${prefix}-${value}`;
}

function splitCsv(value: string | null): string[] {
  return value ? value.split(',').map((part) => part.trim()).filter(Boolean) : [];
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

export async function getCapabilities() {
  return {
    graph: true,
    semanticSearch: false,
    moderationAutomation: false,
    synthesis: false
  };
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
  }
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
  const needle = query.trim().toLowerCase();
  const offset = (page - 1) * pageSize;

  const where = needle
    ? `WHERE lower(n.title) LIKE ? OR lower(k.content) LIKE ? OR lower(k.source_type) LIKE ? OR lower(COALESCE(u.display_name, '')) LIKE ? OR lower(COALESCE(ap.display_name, '')) LIKE ? OR EXISTS (
        SELECT 1
        FROM node_tags nt2
        JOIN tags t2 ON t2.id = nt2.tag_id
        WHERE nt2.node_id = n.id AND lower(t2.name) LIKE ?
      )`
    : '';

  const bindings = needle
    ? Array(6).fill(`%${needle}%`)
    : [];

  const countQuery = await db
    .prepare(
      `SELECT COUNT(DISTINCT n.id) AS total
      FROM nodes n
      JOIN knowledge_chunks k ON k.node_id = n.id
      LEFT JOIN users u ON u.id = k.contributor_user_id
      LEFT JOIN authority_profiles ap ON ap.node_id = k.attributed_authority_profile_node_id
      ${where}`
    )
    .bind(...bindings)
    .first<{ total: number }>();

  const rows = await db
    .prepare(
      `SELECT DISTINCT
        n.id AS nodeId,
        n.title AS title,
        COALESCE(n.summary, substr(k.content, 1, 180)) AS snippet,
        k.source_type AS sourceType,
        COALESCE(ap.display_name, 'Unattributed') AS attributedAuthority,
        COALESCE(GROUP_CONCAT(DISTINCT t.name), '') AS tags
      FROM nodes n
      JOIN knowledge_chunks k ON k.node_id = n.id
      LEFT JOIN users u ON u.id = k.contributor_user_id
      LEFT JOIN authority_profiles ap ON ap.node_id = k.attributed_authority_profile_node_id
      LEFT JOIN node_tags nt ON nt.node_id = n.id
      LEFT JOIN tags t ON t.id = nt.tag_id
      ${where}
      GROUP BY n.id
      ORDER BY n.created_at DESC, n.id DESC
      LIMIT ? OFFSET ?`
    )
    .bind(...bindings, pageSize, offset)
    .all<{ nodeId: number; title: string; snippet: string; sourceType: string; attributedAuthority: string; tags: string }>();

  return {
    mode: 'baseline' as const,
    results: rows.results.map((row) => ({
      id: prefixedId('sub', row.nodeId),
      title: row.title,
      snippet: row.snippet,
      sourceType: row.sourceType,
      attributedAuthority: row.attributedAuthority
    })),
    pagination: {
      page,
      pageSize,
      total: countQuery?.total || 0
    }
  };
}

export function getModerationQueue() {
  return moderationSeed;
}

export function getEndorsements() {
  return endorsementSeed;
}