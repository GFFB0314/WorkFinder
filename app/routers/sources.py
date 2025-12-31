"""
Sources Router (Source Registry)

This router handles all source-related endpoints for managing job data sources.
This is the "Source Registry" - a database of all active job sources.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List

from app import crud, schemas
from app.database import get_db


# Création du router avec préfixe /api/sources
router = APIRouter(
    prefix="/api/sources",
    tags=["sources"],
    responses={404: {"description": "Not found"}},
)


@router.get("", response_model=List[schemas.SourceResponse])
def list_sources(
    skip: int = Query(0, ge=0, description="Number of sources to skip"),
    limit: int = Query(100, ge=1, le=100, description="Maximum sources to return"),
    active_only: bool = Query(False, description="Only return active sources"),
    db: Session = Depends(get_db)
):
    """
    List all job sources in the registry

    **Query Parameters:**
    - **skip**: Number of sources to skip (default: 0)
    - **limit**: Maximum sources to return (default: 100)
    - **active_only**: Only return active sources (default: false)

    **Returns:**
    - List of sources with their metadata
    """
    sources = crud.get_sources(db=db, skip=skip, limit=limit, active_only=active_only)
    return sources


@router.get("/{source_id}", response_model=schemas.SourceResponse)
def get_source(
    source_id: int,
    db: Session = Depends(get_db)
):
    """
    Get a specific source by ID

    **Path Parameters:**
    - **source_id**: The ID of the source to retrieve

    **Returns:**
    - Source details including last scrape time and status

    **Raises:**
    - 404: Source not found
    """
    source = crud.get_source(db, source_id=source_id)

    if source is None:
        raise HTTPException(status_code=404, detail="Source not found")

    return source


@router.post("", response_model=schemas.SourceResponse, status_code=201)
def create_source(
    source: schemas.SourceCreate,
    db: Session = Depends(get_db)
):
    """
    Create a new job source in the registry

    **Request Body:**
    - **name**: Unique name for the source (e.g., "Remotive", "Adzuna")
    - **url**: Base URL of the source
    - **source_type**: Type of source: "api", "rss", or "html"
    - **scrape_frequency**: How often to scrape (default: "daily")

    **Example Requests:**
    ```json
    POST /api/sources
    {
      "name": "Remotive",
      "url": "https://remotive.com/api/remote-jobs",
      "source_type": "api",
      "scrape_frequency": "daily"
    }

    POST /api/sources
    {
      "name": "Adzuna",
      "url": "https://api.adzuna.com/v1/api/jobs",
      "source_type": "api",
      "scrape_frequency": "daily"
    }
    ```

    **Returns:**
    - Created source with generated ID

    **Raises:**
    - 400: Source with this name already exists
    """
    # Vérifier si la source existe déjà
    existing_source = crud.get_source_by_name(db, name=source.name)
    if existing_source:
        raise HTTPException(
            status_code=400,
            detail=f"Source with name '{source.name}' already exists"
        )

    return crud.create_source(db=db, source=source)


@router.put("/{source_id}", response_model=schemas.SourceResponse)
def update_source(
    source_id: int,
    source_update: schemas.SourceUpdate,
    db: Session = Depends(get_db)
):
    """
    Update a source's information

    **Path Parameters:**
    - **source_id**: The ID of the source to update

    **Request Body:**
    - Any fields from SourceUpdate schema (all optional)

    **Returns:**
    - Updated source

    **Raises:**
    - 404: Source not found
    """
    updated_source = crud.update_source(db, source_id=source_id, source_update=source_update)

    if updated_source is None:
        raise HTTPException(status_code=404, detail="Source not found")

    return updated_source


@router.patch("/{source_id}/status", response_model=schemas.SourceResponse)
def toggle_source_status(
    source_id: int,
    status_update: schemas.SourceStatusUpdate,
    db: Session = Depends(get_db)
):
    """
    Toggle a source's active status

    **Path Parameters:**
    - **source_id**: The ID of the source to update

    **Request Body:**
    - **status**: New status (true = active, false = inactive)

    **Returns:**
    - Updated source

    **Raises:**
    - 404: Source not found

    **Note:**
    - Inactive sources will not be scraped by the scheduler
    """
    updated_source = crud.update_source_status(
        db,
        source_id=source_id,
        status=status_update.status
    )

    if updated_source is None:
        raise HTTPException(status_code=404, detail="Source not found")

    return updated_source


@router.delete("/{source_id}", status_code=204)
def delete_source(
    source_id: int,
    db: Session = Depends(get_db)
):
    """
    Delete a source from the registry

    **Path Parameters:**
    - **source_id**: The ID of the source to delete

    **Returns:**
    - No content (204)

    **Raises:**
    - 404: Source not found

    **Warning:**
    - This will not delete associated jobs, only the source reference
    """
    success = crud.delete_source(db, source_id=source_id)

    if not success:
        raise HTTPException(status_code=404, detail="Source not found")

    return None