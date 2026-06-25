"""
CV Parser Service

Extracts raw text from uploaded files (PDF, DOCX, TXT) and processes them
using spaCy to detect technical skills and infer experience level.
"""
import io
import re
import sys
import subprocess
from typing import List, Dict, Any
import pypdf
import docx

# Try loading spaCy models
nlp_fr = None
nlp_en = None
try:
    import spacy
    # Try loading French
    try:
        nlp_fr = spacy.load("fr_core_news_sm")
    except Exception:
        print("[CV Parser] Downloading fr_core_news_sm model...")
        subprocess.run([sys.executable, "-m", "spacy", "download", "fr_core_news_sm"], check=True)
        nlp_fr = spacy.load("fr_core_news_sm")
        
    # Try loading English
    try:
        nlp_en = spacy.load("en_core_web_sm")
    except Exception:
        print("[CV Parser] Downloading en_core_web_sm model...")
        subprocess.run([sys.executable, "-m", "spacy", "download", "en_core_web_sm"], check=True)
        nlp_en = spacy.load("en_core_web_sm")
except Exception as e:
    print(f"[CV Parser] spaCy model load failed, falling back to regex: {e}")


# A rich, comprehensive tech skills dictionary covering multiple domains
SKILLS_DICTIONARY: List[str] = [
    # Programming Languages
    "python", "javascript", "typescript", "java", "c#", "c++", "c", "golang", "go",
    "ruby", "php", "swift", "kotlin", "rust", "scala", "dart", "r", "sql", "html", "css",
    "sass", "bash", "shell", "perl", "matlab", "assembly",

    # Frameworks & Libraries
    "react", "react native", "angular", "vue", "next.js", "nextjs", "nuxt", "svelte", 
    "django", "flask", "fastapi", "spring boot", "spring", "asp.net", "laravel", 
    "express", "node.js", "nodejs", "nest.js", "nestjs", "jquery", "bootstrap", 
    "tailwind", "flutter", "ionic", "cordova", "pytorch", "tensorflow", "keras", 
    "scikit-learn", "pandas", "numpy", "opencv", "spaCy", "nltk",

    # DevOps, Cloud & Systems
    "aws", "amazon web services", "azure", "gcp", "google cloud", "docker", "kubernetes",
    "k8s", "terraform", "ansible", "jenkins", "gitlab", "github actions", "circleci",
    "devops", "ci/cd", "linux", "ubuntu", "debian", "redhat", "centos", "nginx", "apache",
    "prometheus", "grafana", "elk stack", "logstash", "kibana", "vagrant",

    # Databases & Caching
    "postgresql", "postgres", "mysql", "sqlite", "mongodb", "redis", "cassandra", 
    "elasticsearch", "mariadb", "oracle", "sql server", "dynamodb", "neo4j", "firebase",

    # Methodologies, Architecture & Tools
    "git", "github", "gitlab", "bitbucket", "jira", "confluence", "scrum", "agile", 
    "kanban", "trello", "rest api", "graphql", "soap", "microservices", "mvc", "tdd", 
    "ci / cd", "unit testing", "system architecture", "docker compose"
]

def _get_display_name(skill: str) -> str:
    """Normalize display name for technical skills"""
    skill_lower = skill.lower().strip()
    if skill_lower in ["nodejs", "node.js"]:
        return "Node.js"
    elif skill_lower in ["nextjs", "next.js"]:
        return "Next.js"
    elif skill_lower in ["nestjs", "nest.js"]:
        return "Nest.js"
    elif skill_lower in ["postgres", "postgresql"]:
        return "PostgreSQL"
    elif skill_lower in ["aws", "amazon web services"]:
        return "AWS"
    elif skill_lower in ["gcp", "google cloud"]:
        return "Google Cloud"
    elif skill_lower in ["k8s", "kubernetes"]:
        return "Kubernetes"
    
    # Capitalize acronyms or common abbreviations
    if len(skill_lower) <= 3 or skill_lower in ["html", "css", "rest", "soap", "mvc", "tdd", "grpc"]:
        return skill_lower.upper()
    
    return skill_lower.title()

