"""
AI Matching Engine (V2)

Calculates semantic compatibility score (0-100%) between a candidate's CV Profile and a Job
using Sentence Transformers and Cosine Similarity, identifying matching skills,
missing skills, and a detailed natural language explanation.
"""
from typing import Dict, Any, List
import re
from app.models import Job, CVProfile
from app.services.cv_parser import extract_skills_from_text_regex, infer_experience_level_regex

# Try loading SentenceTransformers
model = None
try:
    from sentence_transformers import SentenceTransformer, util
    print("[Matching Engine] Initializing SentenceTransformer (paraphrase-multilingual-MiniLM-L12-v2)...")
    # paraphrase-multilingual-MiniLM-L12-v2 supports 50+ languages, including French and English
    model = SentenceTransformer("paraphrase-multilingual-MiniLM-L12-v2")
except Exception as e:
    print(f"[Matching Engine] SentenceTransformer model load failed, falling back to keyword logic: {e}")
    model = None

def calculate_compatibility(cv: CVProfile, job: Job) -> Dict[str, Any]:
    """
    Computes a deep compatibility report between a CVProfile and a Job.
    Uses Sentence Transformers for semantic embedding similarity + explicit experience check.
    
    Returns a dictionary:
    {
        "compatibility_score": int, # 0-100
        "matching_skills": list[str],
        "missing_skills": list[str],
        "experience_fit": bool,
        "explanation": str
    }
    """
    # 1. Extract job and CV skills for explicit matching list
    job_skills_list = job.skills or []
    if not job_skills_list:
        full_text = f"{job.title} {job.description or ''}"
        job_skills_list = extract_skills_from_text_regex(full_text)
        
    cv_skills_list = cv.skills or []
    
    # Standardize comparison (case-insensitive)
    cv_skills_lower = {s.lower() for s in cv_skills_list}
    job_skills_lower = {s.lower() for s in job_skills_list}
    
    # Compute skill overlap
    overlap_lower = cv_skills_lower.intersection(job_skills_lower)
    missing_lower = job_skills_lower.difference(cv_skills_lower)
    
    matching_skills = [s for s in job_skills_list if s.lower() in overlap_lower]
    missing_skills = [s for s in job_skills_list if s.lower() in missing_lower]
    
    # If the job has no explicit skills in database, try to see if CV skills appear in its text
    if not job_skills_list:
        full_job_text = f" {job.title.lower()} {job.description or ''} "
        for skill in cv_skills_list:
            if f" {skill.lower()} " in full_job_text:
                matching_skills.append(skill)

    # 2. Assess experience level fit
    # Standard levels: junior (1), mid (2), senior (3), lead (4)
    level_hierarchy = {"junior": 1, "mid": 2, "senior": 3, "lead": 4}
    
    # Try to infer job experience level if not set
    job_exp = getattr(job, "experience_level", None)
    if not job_exp:
        job_exp = infer_experience_level_regex(job.title)
        
    cv_exp = cv.experience_level or "mid"
    
    cv_rank = level_hierarchy.get(cv_exp.lower(), 2)
    job_rank = level_hierarchy.get(job_exp.lower(), 2)
    
    experience_fit = cv_rank >= job_rank

    # 3. Calculate score (70% semantic skills, 30% experience)
    skill_score = 0.0
    
    if model:
        try:
            # Formulate text representation for semantic embedding
            cv_text = f"Expérience: {cv_exp}. Compétences: {', '.join(cv_skills_list)}. CV: {cv.raw_text or ''}"
            # Truncate text to avoid model length limit (usually 256 or 512 tokens)
            cv_text = cv_text[:1500]
            
            job_text = f"Poste: {job.title}. Entreprise: {job.company}. Lieu: {job.location or ''}. Compétences: {', '.join(job_skills_list)}. Description: {job.description or ''}"
            job_text = job_text[:1500]
            
            # Encode texts to embeddings
            embeddings = model.encode([cv_text, job_text], convert_to_tensor=True)
            
            # Cosine similarity
            cosine_sim = float(util.cos_sim(embeddings[0], embeddings[1])[0][0])
            
            # Normalize cosine similarity (usually sits between 0.1 and 0.85)
            # Map [0.2, 0.8] range to [0, 100]
            if cosine_sim <= 0.2:
                skill_score = 0.0
            elif cosine_sim >= 0.8:
                skill_score = 100.0
            else:
                skill_score = ((cosine_sim - 0.2) / 0.6) * 100.0
                
        except Exception as e:
            print(f"[Matching Engine] Embedding match failed, falling back to overlap: {e}")
            # Fallback to overlap calculation
            if job_skills_lower:
                skill_score = (len(overlap_lower) / len(job_skills_lower)) * 100.0
            else:
                skill_score = 50.0 if matching_skills else 20.0
    else:
        # Fallback to overlap calculation
        if job_skills_lower:
            skill_score = (len(overlap_lower) / len(job_skills_lower)) * 100.0
        else:
            skill_score = 50.0 if matching_skills else 20.0

    # Experience portion
    if experience_fit:
        exp_score = 100.0
    else:
        # Penalty for under-experience
        diff = job_rank - cv_rank
        exp_score = max(0, 100 - (diff * 40))
        
    compatibility_score = int((skill_score * 0.7) + (exp_score * 0.3))
    compatibility_score = max(0, min(100, compatibility_score))
    
    # 4. Generate French natural-language explanation
    explanation = ""
    if compatibility_score >= 85:
        explanation = (
            f"Excellente correspondance ({compatibility_score}%) ! "
            f"Votre profil correspond parfaitement aux exigences techniques. Vos compétences en "
            f"{', '.join(matching_skills[:3]) if matching_skills else 'tech'} couvrent les attentes principales de {job.company}."
        )
    elif compatibility_score >= 60:
        if missing_skills:
            explanation = (
                f"Très bon match ({compatibility_score}%) ! "
                f"Vous possédez des bases solides pour ce rôle (notamment {', '.join(matching_skills[:2]) if matching_skills else 'tech'}). "
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
            f"Cependant, ce poste requiert des compétences clés en **{', '.join(missing_skills[:3]) if missing_skills else 'autres stacks'}** qui ne figurent pas sur votre CV."
        )
    else:
        explanation = (
            f"Faible adéquation ({compatibility_score}%). "
            f"Ce poste de {job.title} requiert une stack technologique distincte de votre profil. "
            f"Nous vous conseillons d'élargir votre CV avec des compétences en **{', '.join(job_skills_list[:3]) if job_skills_list else 'la stack du poste'}** avant de postuler."
        )
        
    return {
        "compatibility_score": compatibility_score,
        "matching_skills": matching_skills,
        "missing_skills": missing_skills,
        "experience_fit": experience_fit,
        "explanation": explanation
    }
