# """
# Entry point script to run the Remotive job scraper.

# This script provides a simple way to execute the scraper without dealing with
# Python module imports. It automatically configures the Python path and runs
# the fetch_remotive_jobs function.
# """

# import sys
# import os

# # Ensure the backend directory is in the python path
# sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# from app.scrapers.remotive import fetch_remotive_jobs

# if __name__ == "__main__":
#     print("Starting Remotive Scraper...")
#     results: list[dict] = fetch_remotive_jobs(limit=5)
#     print(f"Scraping finished. Found {len(results)} tech jobs.")

"""
Entry point script to run both Remotive and Adzuna scrapers.

This script executes both scrapers and prints the results.
"""

import sys
import os

# Ensure the backend directory is in the python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.scrapers.remotive import fetch_remotive_jobs
from app.scrapers.adzuna import fetch_adzuna_jobs
from app.utils.normalize import to_job_model_payload

if __name__ == "__main__":
    print("=== Starting Remotive Scraper ===")
    remotive_results = fetch_remotive_jobs(limit=5)
    normalized_remotive = [to_job_model_payload(job) for job in remotive_results]
    print(f"Remotive finished. Found {len(normalized_remotive)} tech jobs.")
    for i, job in enumerate(normalized_remotive, 1):
        print(f"{i}. {job['title']} at {job['company']}")
        print(f"   Location: {job['location']}")
        print(f"   URL: {job['url']}")
        print(f"   Hash: {job['normalized_hash']}")
        print("-" * 40)

    print("\n=== Starting Adzuna Scraper ===")
    adzuna_results = fetch_adzuna_jobs(limit=5, keyword="developer", country="gb")
    normalized_adzuna = [to_job_model_payload(job) for job in adzuna_results]
    print(f"Adzuna finished. Found {len(normalized_adzuna)} jobs.")
    for i, job in enumerate(normalized_adzuna, 1):
        print(f"{i}. {job['title']} at {job['company']}")
        print(f"   Location: {job['location']}")
        print(f"   URL: {job['url']}")
        print(f"   Hash: {job['normalized_hash']}")
        print("-" * 40)
