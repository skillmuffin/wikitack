-- =========================================
-- Drop existing tables (DEV ONLY / optional)
-- =========================================

DROP TABLE IF EXISTS page_tags CASCADE;
DROP TABLE IF EXISTS revisions CASCADE;
DROP TABLE IF EXISTS pages CASCADE;
DROP TABLE IF EXISTS tags CASCADE;
DROP TABLE IF EXISTS spaces CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ==================
-- USERS
-- ==================

CREATE TABLE users (
    id              BIGSERIAL PRIMARY KEY,
    username        TEXT NOT NULL UNIQUE,
    email           TEXT UNIQUE,
    display_name    TEXT,
    hashed_password TEXT,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Helpful indexes (unique already creates an index, but we add one for created_at if needed)
CREATE INDEX IF NOT EXISTS ix_users_created_at ON users (created_at);


-- ==================
-- SPACES
-- ==================
-- Each wiki space / workspace. Pages live inside a space.

CREATE TABLE spaces (
    id          BIGSERIAL PRIMARY KEY,
    name        TEXT NOT NULL,
    slug        TEXT NOT NULL UNIQUE,        -- e.g. "platform", "android", etc.
    description TEXT,
    owner_id    BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    is_private  BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_spaces_owner_id ON spaces (owner_id);
CREATE INDEX IF NOT EXISTS ix_spaces_created_at ON spaces (created_at);


-- ==================
-- PAGES
-- ==================
-- Current state of each page. Each page belongs to exactly one space.

CREATE TABLE pages (
    id          BIGSERIAL PRIMARY KEY,
    space_id    BIGINT NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
    slug        TEXT NOT NULL,                -- unique within a space
    title       TEXT NOT NULL,
    content     TEXT NOT NULL,                -- markdown / rich text
    created_by  BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    updated_by  BIGINT REFERENCES users(id) ON DELETE SET NULL,
    is_deleted  BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_pages_space_slug UNIQUE (space_id, slug)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS ix_pages_space_id ON pages (space_id);
CREATE INDEX IF NOT EXISTS ix_pages_slug ON pages (slug);
CREATE INDEX IF NOT EXISTS ix_pages_created_at ON pages (created_at);
CREATE INDEX IF NOT EXISTS ix_pages_title ON pages (title);


-- ==================
-- REVISIONS
-- ==================
-- Historical versions of pages. Each edit creates a revision.

CREATE TABLE revisions (
    id              BIGSERIAL PRIMARY KEY,
    page_id         BIGINT NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
    revision_number INT NOT NULL,                          -- 1..N per page
    title           TEXT NOT NULL,
    content         TEXT NOT NULL,
    editor_id       BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_revisions_page_rev UNIQUE (page_id, revision_number)
);

CREATE INDEX IF NOT EXISTS ix_revisions_page_id ON revisions (page_id);
CREATE INDEX IF NOT EXISTS ix_revisions_editor_id ON revisions (editor_id);
CREATE INDEX IF NOT EXISTS ix_revisions_created_at ON revisions (created_at);


-- ==================
-- TAGS
-- ==================
-- Global tags (you could later scope per space if you want).

CREATE TABLE tags (
    id         BIGSERIAL PRIMARY KEY,
    name       TEXT NOT NULL UNIQUE,         -- e.g. "graphql", "fastapi"
    slug       TEXT UNIQUE,                  -- e.g. "graphql", "fastapi"
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_tags_created_at ON tags (created_at);


-- ==================
-- PAGE_TAGS (many-to-many)
-- ==================
-- Join table between pages and tags.

CREATE TABLE page_tags (
    page_id BIGINT NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
    tag_id  BIGINT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (page_id, tag_id)
);

CREATE INDEX IF NOT EXISTS ix_page_tags_page_id ON page_tags (page_id);
CREATE INDEX IF NOT EXISTS ix_page_tags_tag_id ON page_tags (tag_id);