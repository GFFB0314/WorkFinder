"""
CRUD Operations for Database Models

This module provides Create, Read, Update, Delete operations for all database models.
These functions handle database interactions and are used by the API routers.
"""

from sqlalchemy.orm import Session
from sqlalchemy import or_, cast, String
from typing import List, Optional
from datetime import datetime
import hashlib

from app import models, schemas


# ============================================================================
# Job CRUD Operations
# ============================================================================

def get_job(db: Session, job_id: int) -> Optional[models.Job]:
    """Get a single job by ID"""
    return db.query(models.Job).filter(models.Job.id == job_id).first()


def get_jobs(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    location: Optional[str] = None,
    remote: Optional[bool] = None,
    skills: Optional[List[str]] = None,
    search: Optional[str] = None
) -> List[models.Job]:
    """
    Get jobs with optional filtering
    
    Args:
        db: Database session
        skip: Number of records to skip (for pagination)
        limit: Maximum number of records to return
        location: Filter by location
        remote: Filter by remote status
        skills: Filter by skills (any match)
        search: Search in title and company
    """
    query = db.query(models.Job)
    
    # Apply filters
    if location:
        query = query.filter(models.Job.location.ilike(f"%{location}%"))
    
    if remote is not None:
        query = query.filter(models.Job.remote == remote)
    
    if skills:
        # Filter jobs that have any of the specified skills using SQLite-compatible JSON text search
        # This checks if the JSON string contains the skill (e.g., '["python", "react"]' contains "python")
        skill_filters = [cast(models.Job.skills, String).ilike(f'%"{skill}"%') for skill in skills]
        query = query.filter(or_(*skill_filters))
    
    if search:
        # Search in title or company
        search_pattern = f"%{search}%"
        query = query.filter(
            or_(
                models.Job.title.ilike(search_pattern),
                models.Job.company.ilike(search_pattern)
            )
        )
    
    # Order by most recent first
    query = query.order_by(models.Job.created_at.desc())
    
    return query.offset(skip).limit(limit).all()


def get_jobs_count(
    db: Session,
    location: Optional[str] = None,
    remote: Optional[bool] = None,
    skills: Optional[List[str]] = None,
    search: Optional[str] = None
) -> int:
    """Get total count of jobs matching filters"""
    query = db.query(models.Job)
    
    if location:
        query = query.filter(models.Job.location.ilike(f"%{location}%"))
    
    if remote is not None:
        query = query.filter(models.Job.remote == remote)
    
    if skills:
        skill_filters = [cast(models.Job.skills, String).ilike(f'%"{skill}"%') for skill in skills]
        query = query.filter(or_(*skill_filters))
    
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            or_(
                models.Job.title.ilike(search_pattern),
                models.Job.company.ilike(search_pattern)
            )
        )
    
    return query.count()


def create_job(db: Session, job: schemas.JobCreate) -> models.Job:
    """
    Create a new job posting
    
    Generates a normalized hash for deduplication based on title and company.
    """
    # Generate normalized hash for deduplication
    hash_string = f"{job.title.lower().strip()}|{job.company.lower().strip()}"
    normalized_hash = hashlib.md5(hash_string.encode()).hexdigest()
    
    db_job = models.Job(
        title=job.title,
        company=job.company,
        location=job.location,
        remote=job.remote,
        description=job.description,
        url=job.url,
        skills=job.skills,
        source_id=job.source_id,
        raw_json=job.raw_json,
        posted_at=job.posted_at,
        normalized_hash=normalized_hash
    )
    
    db.add(db_job)
    db.commit()
    db.refresh(db_job)
    return db_job


# ============================================================================
# Source CRUD Operations
# ============================================================================

def get_source(db: Session, source_id: int) -> Optional[models.Source]:
    """Get a single source by ID"""
    return db.query(models.Source).filter(models.Source.id == source_id).first()


def get_source_by_name(db: Session, name: str) -> Optional[models.Source]:
    """Get a source by name"""
    return db.query(models.Source).filter(models.Source.name == name).first()


def get_sources(db: Session, skip: int = 0, limit: int = 100, active_only: bool = False) -> List[models.Source]:
    """
    Get all sources with optional filtering
    
    Args:
        db: Database session
        skip: Number of records to skip
        limit: Maximum number of records to return
        active_only: If True, only return active sources
    """
    query = db.query(models.Source)
    
    if active_only:
        query = query.filter(models.Source.status == True)
    
    return query.offset(skip).limit(limit).all()


def create_source(db: Session, source: schemas.SourceCreate) -> models.Source:
    """Create a new source"""
    db_source = models.Source(
        name=source.name,
        url=source.url,
        source_type=source.source_type,
        scrape_frequency=source.scrape_frequency
    )
    
    db.add(db_source)
    db.commit()
    db.refresh(db_source)
    return db_source


def update_source(db: Session, source_id: int, source_update: schemas.SourceUpdate) -> Optional[models.Source]:
    """Update a source"""
    db_source = get_source(db, source_id)
    
    if not db_source:
        return None
    
    # Update only provided fields
    update_data = source_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_source, field, value)
    
    db.commit()
    db.refresh(db_source)
    return db_source


def update_source_status(db: Session, source_id: int, status: bool) -> Optional[models.Source]:
    """Toggle source active status"""
    db_source = get_source(db, source_id)
    
    if not db_source:
        return None
    
    db_source.status = status
    db.commit()
    db.refresh(db_source)
    return db_source


def update_source_last_scraped(db: Session, source_id: int) -> Optional[models.Source]:
    """Update the last_scraped_at timestamp for a source"""
    db_source = get_source(db, source_id)
    
    if not db_source:
        return None
    
    db_source.last_scraped_at = datetime.utcnow()
    db.commit()
    db.refresh(db_source)
    return db_source


def delete_source(db: Session, source_id: int) -> bool:
    """Delete a source"""
    db_source = get_source(db, source_id)
    
    if not db_source:
        return False
    
    db.delete(db_source)
    db.commit()
    return True
