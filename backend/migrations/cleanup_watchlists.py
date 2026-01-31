"""
ONE-TIME CLEANUP - Executed on 2026-01-31

Clean up duplicate watchlists

Removes duplicate watchlists for the same user with identical keywords.
Can be run anytime to clean up duplicates.
"""
import sys
import os

# Add parent directory to path
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))

from app.database import SessionLocal
from app import models

def cleanup_duplicate_watchlists():
    db = SessionLocal()
    
    try:
        # Get all watchlists
        watchlists = db.query(models.Watchlist).all()
        
        print(f"Found {len(watchlists)} total watchlists")
        
        # Group by user_id and keywords
        seen = {}
        duplicates = []
        
        for wl in watchlists:
            key = (wl.user_id, tuple(sorted(wl.keywords)))
            
            if key in seen:
                duplicates.append(wl.id)
                print(f"Duplicate found: Watchlist ID {wl.id} (User {wl.user_id}, Keywords: {wl.keywords})")
            else:
                seen[key] = wl.id
        
        if duplicates:
            print(f"\nDeleting {len(duplicates)} duplicate watchlists...")
            for wl_id in duplicates:
                wl = db.query(models.Watchlist).filter(models.Watchlist.id == wl_id).first()
                if wl:
                    db.delete(wl)
            
            db.commit()
            print("Duplicates removed successfully!")
        else:
            print("No duplicates found!")
        
        # Show remaining watchlists
        remaining = db.query(models.Watchlist).all()
        print(f"\nRemaining watchlists: {len(remaining)}")
        for wl in remaining:
            print(f"  - ID {wl.id}: User {wl.user_id}, Keywords: {wl.keywords}")
            
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    cleanup_duplicate_watchlists()
