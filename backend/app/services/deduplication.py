"""
Job Deduplication Service

Provides intelligent job deduplication using multiple strategies to prevent
duplicate job postings from being stored in the database.

Deduplication Strategies:
    1. Exact Hash Match: Fast lookup using normalized_hash field
    2. Fuzzy Title Match: RapidFuzz similarity matching (90% threshold)
       - Only compares jobs from the same company
       - Case-insensitive comparison

Algorithm:
    - First checks for exact hash match (O(1) lookup)
    - If no match, performs fuzzy matching on title within same company
    - Returns existing job if duplicate found, None otherwise

Usage:
    from app.services.deduplication import check_is_duplicate
    
    existing = check_is_duplicate(db, title, company, hash)
    if existing:
        print(f"Duplicate found: {existing.id}")
    else:
        # Create new job
        pass

Configuration:
    SIMILARITY_THRESHOLD = 90  # Percentage similarity required for fuzzy match
"""
from sqlalchemy.orm import Session
from sqlalchemy import func
from rapidfuzz import fuzz
from app import models

SIMILARITY_THRESHOLD = 90  # 90% similarity required

def check_is_duplicate(db: Session, title: str, company: str, normalized_hash: str) -> models.Job | None:
    """
    Check if a job already exists using specialized deduplication logic.
    1. Check exact hash match.
    2. Check Fuzzy match on Title within the same Company.
    """
    
    # 1. Exact Hash Match (Fastest)
    existing_job = db.query(models.Job).filter(models.Job.normalized_hash == normalized_hash).first()
    if existing_job:
        print(f"[Dedup] Exact hash match found: {existing_job.id}")
        return existing_job

    # 2. Fuzzy Match on Title within same Company
    # First, find potential candidates (same company, case-insensitive)
    candidates = db.query(models.Job).filter(
        func.lower(models.Job.company) == company.lower().strip()
    ).all()
    
    if not candidates:
        return None
        
    for job in candidates:
        similarity = fuzz.ratio(title.lower(), job.title.lower())
        if similarity >= SIMILARITY_THRESHOLD:
            print(f"[Dedup] Fuzzy match found ({similarity}%): '{title}' vs '{job.title}' (ID: {job.id})")
            return job
            
    return None
