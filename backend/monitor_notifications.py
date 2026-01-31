"""
WorkFinder Continuous Notification Monitor

This script runs indefinitely, periodically checking for new job matches
and sending email notifications to users with matching watchlists.

Features:
    - Configurable check interval (default: 5 minutes)
    - Automatic notification tracking (prevents duplicate alerts)
    - Graceful shutdown with Ctrl+C
    - Cycle counting and error handling
    - Logs all notifications to notifications.log

Usage:
    python monitor_notifications.py
    
    # Or customize interval in code:
    run_continuous_monitor(check_interval_minutes=10)

How it works:
    1. Queries all active watchlists
    2. Finds jobs created since last notification
    3. Matches jobs against watchlist keywords
    4. Sends mock email alerts (console + file log)
    5. Updates last_notified_at timestamp
    6. Sleeps for configured interval
    7. Repeats until interrupted

Note:
    - Emails are currently mocked (printed to console and logged to file)
    - For production, integrate real SMTP email sending
    - Run as a background service or cron job in production
"""
import sys
import os
import time
from datetime import datetime

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.services.notifier import match_and_notify

def run_continuous_monitor(check_interval_minutes=5):
    """
    Continuously monitor for new jobs and send notifications.
    
    Args:
        check_interval_minutes: How often to check for new jobs (default: 5 minutes)
    """
    print("=" * 60)
    print("WorkFinder Notification Monitor - STARTED")
    print("=" * 60)
    print(f"Checking for new job matches every {check_interval_minutes} minutes")
    print("Press Ctrl+C to stop\n")
    
    cycle_count = 0
    
    try:
        while True:
            cycle_count += 1
            timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            
            print(f"\n[{timestamp}] Cycle #{cycle_count} - Checking for matches...")
            print("-" * 60)
            
            try:
                match_and_notify()
            except Exception as e:
                print(f"ERROR during notification cycle: {e}")
            
            print(f"\nNext check in {check_interval_minutes} minutes...")
            print("=" * 60)
            
            # Sleep for the specified interval
            time.sleep(check_interval_minutes * 60)
            
    except KeyboardInterrupt:
        print("\n\n" + "=" * 60)
        print("Notification Monitor STOPPED by user")
        print(f"Total cycles completed: {cycle_count}")
        print("=" * 60)

if __name__ == "__main__":
    # You can customize the interval here (in minutes)
    # Default: 5 minutes
    run_continuous_monitor(check_interval_minutes=5)
