"""
Gemini LLM API Service for WorkFinder V3

Handles semantic CV parsing and job compatibility matching using the
Google Gemini 1.5 Flash API with JSON outputs.
"""

import os
import json
import requests
from typing import Optional, Dict, Any

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"


def parse_cv_with_llm(cv_text: str) -> Optional[Dict[str, Any]]:
    """
    Parses a resume raw text using Gemini 1.5 Flash to extract:
    - skills (list of tech skills/frameworks)
    - experience_level (junior, mid, senior)
    - entities (ORG, LOC, PER)
    - experience_sentences (key summary sentences)
    """
    if not GEMINI_API_KEY:
        print("[LLM Service] GEMINI_API_KEY is not set. Falling back to local parser.")
        return None

    system_prompt = (
        "You are a professional CV parsing assistant. Your task is to extract structured details "
        "from the raw text of a candidate's resume.\n"
        "Analyze the text and output a JSON object matching the following structure:\n"
        "{\n"
        "  \"skills\": [\"List of technical skills, frameworks, tools, and methodologies detected\"],\n"
        "  \"experience_level\": \"junior\" | \"mid\" | \"senior\" (infer based on years of experience, titles, and context),\n"
        "  \"entities\": {\n"
        "    \"ORG\": [\"List of companies, institutions or universities mentioned\"],\n"
        "    \"LOC\": [\"List of cities or countries mentioned\"],\n"
        "    \"PER\": [\"Name of the candidate if detected\"]\n"
        "  },\n"
        "  \"experience_sentences\": [\"Top 3 key sentences summarizing the candidate's roles or years of experience\"]\n"
        "}\n"
        "Do not include any explanation or markdown formatting, output only the raw JSON."
    )

    prompt = f"Resume text:\n{cv_text}"

    payload = {
        "contents": [
            {
                "parts": [
                    {"text": f"{system_prompt}\n\n{prompt}"}
                ]
            }
        ],
        "generationConfig": {
            "responseMimeType": "application/json"
        }
    }

    try:
        url = f"{GEMINI_URL}?key={GEMINI_API_KEY}"
        response = requests.post(url, json=payload, timeout=15)
        response.raise_for_status()
        
        result_json = response.json()
        text_response = result_json["candidates"][0]["content"]["parts"][0]["text"]
        
        parsed_data = json.loads(text_response.strip())
        return parsed_data
        
    except Exception as e:
        print(f"[LLM Service] Error parsing CV with Gemini: {e}")
        return None


def match_job_with_llm(cv_text: str, job_title: str, job_description: str) -> Optional[Dict[str, Any]]:
    """
    Compares a candidate's CV and the job description using Gemini 1.5 Flash.
    Computes a semantic compatibility score based on a 4-dimensional rubric:
    1. Technical Skills Fit (Max 40 pts)
    2. Conceptual Core (Max 20 pts)
    3. Experience Fit (Max 25 pts)
    4. Contextual & Location Fit (Max 15 pts)
    
    Returns:
    - score (0 to 100)
    - matched_skills
    - missing_skills
    - experience_fit (bool)
    - explanation (in French, explaining the dimensions and recommending adjustments)
    """
    if not GEMINI_API_KEY:
        print("[LLM Service] GEMINI_API_KEY is not set. Falling back to local matching engine.")
        return None

    system_prompt = (
        "You are an expert tech recruiter and semantic matching agent. Compare the candidate's CV text "
        "with the job title and description.\n"
        "Analyze the compatibility by evaluating the following 4-dimensional criteria:\n"
        "1. Technical Skills Fit (Max 40 pts): Match of candidate's stack with job requirements, "
        "allowing semantic equivalence (e.g. NumPy/Pandas/Scikit-Learn maps to Machine Learning/Data Science).\n"
        "2. Conceptual Core (Max 20 pts): Understanding of methodologies (e.g. NLP, REST APIs, Agile, CI/CD).\n"
        "3. Experience Fit (Max 25 pts): Alignment of seniority level.\n"
        "4. Contextual & Location Fit (Max 15 pts): Remote preferences or location matches.\n\n"
        "Compute the final score as the sum of these dimensions (0-100).\n"
        "Output a JSON object matching this structure:\n"
        "{\n"
        "  \"score\": integer (0 to 100),\n"
        "  \"matched_skills\": [\"List of required skills the candidate possesses\"],\n"
        "  \"missing_skills\": [\"List of required skills the candidate lacks\"],\n"
        "  \"experience_fit\": boolean (true if seniority matches, false if mismatch),\n"
        "  \"explanation\": \"A concise explanation in French, detailing the points awarded across the 4 dimensions, "
        "highlighting strengths, weaknesses, and actionable recommendations.\"\n"
        "}\n"
        "Do not include any markdown or commentary outside the JSON."
    )

    prompt = (
        f"Candidate CV Text:\n{cv_text}\n\n"
        f"Job Title:\n{job_title}\n\n"
        f"Job Description:\n{job_description}"
    )

    payload = {
        "contents": [
            {
                "parts": [
                    {"text": f"{system_prompt}\n\n{prompt}"}
                ]
            }
        ],
        "generationConfig": {
            "responseMimeType": "application/json"
        }
    }

    try:
        url = f"{GEMINI_URL}?key={GEMINI_API_KEY}"
        response = requests.post(url, json=payload, timeout=15)
        response.raise_for_status()
        
        result_json = response.json()
        text_response = result_json["candidates"][0]["content"]["parts"][0]["text"]
        
        parsed_data = json.loads(text_response.strip())
        return parsed_data
        
    except Exception as e:
        print(f"[LLM Service] Error matching CV with Gemini: {e}")
        return None
