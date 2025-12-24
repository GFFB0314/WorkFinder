"""
Entry point script to run the Remotive job scraper.

This script provides a simple way to execute the scraper without dealing with
Python module imports. It automatically configures the Python path and runs
the fetch_remotive_jobs function.
"""

import sys
import os

# Ensure the backend directory is in the python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.scrapers.remotive import fetch_remotive_jobs

if __name__ == "__main__":
    print("Starting Remotive Scraper...")
    results: list[dict] = fetch_remotive_jobs(limit=5)
    print(f"Scraping finished. Found {len(results)} tech jobs.")

