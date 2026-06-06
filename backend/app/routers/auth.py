from datetime import timedelta
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app import crud, models, schemas
from app.database import get_db
from app.utils import security

router = APIRouter(
    prefix="/api/auth",
    tags=["auth"],
)

@router.post("/register", response_model=schemas.UserResponse)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = security.get_password_hash(user.password)
    return crud.create_user(db=db, email=user.email, password_hash=hashed_password)

@router.post("/token", response_model=dict)
def login(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()], 
    db: Session = Depends(get_db)
):
    user = crud.get_user_by_email(db, email=form_data.username) # OAuth2 form uses 'username' field
    if not user or not security.verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=security.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

from datetime import datetime, timedelta

@router.get("/me", response_model=schemas.UserResponse)
def read_users_me(
    current_user: models.User = Depends(security.get_current_user)
):
    return current_user

@router.post("/subscribe", response_model=schemas.SubscriptionResponse)
def subscribe_user(
    request: schemas.SubscriptionRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    """
    Simulate subscription upgrade.
    Sets the user's status to 'premium' or 'student' for 30 days.
    """
    if request.plan not in ["premium", "student"]:
        raise HTTPException(status_code=400, detail="Invalid subscription plan.")
        
    # Set expiration to 30 days from now
    expires_at = datetime.utcnow() + timedelta(days=30)
    
    updated_user = crud.update_user_subscription(
        db=db,
        user_id=current_user.id,
        plan=request.plan,
        expires_at=expires_at
    )
    
    if not updated_user:
        raise HTTPException(status_code=404, detail="User not found.")
        
    return schemas.SubscriptionResponse(
        status="success",
        message=f"Paiement traité avec succès via {request.payment_method} ! Bienvenue au club Premium !",
        plan=request.plan,
        subscription_status=updated_user.subscription_status,
        subscription_expires_at=expires_at
    )
