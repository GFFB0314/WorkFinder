"""
Jobs Router

This router handles all job-related endpoints including listing, searching,
and retrieving individual job postings.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app import crud, schemas
from app.database import get_db


router = APIRouter(
    prefix="/api/jobs",
    tags=["jobs"],
    responses={404: {"description": "Not found"}},
)


@router.get("", response_model=schemas.JobListResponse)
def list_jobs(
    page: int = Query(1, ge=1, description="Page number (starts at 1)"),
    page_size: int = Query(20, ge=1, le=100, description="Number of jobs per page"),
    location: Optional[str] = Query(None, description="Filter by location"),
    remote: Optional[bool] = Query(None, description="Filter by remote status"),
    skills: Optional[str] = Query(None, description="Filter by skills (comma-separated)"),
    search: Optional[str] = Query(None, description="Search in title and company"),
    db: Session = Depends(get_db)
):
    """
    List jobs with optional filtering and pagination
    
    **Query Parameters:**
    - **page**: Page number (default: 1)
    - **page_size**: Jobs per page (default: 20, max: 100)
    - **location**: Filter by location (partial match)
    - **remote**: Filter by remote status (true/false)
    - **skills**: Filter by skills (comma-separated, e.g., "python,react")
    - **search**: Search in job title and company name
    
    **Returns:**
    - Paginated list of jobs with total count
    """
    # Parse skills if provided
    skills_list = None
    if skills:
        skills_list = [s.strip() for s in skills.split(",") if s.strip()]
    
    # Calculate skip value for pagination
    skip = (page - 1) * page_size
    
    # Get jobs and total count
    jobs = crud.get_jobs(
        db=db,
        skip=skip,
        limit=page_size,
        location=location,
        remote=remote,
        skills=skills_list,
        search=search
    )
    
    total = crud.get_jobs_count(
        db=db,
        location=location,
        remote=remote,
        skills=skills_list,
        search=search
    )
    
    return schemas.JobListResponse(
        total=total,
        page=page,
        page_size=page_size,
        jobs=jobs
    )


@router.get("/{job_id}", response_model=schemas.JobResponse)
def get_job(
    job_id: int,
    db: Session = Depends(get_db)
):
    """
    Get a specific job by ID
    
    **Path Parameters:**
    - **job_id**: The ID of the job to retrieve
    
    **Returns:**
    - Job details
    
    **Raises:**
    - 404: Job not found
    """
    job = crud.get_job(db, job_id=job_id)
    
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")
    
    return job


@router.post("", response_model=schemas.JobResponse, status_code=201)
def create_job(
    job: schemas.JobCreate,
    db: Session = Depends(get_db)
):
    """
    Create a new job posting
    
    **Request Body:**
    - Job data following the JobCreate schema
    
    **Returns:**
    - Created job with generated ID
    
    **Note:**
    - This endpoint is typically used by scrapers, not end users
    - Duplicate jobs (same title + company) will be rejected
    """
    try:
        return crud.create_job(db=db, job=job)
    except Exception as e:
        # Handle duplicate hash error
        if "unique constraint" in str(e).lower():
            raise HTTPException(
                status_code=400,
                detail="Job already exists (duplicate title and company)"
            )
        raise HTTPException(status_code=500, detail=f"Error creating job: {str(e)}")


"kljnidgb;jlmj"


from app.scrapers.remotive import fetch_remotive_jobs
from app.scrapers.adzuna import fetch_adzuna_jobs

@router.post("/ingest/remotive", response_model=List[schemas.JobResponse])
def ingest_remotive_jobs(limit: int = 10, db: Session = Depends(get_db)):
    jobs = fetch_remotive_jobs(limit=limit)
    created_jobs = []
    for job in jobs:
        try:
            created = crud.create_job(db=db, job=schemas.JobCreate(
                title=job["title"],
                company=job["company"],
                location=job["location"],
                remote=job["remote"],
                description=job["description"],
                url=job["url"],
                posted_at=job["posted_at"],
                source_id=1,  # Remotive dans ta table sources
                raw_json=job["raw_data"]
            ))
            created_jobs.append(created)
        except Exception as e:
            print(f"Skipping duplicate or error: {e}")
    return created_jobs


@router.post("/ingest/adzuna", response_model=List[schemas.JobResponse])
def ingest_adzuna_jobs(limit: int = 10, db: Session = Depends(get_db)):
    jobs = fetch_adzuna_jobs(limit=limit)
    created_jobs = []
    for job in jobs:
        try:
            created = crud.create_job(db=db, job=schemas.JobCreate(
                title=job["title"],
                company=job["company"],
                location=job["location"],
                remote=job["remote"],
                description=job["description"],
                url=job["url"],
                posted_at=job["posted_at"],
                source_id=2,  # Adzuna dans ta table sources
                raw_json=job["raw_data"]
            ))
            created_jobs.append(created)
        except Exception as e:
            print(f"Skipping duplicate or error: {e}")
    return created_jobs