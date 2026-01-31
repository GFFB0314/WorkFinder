"""
ONE-TIME CLEANUP - Executed on 2026-01-31

Clean Up Test Jobs from Database

Purpose:
    Removes all jobs from "Test Corp" company that were created by demo/test scripts.
    
Usage:
    python migrations/cleanup_test_jobs.py
    
What it does:
    - Queries all jobs where company = "Test Corp"
    - Deletes each test job
    - Reports total count of deleted jobs
    - Shows remaining job count in database
    
When to run:
    - After running demo_notifications.py multiple times
    - When test data needs to be cleaned from the database
    - Before production deployment
"""
import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app import models

def cleanup_test_jobs():
    db = SessionLocal()
    
    try:
        # Find all Test Corp jobs
        test_jobs = db.query(models.Job).filter(models.Job.company == "Test Corp").all()
        
        print(f"Found {len(test_jobs)} test jobs from 'Test Corp'")
        
        if test_jobs:
            for job in test_jobs:
                print(f"  - Deleting: {job.title}")
                db.delete(job)
            
            db.commit()
            print(f"\n✓ Deleted {len(test_jobs)} test jobs")
        else:
            print("No test jobs found")
        
        # Show remaining job count
        remaining = db.query(models.Job).count()
        print(f"\nRemaining jobs in database: {remaining}")
            
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    cleanup_test_jobs()
