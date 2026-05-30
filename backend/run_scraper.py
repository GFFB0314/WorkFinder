"""
WorkFinder Universal Scraper Handler

This script orchestrates the execution of all job scrapers and handles data persistence.

Features:
    - Supports multiple scraper sources (API and HTML)
    - Automatic source registration in database
    - Job deduplication before insertion
    - Command-line interface for selective scraping
    - Error handling and reporting

Usage:
    # Scrape all sources
    python run_scraper.py
    
    # Scrape specific source
    python run_scraper.py --source Adzuna --limit 10
    
    # List available sources
    python run_scraper.py --list

Supported Sources:
    - Remotive (API): Remote tech jobs
    - Adzuna (API): Job market
    - Jobartis (HTML): Cameroon jobs
    - Emploi.cm (HTML): Cameroon IT jobs

Environment Variables:
    ADZUNA_APP_ID: Adzuna API application ID
    ADZUNA_APP_KEY: Adzuna API key
"""
import sys
import os
import argparse
from sqlalchemy.orm import Session
from datetime import datetime
from dotenv import load_dotenv

# Load env vars before imports
load_dotenv()

# Add global path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal, init_db
from app import crud, models, schemas
from app.scrapers.remotive import fetch_remotive_jobs
from app.scrapers.adzuna import fetch_adzuna_jobs
from app.scrapers.jobartis import fetch_jobartis_jobs
from app.scrapers.emploicm import fetch_emploicm_jobs

# Source Registry
SOURCES = {
    "Remotive": {"func": fetch_remotive_jobs, "type": "api", "url": "https://remotive.com"},
    "Adzuna": {"func": fetch_adzuna_jobs, "type": "api", "url": "https://adzuna.com"},
    "Jobartis": {"func": fetch_jobartis_jobs, "type": "html", "url": "https://jobartis.com"},
    "Emploi.cm": {"func": fetch_emploicm_jobs, "type": "html", "url": "https://emploi.cm"},
}

def get_or_create_source(db: Session, name: str, data: dict) -> models.Source:
    source = crud.get_source_by_name(db, name)
    if not source:
        print(f"Creating new source: {name}")
        source_create = schemas.SourceCreate(
            name=name,
            url=data["url"],
            source_type=data["type"],
            scrape_frequency="daily"
        )
        source = crud.create_source(db, source_create)
    return source

def run_scrapers(source_name: str = "all", limit: int = 10):
    db: Session = SessionLocal()
    init_db() # Ensure tables exist
    
    targets = SOURCES.keys() if source_name == "all" else [source_name]
    
    total_new = 0
    total_errors = 0

    print(f"Starting Scraper Run... Target: {source_name}")

    for name in targets:
        if name not in SOURCES:
            print(f"Source {name} not found. Skipping.")
            continue
            
        config = SOURCES[name]
        source_db = get_or_create_source(db, name, config)
        
        if not source_db.status:
            print(f"Source {name} is disabled. Skipping.")
            continue

        print(f"\n--- Scraping {name} ---")
        try:
            # Fetch Jobs
            results = config["func"](limit=limit)
            print(f"Fetched {len(results)} jobs from {name}.")
            
            # Save to DB
            count = 0
            for job_data in results:
                # Prepare JobCreate schema
                # Extract skills
                from app.services.tech_filter import extract_skills
                full_text = f"{job_data['title']} {job_data.get('description', '')}"
                extracted_skills = extract_skills(full_text)

                job_in = schemas.JobCreate(
                    title=job_data["title"],
                    company=job_data["company"],
                    location=job_data.get("location"),
                    remote=job_data.get("remote", False),
                    description=job_data.get("description"),
                    url=job_data.get("url"),
                    skills=extracted_skills,
                    source_id=source_db.id,
                    raw_json=job_data.get("raw_data", {}),
                    posted_at=None 
                )
                
                try:
                    crud.create_job(db, job_in)
                    count += 1
                except Exception as e:
                    # Ignore duplicates silently (expected behavior)
                    if "unique constraint" not in str(e).lower() and "integrityerror" not in str(e).lower():
                        print(f"Failed to save job {job_data['title']}: {e}")
            
            print(f"Saved {count} new jobs from {name}.")
            crud.update_source_last_scraped(db, source_db.id)
            total_new += count

        except Exception as e:
            print(f"Critical error scraping {name}: {e}")
            total_errors += 1
            
    db.close()
    print(f"\nScraping Finished. Total New Jobs: {total_new}. Errors: {total_errors}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run Job Scrapers")
    parser.add_argument("--source", type=str, default="all", help="Source to scrape (Remotive, Adzuna, Jobartis, Emploi.cm)")
    parser.add_argument("--limit", type=int, default=15, help="Max jobs per source")
    
    args = parser.parse_args()
    
    run_scrapers(args.source, args.limit)
