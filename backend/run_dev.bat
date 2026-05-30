@echo off
echo Starting WorkFinder Development Environment...

REM Start Backend API
start "WorkFinder API" cmd /k "uvicorn app.main:app --reload"

REM Start Notification Monitor
start "Notification Monitor" cmd /k "python monitor_notifications.py"

REM Start Scheduled Scraper (runs every 6 hours)
start "Scheduled Scraper" cmd /k "python scheduled_scraper.py"

echo Services started!
echo - API: http://localhost:8000
echo - Scraper: Running every 6 hours
echo - Notifications: Checking every 5 minutes
