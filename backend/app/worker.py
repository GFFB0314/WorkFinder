"""
Celery Worker Configuration

Configures the Celery distributed task queue for asynchronous job processing.
Registers periodic tasks for:
  - Job scraping (every 6 hours)
  - Notification matching & alerting (every 5 minutes)
"""

import os
import sys
from celery import Celery

# Ensure backend is on path when running as standalone worker
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Initialize Celery application
celery: Celery = Celery("workfinder")

# Configure broker and result backend from environment variables
celery.conf.broker_url = os.environ.get("CELERY_BROKER_URL", "redis://localhost:6379/0")
celery.conf.result_backend = os.environ.get("CELERY_RESULT_BACKEND", "redis://localhost:6379/0")

# Serialization settings
celery.conf.accept_content = ["json"]
celery.conf.task_serializer = "json"
celery.conf.result_serializer = "json"
celery.conf.timezone = "UTC"


# ============================================================================
# Task Definitions
# ============================================================================

@celery.task(name="workfinder.run_scraper")
def run_scraper_task():
    """Run all registered scrapers to ingest new job postings."""
    from run_scraper import run_scrapers
    print("[Celery] Starting scheduled scraping cycle...")
    try:
        run_scrapers(source_name="all", limit=1000)
        print("[Celery] Scraping cycle completed successfully.")
        return {"status": "success"}
    except Exception as e:
        print(f"[Celery] Scraping cycle failed: {e}")
        return {"status": "error", "detail": str(e)}


@celery.task(name="workfinder.run_notifications")
def run_notification_task():
    """Match new jobs against user watchlists and send email notifications."""
    from app.services.notifier import match_and_notify
    print("[Celery] Starting notification matching cycle...")
    try:
        match_and_notify()
        print("[Celery] Notification cycle completed successfully.")
        return {"status": "success"}
    except Exception as e:
        print(f"[Celery] Notification cycle failed: {e}")
        return {"status": "error", "detail": str(e)}


# ============================================================================
# Celery Beat Schedule (Periodic Tasks)
# ============================================================================

celery.conf.beat_schedule = {
    "scrape-all-sources-every-6h": {
        "task": "workfinder.run_scraper",
        "schedule": 6 * 60 * 60,  # Every 6 hours (21600 seconds)
    },
    "match-and-notify-every-5min": {
        "task": "workfinder.run_notifications",
        "schedule": 5 * 60,  # Every 5 minutes (300 seconds)
    },
}
