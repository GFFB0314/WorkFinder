@echo off
echo ========================================================
echo Starting WorkFinder Development Environment (Full Stack)
echo ========================================================

REM Start Backend API
start "WorkFinder API" cmd /k "cd backend && uvicorn app.main:app --reload"

REM Start Notification Monitor
start "Notification Monitor" cmd /k "cd backend && python monitor_notifications.py"

REM Start Scheduled Scraper
start "Scheduled Scraper" cmd /k "cd backend && python scheduled_scraper.py"

REM Start Frontend
start "WorkFinder Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo All services are starting up!
echo - API: http://localhost:8000
echo - Frontend: http://localhost:5173
echo - Scraper: Running every 6 hours
echo - Notifications: Checking every 5 minutes
echo.
echo You can close this window, but do not close the opened service windows.
echo ========================================================
pause
