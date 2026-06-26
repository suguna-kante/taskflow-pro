require('dotenv').config();
const pool = require('./pool');

const SQL = `
-- Users
CREATE TABLE IF NOT EXISTS users (
  id          SERIAL PRIMARY KEY,
  username    VARCHAR(150) UNIQUE NOT NULL,
  email       VARCHAR(255) UNIQUE,
  password    VARCHAR(255) NOT NULL,
  first_name  VARCHAR(100) DEFAULT '',
  last_name   VARCHAR(100) DEFAULT '',
  bio         TEXT         DEFAULT '',
  theme       VARCHAR(10)  DEFAULT 'light',
  created_at  TIMESTAMPTZ  DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  DEFAULT NOW()
);

-- Projects
CREATE TABLE IF NOT EXISTS projects (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(120) NOT NULL,
  description TEXT         DEFAULT '',
  color       VARCHAR(7)   DEFAULT '#6366f1',
  owner_id    INTEGER      REFERENCES users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ  DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  DEFAULT NOW()
);

-- Tags
CREATE TABLE IF NOT EXISTS tags (
  id    SERIAL PRIMARY KEY,
  name  VARCHAR(60) UNIQUE NOT NULL,
  color VARCHAR(7) DEFAULT '#6366f1'
);

-- Tasks
CREATE TABLE IF NOT EXISTS tasks (
  id           SERIAL PRIMARY KEY,
  title        VARCHAR(255) NOT NULL,
  description  TEXT         DEFAULT '',
  status       VARCHAR(20)  NOT NULL DEFAULT 'todo'
                 CHECK (status IN ('todo','inprogress','inreview','done')),
  priority     VARCHAR(10)  NOT NULL DEFAULT 'medium'
                 CHECK (priority IN ('high','medium','low')),
  deadline     DATE,
  "order"      INTEGER      DEFAULT 0,
  owner_id     INTEGER      REFERENCES users(id) ON DELETE CASCADE,
  project_id   INTEGER      REFERENCES projects(id) ON DELETE SET NULL,
  completed_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ  DEFAULT NOW(),
  updated_at   TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_owner_status   ON tasks(owner_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_owner_priority ON tasks(owner_id, priority);
CREATE INDEX IF NOT EXISTS idx_tasks_deadline       ON tasks(deadline);

-- Task-Tag junction
CREATE TABLE IF NOT EXISTS task_tags (
  task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
  tag_id  INTEGER REFERENCES tags(id)  ON DELETE CASCADE,
  PRIMARY KEY (task_id, tag_id)
);

-- Comments
CREATE TABLE IF NOT EXISTS comments (
  id         SERIAL PRIMARY KEY,
  task_id    INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
  author_id  INTEGER REFERENCES users(id) ON DELETE CASCADE,
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Refresh tokens
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER REFERENCES users(id) ON DELETE CASCADE,
  token      TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
`;

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query(SQL);
    console.log('✅  Migrations complete — all tables created.');
  } catch (err) {
    console.error('❌  Migration error:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
