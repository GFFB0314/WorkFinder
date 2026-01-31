"""
Jobartis HTML Scraper Module

Scrapes job postings from Jobartis Cameroun (https://jobartiscameroun.com).
Jobartis is a major job board in Cameroon covering various industries.

Features:
    - HTML scraping using BeautifulSoup
    - Tech job filtering applied
    - Handles dynamic site structure
    - Graceful error handling

Limitations:
    - CSS selectors may need updates if site structure changes
    - Currently returns 0 jobs (selectors outdated)
    - Requires manual inspection to fix selectors

Usage:
    from app.scrapers.jobartis import fetch_jobartis_jobs
    
    jobs = fetch_jobartis_jobs(limit=10)

Note:
    This scraper may need maintenance if the website structure changes.
"""
import requests
from bs4 import BeautifulSoup
from app.services.tech_filter import is_tech_job

JOBARTIS_URL = "https://jobartiscameroun.com"

def fetch_jobartis_jobs(limit: int = 10) -> list[dict]:
    """
    Scrapes jobs from Jobartis (Cameroun).
    """
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }
    
    try:
        response = requests.get(JOBARTIS_URL, headers=headers)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, "html.parser")
        job_cards = soup.find_all("div", class_="job-card") # Hypothetical class, adjusting to standard structures often found
        
        # Fallback if specific class not found, try generic search matches
        if not job_cards:
            job_cards = soup.select(".card-job, .job-listing, .offer-container")

        normalized_jobs = []
        print(f"Scraping Jobartis... Found {len(job_cards)} potential cards.")

        count = 0
        for card in job_cards:
            if count >= limit:
                break
                
            # Extraction logic - adapting to common patterns
            title_elem = card.find(["h2", "h3", "a"], class_=["title", "job-title"])
            company_elem = card.find(["div", "span", "p"], class_=["company", "employer"])
            location_elem = card.find(["div", "span"], class_=["location", "city"])
            
            if not title_elem:
                continue

            title = title_elem.get_text(strip=True)
            company = company_elem.get_text(strip=True) if company_elem else "Unknown"
            
            # Link extraction
            link_tag = card.find("a", href=True)
            link = link_tag["href"] if link_tag else None
            if link and not link.startswith("http"):
                link = f"https://www.jobartis.com{link}"

            normalized_job_temp = {
                "title": title,
                "company": company
            }

            if not is_tech_job(normalized_job_temp):
                continue

            normalized_job = {
                "title": title,
                "company": company,
                "location": location_elem.get_text(strip=True) if location_elem else "Cameroun",
                "remote": False,
                "description": "Visit link for details", # Deep scraping would require visiting the link
                "url": link,
                "posted_at": None, # Date parsing is complex on HTML
                "source": "Jobartis",
                "raw_data": str(card)[:200]
            }
            
            normalized_jobs.append(normalized_job)
            count += 1
            
        return normalized_jobs

    except Exception as e:
        print(f"Error scraping Jobartis: {e}")
        return []
