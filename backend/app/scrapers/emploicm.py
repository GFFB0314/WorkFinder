"""
Emploi.cm HTML Scraper Module

Scrapes IT/tech jobs from Emploi.cm (https://www.emploi.cm).
Emploi.cm is a Cameroonian job portal with dedicated IT category.

Features:
    - Targets IT/Telecom/Internet category directly
    - HTML scraping using BeautifulSoup
    - Tech job filtering applied
    - Cameroon-focused listings

Limitations:
    - CSS selectors may need updates if site structure changes
    - Currently finds 1 card but extracts 0 jobs (selectors need fixing)
    - Requires manual inspection to update selectors

Usage:
    from app.scrapers.emploicm import fetch_emploicm_jobs
    
    jobs = fetch_emploicm_jobs(limit=10)

Note:
    This scraper may need maintenance if the website structure changes.
"""
import requests
from bs4 import BeautifulSoup
from app.services.tech_filter import is_tech_job

EMPLOICM_URL = "https://www.emploi.cm/recherche-jobs-cameroun/informatique-telecom-internet"

def fetch_emploicm_jobs(limit: int = 10) -> list[dict]:
    """
    Scrapes jobs from Emploi.cm (targeting IT category).
    """
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }
    
    try:
        response = requests.get(EMPLOICM_URL, headers=headers)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, "html.parser")
        # Emploi.cm typically uses search-result div
        job_cards = soup.select(".search-result, .job-row, .card")

        normalized_jobs = []
        print(f"Scraping Emploi.cm... Found {len(job_cards)} potential cards.")

        count = 0
        for card in job_cards:
            if count >= limit:
                break
            
            title_elem = card.find(["h5", "h3"], class_="job-title") or card.find("a", title=True)
            if not title_elem:
                continue

            title = title_elem.get_text(strip=True)
            
            company_elem = card.find(class_="company-name")
            company = company_elem.get_text(strip=True) if company_elem else "Unknown"

            loc_elem = card.find(class_="job-location")
            location = loc_elem.get_text(strip=True) if loc_elem else "Cameroun"

            link_tag = card.find("a", href=True)
            link = link_tag["href"] if link_tag else ""
            if link and not link.startswith("http"):
                link = f"https://www.emploi.cm{link}"

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
                "remote": False,
                "description": "Details on Emploi.cm",
                "url": link,
                "posted_at": None,
                "source": "Emploi.cm",
                "raw_data": str(card)[:200]
            }
            
            normalized_jobs.append(normalized_job)
            count += 1
            
        return normalized_jobs

    except Exception as e:
        print(f"Error scraping Emploi.cm: {e}")
        return []
