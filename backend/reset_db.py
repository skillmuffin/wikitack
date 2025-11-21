#!/usr/bin/env python3
"""
Database Reset Script
WARNING: This script will DELETE ALL DATA in the database!
Use with caution, typically only in development environments.
"""

import subprocess
import sys
import os


def run_command(cmd, description):
    """Run a shell command and handle errors."""
    print(f"\n{description}...")
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)

    if result.returncode != 0:
        print(f"❌ Error: {result.stderr}")
        return False

    if result.stdout:
        print(result.stdout)

    return True


def drop_all_tables():
    """Drop all tables in the database using psql via podman."""

    # Database connection parameters
    db_name = os.getenv("POSTGRES_DB", "wikitack")
    db_user = os.getenv("POSTGRES_USER", "wikitack")

    # SQL command to drop all tables
    sql_cmd = """
    DO \\$\\$ DECLARE
        r RECORD;
    BEGIN
        FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
            EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
        END LOOP;
    END \\$\\$;
    """

    # Try to find the postgres container
    find_container = "podman ps --filter name=postgres --format '{{.Names}}' | head -n 1"
    result = subprocess.run(find_container, shell=True, capture_output=True, text=True)

    if result.returncode != 0 or not result.stdout.strip():
        print("❌ Error: Could not find running PostgreSQL container")
        print("   Make sure the database is running with: make db-up")
        return False

    container_name = result.stdout.strip()
    print(f"📦 Found database container: {container_name}")

    # Build podman exec command to run psql inside the container
    psql_cmd = f'podman exec {container_name} psql -U {db_user} -d {db_name} -c "{sql_cmd}"'

    if run_command(psql_cmd, "🗑️  Dropping all tables"):
        print("✅ All tables dropped successfully!")
        return True
    else:
        print("❌ Failed to drop tables")
        return False


def recreate_tables():
    """Recreate all tables using Alembic migrations."""
    print("\n🔄 Running Alembic migrations to recreate tables...")

    backend_dir = os.path.dirname(os.path.abspath(__file__))
    result = subprocess.run(
        ["alembic", "upgrade", "head"],
        cwd=backend_dir,
        capture_output=True,
        text=True
    )

    if result.returncode == 0:
        print("✅ Tables recreated successfully!")
        print(result.stdout)
        return True
    else:
        print("❌ Error recreating tables:")
        print(result.stderr)
        return False


def main():
    """Main function to reset the database."""
    print("=" * 60)
    print("DATABASE RESET SCRIPT")
    print("=" * 60)
    print(f"\nDatabase: wikitack")
    print("\n⚠️  WARNING: This will DELETE ALL DATA in the database!")
    print("=" * 60)

    # Confirmation prompt
    confirm = input("\nType 'DELETE ALL DATA' to confirm: ")

    if confirm != "DELETE ALL DATA":
        print("\n❌ Aborted. Database not modified.")
        sys.exit(0)

    # Drop all tables
    if not drop_all_tables():
        sys.exit(1)

    # Ask if user wants to recreate tables
    recreate = input("\n❓ Do you want to recreate tables with migrations? (y/n): ")

    if recreate.lower() == 'y':
        if recreate_tables():
            print("\n✅ Database reset complete!")
        else:
            print("\n⚠️  Tables dropped but migration failed.")
            print("   Run 'alembic upgrade head' manually to recreate tables.")
            sys.exit(1)
    else:
        print("\n✅ Database reset complete. Tables not recreated.")
        print("   Run 'alembic upgrade head' manually to recreate tables.")


if __name__ == "__main__":
    main()
