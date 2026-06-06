"""
Arbeitnow API Scraper Module

Fetches tech jobs from the public Arbeitnow API (https://arbeitnow.com/api/job-board-api).
"""
import requests
from app.services.tech_filter import is_tech_job

ARBEITNOW_API_URL = "https://arbeitnow.com/api/job-board-api"

def fetch_arbeitnow_jobs(limit: int = 10) -> list[dict]:
    """
    Fetches jobs from the Arbeitnow API.
    """
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }
    try:
        response = requests.get(ARBEITNOW_API_URL, headers=headers)
        response.raise_for_status()
        data = response.json()
        
        jobs = data.get("data", [])
        normalized_jobs = []
        
        print(f"Fetched {len(jobs)} jobs from Arbeitnow. Processing top {limit}...")
        
        count = 0
        for job in jobs:
            if count >= limit:
                break
                
            title = job.get("title")
            company = job.get("company_name")
            location = job.get("location", "Remote")
            remote = job.get("remote", False)
            url = job.get("url")
            description = job.get("description")
            posted_at = job.get("created_at")
            
            normalized_job_temp = {
                "title": title,
                "company": company
            }
            
            if not is_tech_job(normalized_job_temp):
                continue
                
            normalized_job = {
                "title": title,
                "company": company,
                "location": location,
                "remote": remote,
                "description": description,
                "url": url,
                "posted_at": posted_at,
                "source": "Arbeitnow",
                "raw_data": job
            }
            
            normalized_jobs.append(normalized_job)
            count += 1
            
        return normalized_jobs
        
    except Exception as e:
        print(f"Error fetching from Arbeitnow: {e}")
        return []

if __name__ == "__main__":
    results = fetch_arbeitnow_jobs(limit=5)
    for i, job in enumerate(results, 1):
        print(f"{i}. {job['title']} at {job['company']} (Remote: {job['remote']})")
