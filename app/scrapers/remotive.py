import requests
from datetime import datetime
from app.services.tech_filter import is_tech_job


REMOTIVE_API_URL = "https://remotive.com/api/remote-jobs"

def fetch_remotive_jobs(limit: int = 10) -> list[dict]:
    """
    Fetches jobs from Remotive API.
    Args:
        limit (int): Number of jobs to return (for PoC purposes).
    Returns:
        list[dict]: List of normalized job dictionaries.
    """
    try:
        response = requests.get(REMOTIVE_API_URL)
        response.raise_for_status()
        data = response.json()
        
        jobs = data.get("jobs", [])
        normalized_jobs: list[dict] = []

        print(f"Fetched {len(jobs)} jobs from Remotive. Processing top {limit}...")

        for job in jobs[:limit]:
            # Normalize first to get clean title/company
            normalized_job_temp = {
                "title": job.get("title"),
                "company": job.get("company_name"),
            }

            if not is_tech_job(normalized_job_temp):
                print(f"Skipping Non-Tech Job: {normalized_job_temp['title']}")
                continue

            # Normalize to match our Job model structure roughly
            normalized_job: dict = {

                "title": job.get("title"),
                "company": job.get("company_name"),
                "location": job.get("candidate_required_location"),
                "remote": True, # Remotive is all remote
                "description": job.get("description"), # functionality to clean html might be needed later
                "url": job.get("url"),
                "posted_at": job.get("publication_date"), # Format might need adjustment
                "source": "Remotive",
                "raw_data": job # Keep raw for debug
            }
            normalized_jobs.append(normalized_job)
            
        return normalized_jobs

    except requests.RequestException as e:
        print(f"Error fetching from Remotive: {e}")
        return []

if __name__ == "__main__":
    # PoC Execution
    results: list[dict] = fetch_remotive_jobs(limit=5)
    for i, job in enumerate(results, 1):
        print(f"{i}. {job['title']} at {job['company']}")
        print(f"   Location: {job['location']}")
        print(f"   URL: {job['url']}")
        print("-" * 40)