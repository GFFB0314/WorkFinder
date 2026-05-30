"""
Database User Cleanup Script

This script removes all users from the database except the default user (user@example.com).
Useful for resetting the database to a clean state after testing or development.

Usage:
    python migrations/cleanup_users.py

Safety:
    - Preserves the default user account
    - Cascades to delete associated watchlists
    - Prints confirmation of deleted users
"""
import sys
import os

# Add parent directory to path
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))

from app.database import SessionLocal
from app import models

def cleanup_users():
    """Remove all users except the default user"""
    db = SessionLocal()
    try:
        default_email = "user@example.com"
        
        # Get all users except default
        users_to_delete = db.query(models.User).filter(
            models.User.email != default_email
        ).all()
        
        if not users_to_delete:
            print("No users to delete. Only default user exists.")
            db.close()
            return
        
        print(f"Found {len(users_to_delete)} user(s) to delete:")
        for user in users_to_delete:
            print(f"  - {user.email}")
        
        # Delete users (watchlists will cascade)
        db.query(models.User).filter(
            models.User.email != default_email
        ).delete()
        
        db.commit()
        print(f"\n✓ Deleted {len(users_to_delete)} user(s). Default user preserved.")
        
    except Exception as e:
        db.rollback()
        print(f"Error cleaning users: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    print("=" * 60)
    print("WorkFinder User Cleanup")
    print("=" * 60)
    cleanup_users()
