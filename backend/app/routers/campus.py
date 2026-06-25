from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from app import crud, models, schemas
from app.database import get_db
from app.utils import security
import csv
import io

router = APIRouter(
    prefix="/api/campus",
    tags=["campus"],
)


@router.get("/dashboard/stats")
def get_campus_stats(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    """Retrieve university specific placement and tracking stats"""
    if current_user.role != "university_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès réservé aux administrateurs d'universités."
        )
        
    uni = current_user.university_profile
    if not uni:
        raise HTTPException(status_code=404, detail="Profil d'université introuvable.")
        
    # Stats queries
    total_students = db.query(models.StudentProfile).filter(models.StudentProfile.university_id == uni.id).count()
    verified_students = db.query(models.StudentProfile).filter(
        models.StudentProfile.university_id == uni.id,
        models.StudentProfile.is_verified == True
    ).count()
    
    # Mock visual metrics for demonstration/defense matching Cameroonian market stats
    placement_by_department = [
        {"name": "Génie Logiciel", "Taux": 78, "Diplomés": 45},
        {"name": "Réseaux & Télécoms", "Taux": 65, "Diplomés": 38},
        {"name": "Data Science", "Taux": 82, "Diplomés": 15},
        {"name": "Sécurité Informatique", "Taux": 70, "Diplomés": 22}
    ]
    
    average_search_months = 4.2
    
    top_skills_demanded = [
        {"skill": "Python", "demande": 95},
        {"skill": "React", "demande": 88},
        {"skill": "PostgreSQL", "demande": 75},
        {"skill": "FastAPI", "demande": 68},
        {"skill": "Docker", "demande": 62}
    ]
    
    top_employers = [
        {"company": "Orange Cameroun", "hires": 12},
        {"company": "MTN Cameroon", "hires": 8},
        {"company": "KmerTech", "hires": 6},
        {"company": "Camtel", "hires": 4}
    ]

    return {
        "university_name": uni.name,
        "university_acronym": uni.acronym,
        "subscription_status": uni.subscription_status,
        "total_students": total_students,
        "verified_students": verified_students,
        "unverified_students": total_students - verified_students,
        "placement_rate": 74,  # overall 74%
        "average_search_months": average_search_months,
        "placement_by_department": placement_by_department,
        "top_skills_demanded": top_skills_demanded,
        "top_employers": top_employers
    }


@router.get("/students/pending")
def get_pending_students(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    """Retrieve list of students awaiting verification"""
    if current_user.role != "university_admin":
        raise HTTPException(status_code=403, detail="Accès interdit.")
        
    uni = current_user.university_profile
    if not uni:
        raise HTTPException(status_code=404, detail="Profil d'université introuvable.")
        
    students = db.query(models.StudentProfile).filter(
        models.StudentProfile.university_id == uni.id,
        models.StudentProfile.is_verified == False
    ).all()
    
    result = []
    for s in students:
        result.append({
            "id": s.id,
            "matricule": s.student_matricule,
            "email": s.school_email,
            "department": s.department,
            "graduation_year": s.graduation_year
        })
    return result


@router.post("/students/{student_profile_id}/verify")
def verify_student(
    student_profile_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    """Approve a student's profile, set is_verified=True"""
    if current_user.role != "university_admin":
        raise HTTPException(status_code=403, detail="Accès interdit.")
        
    uni = current_user.university_profile
    student = db.query(models.StudentProfile).filter(
        models.StudentProfile.id == student_profile_id,
        models.StudentProfile.university_id == uni.id
    ).first()
    
    if not student:
        raise HTTPException(status_code=404, detail="Étudiant introuvable.")
        
    student.is_verified = True
    db.commit()
    return {"status": "success", "message": "Étudiant vérifié avec succès !"}


@router.post("/students/import-roster")
async def import_roster(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    """Imports pre-authorized student roster from a CSV file for automated validation"""
    if current_user.role != "university_admin":
        raise HTTPException(status_code=403, detail="Accès interdit.")
        
    uni = current_user.university_profile
    if not uni:
        raise HTTPException(status_code=404, detail="Profil d'université introuvable.")
        
    contents = await file.read()
    decoded = contents.decode("utf-8")
    csv_file = io.StringIO(decoded)
    reader = csv.DictReader(csv_file)
    
    imported_count = 0
    auto_verified_count = 0
    
    # Process each row
    for row in reader:
        matricule = row.get("matricule", "").strip()
        filiere = row.get("filiere", "").strip()
        email = row.get("email", "").strip()
        
        if not matricule:
            continue
            
        # Check if this student is already registered in the system
        student_profile = db.query(models.StudentProfile).filter(
            models.StudentProfile.student_matricule == matricule,
            models.StudentProfile.university_id == uni.id
        ).first()
        
        if student_profile:
            student_profile.is_verified = True
            auto_verified_count += 1
        else:
            # If not registered yet, we can record it in a temporary database table or keep list.
            # In Phase 1, we simulate matching dynamically.
            pass
            
        imported_count += 1
        
    db.commit()
    
    return {
        "status": "success",
        "message": f"Fichier cohorte traité. {imported_count} lignes analysées, {auto_verified_count} étudiants enregistrés automatiquement vérifiés !"
    }
