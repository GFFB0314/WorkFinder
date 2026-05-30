from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import crud, models, schemas
from app.database import get_db
from app.utils import security

router = APIRouter(
    prefix="/api/watchlists",
    tags=["watchlists"],
)

@router.get("", response_model=List[schemas.WatchlistResponse])
def read_watchlists(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    """List all watchlists for the current user."""
    return crud.get_watchlists_by_user(db, user_id=current_user.id, skip=skip, limit=limit)

@router.post("", response_model=schemas.WatchlistResponse, status_code=201)
def create_watchlist(
    watchlist: schemas.WatchlistCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    """Create a new watchlist with comprehensive filtering options."""
    return crud.create_watchlist(db, watchlist=watchlist, user_id=current_user.id)

@router.put("/{watchlist_id}", response_model=schemas.WatchlistResponse)
def update_watchlist(
    watchlist_id: int,
    watchlist: schemas.WatchlistUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    """Update an existing watchlist."""
    updated = crud.update_watchlist(db, watchlist_id=watchlist_id, watchlist=watchlist, user_id=current_user.id)
    if not updated:
        raise HTTPException(status_code=404, detail="Watchlist not found")
    return updated

@router.delete("/{watchlist_id}", status_code=204)
def delete_watchlist(
    watchlist_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    """Delete a watchlist."""
    success = crud.delete_watchlist(db, watchlist_id=watchlist_id, user_id=current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Watchlist not found")
