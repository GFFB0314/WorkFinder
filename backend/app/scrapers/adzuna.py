"""
Adzuna API Scraper Module

This module fetches job postings from the Adzuna API (https://www.adzuna.com/).
Adzuna aggregates job listings from multiple sources across various countries.

Features:
    - API-based job fetching (no HTML parsing required)
    - Country-specific job searches (default: UK)
    - Tech job filtering using keyword matching
    - Graceful handling of missing API credentials

Configuration:
    Requires environment variables:
    - ADZUNA_APP_ID: Your Adzuna application ID
    - ADZUNA_APP_KEY: Your Adzuna API key
    
    Get credentials at: https://developer.adzuna.com/

Usage:
    from app.scrapers.adzuna import fetch_adzuna_jobs
    
    jobs = fetch_adzuna_jobs(country="gb", limit=20)
    for job in jobs:
        print(job['title'], job['company'])

Returns:
    List of normalized job dictionaries with fields:
    - title, company, location, remote, description, url, posted_at, source, raw_data
"""
import requests
import os
from typing import List, Dict, Any
from app.services.tech_filter import is_tech_job

ADZUNA_API_URL = "https://api.adzuna.com/v1/api/jobs"
ADZUNA_APP_ID = os.getenv("ADZUNA_APP_ID", "placeholder_id")
ADZUNA_APP_KEY = os.getenv("ADZUNA_APP_KEY", "placeholder_key")

def fetch_adzuna_jobs(country: str = "gb", limit: int = 10) -> List[Dict[str, Any]]:
    """
    Fetches jobs from Adzuna API for a specific country.
    """
    url = f"{ADZUNA_API_URL}/{country}/search/1"
    params = {
        "app_id": ADZUNA_APP_ID,
        "app_key": ADZUNA_APP_KEY,
        "results_per_page": limit,
        "what": "developer", # Default search term
        "content-type": "application/json",
    }
    
    try:
        response = requests.get(url, params=params)
        # For development without valid keys, we might get 400/401. 
        # We'll fail gracefully or return mock data if env vars are unset.
        if response.status_code in [400, 401] and ADZUNA_APP_ID == "placeholder_id":
            print("Adzuna API credentials missing. Returning empty list (or mock data optionally).")
            return []

        response.raise_for_status()
        data = response.json()
        
        jobs = data.get("results", [])
        normalized_jobs = []

        print(f"Fetched {len(jobs)} jobs from Adzuna ({country}). Processing...")

        for job in jobs:
            normalized_job_temp = {
                "title": job.get("title"),
                "company": job.get("company", {}).get("display_name"),
            }

            if not is_tech_job(normalized_job_temp):
                continue

            normalized_job = {
                "title": job.get("title"),
                "company": job.get("company", {}).get("display_name"),
                "location": job.get("location", {}).get("display_name"),
                "remote": False, # Adzuna data may vary, defaulting to False
                "description": job.get("description"),
                "url": job.get("redirect_url"),
                "posted_at": job.get("created"),
                "source": "Adzuna",
                "raw_data": job
            }
            normalized_jobs.append(normalized_job)
            
        return normalized_jobs

    except requests.RequestException as e:
        print(f"Error fetching from Adzuna: {e}")
        return []
