"""
Tech Job Filter Module

This module provides functionality to determine if a job posting is related to the technology industry
using comprehensive keyword matching. This approach is reliable, fast, and requires no external API calls.
"""

from typing import Dict, Any


def is_tech_job(job_data: Dict[str, Any]) -> bool:
    """
    Determines if a job is related to the Tech industry using comprehensive keyword matching.
    
    This function checks the job title against a curated list of technology-related keywords
    spanning various tech domains including software development, DevOps, data science,
    product management, design, security, and IT support.
    
    Args:
        job_data: Dictionary containing job details with at least a 'title' key.
                  Optional keys: 'company', 'description'.    
    Returns:
        True if the job matches any tech keyword, False otherwise.
    Examples:
        >>> is_tech_job({"title": "Senior Python Developer"})
        True
        >>> is_tech_job({"title": "Marketing Manager"})
        False
    """
    title: str = job_data.get("title", "").lower()
    
    # Comprehensive tech keywords organized by category
    tech_keywords: list[str] = [
        # Software Development
        "developer", "engineer", "programmer", "coder", "software", 
        "full stack", "frontend", "backend", "web developer", "mobile developer", 
        "app developer", "java", "python", "javascript", "react", "angular",
        
        # DevOps & Infrastructure
        "devops", "sre", "site reliability", "cloud", "aws", "azure", "gcp", 
        "kubernetes", "docker", "infrastructure", "platform engineer", 
        "system administrator", "sysadmin",
        
        # Data & AI
        "data scientist", "data engineer", "data analyst", "machine learning", 
        "ml engineer", "ai engineer", "artificial intelligence", "deep learning", 
        "nlp", "computer vision", "analytics",
        
        # Design & Product
        "ui/ux", "ux designer", "ui designer", "product designer", 
        "graphic designer", "web designer", "product manager", "product owner", 
        "scrum master", "agile",
        
        # Security & QA
        "security engineer", "cybersecurity", "penetration tester", 
        "qa engineer", "test engineer", "quality assurance", "automation engineer",
        
        # IT & Other Tech Roles
        "technical writer", "solutions architect", "database administrator", "dba", 
        "network engineer", "it support", "help desk", "technical support", 
        "blockchain", "game developer", "embedded", "iot", "it manager", 
        "technology manager", "it specialist"
    ]
    
    # Check if any keyword appears in the title
    for keyword in tech_keywords:
        if keyword in title:
            print(f"[Filter] '{job_data.get('title')}' matched keyword '{keyword}'. Allowed.")
            return True
    
    # If no match, it's not a tech job
    # print(f"[Filter] '{job_data.get('title')}' did not match any tech keywords. Blocked.")
    return False

def extract_skills(text: str) -> list[str]:
    """
    Extracts tech skills from text (title + description)
    """
    if not text:
        return []
        
    text = text.lower()
    found_skills = []
    
    # Re-use keywords from is_tech_job (copying list for now to avoid scope issues or refactor)
    # Ideally should be a shared constant
    tech_keywords = [
        "python", "javascript", "react", "angular", "java", "c#", "c++", "golang", "ruby", "php",
        "aws", "azure", "gcp", "docker", "kubernetes", "terraform",
        "sql", "nosql", "postgresql", "mongodb", "redis",
        "machine learning", "ai", "data science", "nlp",
        "devops", "ci/cd", "linux", "git",
        "frontend", "backend", "full stack", "mobile", "ios", "android"
    ]
    
    for kw in tech_keywords:
        # Simple containment check; for better results use regex boundry
        if kw in text:
            found_skills.append(kw)
            
    return list(set(found_skills))
