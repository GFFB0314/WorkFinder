from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app import crud, models, schemas
from app.database import get_db
from app.utils import security
from app.services.matching_engine import calculate_compatibility

router = APIRouter(
    prefix="/api/recruit",
    tags=["recruit"],
)


@router.post("/jobs", response_model=schemas.JobResponse)
def post_job(
    job_in: schemas.JobBase,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    """Publish a new job posting directly on WorkFinder"""
    if current_user.role != "recruiter":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les recruteurs peuvent publier des offres."
        )
        
    # Get or create the local direct posting source
    local_source = db.query(models.Source).filter(models.Source.name == "WorkFinder Direct").first()
    if not local_source:
        local_source = models.Source(
            name="WorkFinder Direct",
            url="https://workfinder.cm",
            source_type="api",
            status=True,
            scrape_frequency="daily"
        )
        db.add(local_source)
        db.commit()
        db.refresh(local_source)
        
    # Calculate a unique hash for deduplication
    import hashlib
    norm_text = f"{job_in.title.strip().lower()}|{job_in.company.strip().lower()}"
    norm_hash = hashlib.md5(norm_text.encode("utf-8")).hexdigest()
    
    # Check if job already exists
    existing = db.query(models.Job).filter(models.Job.normalized_hash == norm_hash).first()
    if existing:
        return existing
        
    db_job = models.Job(
        title=job_in.title,
        company=job_in.company,
        location=job_in.location or "Douala, Cameroun",
        remote=job_in.remote,
        description=job_in.description,
        skills=job_in.skills or [],
        url=f"https://workfinder.cm/jobs/direct",
        normalized_hash=norm_hash,
        source_id=local_source.id,
        raw_json={"posted_by_user_id": current_user.id}
    )
    
    db.add(db_job)
    db.commit()
    db.refresh(db_job)
    return db_job


@router.get("/jobs", response_model=List[schemas.JobResponse])
def get_recruiter_jobs(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    """List all jobs posted by the logged-in recruiter"""
    if current_user.role != "recruiter":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès interdit."
        )
        
    # Get the direct postings source
    local_source = db.query(models.Source).filter(models.Source.name == "WorkFinder Direct").first()
    if not local_source:
        return []
        
    # Filter jobs that have the recruiter's user id in raw_json
    # SQLite compatible filter: cast raw_json to string and check
    from sqlalchemy import cast, String
    jobs = db.query(models.Job).filter(
        models.Job.source_id == local_source.id,
        cast(models.Job.raw_json, String).contains(f'"posted_by_user_id": {current_user.id}')
    ).all()
    
    return jobs


@router.get("/jobs/{job_id}/recommendations")
def get_job_recommendations(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    """Scans the database CV profiles and recommends the top candidates ranked by AI matching score"""
    if current_user.role != "recruiter":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès interdit."
        )
        
    job = db.query(models.Job).filter(models.Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Offre d'emploi introuvable.")
        
    # Fetch all CV profiles in the system
    cvs = db.query(models.CVProfile).all()
    
    recommendations = []
    for cv in cvs:
        # Fetch user email
        user = db.query(models.User).filter(models.User.id == cv.user_id).first()
        if not user:
            continue
            
        # Calculate compatibility report
        report = calculate_compatibility(cv, job)
        score = report.get("compatibility_score", 0)
        
        # Determine student status and name
        name = "Candidat Anonyme"
        is_student_flag = False
        school_name = None
        if user.student_profile:
            is_student_flag = True
            student = user.student_profile
            # Try to get candidate name from CV entities if parsed
            per_list = (cv.raw_text or "").split("\n")[0] # First line is usually name
            name = student.user.email.split("@")[0].title().replace(".", " ")
            
            # Fetch university name
            uni = db.query(models.University).filter(models.University.id == student.university_id).first()
            school_name = uni.acronym if uni else "Université"
            
        recommendations.append({
            "candidate_id": user.id,
            "name": name,
            "email": user.email,
            "skills": cv.skills or [],
            "experience_level": cv.experience_level or "junior",
            "is_student": is_student_flag,
            "university": school_name,
            "score": score,
            "report": report
        })
        
    # Sort recommendations by match score descending
    recommendations.sort(key=lambda x: x["score"], reverse=True)
    
    return recommendations[:10]  # Return top 10 recommended profiles
