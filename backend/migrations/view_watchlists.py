"""
View All Watchlists - Utility Script

This utility script displays all watchlists currently stored in the database.

Usage:
    python migrations/view_watchlists.py

Output:
    - Total number of watchlists
    - For each watchlist:
        * ID
        * User email
        * Keywords
        * Frequency
        * Creation timestamp
        * Last notification timestamp

Useful for:
    - Debugging watchlist issues
    - Verifying watchlist creation
    - Checking notification timestamps
"""
import sys
import os

# Add parent directory to path
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))

from app.database import SessionLocal
from app import models

def view_all_watchlists():
    """
    Query and display all watchlists from the database.
    
    Returns:
        None (prints to console)
    """
    db = SessionLocal()
    watchlists = db.query(models.Watchlist).all()

    print(f"\nTotal watchlists: {len(watchlists)}\n")
    
    for wl in watchlists:
        user = db.query(models.User).filter(models.User.id == wl.user_id).first()
        print(f"ID: {wl.id}")
        print(f"  User: {user.email if user else 'Unknown'}")
        print(f"  Keywords: {wl.keywords}")
        print(f"  Frequency: {wl.frequency}")
        print(f"  Created: {wl.created_at}")
        print(f"  Last Notified: {wl.last_notified_at}")
        print()

    db.close()

if __name__ == "__main__":
    view_all_watchlists()

