-- Eidolon Phase 1 schema bootstrap for Cloudflare D1

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  clerk_id TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE TABLE IF NOT EXISTS node_types (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS nodes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  node_type_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  summary TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  FOREIGN KEY (node_type_id) REFERENCES node_types(id)
);

CREATE TABLE IF NOT EXISTS authority_profiles (
  node_id INTEGER PRIMARY KEY,
  display_name TEXT NOT NULL,
  authority_level TEXT NOT NULL,
  first_year_published INTEGER,
  total_books_published INTEGER,
  claimed INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  FOREIGN KEY (node_id) REFERENCES nodes(id)
);

CREATE TABLE IF NOT EXISTS user_authority_profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  authority_profile_node_id INTEGER NOT NULL,
  relationship_type TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (authority_profile_node_id) REFERENCES authority_profiles(node_id)
);

CREATE TABLE IF NOT EXISTS knowledge_chunks (
  node_id INTEGER PRIMARY KEY,
  content TEXT NOT NULL,
  source_type TEXT NOT NULL,
  source_url TEXT,
  contributor_user_id INTEGER,
  attributed_authority_profile_node_id INTEGER,
  FOREIGN KEY (node_id) REFERENCES nodes(id),
  FOREIGN KEY (contributor_user_id) REFERENCES users(id),
  FOREIGN KEY (attributed_authority_profile_node_id) REFERENCES authority_profiles(node_id)
);

CREATE TABLE IF NOT EXISTS topics (
  node_id INTEGER PRIMARY KEY,
  description TEXT NOT NULL,
  FOREIGN KEY (node_id) REFERENCES nodes(id)
);

CREATE TABLE IF NOT EXISTS tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS node_tags (
  node_id INTEGER NOT NULL,
  tag_id INTEGER NOT NULL,
  PRIMARY KEY (node_id, tag_id),
  FOREIGN KEY (node_id) REFERENCES nodes(id),
  FOREIGN KEY (tag_id) REFERENCES tags(id)
);

CREATE TABLE IF NOT EXISTS node_embeddings (
  node_id INTEGER PRIMARY KEY,
  embedding_reference TEXT NOT NULL,
  FOREIGN KEY (node_id) REFERENCES nodes(id)
);

CREATE TABLE IF NOT EXISTS endorsements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  node_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  authority_profile_node_id INTEGER,
  authority_level_snapshot TEXT NOT NULL,
  weight INTEGER NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  FOREIGN KEY (node_id) REFERENCES nodes(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (authority_profile_node_id) REFERENCES authority_profiles(node_id)
);

CREATE TABLE IF NOT EXISTS relationships (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_node_id INTEGER NOT NULL,
  target_node_id INTEGER NOT NULL,
  relationship_type TEXT NOT NULL,
  strength INTEGER NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  FOREIGN KEY (source_node_id) REFERENCES nodes(id),
  FOREIGN KEY (target_node_id) REFERENCES nodes(id)
);

INSERT OR IGNORE INTO node_types (id, name) VALUES
  (1, 'KNOWLEDGE_CHUNK'),
  (2, 'TOPIC'),
  (3, 'AUTHORITY_PROFILE'),
  (4, 'KNOWLEDGE_SYNTHESIS');
