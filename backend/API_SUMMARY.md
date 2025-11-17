# WikiTack API Documentation

## Overview
Complete REST API for WikiTack - a wiki application with spaces, pages, revisions, tags, and users.

## Base URL
`http://localhost:8000/api/v1`

## Database Schema
Matches the DDL in `app/db/ddl.sql`:
- **users**: User accounts with authentication
- **spaces**: Wiki workspaces/namespaces
- **pages**: Wiki pages with markdown content
- **revisions**: Version history for pages
- **tags**: Labels for categorizing pages
- **page_tags**: Many-to-many relationship between pages and tags

## API Endpoints

### Users (`/users`)
- `GET /users/` - List all active users (pagination: skip, limit)
- `GET /users/{user_id}` - Get user by ID
- `GET /users/username/{username}` - Get user by username
- `POST /users/` - Create new user
- `PATCH /users/{user_id}` - Update user
- `DELETE /users/{user_id}` - Soft delete user (sets is_active=false)

### Spaces (`/spaces`)
- `GET /spaces/` - List all spaces (params: skip, limit, include_private)
- `GET /spaces/{space_id}` - Get space by ID with owner details
- `GET /spaces/slug/{slug}` - Get space by slug with owner details
- `POST /spaces/` - Create new space
- `PATCH /spaces/{space_id}` - Update space
- `DELETE /spaces/{space_id}` - Delete space (cascades to pages)

### Pages (`/pages`)
- `GET /pages/` - List all pages (params: skip, limit, space_id, include_deleted)
- `GET /pages/{page_id}` - Get page with full details (creator, updater, space, tags)
- `GET /pages/space/{space_id}/slug/{slug}` - Get page by space and slug
- `POST /pages/` - Create new page (automatically creates revision #1)
- `PATCH /pages/{page_id}` - Update page (creates new revision if content changed)
- `DELETE /pages/{page_id}` - Delete page (params: soft_delete=true/false)

### Revisions (`/revisions`)
- `GET /revisions/page/{page_id}` - List all revisions for a page (ordered by revision_number desc)
- `GET /revisions/{revision_id}` - Get specific revision by ID
- `GET /revisions/page/{page_id}/number/{revision_number}` - Get specific revision by number

### Tags (`/tags`)
- `GET /tags/` - List all tags (pagination: skip, limit)
- `GET /tags/{tag_id}` - Get tag by ID
- `GET /tags/slug/{slug}` - Get tag by slug
- `POST /tags/` - Create new tag
- `PATCH /tags/{tag_id}` - Update tag
- `DELETE /tags/{tag_id}` - Delete tag

## Features

### Automatic Revision Tracking
- Creating a page automatically creates revision #1
- Updating a page's title or content creates a new revision
- Revisions are immutable and track the editor

### Relationships
- Pages belong to a Space
- Pages have a creator and optional updater (Users)
- Pages can have multiple Tags (many-to-many)
- Pages have multiple Revisions
- Spaces have an owner (User)

### Soft Deletes
- Users: Soft delete via `is_active` flag
- Pages: Soft delete via `is_deleted` flag (configurable hard delete)
- Spaces: Hard delete with cascade to pages

### Validation
- Unique constraints enforced (usernames, emails, space slugs, page slugs within space)
- Foreign key validation (users, spaces exist before creating pages)
- Proper error messages with HTTP status codes

## Running the API

### Install dependencies
```bash
cd backend
pip install -e .
```

### Set up database
```bash
# Apply DDL
psql -U wikitack -d wikitack -f app/db/ddl.sql

# Or use Alembic migrations
alembic upgrade head
```

### Run the server
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### API Documentation
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Example Usage

### Create a user
```bash
curl -X POST http://localhost:8000/api/v1/users/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "email": "john@example.com",
    "display_name": "John Doe",
    "password": "secret123"
  }'
```

### Create a space
```bash
curl -X POST http://localhost:8000/api/v1/spaces/ \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Platform Docs",
    "slug": "platform",
    "description": "Platform engineering documentation",
    "owner_id": 1,
    "is_private": false
  }'
```

### Create a page
```bash
curl -X POST http://localhost:8000/api/v1/pages/ \
  -H "Content-Type: application/json" \
  -d '{
    "space_id": 1,
    "slug": "getting-started",
    "title": "Getting Started",
    "content": "# Welcome\n\nThis is your first page!",
    "created_by": 1,
    "tag_ids": [1, 2]
  }'
```

### Update a page (creates new revision)
```bash
curl -X PATCH http://localhost:8000/api/v1/pages/1 \
  -H "Content-Type: application/json" \
  -d '{
    "content": "# Welcome\n\nUpdated content!",
    "updated_by": 1
  }'
```

### Get page revisions
```bash
curl http://localhost:8000/api/v1/revisions/page/1
```

## Notes

- Password hashing is stubbed (uses `hashed_` prefix). Implement proper bcrypt/argon2 for production
- No authentication/authorization implemented yet (add JWT, OAuth, etc.)
- All endpoints use async/await with SQLAlchemy async
- Database sessions are automatically committed/rolled back
- Eager loading used for nested relationships to avoid N+1 queries

## Next Steps

1. Add authentication (JWT tokens, OAuth)
2. Add authorization (role-based access control)
3. Implement proper password hashing (bcrypt, argon2)
4. Add full-text search for pages
5. Add webhooks for page changes
6. Add API rate limiting
7. Add caching (Redis)
8. Add file attachments for pages
