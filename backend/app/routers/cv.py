"""
CV Router

Handles file uploads, CV parsing, profile retrieval, and AI skill-matching analysis.
Enforces premium paywall checks for CV uploads and compatibility report accesses.
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
from app import crud, models, schemas
from app.database import get_db
from app.utils import security
from app.services.cv_parser import parse_cv_bytes
from app.services.matching_engine import calculate_compatibility

router = APIRouter(
    prefix="/api/cv",
    tags=["cv"],
)

@router.post("/upload", response_model=schemas.CVProfileResponse)
async def upload_cv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    """
    Upload and parse CV (PDF, DOCX, or TXT).
    Requires a Premium or Student subscription.
    """
    # Paywall Check
    if current_user.subscription_status not in ["premium", "student"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="CV Upload is a Premium feature. Please upgrade to unlock AI CV parsing."
        )
        
    filename = file.filename
    # Read file content
    contents = await file.read()
    if not contents:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty."
        )
        
    # Run parsing engine
    try:
        parsed_data = parse_cv_bytes(contents, filename)
        if not parsed_data["raw_text"]:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Unable to extract text from your resume. Ensure it is a valid PDF or DOCX."
            )
            
        # Store in database
        cv_profile = crud.create_or_update_cv_profile(
            db=db, 
            user_id=current_user.id, 
            parsed_cv=parsed_data
        )
        return cv_profile
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while parsing your resume: {str(e)}"
        )

@router.get("/profile", response_model=schemas.CVProfileResponse)
def get_cv_profile(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    """Retrieve the current user's CV Profile"""
    # Paywall check
    if current_user.subscription_status not in ["premium", "student"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="CV Profile access is restricted to Premium users."
        )
        
    cv_profile = crud.get_cv_profile_by_user(db, user_id=current_user.id)
    if not cv_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="You haven't uploaded a CV yet."
        )
    return cv_profile

@router.get("/match/{job_id}", response_model=dict)
def get_job_match_report(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    """
    Get deep AI match analysis report between user's CV and a specific job posting.
    Enforces premium subscription checking.
    """
    # Paywall Check
    if current_user.subscription_status not in ["premium", "student"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Detailed compatibility matching is a Premium feature."
        )
        
    # Get user CV
    cv_profile = crud.get_cv_profile_by_user(db, user_id=current_user.id)
    if not cv_profile:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please upload a CV in your profile dashboard before calculating match scores."
        )
        
    # Get target job
    job = crud.get_job(db, job_id=job_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Target job posting not found."
        )
        
    # Calculate score & compatibility breakdown
    report = calculate_compatibility(cv=cv_profile, job=job)
    return report
