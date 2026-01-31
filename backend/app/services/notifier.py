from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import or_, cast, String
from app import models, crud
from app.database import SessionLocal

def send_email_mock(to_email: str, job_count: int, jobs: list):
    """Mock email sending with file logging"""
    from datetime import datetime
    
    # Console output
    print(f"\n[EMAIL SENT] To: {to_email}")
    print(f"Subject: WorkFinder Alert - {job_count} new jobs found!")
    print("Body:")
    for job in jobs[:5]:
        print(f"- {job.title} at {job.company} ({job.url})")
    if job_count > 5:
        print(f"...and {job_count - 5} more.")
    print("-" * 30)
    
    # File logging
    log_file = "notifications.log"
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    with open(log_file, "a", encoding="utf-8") as f:
        f.write(f"\n{'='*70}\n")
        f.write(f"[{timestamp}] EMAIL SENT\n")
        f.write(f"To: {to_email}\n")
        f.write(f"Subject: WorkFinder Alert - {job_count} new jobs found!\n")
        f.write(f"\nMatched Jobs:\n")
        for i, job in enumerate(jobs, 1):
            f.write(f"{i}. {job.title}\n")
            f.write(f"   Company: {job.company}\n")
            f.write(f"   Location: {job.location}\n")
            f.write(f"   URL: {job.url}\n")
            f.write(f"   Posted: {job.created_at}\n")
            if i >= 10:  # Limit to first 10 in log
                f.write(f"   ...and {job_count - 10} more jobs\n")
                break
        f.write(f"{'='*70}\n")


def match_and_notify():
    """
    Main notification logic.
    Only notifies about jobs created since the last notification for each watchlist.
    """
    db: Session = SessionLocal()
    try:
        print("Starting Match & Notify cycle...")
        watchlists = db.query(models.Watchlist).all()
        
        for wl in watchlists:
            user = crud.get_user(db, wl.user_id)
            if not user:
                continue
                
            keywords = wl.keywords # List of strings
            if not keywords:
                continue
            
            # Determine time window based on last notification
            if wl.last_notified_at:
                since_time = wl.last_notified_at
                print(f"Checking jobs since last notification: {since_time}")
            else:
                # First time - check last 24 hours
                since_time = datetime.utcnow() - timedelta(hours=24)
                print(f"First notification - checking last 24 hours")
            
            # Find matching jobs created since last check
            query = db.query(models.Job).filter(models.Job.created_at >= since_time)
            
            # Construct OR filter for keywords in title/description
            filters = []
            for kw in keywords:
                pattern = f"%{kw}%"
                filters.append(models.Job.title.ilike(pattern))
                filters.append(models.Job.description.ilike(pattern))
            
            query = query.filter(or_(*filters))
            
            matched_jobs = query.all()
            
            if matched_jobs:
                send_email_mock(user.email, len(matched_jobs), matched_jobs)
                
                # Update last notification timestamp
                wl.last_notified_at = datetime.utcnow()
                db.commit()
            else:
                print(f"No new matches for watchlist {wl.id} (User: {user.email})")
                
    except Exception as e:
        print(f"Error in notification routine: {e}")
        db.rollback()
    finally:
        db.close()
