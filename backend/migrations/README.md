# Database Migrations & Utilities

This folder contains one-time database migration scripts and utility tools.

## Migration History

### 2026-01-31: Notification Tracking
- **`migrate_add_last_notified.py`**: Added `last_notified_at` column to `watchlists` table
- **`cleanup_watchlists.py`**: Removed duplicate watchlists
- **`cleanup_test_jobs.py`**: Removed test jobs created by demo scripts

## Utility Scripts

### `demo_notifications.py`
Demonstrates the notification system by creating test data and triggering alerts.
- Creates test user and watchlist
- Creates test job matching keywords
- Triggers notification engine
- Logs results to `notifications.log`

**Usage**: `python migrations/demo_notifications.py`

### `view_watchlists.py`
Displays all watchlists in the database with full details.
- Shows user email, keywords, frequency
- Displays creation and last notification timestamps

**Usage**: `python migrations/view_watchlists.py`

## Notes

- Migration scripts are kept for reference and documentation
- They have already been executed on the production database
- Migration scripts include safety checks and can be re-run if needed
- Utility scripts can be run anytime for debugging/testing
- For future migrations, consider using Alembic for versioned migrations

