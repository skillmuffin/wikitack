# WikiTack

A modern wiki application built with FastAPI, PostgreSQL, and asyncpg.

## Env

python3 -m venv .venv


uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

## Project Structure

```
wikitack/
├── backend/
│   ├── alembic/              # Database migrations
│   │   ├── versions/         # Migration files
│   │   ├── env.py           # Alembic environment config
│   │   └── script.py.mako   # Migration template
│   ├── app/
│   │   ├── api/             # API endpoints (to be added)
│   │   ├── core/            # Core configuration
│   │   │   └── config.py    # Application settings
│   │   ├── db/              # Database setup
│   │   │   ├── base.py      # Model imports for Alembic
│   │   │   └── session.py   # Database session and engine
│   │   ├── models/          # SQLAlchemy models
│   │   │   ├── base.py      # Base model mixins
│   │   │   ├── user.py      # User model
│   │   │   └── page.py      # Page model
│   │   ├── schemas/         # Pydantic schemas
│   │   │   ├── user.py      # User schemas
│   │   │   └── page.py      # Page schemas
│   │   └── main.py          # FastAPI application entry point
│   ├── alembic.ini          # Alembic configuration
│   ├── Dockerfile           # Docker container definition
│   └── pyproject.toml       # Python dependencies and project config
├── podman-compose.yml       # Container orchestration
├── .gitignore
└── README.md
```

## Technology Stack

- **FastAPI**: Modern, fast web framework for building APIs
- **PostgreSQL**: Robust relational database
- **asyncpg**: High-performance async PostgreSQL driver
- **SQLAlchemy 2.0**: Async ORM for database operations
- **Alembic**: Database migration tool
- **Pydantic**: Data validation using Python type hints
- **Podman/Docker**: Containerization

## Getting Started

### Prerequisites

- Python 3.11+
- Podman or Docker
- podman-compose or docker-compose

### Installation

1. **Clone the repository** (if using git):
   ```bash
   git clone <repository-url>
   cd wikitack
   ```

2. **Set up environment variables**:
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env if needed
   ```

3. **Start the services with Podman**:
   ```bash
   cd ..
   podman-compose up -d
   ```

   Or with Docker:
   ```bash
   docker-compose up -d
   ```

4. **Run database migrations**:
   ```bash
   podman-compose exec backend alembic upgrade head
   ```

5. **Access the application**:
   - API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs
   - Health Check: http://localhost:8000/health

### Local Development (without containers)

1. **Install dependencies**:
   ```bash
   cd backend
   pip install -e .
   pip install -e ".[dev]"
   ```

2. **Start PostgreSQL**:
   ```bash
   podman-compose up -d postgres
   ```

3. **Run migrations**:
   ```bash
   alembic upgrade head
   ```

4. **Start the development server**:
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

## Db Containers

To run just the database and pgadmin:

  podman-compose -f podman-compose.db.yml up -d

  To stop them:

  podman-compose -f podman-compose.db.yml down

  Access Details

  - PostgreSQL: localhost:5432
    - Database: wikitack
    - Username: wikitack
    - Password: wikitack_dev_password
  - pgAdmin: http://localhost:5050
    - Email: admin@wikitack.local
    - Password: admin

  This setup is useful when you want to run the backend locally (outside of containers) but still use containerized database services.

## Database Migrations

### Create a new migration:
```bash
alembic revision --autogenerate -m "Description of changes"
```

### Apply migrations:
```bash
alembic upgrade head
```

### Rollback migration:
```bash
alembic downgrade -1
```

## API Development

The project is structured to easily add new endpoints:

1. Create model in `backend/app/models/`
2. Create Pydantic schemas in `backend/app/schemas/`
3. Create API router in `backend/app/api/`
4. Register router in `backend/app/main.py`

## Models

### User Model
- `id`: Primary key
- `username`: Unique username
- `email`: Unique email address
- `full_name`: Optional full name
- `is_active`: Account status
- `is_admin`: Admin privileges
- `created_at`, `updated_at`: Timestamps

### Page Model
- `id`: Primary key
- `title`: Page title
- `slug`: URL-friendly identifier
- `content`: Page content (markdown/text)
- `author_id`: Foreign key to User
- `is_published`: Publication status
- `created_at`, `updated_at`: Timestamps

## Next Steps

Ready to add your endpoints! Define your API routes and business logic.

## Development Tools

- **Code formatting**: `ruff format`
- **Linting**: `ruff check`
- **Testing**: `pytest` (when tests are added)



## Podman commands
podman compose -f podman-compose.db.yml up -d
podman compose -f podman-compose.backend.yml up -d
## License

[Your License]
