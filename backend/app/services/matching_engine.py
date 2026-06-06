"""
AI Matching Engine

Calculates compatibility score (0-100%) between a candidate's CV Profile and a Job,
identifying matching skills, missing skills, and a detailed natural language explanation.
"""
from typing import Dict, Any, List
from app.models import Job, CVProfile
from app.services.cv_parser import extract_skills_from_text, infer_experience_level

def calculate_compatibility(cv: CVProfile, job: Job) -> Dict[str, Any]:
    """
    Computes a deep compatibility report between a CVProfile and a Job.
    
    Returns a dictionary:
    {
        "compatibility_score": int, # 0-100
        "matching_skills": list[str],
        "missing_skills": list[str],
        "experience_fit": bool,
        "explanation": str
    }
    """
    # 1. Extract job skills
    # Use pre-extracted job skills if available, or extract them dynamically from title + description
    job_skills_list = job.skills or []
    if not job_skills_list:
        full_text = f"{job.title} {job.description or ''}"
        job_skills_list = extract_skills_from_text(full_text)
        
    cv_skills_list = cv.skills or []
    
    # Standardize comparison (case-insensitive)
    cv_skills_lower = {s.lower() for s in cv_skills_list}
    job_skills_lower = {s.lower() for s in job_skills_list}
    
    # 2. Compute skill overlap
    overlap_lower = cv_skills_lower.intersection(job_skills_lower)
    missing_lower = job_skills_lower.difference(cv_skills_lower)
    
    # Map back to nice capitalized names
    matching_skills = []
    for skill in job_skills_list:
        if skill.lower() in overlap_lower:
            matching_skills.append(skill)
            
    missing_skills = []
    for skill in job_skills_list:
        if skill.lower() in missing_lower:
            missing_skills.append(skill)
            
    # If the job has no explicit skills in database, try to see if CV skills appear in its text
    if not job_skills_list:
        full_job_text = f" {job.title.lower()} {job.description or ''} "
        for skill in cv_skills_list:
            if f" {skill.lower()} " in full_job_text:
                matching_skills.append(skill)
                
    # 3. Assess experience level fit
    # Standard levels: junior (1), mid (2), senior (3), lead (4)
    level_hierarchy = {"junior": 1, "mid": 2, "senior": 3, "lead": 4}
    
    # Try to infer job experience level if not set
    job_exp = getattr(job, "experience_level", None)
    if not job_exp:
        job_exp = infer_experience_level(job.title)
        
    cv_exp = cv.experience_level or "mid"
    
    cv_rank = level_hierarchy.get(cv_exp.lower(), 2)
    job_rank = level_hierarchy.get(job_exp.lower(), 2)
    
    experience_fit = cv_rank >= job_rank
    
    # 4. Calculate score (70% skills, 30% experience)
    skill_score = 0.0
    if job_skills_lower:
        skill_score = (len(overlap_lower) / len(job_skills_lower)) * 100.0
    else:
        # If no skills are mentioned in the job description at all, default to basic baseline
        skill_score = 50.0 if matching_skills else 20.0
        
    if experience_fit:
        exp_score = 100.0
    else:
        # Penalty for under-experience (e.g. junior applying for senior role)
        diff = job_rank - cv_rank
        exp_score = max(0, 100 - (diff * 40))
        
    compatibility_score = int((skill_score * 0.7) + (exp_score * 0.3))
    # Cap at 100, min at 0
    compatibility_score = max(0, min(100, compatibility_score))
    
    # 5. Generate French natural-language explanation (Highly relevant for IUT Douala)
    explanation = ""
    if compatibility_score >= 85:
        explanation = (
            f"Excellente correspondance ({compatibility_score}%) ! "
            f"Votre profil correspond parfaitement aux exigences techniques. Vos compétences en "
            f"{', '.join(matching_skills[:3])} couvrent les attentes principales de {job.company}."
        )
    elif compatibility_score >= 60:
        if missing_skills:
            explanation = (
                f"Très bon match ({compatibility_score}%) ! "
                f"Vous possédez des bases solides pour ce rôle (notamment {', '.join(matching_skills[:2])}). "
                f"L'acquisition de compétences en **{', '.join(missing_skills[:2])}** augmenterait grandement vos chances de recrutement."
            )
        else:
            explanation = (
                f"Bon match ({compatibility_score}%) ! "
                f"Votre niveau technique est en phase avec ce poste, bien que le niveau d'expérience requis "
                f"soit légèrement plus élevé."
            )
    elif compatibility_score >= 40:
        explanation = (
            f"Match modéré ({compatibility_score}%). "
            f"Vous partagez des compétences communes comme {', '.join(matching_skills[:2]) if matching_skills else 'certaines bases tech'}. "
            f"Cependant, ce poste requiert des compétences clés en **{', '.join(missing_skills[:3])}** qui ne figurent pas sur votre CV."
        )
    else:
        explanation = (
            f"Faible adéquation ({compatibility_score}%). "
            f"Ce poste de {job.title} requiert une stack technologique distincte de votre profil. "
            f"Nous vous conseillons d'élargir votre CV avec des compétences en **{', '.join(job_skills_list[:3])}** avant de postuler."
        )
        
    return {
        "compatibility_score": compatibility_score,
        "matching_skills": matching_skills,
        "missing_skills": missing_skills,
        "experience_fit": experience_fit,
        "explanation": explanation
    }
