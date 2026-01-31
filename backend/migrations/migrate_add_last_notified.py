"""
ONE-TIME MIGRATION - Executed on 2026-01-31

Add last_notified_at column to watchlists table

This migration adds tracking for when notifications were last sent.
This prevents duplicate notifications for the same jobs.
"""
import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import engine
from sqlalchemy import text

def migrate():
    print("Adding last_notified_at column to watchlists table...")
    
    with engine.connect() as conn:
        try:
            # Check if column already exists
            result = conn.execute(text("PRAGMA table_info(watchlists)"))
            columns = [row[1] for row in result]
            
            if 'last_notified_at' in columns:
                print("Column already exists. Skipping migration.")
                return
            
            # Add the column
            conn.execute(text("ALTER TABLE watchlists ADD COLUMN last_notified_at TIMESTAMP"))
            conn.commit()
            
            print("Migration completed successfully!")
            
        except Exception as e:
            print(f"Migration failed: {e}")
            conn.rollback()

if __name__ == "__main__":
    migrate()
