#!/usr/bin/env python3
"""
Database initialization script for News Pulse scraper.
Creates tables and seeds initial RSS sources using shared SQL files.
Safe to run multiple times (idempotent).
"""
import sys
import os

# Add the app directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from app.database.connection import init_connection_pool, close_connection_pool, get_cursor

# Path to shared SQL files in backend
BACKEND_DIR = os.path.join(os.path.dirname(__file__), '..', 'backend')
SCHEMA_SQL_PATH = os.path.join(BACKEND_DIR, 'src', 'db', 'schema.sql')
SEED_SQL_PATH = os.path.join(BACKEND_DIR, 'src', 'db', 'seed.sql')


def read_sql_file(path: str) -> str:
    """Read SQL from file."""
    with open(path, 'r') as f:
        return f.read()


def run_sql(sql: str, description: str):
    """Execute SQL statements."""
    try:
        init_connection_pool()
        with get_cursor() as cur:
            cur.execute(sql)
        print(f"✓ {description}")
    except Exception as e:
        print(f"✗ {description}: {e}")
        raise
    finally:
        close_connection_pool()


def main():
    print("Initializing News Pulse database...")
    print(f"Reading schema from: {SCHEMA_SQL_PATH}")
    print(f"Reading seeds from: {SEED_SQL_PATH}")
    
    schema_sql = read_sql_file(SCHEMA_SQL_PATH)
    seed_sql = read_sql_file(SEED_SQL_PATH)
    
    run_sql(schema_sql, "Creating tables")
    run_sql(seed_sql, "Seeding RSS sources")
    print("Database initialization complete!")


if __name__ == "__main__":
    main()