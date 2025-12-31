# app/utils/normalize.py
"""
Normalization utilities for job scrapers.
- Standardizes raw job dicts to your Job schema payload
- Computes a dedup hash across sources
"""

import hashlib
from typing import Dict, Any, Optional


def compute_normalized_hash(title: Optional[str], company: Optional[str], url: Optional[str]) -> str:
    """
    Compute a SHA256 hash based on title, company, and url.
    This is used to deduplicate jobs across sources.
    """
    base = f"{(title or '').strip().lower()}|{(company or '').strip().lower()}|{(url or '').strip().lower()}"
    return hashlib.sha256(base.encode("utf-8")).hexdigest()


def to_job_model_payload(raw: Dict[str, Any]) -> Dict[str, Any]:
    """
    Normalize a raw job dictionary into a payload ready for Job model insertion.

    Expected keys in `raw`:
      - title, company, location, remote, description, url, posted_at, raw_json, source_name

    Returns a dict you can pass to your SQLAlchemy Job creation.
    """
    title = raw.get("title")
    company = raw.get("company")
    url = raw.get("url")

    payload = {
        "title": title,
        "company": company,
        "location": raw.get("location"),
        "remote": bool(raw.get("remote")),
        "description": raw.get("description"),
        "url": url,
        "posted_at": raw.get("posted_at"),  # keep raw ISO string; parse in DB layer if needed
        "raw_json": raw.get("raw_json") or raw,  # ensure we always keep the original data
        "normalized_hash": compute_normalized_hash(title, company, url),
        # "source_id" should be added in the ingestion layer after looking up Source
        # "skills" optional; can be added later via parsing pipeline
    }
    return payload