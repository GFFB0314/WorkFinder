"""
WeWorkRemotely RSS Scraper Module

Fetches high-quality remote tech jobs from weworkremotely.com's RSS feed.
"""
import requests
from bs4 import BeautifulSoup
from datetime import datetime
import re
from app.services.tech_filter import is_tech_job

WWR_RSS_URL = "https://weworkremotely.com/remote-jobs.rss"

def fetch_weworkremotely_jobs(limit: int = 10) -> list[dict]:
    """
    Fetches remote jobs from WeWorkRemotely RSS feed.
    """
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }
    try:
        response = requests.get(WWR_RSS_URL, headers=headers)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, "xml")
        items = soup.find_all("item")
        
        normalized_jobs = []
        print(f"Fetched {len(items)} items from WeWorkRemotely RSS. Processing top {limit}...")
        
        count = 0
        for item in items:
            if count >= limit:
                break
                
            title_text = item.find("title").get_text() if item.find("title") else ""
            # WeWorkRemotely titles are usually like: "Company Name: Job Title"
            company = "Unknown"
            title = title_text
            if ":" in title_text:
                parts = title_text.split(":", 1)
                company = parts[0].strip()
                title = parts[1].strip()
                
            description = item.find("description").get_text() if item.find("description") else ""
            link = item.find("link").get_text() if item.find("link") else ""
            pub_date = item.find("pubDate").get_text() if item.find("pubDate") else None
            
            # Simple location extraction from description or default to "Remote"
            location = "Remote"
            
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
                "remote": True, # WWR is remote
                "description": description,
                "url": link,
                "posted_at": pub_date,
                "source": "WeWorkRemotely",
                "raw_data": str(item)[:200]
            }
            
            normalized_jobs.append(normalized_job)
            count += 1
            
        return normalized_jobs
        
    except Exception as e:
        print(f"Error fetching from WeWorkRemotely RSS: {e}")
        return []

if __name__ == "__main__":
    results = fetch_weworkremotely_jobs(limit=5)
    for i, job in enumerate(results, 1):
        print(f"{i}. {job['title']} at {job['company']}")
        print(f"   URL: {job['url']}")
