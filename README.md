# WikiTack

A modern collaborative wiki platform with structured content sections, Google OAuth authentication, and full CRUD operations for wiki pages organized in workspaces.

## Table of Contents
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Key Features](#key-features)
- [Data Models](#data-models)
- [API Endpoints](#api-endpoints)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Custom Markup Language](#custom-markup-language)
- [Architecture Patterns](#architecture-patterns)
- [Security](#security)
- [Email Invites](#email-invites)

---

## Technology Stack

### Backend
- **Language**: Python 3.11+
- **Framework**: FastAPI 0.121.2
- **Database**: PostgreSQL 16
- **ORM**: SQLAlchemy 2.0 (async)
- **Database Driver**: asyncpg 0.30.0
- **Migrations**: Alembic 1.17.2
- **Authentication**:
  - python-jose (JWT tokens)
  - authlib (OAuth integration)
  - passlib with bcrypt (password hashing)
- **Validation**: Pydantic 2.5+ with Pydantic Settings
- **Server**: Uvicorn with standard extensions

### Frontend
- **Framework**: Next.js 16.0.3 (React 19.2.0)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **Build Tools**: SWC (Fast Rust-based compiler)

### DevOps & Infrastructure
- **Containerization**: Podman/Docker
- **Orchestration**: podman-compose/docker-compose
- **Database Admin**: pgAdmin 4
- **Development Tools**:
  - Ruff (linting and formatting)
  - pytest (testing framework)
  - ESLint (frontend linting)

---

## Project Structure

```
wikitack/
├── backend/                    # FastAPI backend application
│   ├── alembic/               # Database migrations
│   │   ├── versions/          # Migration files
│   │   ├── env.py            # Alembic environment config
│   │   └── script.py.mako    # Migration template
│   ├── app/
│   │   ├── api/              # API route handlers
│   │   │   ├── auth.py       # Google OAuth authentication
│   │   │   ├── pages.py      # Wiki page CRUD operations
│   │   │   ├── spaces.py     # Workspace management
│   │   │   ├── users.py      # User management
│   │   │   ├── tags.py       # Tag management
│   │   │   └── revisions.py  # Page revision history
│   │   ├── core/             # Core configuration
│   │   │   ├── config.py     # Application settings
│   │   │   ├── security.py   # JWT and security utilities
│   │   │   └── deps.py       # FastAPI dependencies
│   │   ├── db/               # Database configuration
│   │   │   ├── session.py    # Async database session
│   │   │   └── base.py       # Model imports for Alembic
│   │   ├── models/           # SQLAlchemy ORM models
│   │   │   ├── base.py       # Base model mixins
│   │   │   ├── user.py       # User model
│   │   │   ├── space.py      # Workspace model
│   │   │   ├── page.py       # Wiki page model
│   │   │   ├── page_section.py  # Structured content sections
│   │   │   ├── page_tag.py   # Many-to-many page-tag relation
│   │   │   ├── tag.py        # Tag model
│   │   │   └── revision.py   # Page version history
│   │   ├── schemas/          # Pydantic schemas
│   │   │   ├── user.py       # User validation schemas
│   │   │   ├── space.py      # Space schemas
│   │   │   ├── page.py       # Page schemas
│   │   │   ├── page_section.py  # Section schemas with validation
│   │   │   ├── tag.py        # Tag schemas
│   │   │   ├── revision.py   # Revision schemas
│   │   │   └── auth.py       # Authentication schemas
│   │   └── main.py           # FastAPI application entry point
│   ├── alembic.ini           # Alembic configuration
│   ├── Dockerfile            # Container definition
│   └── pyproject.toml        # Python dependencies & config
├── frontend/                  # Next.js frontend application
│   ├── src/
│   │   ├── app/              # Next.js App Router pages
│   │   │   ├── page.tsx      # Home page
│   │   │   ├── layout.tsx    # Root layout
│   │   │   ├── auth/callback/  # OAuth callback handler
│   │   │   ├── dashboard/    # User dashboard
│   │   │   ├── login/        # Login page
│   │   │   ├── page/new/     # Create new page
│   │   │   ├── space/[slug]/ # Space detail view
│   │   │   └── wiki/[slug]/  # Wiki page view
│   │   ├── components/       # React components
│   │   │   ├── WikiHeader.tsx    # Header with search & auth
│   │   │   ├── WikiContent.tsx   # Page content display/editor
│   │   │   ├── WikiSidebar.tsx   # Navigation sidebar
│   │   │   └── ProtectedRoute.tsx  # Auth guard component
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx   # Authentication state management
│   │   ├── lib/
│   │   │   └── sectionMarkup.ts  # Custom markup parser
│   │   └── types/
│   │       └── wiki.ts       # TypeScript type definitions
│   ├── Dockerfile
│   └── package.json
├── podman-compose.yml         # Main orchestration file
├── podman-compose.backend.yml # Backend-only compose
├── podman-compose.db.yml      # Database-only compose
├── podman-compose.frontend.yml # Frontend-only compose
├── Makefile                   # Development commands
├── .gitignore
└── README.md
```

---

## Key Features

### 1. Structured Content Sections

WikiTack implements a custom markup language for creating structured, validated content with multiple section types:

#### Section Types:
- **paragraph**: Text blocks with optional headers
- **info/warning/error**: Colored callout cards for notices
- **snippet**: Code blocks with syntax highlighting metadata
- **picture**: Image sections with captions

#### Custom Markup Syntax:
```
:::info: Getting Started
You'll need VPN access to continue.
:::end

:::code javascript: Example Function
console.log('Hello World');
:::end

:::paragraph: Overview
This is a paragraph section with free-form text.
:::end

:::picture: Architecture Diagram
https://example.com/diagram.png
Optional caption text here
:::end
```

**Parser Implementation**: `/frontend/src/lib/sectionMarkup.ts`
- Parses custom markup into `PageSection` objects
- Validates section requirements
- Converts sections back to markup for editing
- Supports mixed markup and loose paragraphs

### 2. Google OAuth Authentication
- **Flow**: Frontend → Backend → Google → Backend → Frontend with JWT
- **User Creation**: Auto-creates users on first login
- **Username Generation**: Email prefix + Google ID suffix if conflicts
- **Token**: JWT tokens with 24-hour expiration (configurable)
- **Protected Routes**: Frontend auth context guards sensitive pages

### 3. Page Revision System
- **Auto-versioning**: New revision created on every content/title change
- **Revision Tracking**: Stores complete page state (title + content)
- **Editor Attribution**: Links each revision to the user who made it
- **Sequential Numbering**: Per-page revision numbers (1, 2, 3...)
- **History View**: View and compare past versions

### 4. Workspace Organization (Spaces)
- **Multi-tenancy**: Multiple workspaces per installation
- **Access Control**: Public/private space toggle
- **Slug-based URLs**: SEO-friendly URLs via slugs
- **Cascade Deletion**: Deleting a space removes all pages

### 5. Tagging System
- **Many-to-Many**: Pages can have multiple tags
- **Tag Association**: Via `page_tags` join table
- **Categorization**: Organize and filter pages by tags

### 6. Soft Deletion
- **Non-destructive**: Pages marked as deleted by default
- **Recovery**: Can be undeleted if needed
- **Hard Delete Option**: API supports permanent deletion

### 7. Rich Editing Experience
- **Live Preview**: Toggle between edit and preview modes
- **Section Manipulation**: Reorder, add, delete sections
- **Markup + UI**: Dual editing interface (markup text OR visual editor)
- **Auto-save Drafts**: Client-side state management

---

## Data Models

### User Model
**Table**: `users`

| Field | Type | Description |
|-------|------|-------------|
| id | Integer | Primary Key |
| username | Text | Unique username |
| email | Text | Unique email (optional) |
| display_name | Text | Display name (optional) |
| hashed_password | Text | Password hash (optional, for future) |
| is_active | Boolean | Account status (default: True) |
| created_at | DateTime | Created timestamp |
| updated_at | DateTime | Updated timestamp |

**Relationships**:
- `owned_spaces`: One-to-Many with Space
- `created_pages`: One-to-Many with Page (as creator)
- `updated_pages`: One-to-Many with Page (as updater)
- `revisions`: One-to-Many with Revision

### Space Model
**Table**: `spaces`

| Field | Type | Description |
|-------|------|-------------|
| id | Integer | Primary Key |
| name | Text | Space name |
| slug | Text | Unique URL slug |
| description | Text | Space description (optional) |
| owner_id | Integer | Foreign Key to User |
| is_private | Boolean | Private flag (default: False) |
| created_at | DateTime | Created timestamp |
| updated_at | DateTime | Updated timestamp |

**Relationships**:
- `owner`: Many-to-One with User
- `pages`: One-to-Many with Page (Cascade delete)

### Page Model
**Table**: `pages`

| Field | Type | Description |
|-------|------|-------------|
| id | Integer | Primary Key |
| space_id | Integer | Foreign Key to Space (Cascade delete) |
| slug | Text | URL slug (unique per space) |
| title | Text | Page title |
| content | Text | Fallback HTML content |
| created_by | Integer | Foreign Key to User |
| updated_by | Integer | Foreign Key to User (nullable) |
| is_deleted | Boolean | Soft delete flag (default: False) |
| created_at | DateTime | Created timestamp |
| updated_at | DateTime | Updated timestamp |

**Unique Constraint**: `(space_id, slug)`

**Relationships**:
- `space`: Many-to-One with Space
- `creator`: Many-to-One with User
- `updater`: Many-to-One with User
- `revisions`: One-to-Many with Revision (Cascade delete)
- `tags`: Many-to-Many with Tag (via page_tags)
- `sections`: One-to-Many with PageSection (Cascade delete, ordered by position)

### PageSection Model
**Table**: `page_sections`

| Field | Type | Description |
|-------|------|-------------|
| id | Integer | Primary Key |
| page_id | Integer | Foreign Key to Page (Cascade delete) |
| position | Integer | Order position |
| section_type | String(32) | One of: paragraph, picture, snippet, info, warning, error |
| header | Text | Section header (optional) |
| text | Text | Section text (optional) |
| media_url | Text | Image URL (optional) |
| caption | Text | Image caption (optional) |
| code | Text | Code content (optional) |
| language | String(64) | Programming language (optional) |
| created_at | DateTime | Created timestamp |
| updated_at | DateTime | Updated timestamp |

**Unique Constraint**: `(page_id, position)`

**Validation Rules**:
- `paragraph`: Requires header OR text
- `picture`: Requires media_url
- `snippet`: Requires code AND language
- `info/warning/error`: Requires text

**Relationships**:
- `page`: Many-to-One with Page

### Tag Model
**Table**: `tags`

| Field | Type | Description |
|-------|------|-------------|
| id | Integer | Primary Key |
| name | Text | Tag name (unique) |
| slug | Text | URL slug (unique, optional) |
| created_at | DateTime | Created timestamp |

**Relationships**:
- `pages`: Many-to-Many with Page (via page_tags)

### Revision Model
**Table**: `revisions`

| Field | Type | Description |
|-------|------|-------------|
| id | Integer | Primary Key |
| page_id | Integer | Foreign Key to Page (Cascade delete) |
| revision_number | Integer | Sequential version number |
| title | Text | Page title at this revision |
| content | Text | Page content at this revision |
| editor_id | Integer | Foreign Key to User |
| created_at | DateTime | Created timestamp |

**Unique Constraint**: `(page_id, revision_number)`

**Relationships**:
- `page`: Many-to-One with Page
- `editor`: Many-to-One with User

---

## API Endpoints

**Base URL**: `http://localhost:8000`
**API Prefix**: `/api/v1`

### Authentication Endpoints (`/api/v1/auth`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/google/login` | Get Google OAuth authorization URL | No |
| GET | `/google/callback` | Handle OAuth callback, return JWT | No |
| GET | `/me` | Get current authenticated user info | Yes (JWT) |
| POST | `/logout` | Logout (client-side token clear) | Yes (JWT) |

### Space Endpoints (`/api/v1/spaces`)

| Method | Endpoint | Description | Query Params |
|--------|----------|-------------|--------------|
| GET | `/` | List all spaces | `skip`, `limit`, `include_private` |
| GET | `/{space_id}` | Get space by ID | - |
| GET | `/slug/{slug}` | Get space by slug | - |
| POST | `/` | Create new space | - |
| PATCH | `/{space_id}` | Update space | - |
| DELETE | `/{space_id}` | Delete space (cascade) | - |

### Page Endpoints (`/api/v1/pages`)

| Method | Endpoint | Description | Query Params |
|--------|----------|-------------|--------------|
| GET | `/` | List pages | `space_id`, `include_deleted`, `skip`, `limit` |
| GET | `/{page_id}` | Get page by ID | Includes sections, tags, creator, updater |
| GET | `/space/{space_id}/slug/{slug}` | Get page by space+slug | Full page details |
| POST | `/` | Create page with sections | - |
| PATCH | `/{page_id}` | Update page | Auto-creates revision on change |
| DELETE | `/{page_id}` | Delete page | `soft_delete=true` (default) or `false` |

**Page Creation Example**:
```json
{
  "space_id": 1,
  "title": "My Page",
  "slug": "my-page",
  "content": "Optional fallback content",
  "created_by": 1,
  "tag_ids": [1, 2],
  "sections": [
    {
      "section_type": "info",
      "position": 0,
      "text": "Important information"
    },
    {
      "section_type": "snippet",
      "position": 1,
      "code": "console.log('Hello');",
      "language": "javascript"
    }
  ]
}
```

### Tag Endpoints (`/api/v1/tags`)
Standard CRUD operations for tag management.

### User Endpoints (`/api/v1/users`)
Standard CRUD operations for user management.

### Revision Endpoints (`/api/v1/revisions`)
Endpoints to view and manage page revision history.

---

## Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+
- Podman or Docker
- podman-compose or docker-compose

### Quick Start with Make

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd wikitack
   ```

2. **Start all services**:
   ```bash
   make up
   ```

3. **View logs**:
   ```bash
   make logs
   ```

4. **Access the application**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs
   - pgAdmin: http://localhost:5050

5. **Stop all services**:
   ```bash
   make down
   ```

### Database Only Setup

To run just the database and pgAdmin:

```bash
make db-up
```

Access Details:
- **PostgreSQL**: localhost:5432
  - Database: `wikitack`
  - Username: `wikitack`
  - Password: `wikitack_dev_password`
- **pgAdmin**: http://localhost:5050
  - Email: `admin@wikitack.local`
  - Password: `admin`

Stop database services:
```bash
make db-down
```

### Local Development (Backend)

Run the backend locally with hot reload while using containerized database:

1. **Start database**:
   ```bash
   make db-up
   ```

2. **Setup backend**:
   ```bash
   cd backend
   python3 -m venv .venv
   source .venv/bin/activate
   pip install -e .
   pip install -e ".[dev]"
   ```

3. **Run migrations**:
   ```bash
   alembic upgrade head
   ```

4. **Start backend**:
   ```bash
   make backend-dev
   # Or manually: uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

### Local Development (Frontend)

Run the frontend locally:

```bash
cd frontend
npm install
npm run dev
```

Access at http://localhost:3000

---

## Development Workflow

### Makefile Commands

**Database**:
- `make db-up`: Start PostgreSQL + pgAdmin
- `make db-down`: Stop database services
- `make db-logs`: View database logs

**Backend**:
- `make backend-up`: Start backend container
- `make backend-dev`: Run backend locally with hot reload
- `make backend-shell`: Open shell with venv activated
- `make backend-logs`: View backend logs

**Frontend**:
- `make frontend-up`: Start frontend container
- `make frontend-logs`: View frontend logs

**Full Stack**:
- `make up`: Start all services (db + backend + frontend)
- `make down`: Stop all services
- `make logs`: Tail all service logs
- `make clean`: Remove all containers and volumes
- `make help`: Show all available commands

### Database Migrations

**Create a new migration**:
```bash
cd backend
alembic revision --autogenerate -m "Description of changes"
```

**Apply migrations**:
```bash
alembic upgrade head
```

**Rollback migration**:
```bash
alembic downgrade -1
```

**View migration history**:
```bash
alembic history
```

### Code Quality

**Backend**:
```bash
cd backend
ruff format .          # Format code
ruff check .           # Lint code
pytest                 # Run tests
```

**Frontend**:
```bash
cd frontend
npm run lint           # Run ESLint
npm run build          # Build for production
```

---

## Custom Markup Language

WikiTack uses a custom markup language for structured content. This provides more structure than Markdown while being easier to validate and render consistently.

### Syntax

**General Format**:
```
:::type [language]: Header Text
Body content
:::end
```

### Section Types

#### 1. Paragraph
Free-form text with optional header.

```
:::paragraph: Introduction
This is a paragraph with a header. You can write multiple lines
of text here.
:::end
```

#### 2. Code Snippet
Code blocks with syntax highlighting.

```
:::code javascript: Example Function
function greet(name) {
  console.log(`Hello, ${name}!`);
}
:::end
```

#### 3. Info/Warning/Error Callouts
Colored notice boxes.

```
:::info: Getting Started
You'll need admin access to continue.
:::end

:::warning: Deprecated
This feature will be removed in v2.0
:::end

:::error: Common Mistake
Don't forget to call initialize() first!
:::end
```

#### 4. Picture
Images with captions.

```
:::picture: Architecture Diagram
https://example.com/diagram.png
This shows our system architecture.
:::end
```

### Parser Functions

Located in `/frontend/src/lib/sectionMarkup.ts`:

- `parseSectionMarkup(text: string): PageSection[]` - Converts markup to sections
- `sectionsToMarkup(sections: PageSection[]): string` - Converts sections back to markup

### Dual Content Storage

Pages store both:
1. **Sections** (structured): Primary content format
2. **Content** (HTML): Auto-generated fallback from sections

This provides backward compatibility and flexibility.

---

## Architecture Patterns

### Backend Architecture

#### 1. Layered Architecture
- **API Layer** (`/api`): HTTP request handlers
- **Schema Layer** (`/schemas`): Pydantic validation models
- **Model Layer** (`/models`): SQLAlchemy ORM models
- **Core Layer** (`/core`): Cross-cutting concerns (config, security, deps)
- **DB Layer** (`/db`): Database session management

#### 2. Dependency Injection
- FastAPI's `Depends()` for database sessions
- `get_current_active_user` dependency for protected routes
- Async context managers for database operations

#### 3. Async/Await Pattern
- All database operations are async
- AsyncSession for SQLAlchemy
- asyncpg driver for PostgreSQL
- httpx for async HTTP requests (OAuth)

#### 4. Repository Pattern (Implicit)
- Direct SQLAlchemy queries in route handlers
- Select queries with explicit eager loading via `selectinload()`
- Prevents N+1 query problems

### Frontend Architecture

#### 1. Next.js App Router
- File-system based routing
- Server and client components
- Dynamic routes with `[slug]` syntax
- Nested layouts

#### 2. Context API for State
- `AuthContext` manages authentication state globally
- JWT token stored in context and localStorage
- User profile cached in context

#### 3. Component Composition
- Reusable components (WikiHeader, WikiContent, WikiSidebar)
- Presentation components (SectionRenderer, SectionEditor)
- Container components (page components)

---

## Security

### Implemented Security Features
- JWT authentication with 24-hour expiration
- Google OAuth 2.0 integration
- Password hashing with bcrypt (ready for future password auth)
- CORS configuration with explicit origin allowlist
- SQL injection protection via SQLAlchemy parameterized queries
- Input validation with Pydantic schemas

### Configuration

**Backend Environment Variables** (`backend/.env`):
```bash
# Database
DATABASE_URL=postgresql+asyncpg://wikitack:wikitack_dev_password@localhost:5432/wikitack

# JWT
SECRET_KEY=your-secret-key-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:8000/api/v1/auth/google/callback

# CORS
CORS_ORIGINS=["http://localhost:3000", "http://localhost:8000"]
```

**Frontend Environment Variables** (`frontend/.env.local`):
```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
```

### Security Considerations

**Not Yet Implemented**:
- Token blacklisting (logout doesn't invalidate tokens)
- Rate limiting on API endpoints
- Role-based access control (RBAC)
- CSRF protection (relying on JWT)
- File upload validation (pictures use URLs only)

---

## Email Invites

- Workspace invites can optionally send emails to non-enrolled users when SMTP settings are provided.
- Configure in backend env: `SMTP_HOST`, `SMTP_PORT` (default 587), `SMTP_USER`, `SMTP_PASS`, and `INVITE_FROM_EMAIL` (defaults to `SMTP_USER`).
- If SMTP is missing, invites still return 202 but no email is sent.

---

## Contributing

### Adding New Features

1. **Create model** in `backend/app/models/`
2. **Create Pydantic schemas** in `backend/app/schemas/`
3. **Create API router** in `backend/app/api/`
4. **Register router** in `backend/app/main.py`
5. **Create migration**: `alembic revision --autogenerate -m "Description"`
6. **Add frontend types** in `frontend/src/types/`
7. **Create UI components** in `frontend/src/components/`
8. **Add pages/routes** in `frontend/src/app/`

### Development Best Practices

- Write tests for new features
- Use type hints in Python code
- Use TypeScript types in frontend
- Follow existing code structure and patterns
- Run linters before committing
- Keep components small and focused
- Document complex logic with comments

---

## Troubleshooting

### Common Issues

**Database connection errors**:
```bash
# Check if database is running
podman ps
# Restart database
make db-down && make db-up
```

**Frontend not connecting to backend**:
- Verify `NEXT_PUBLIC_API_BASE_URL` in frontend `.env.local`
- Check CORS configuration in `backend/app/core/config.py`

**Migration errors**:
```bash
# Reset database (WARNING: destroys data)
make db-down
make db-up
cd backend && alembic upgrade head
```

**Port conflicts**:
- Frontend (3000), Backend (8000), PostgreSQL (5432), pgAdmin (5050)
- Change ports in respective `podman-compose.*.yml` files

---

## License

[Your License]

---

## Roadmap

### Planned Features
- [ ] Full-text search implementation
- [ ] File upload for images
- [ ] Role-based permissions (RBAC)
- [ ] Real-time collaborative editing
- [ ] Page templates
- [ ] Export to PDF/Markdown
- [ ] API rate limiting
- [ ] Comprehensive test coverage
- [ ] CI/CD pipeline

### Recent Changes
- Implemented structured content sections with custom markup
- Added dual markup/visual editor
- Integrated Google OAuth authentication
- Created page revision system
- Built workspace (spaces) organization
- Added tagging system

---
python3 -m venv .venv

   cd backend
	source .venv/bin/activate
	pip install -e .
	uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

**Built with FastAPI, Next.js, PostgreSQL, and modern web technologies.**
