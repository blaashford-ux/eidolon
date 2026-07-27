import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const nodeTypes = sqliteTable('node_types', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull()
}, (table) => ({
  nameIdx: uniqueIndex('node_types_name_idx').on(table.name)
}));

export const nodes = sqliteTable('nodes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  nodeTypeId: integer('node_type_id').notNull().references(() => nodeTypes.id),
  title: text('title').notNull(),
  summary: text('summary'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch() * 1000)`),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch() * 1000)`)
});

export const authorityProfiles = sqliteTable('authority_profiles', {
  nodeId: integer('node_id').primaryKey().references(() => nodes.id),
  displayName: text('display_name').notNull(),
  authorityLevel: text('authority_level').notNull(),
  firstYearPublished: integer('first_year_published'),
  totalBooksPublished: integer('total_books_published'),
  claimed: integer('claimed', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch() * 1000)`)
});

export const userAuthorityProfiles = sqliteTable('user_authority_profiles', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull(),
  authorityProfileNodeId: integer('authority_profile_node_id').notNull().references(() => authorityProfiles.nodeId),
  relationshipType: text('relationship_type').notNull()
});

export const knowledgeChunks = sqliteTable('knowledge_chunks', {
  nodeId: integer('node_id').primaryKey().references(() => nodes.id),
  content: text('content').notNull(),
  sourceType: text('source_type').notNull(),
  sourceUrl: text('source_url'),
  contributorUserId: integer('contributor_user_id'),
  attributedAuthorityProfileNodeId: integer('attributed_authority_profile_node_id').references(() => authorityProfiles.nodeId)
});

export const topics = sqliteTable('topics', {
  nodeId: integer('node_id').primaryKey().references(() => nodes.id),
  description: text('description').notNull()
});

export const tags = sqliteTable('tags', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull()
}, (table) => ({
  nameIdx: uniqueIndex('tags_name_idx').on(table.name)
}));

export const nodeTags = sqliteTable('node_tags', {
  nodeId: integer('node_id').notNull().references(() => nodes.id),
  tagId: integer('tag_id').notNull().references(() => tags.id)
});

export const nodeEmbeddings = sqliteTable('node_embeddings', {
  nodeId: integer('node_id').primaryKey().references(() => nodes.id),
  embeddingReference: text('embedding_reference').notNull()
});

export const endorsements = sqliteTable('endorsements', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  nodeId: integer('node_id').notNull().references(() => nodes.id),
  userId: integer('user_id').notNull(),
  authorityProfileNodeId: integer('authority_profile_node_id').references(() => authorityProfiles.nodeId),
  authorityLevelSnapshot: text('authority_level_snapshot').notNull(),
  weight: integer('weight').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch() * 1000)`)
});

export const relationships = sqliteTable('relationships', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  sourceNodeId: integer('source_node_id').notNull().references(() => nodes.id),
  targetNodeId: integer('target_node_id').notNull().references(() => nodes.id),
  relationshipType: text('relationship_type').notNull(),
  strength: integer('strength').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch() * 1000)`)
});
