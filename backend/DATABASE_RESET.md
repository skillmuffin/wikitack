# Database Reset Guide

**⚠️ WARNING: These scripts will DELETE ALL DATA in your database!**

Use these scripts carefully, typically only in development environments.

---

## Method 1: Using Makefile (Recommended)

The easiest way to reset the database:

```bash
make db-reset
```

This will:
1. Show a warning message
2. Ask for confirmation by typing `DELETE ALL DATA`
3. Drop all tables
4. Ask if you want to recreate tables with migrations
5. Optionally run `alembic upgrade head` to recreate schema

---

## Method 2: Using Python Script

Run the Python script directly:

```bash
cd backend
source .venv/bin/activate
python reset_db.py
```

### What it does:
- Drops all tables including Alembic version table
- Uses CASCADE to handle foreign key dependencies
- Optionally runs migrations to recreate tables

### Confirmation Required:
You must type exactly `DELETE ALL DATA` to proceed.

---

## Method 3: Using SQL Script

For manual control via psql:

```bash
# Using psql directly
PGPASSWORD='wikitack_dev_password' psql -h localhost -U wikitack -d wikitack -f backend/reset_db.sql

# Then recreate tables
cd backend
source .venv/bin/activate
alembic upgrade head
```

---

## Method 4: Complete Database Recreation

To completely remove and recreate the database:

```bash
# Stop all services
make down

# Remove database volumes
podman-compose -f podman-compose.db.yml down -v

# Start database again (creates fresh database)
make db-up

# Run migrations
cd backend
source .venv/bin/activate
alembic upgrade head
```

---

## After Reset

Once the database is reset and tables are recreated:

1. **First login**: Users will need to create a workspace
2. **Data is gone**: All users, workspaces, spaces, pages, and content are deleted
3. **Fresh start**: Database is in the same state as initial setup

---

## Production Warning

**NEVER run these scripts in production!**

For production database operations:
- Use database backups
- Use proper migration rollback procedures
- Follow your organization's data governance policies
- Maintain audit trails

---

## Quick Reference

| Method | Command | Use Case |
|--------|---------|----------|
| Makefile | `make db-reset` | Quick dev reset with prompts |
| Python | `python reset_db.py` | Programmatic reset |
| SQL | `psql -f reset_db.sql` | Manual database control |
| Full Reset | `podman-compose down -v` | Complete fresh start |

---

## Troubleshooting

### Script fails with "permission denied"

Make the script executable:
```bash
chmod +x backend/reset_db.py
```

### "Database does not exist" error

Ensure the database is running:
```bash
make db-up
```

### Foreign key constraint errors

The scripts use `CASCADE` which should handle all dependencies. If issues persist, use Method 4 (complete recreation).

### Alembic version conflicts

After reset, Alembic version table is also dropped. Running `alembic upgrade head` will start fresh.
