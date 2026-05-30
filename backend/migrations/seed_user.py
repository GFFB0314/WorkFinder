"""
Seed Default User Script

This script creates the default user account for the WorkFinder application.
The default user is used for initial testing and demonstration purposes.

Default Credentials:
    Email: user@example.com
    Password: password123

Usage:
    python migrations/seed_user.py

Safety:
    - Checks if user already exists before creating
    - Uses secure password hashing via bcrypt
    - Prints confirmation message
"""
import sys
import os

# Add parent directory to path
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))

from app.database import SessionLocal
from app import models
from app.utils.security import get_password_hash

def seed_user():
    """Create the default user account"""
    db = SessionLocal()
    try:
        email = "user@example.com"
        password = "password123"
        
        # Check if user exists
        existing_user = db.query(models.User).filter(models.User.email == email).first()
        if existing_user:
            print(f"✓ User {email} already exists. Skipping.")
            return

        # Create user with hashed password
        hashed_password = get_password_hash(password)
        db_user = models.User(email=email, password_hash=hashed_password)
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        
        print(f"✓ Created default user:")
        print(f"  Email: {email}")
        print(f"  Password: {password}")
        print(f"  User ID: {db_user.id}")
        
    except Exception as e:
        db.rollback()
        print(f"Error seeding user: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    print("=" * 60)
    print("WorkFinder Default User Seed")
    print("=" * 60)
    seed_user()