def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract text from a PDF file"""
    try:
        pdf_file = io.BytesIO(file_bytes)
        reader = pypdf.PdfReader(pdf_file)
        text = []
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text.append(page_text)
        return "\n".join(text)
    except Exception as e:
        print(f"Error parsing PDF CV: {e}")
        return ""

def extract_text_from_docx(file_bytes: bytes) -> str:
    """Extract text from a DOCX file"""
    try:
        docx_file = io.BytesIO(file_bytes)
        doc = docx.Document(docx_file)
        text = []
        for paragraph in doc.paragraphs:
            text.append(paragraph.text)
        for table in doc.tables:
            for row in table.rows:
                row_text = [cell.text.strip() for cell in row.cells]
                text.append(" | ".join(row_text))
        return "\n".join(text)
    except Exception as e:
        print(f"Error parsing DOCX CV: {e}")
        return ""

def parse_cv_bytes(file_bytes: bytes, filename: str) -> Dict[str, Any]:
    """
    Main entry point for parsing CV bytes.
    Extracts text, processes it using spaCy (if available) or regex fallback.
    """
    filename_lower = filename.lower()
    raw_text = ""
    
    if filename_lower.endswith(".pdf"):
        raw_text = extract_text_from_pdf(file_bytes)
    elif filename_lower.endswith(".docx"):
        raw_text = extract_text_from_docx(file_bytes)
    else:
        # Fallback to plain text
        try:
            raw_text = file_bytes.decode("utf-8")
        except UnicodeDecodeError:
            try:
                raw_text = file_bytes.decode("latin-1")
            except Exception:
                raw_text = ""

    # Try LLM-based parsing if API key is set
    from app.services.llm_service import parse_cv_with_llm
    if raw_text:
        try:
            llm_result = parse_cv_with_llm(raw_text)
            if llm_result:
                return {
                    "raw_text": raw_text,
                    "skills": llm_result.get("skills", []),
                    "experience_level": llm_result.get("experience_level", "junior"),
                    "entities": llm_result.get("entities", {"ORG": [], "LOC": [], "PER": []}),
                    "experience_sentences": llm_result.get("experience_sentences", [])
                }
        except Exception as e:
            print(f"[CV Parser] LLM extraction error: {e}, falling back to local parsing.")

    # spaCy-based parsing
    if (nlp_fr or nlp_en) and raw_text:
        try:
            structured_info = extract_structured_info_with_spacy(raw_text)
            return {
                "raw_text": raw_text,
                "skills": structured_info["skills"],
                "experience_level": structured_info["experience_level"],
                "entities": structured_info["entities"],
                "experience_sentences": structured_info["experience_sentences"]
            }
        except Exception as e:
            print(f"[CV Parser] spaCy extraction error: {e}, using regex fallback.")
    
    # Fallback to standard regex
    extracted_skills = extract_skills_from_text_regex(raw_text)
    experience_level = infer_experience_level_regex(raw_text)
    
    return {
        "raw_text": raw_text,
        "skills": extracted_skills,
        "experience_level": experience_level,
        "entities": {},
        "experience_sentences": []
    }

def detect_language(text: str) -> str:
    """Detect if text is English or French based on simple common stopwords"""
    text_lower = text.lower()
    en_words = len(re.findall(r"\b(the|and|of|with|for|in|to|is|at|on|from)\b", text_lower))
    fr_words = len(re.findall(r"\b(le|la|et|dans|pour|avec|en|a|sur|du|des|est)\b", text_lower))
    return "en" if en_words > fr_words else "fr"

def extract_structured_info_with_spacy(text: str) -> Dict[str, Any]:
    """
    Use spaCy NLP pipeline to clean, tokenize, and extract structural information:
    - Named Entities (ORG, LOC, PER)
    - Key experience sentences
    - Technical skills matching token lemmas & chunks
    - Experience level inference
    """
    lang = detect_language(text)
    selected_nlp = nlp_en if lang == "en" else nlp_fr
    if not selected_nlp:
        selected_nlp = nlp_fr or nlp_en
        
    if not selected_nlp:
        raise ValueError("No spaCy models loaded in cv_parser")
        
    doc = selected_nlp(text)
    
    # Entity extraction
    entities = {"ORG": [], "LOC": [], "PER": []}
    for ent in doc.ents:
        if ent.label_ in ["ORG", "LOC", "GPE", "PER", "PERS"]:
            label = "LOC" if ent.label_ == "GPE" else ("PER" if ent.label_ == "PERS" else ent.label_)
            clean_text = ent.text.strip().replace("\n", " ")
            clean_text = re.sub(r"\s+", " ", clean_text)
            if len(clean_text) > 2 and clean_text not in entities[label]:
                entities[label].append(clean_text)
                
    entities = {k: v[:5] for k, v in entities.items()} # limit to top 5
    
    # Experience sentences extraction
    exp_sentences = []
    exp_keywords = ["ans", "année", "year", "expérience", "experience", "lead", "senior", "sénior", "chef", "directeur", "manager"]
    for sent in doc.sents:
        sent_text = sent.text.strip()
        if any(kw in sent_text.lower() for kw in exp_keywords):
            cleaned_sent = re.sub(r"\s+", " ", sent_text)
            if 15 < len(cleaned_sent) < 150:
                exp_sentences.append(cleaned_sent)
                if len(exp_sentences) >= 5:
                    break
                    
    # Skills extraction using spaCy lemmas, tokens, and noun chunks
    lemmas = {token.lemma_.lower().strip() for token in doc if not token.is_stop}
    tokens_lower = {token.text.lower().strip() for token in doc if not token.is_stop}
    chunks = {chunk.text.lower().strip() for chunk in doc.noun_chunks}
    
    text_features = lemmas.union(tokens_lower).union(chunks)
    
    found_skills = set()
    text_lower = f" {text.lower()} "
    for skill in SKILLS_DICTIONARY:
        skill_lower = skill.lower().strip()
        # Check direct lemma/token match or fallback to regex boundary for multi-word skills
        if (skill_lower in text_features) or (f" {skill_lower} " in text_lower):
            found_skills.add(_get_display_name(skill))
            
    # Experience level inference
    senior_count = 0
    junior_count = 0
    for token in doc:
        token_lower = token.text.lower()
        if token_lower in ["senior", "sénior", "lead", "principal", "expert", "architecte", "architect"]:
            senior_count += 1
        elif token_lower in ["junior", "stagiaire", "intern", "assistant", "débutant", "debutant"]:
            junior_count += 1
            
    experience_years = 0
    for sent in doc.sents:
        match = re.search(r"(\d+)\s*(?:\+|plus)?\s*(?:ans|years|années)\s*(?:d'expérience|of experience)?", sent.text.lower())
        if match:
            try:
                years = int(match.group(1))
                if years > experience_years:
                    experience_years = years
            except ValueError:
                pass
                
    if experience_years >= 5 or (senior_count > junior_count and senior_count >= 1):
        experience_level = "senior"
    elif junior_count > senior_count and junior_count >= 1:
        experience_level = "junior"
    else:
        experience_level = "mid"
        
    return {
        "entities": entities,
        "experience_sentences": exp_sentences,
        "skills": sorted(list(found_skills)),
        "experience_level": experience_level
    }

def extract_skills_from_text_regex(text: str) -> List[str]:
    """Fallback skill detector using basic boundary word matching"""
    if not text:
        return []
        
    text_lower = f" {text.lower()} "
    text_processed = re.sub(r"[,\.\(\)\{\}\[\]\-\/\;]", " ", text_lower)
    text_processed = re.sub(r"\s+", " ", text_processed)
    
    found_skills = set()
    for skill in SKILLS_DICTIONARY:
        pattern = r"\b" + re.escape(skill) + r"\b"
        if re.search(pattern, text_processed):
            found_skills.add(_get_display_name(skill))
            
    return sorted(list(found_skills))

def infer_experience_level_regex(text: str) -> str:
    """Fallback experience level inference"""
    if not text:
        return "mid"
        
    text_lower = text.lower()
    
    senior_patterns = [
        r"\bsenior\b", r"\bsénior\b", r"\blead\b", r"\barchitect\b", r"\barchitecte\b",
        r"\bdirector\b", r"\bdirecteur\b", r"\bchef de projet\b", r"\btech lead\b",
        r"\b5\s*\+\s*ans\b", r"\b5\s*\+\s*years\b", r"\b8\s*ans\b", r"\b10\s*years\b"
    ]
    
    junior_patterns = [
        r"\bjunior\b", r"\bstagiaire\b", r"\bintern\b", r"\bbeginner\b", r"\bdébutant\b",
        r"\bdebutant\b", r"\bstage\b", r"\bétudiant\b", r"\betudiant\b"
    ]
    
    senior_score = sum(1 for pattern in senior_patterns if re.search(pattern, text_lower))
    junior_score = sum(1 for pattern in junior_patterns if re.search(pattern, text_lower))
    
    if senior_score > junior_score and senior_score >= 1:
        return "senior"
    elif junior_score > senior_score and junior_score >= 1:
        return "junior"
    else:
        return "mid"
