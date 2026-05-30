"""
Scheduled Job Scraper

This script runs the job scraper on a schedule (every 6 hours by default).
It uses APScheduler to automatically fetch new jobs without manual intervention.

Usage:
    python scheduled_scraper.py

Configuration:
    - SCRAPE_INTERVAL_HOURS: How often to run the scraper (default: 6 hours)
    - Can be run alongside the API and notification monitor
"""
import sys
import os
import time
from datetime import datetime

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from apscheduler.schedulers.blocking import BlockingScheduler
from run_scraper import run_scrapers

# Configuration
SCRAPE_INTERVAL_HOURS = 6  # Run every 6 hours

def scheduled_scrape():
    """Run the scraper and log the execution"""
    print("\n" + "=" * 70)
    print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Running scheduled scrape...")
    print("=" * 70)
    
    try:
        run_scrapers(source_name="all", limit=1000)
        print(f"\n[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Scrape completed successfully!")
    except Exception as e:
        print(f"\n[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Error during scrape: {e}")
    
    print(f"Next scrape in {SCRAPE_INTERVAL_HOURS} hours...")
    print("=" * 70 + "\n")

if __name__ == "__main__":
    print("=" * 70)
    print("WorkFinder Scheduled Scraper - STARTED")
    print("=" * 70)
    print(f"Scraping every {SCRAPE_INTERVAL_HOURS} hours")
    print("Press Ctrl+C to stop\n")
    
    # Run immediately on startup
    scheduled_scrape()
    
    # Set up scheduler
    scheduler = BlockingScheduler()
    scheduler.add_job(
        scheduled_scrape,
        'interval',
        hours=SCRAPE_INTERVAL_HOURS,
        id='job_scraper'
    )
    
    try:
        scheduler.start()
    except (KeyboardInterrupt, SystemExit):
        print("\n\nStopping scheduled scraper...")
        scheduler.shutdown()
