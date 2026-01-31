"""
Demo Notification System

This script demonstrates the notification system by:
1. Creating a test user and watchlist
2. Creating a fresh test job that matches the watchlist keywords
3. Triggering the notification engine to send a mock email
4. Logging the notification to notifications.log file

Run this script to:
- Test that notifications are working
- Generate sample entries in notifications.log
- Verify email matching logic

Note: Creates test data in the database (Test Corp jobs)
"""
import sys
import os

# Add parent directory to path
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))

from app.services.notifier import match_and_notify
from app.database import SessionLocal
from app import models, crud, schemas

def setup_test_data():
    """
    Creates test data for notification demo:
    - A test user (notif_test@example.com)
    - A watchlist for "Python" keyword
    - A fresh job matching the keyword
    """
    db = SessionLocal()
    
    # 1. Create a test user (or get existing)
    user_email = "notif_test@example.com"
    user = crud.get_user_by_email(db, user_email)
    if not user:
        print(f"Creating test user: {user_email}")
        user = crud.create_user(db, user_email, "hashed_secret")
    else:
        print(f"Using existing test user: {user_email}")
    
    # 2. Create a watchlist for "Python" (or skip if exists)
    print("Creating watchlist for 'Python'...")
    try:
        wl = models.Watchlist(user_id=user.id, keywords=["python"], frequency="daily")
        db.add(wl)
        db.commit()
        print("Watchlist created!")
    except:
        db.rollback()
        print("Watchlist already exists.")

    # 3. Create a fresh job matching "Python"
    # This ensures the notification engine has something new to match
    print("Creating a fresh 'Python Developer' job...")
    job = models.Job(
        title="Senior Python Back-End Developer",
        company="Test Corp",
        location="Remote",
        normalized_hash="unique_hash_" + str(os.urandom(4).hex()), # Randomize to ensure it's "new"
        source_id=1
    )
    db.add(job)
    db.commit()
    print("Test job created!")
    db.close()

if __name__ == "__main__":
    print("="*70)
    print("WorkFinder Notification Demo")
    print("="*70)
    print("\nThis will:")
    print("1. Create test user and watchlist")
    print("2. Create a test job matching 'Python'")
    print("3. Trigger notification engine")
    print("4. Log results to notifications.log\n")
    
    setup_test_data()
    
    print("\n--- Triggering Notification Engine ---")
    
    # Debug: Check what's in the database
    from datetime import datetime, timedelta
    db = SessionLocal()
    since_time = datetime.utcnow() - timedelta(hours=24)
    recent_jobs = db.query(models.Job).filter(models.Job.created_at >= since_time).all()
    print(f"DEBUG: Found {len(recent_jobs)} jobs created in last 24h")
    for job in recent_jobs[:3]:
        print(f"  - {job.title} (created: {job.created_at})")
    
    watchlists = db.query(models.Watchlist).all()
    print(f"DEBUG: Found {len(watchlists)} watchlists")
    for wl in watchlists[:3]:
        print(f"  - Watchlist ID {wl.id}: keywords={wl.keywords}")
    db.close()
    
    # Trigger the notification engine
    match_and_notify()
    
    print("\n" + "="*70)
    print("Demo complete! Check notifications.log for the logged email.")
    print("="*70)
