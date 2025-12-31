"""
Adzuna Scraper (robust)
- Loads .env
- Validates credentials
- Widened search, optional country override
- Clear debug logs for zero-results cases
"""

import os
import requests
from typing import List, Dict, Optional
from dotenv import load_dotenv

load_dotenv()

APP_ID = os.getenv("ADZUNA_APP_ID")
APP_KEY = os.getenv("ADZUNA_APP_KEY")

# Default to GB (more results). You can switch to "us" later.
DEFAULT_COUNTRY = os.getenv("ADZUNA_COUNTRY", "gb")  # set in .env if needed

def _api_url(country: str, page: int = 1) -> str:
    return f"https://api.adzuna.com/v1/api/jobs/{country}/search/{page}"

def fetch_adzuna_jobs(
    limit: int = 10,
    keyword: Optional[str] = "developer",
    location: Optional[str] = None,
    country: Optional[str] = None,
    max_days_old: Optional[int] = 30,
) -> List[Dict]:
    if not APP_ID or not APP_KEY:
        print("[Adzuna] Missing ADZUNA_APP_ID or ADZUNA_APP_KEY in environment.")
        return []

    country = (country or DEFAULT_COUNTRY).lower()
    url = _api_url(country)

    params = {
        "app_id": APP_ID,
        "app_key": APP_KEY,
        "results_per_page": limit,
    }
    if keyword:
        params["what"] = keyword
    if location:
        params["where"] = location
    if max_days_old:
        params["max_days_old"] = max_days_old

    headers = {"Accept": "application/json"}

    try:
        resp = requests.get(url, params=params, headers=headers, timeout=20)
        # Log the final request for debugging
        print(f"[Adzuna] GET {resp.url} -> {resp.status_code}")
        resp.raise_for_status()
        data = resp.json()
        results = data.get("results", [])

        if not results:
            print("[Adzuna] No results. Try broader keyword, different country (gb/us), or remove location.")

        normalized: List[Dict] = []
        for job in results:
            normalized.append({
                "title": job.get("title"),
                "company": (job.get("company") or {}).get("display_name"),
                "location": (job.get("location") or {}).get("display_name"),
                "remote": False,  # Adzuna doesn't reliably mark remote; infer later if needed
                "description": job.get("description"),
                "url": job.get("redirect_url"),
                "posted_at": job.get("created"),
                "source_name": "Adzuna",
                "raw_json": job,
            })
        return normalized

    except requests.HTTPError as e:
        print(f"[Adzuna] HTTP error: {e}")
        try:
            print(f"[Adzuna] Body: {resp.text[:500]}")
        except Exception:
            pass
        return []
    except requests.RequestException as e:
        print(f"[Adzuna] Network error: {e}")
        return []