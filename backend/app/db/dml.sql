-- Sample seed data for WikiTack
-- Run with: psql "$DATABASE_URL" -f dml.sql

-- Users
INSERT INTO users (id, username, email, display_name, hashed_password, is_active)
VALUES
  (1, 'alice', 'alice@example.com', 'Alice Example', NULL, TRUE),
  (2, 'bob', 'bob@example.com', 'Bob Example', NULL, TRUE)
ON CONFLICT (id) DO NOTHING;

-- Spaces
INSERT INTO spaces (id, name, slug, description, owner_id, is_private)
VALUES
  (1, 'Engineering', 'engineering', 'Engineering wiki', 1, FALSE),
  (2, 'Product', 'product', 'Product docs and specs', 2, FALSE)
ON CONFLICT (id) DO NOTHING;

-- Tags
INSERT INTO tags (id, name, slug)
VALUES
  (1, 'getting-started', 'getting-started'),
  (2, 'architecture', 'architecture'),
  (3, 'how-to', 'how-to')
ON CONFLICT (id) DO NOTHING;

-- Pages
INSERT INTO pages (id, space_id, slug, title, content, created_by, updated_by, is_deleted)
VALUES
  (1, 1, 'onboarding', 'Engineering Onboarding', 'Welcome to engineering!', 1, 1, FALSE),
  (2, 2, 'roadmap', 'Product Roadmap', 'Quarterly plans overview', 2, 2, FALSE)
ON CONFLICT (id) DO NOTHING;

-- Page tags
INSERT INTO page_tags (page_id, tag_id) VALUES
  (1, 1),
  (1, 3),
  (2, 2)
ON CONFLICT DO NOTHING;

-- Page sections
INSERT INTO page_sections (id, page_id, position, section_type, header, text, media_url, caption, code, language)
VALUES
  -- Engineering Onboarding
  (1, 1, 0, 'paragraph', 'Welcome 👋', 'Here is how to get set up.', NULL, NULL, NULL, NULL),
  (2, 1, 1, 'info', NULL, 'You will need access to GitHub, CI, and the VPN.', NULL, NULL, NULL, NULL),
  (3, 1, 2, 'snippet', 'Install tools', NULL, NULL, 'Install via Homebrew', 'brew install pyenv node', 'shell'),
  (4, 1, 3, 'picture', NULL, NULL, 'https://placehold.co/600x200', 'Team architecture diagram', NULL, NULL),
  -- Product Roadmap
  (5, 2, 0, 'paragraph', 'Vision', 'Ship delightful features consistently.', NULL, NULL, NULL, NULL),
  (6, 2, 1, 'warning', NULL, 'Roadmap is confidential. Do not share externally.', NULL, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- Revisions
INSERT INTO revisions (id, page_id, revision_number, title, content, editor_id)
VALUES
  (1, 1, 1, 'Engineering Onboarding', 'Welcome to engineering!', 1),
  (2, 2, 1, 'Product Roadmap', 'Quarterly plans overview', 2)
ON CONFLICT (id) DO NOTHING;

-- Reset sequences to avoid PK collisions after explicit IDs
SELECT setval(pg_get_serial_sequence('users', 'id'),       (SELECT COALESCE(MAX(id), 0) + 1 FROM users), false);
SELECT setval(pg_get_serial_sequence('spaces', 'id'),      (SELECT COALESCE(MAX(id), 0) + 1 FROM spaces), false);
SELECT setval(pg_get_serial_sequence('tags', 'id'),        (SELECT COALESCE(MAX(id), 0) + 1 FROM tags), false);
SELECT setval(pg_get_serial_sequence('pages', 'id'),       (SELECT COALESCE(MAX(id), 0) + 1 FROM pages), false);
SELECT setval(pg_get_serial_sequence('page_sections', 'id'), (SELECT COALESCE(MAX(id), 0) + 1 FROM page_sections), false);
SELECT setval(pg_get_serial_sequence('revisions', 'id'),   (SELECT COALESCE(MAX(id), 0) + 1 FROM revisions), false);
