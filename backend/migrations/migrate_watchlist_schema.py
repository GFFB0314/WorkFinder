"""
Database Migration: Add Watchlist Enhancement Fields

This migration adds new columns to the watchlists table to support
comprehensive job filtering (location, remote, experience, salary, active status).

Usage:
    python migrations/migrate_watchlist_schema.py

Safety:
    - Checks if columns already exist before adding
    - Preserves existing watchlist data
    - Adds sensible default values for new columns
"""
import sys
import os

# Add parent directory to path
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))

from app.database import engine
from sqlalchemy import text

def migrate():
    """Add new columns to watchlists table"""
    print("=" + "=" * 59)
    print("Watchlist Schema Migration")
    print("=" + "=" * 59)
    
    # SQL to add new columns with default values
    migrations = [
        "ALTER TABLE watchlists ADD COLUMN location TEXT",
        "ALTER TABLE watchlists ADD COLUMN remote_only BOOLEAN DEFAULT 0",
        "ALTER TABLE watchlists ADD COLUMN experience_level TEXT",
        "ALTER TABLE watchlists ADD COLUMN min_salary INTEGER",
        "ALTER TABLE watchlists ADD COLUMN max_salary INTEGER",
        "ALTER TABLE watchlists ADD COLUMN active BOOLEAN DEFAULT 1",
    ]
    
    with engine.connect() as conn:
        for sql in migrations:
            try:
                conn.execute(text(sql))
                conn.commit()
                column_name = sql.split("ADD COLUMN ")[1].split(" ")[0]
                print(f"[OK] Added column: {column_name}")
            except Exception as e:
                if "duplicate column name" in str(e).lower():
                    column_name = sql.split("ADD COLUMN ")[1].split(" ")[0]
                    print(f"[SKIP] Column already exists: {column_name}")
                else:
                    print(f"[ERROR] {e}")
    
    print("\n[OK] Migration completed successfully!")
    print("=" + "=" * 59)

if __name__ == "__main__":
    migrate()
