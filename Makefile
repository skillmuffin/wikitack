.PHONY: help activate db-up db-down db-restart db-logs backend-up backend-down backend-restart backend-build backend-logs backend-dev backend-shell frontend-up frontend-down frontend-restart frontend-build frontend-logs up down restart logs build clean ps

# Default target
help:
	@echo "WikiTack - Makefile Commands"
	@echo "============================"
	@echo ""
	@echo "Database & pgAdmin:"
	@echo "  make db-up       - Start database and pgAdmin services"
	@echo "  make db-down     - Stop database and pgAdmin services"
	@echo "  make db-restart  - Restart database and pgAdmin services"
	@echo "  make db-logs     - View database and pgAdmin logs"
	@echo ""
	@echo "Backend (Container):"
	@echo "  make backend-up       - Start backend service"
	@echo "  make backend-down     - Stop backend service"
	@echo "  make backend-restart  - Restart backend service"
	@echo "  make backend-build    - Build backend service"
	@echo "  make backend-logs     - View backend logs"
	@echo ""
	@echo "Backend (Local Development):"
	@echo "  make activate         - Show command to activate virtual environment"
	@echo "  make backend-dev      - Run backend locally with auto-reload"
	@echo "  make backend-shell    - Open shell with venv activated"
	@echo ""
	@echo "Frontend Only:"
	@echo "  make frontend-up      - Start frontend service"
	@echo "  make frontend-down    - Stop frontend service"
	@echo "  make frontend-restart - Restart frontend service"
	@echo "  make frontend-build   - Build frontend service"
	@echo "  make frontend-logs    - View frontend logs"
	@echo ""
	@echo "Full Application:"
	@echo "  make up          - Start all services (frontend, backend, db, pgAdmin)"
	@echo "  make down        - Stop all services"
	@echo "  make restart     - Restart all services"
	@echo "  make build       - Build all services"
	@echo "  make logs        - View logs from all services"
	@echo "  make ps          - List running containers"
	@echo ""
	@echo "Cleanup:"
	@echo "  make clean       - Stop all services and remove volumes"
	@echo ""

# Virtual environment activation
activate:
	@echo "To activate the virtual environment, run:"
	@echo ""
	@echo "  cd backend && source .venv/bin/activate"
	@echo ""
	@echo "Or use 'make backend-shell' to open a shell with venv already activated"

# Backend local development commands
backend-dev:
	@echo "Starting backend in development mode..."
	cd backend && source .venv/bin/activate && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

backend-shell:
	@echo "Opening shell with virtual environment activated..."
	@echo "Run 'deactivate' to exit the virtual environment"
	cd backend && bash --init-file <(echo "source .venv/bin/activate; PS1='(wikitack-venv) \w\$$ '")

# Database and pgAdmin commands
db-up:
	podman-compose -f podman-compose.db.yml up -d

db-down:
	podman-compose -f podman-compose.db.yml down

db-restart:
	podman-compose -f podman-compose.db.yml restart

db-logs:
	podman-compose -f podman-compose.db.yml logs -f

# Backend commands
backend-up:
	podman-compose -f podman-compose.backend.yml up -d

backend-down:
	podman-compose -f podman-compose.backend.yml down --force

backend-restart:
	podman-compose -f podman-compose.backend.yml restart

backend-build:
	podman-compose -f podman-compose.backend.yml build

backend-logs:
	podman-compose -f podman-compose.backend.yml logs -f

# Frontend commands
frontend-up:
	podman-compose -f podman-compose.frontend.yml up -d

frontend-down:
	podman-compose -f podman-compose.frontend.yml down

frontend-restart:
	podman-compose -f podman-compose.frontend.yml restart

frontend-build:
	podman-compose -f podman-compose.frontend.yml build

frontend-logs:
	podman-compose -f podman-compose.frontend.yml logs -f

# Full application commands
up:
	podman-compose up -d

down:
	podman-compose down

restart:
	podman-compose restart

build:
	podman-compose build

logs:
	podman-compose logs -f

ps:
	podman-compose ps

# Cleanup
clean:
	podman-compose down -v
	podman-compose -f podman-compose.db.yml down -v
	podman-compose -f podman-compose.backend.yml down -v
	podman-compose -f podman-compose.frontend.yml down -v
