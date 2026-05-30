"""
Notification Matching & Alerting Service

Matches new jobs against user watchlists and sends mock email notifications.
Uses word-boundary-aware matching to avoid false positives with short keywords
like "AI" matching inside words like "maintain" or "domain".
"""

import re
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app import models, crud
from app.database import SessionLocal


def _strip_html(text: str) -> str:
    """Remove HTML tags from a string for clean text matching."""
    if not text:
        return ""
    return re.sub(r"<[^>]+>", " ", text)


def _keyword_matches(keyword: str, text: str) -> bool:
    """
    Check if a keyword appears in text using word-boundary matching.
    
    This prevents short keywords like 'AI' from matching inside
    unrelated words like 'maintain', 'domain', 'training', etc.
    
    For multi-word keywords like 'data science', we check if the 
    exact phrase appears (case-insensitive).
    """
    if not text or not keyword:
        return False
    # Use word boundaries (\\b) for precise matching
    # re.escape handles special regex characters in keywords
    pattern = r"\b" + re.escape(keyword.strip()) + r"\b"
    return bool(re.search(pattern, text, re.IGNORECASE))


def _job_matches_watchlist(job: models.Job, keywords: list[str]) -> bool:
    """
    Check if a job matches any of the watchlist keywords.
    
    Matching is done on:
      - Job title (clean text)
      - Job description (HTML-stripped)
    
    Uses word-boundary matching to avoid false positives.
    """
    title = job.title or ""
    description = _strip_html(job.description or "")
    combined = f"{title} {description}"
    
    for kw in keywords:
        if _keyword_matches(kw, combined):
            return True
    return False


def send_email_mock(to_email: str, job_count: int, jobs: list):
    """Mock email sending with file logging"""
    
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
    Uses word-boundary matching to prevent false positives.
    """
    db: Session = SessionLocal()
    try:
        print("Starting Match & Notify cycle...")
        watchlists = db.query(models.Watchlist).filter(
            models.Watchlist.active == True
        ).all()
        
        for wl in watchlists:
            user = crud.get_user(db, wl.user_id)
            if not user:
                continue
                
            keywords = wl.keywords  # List of strings
            if not keywords:
                continue
            
            # Determine time window based on last notification
            if wl.last_notified_at:
                since_time = wl.last_notified_at
                print(f"Watchlist {wl.id}: Checking jobs since {since_time}")
            else:
                # First time - check last 24 hours
                since_time = datetime.utcnow() - timedelta(hours=24)
                print(f"Watchlist {wl.id}: First check - last 24 hours")
            
            # Get all new jobs since last notification
            candidate_jobs = db.query(models.Job).filter(
                models.Job.created_at >= since_time
            ).all()
            
            # Apply precise word-boundary matching in Python
            matched_jobs = [
                job for job in candidate_jobs
                if _job_matches_watchlist(job, keywords)
            ]
            
            if matched_jobs:
                print(f"Watchlist {wl.id}: {len(matched_jobs)} matches for keywords {keywords}")
                send_email_mock(user.email, len(matched_jobs), matched_jobs)
                
                # Update last notification timestamp
                wl.last_notified_at = datetime.utcnow()
                db.commit()
            else:
                print(f"Watchlist {wl.id}: No new matches (User: {user.email})")
                
    except Exception as e:
        print(f"Error in notification routine: {e}")
        db.rollback()
    finally:
        db.close()
