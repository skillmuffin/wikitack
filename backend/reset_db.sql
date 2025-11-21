-- Database Reset SQL Script
-- WARNING: This will DELETE ALL DATA in the database!
-- Use with caution, typically only in development environments.

-- Drop all tables in cascade order
DROP TABLE IF EXISTS workspace_members CASCADE;
DROP TABLE IF EXISTS page_sections CASCADE;
DROP TABLE IF EXISTS page_tags CASCADE;
DROP TABLE IF EXISTS revisions CASCADE;
DROP TABLE IF EXISTS pages CASCADE;
DROP TABLE IF EXISTS spaces CASCADE;
DROP TABLE IF EXISTS workspaces CASCADE;
DROP TABLE IF EXISTS tags CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS alembic_version CASCADE;

-- Verify all tables are dropped
SELECT tablename FROM pg_tables WHERE schemaname = 'public';

-- After running this script, run:
-- alembic upgrade head
-- to recreate all tables
