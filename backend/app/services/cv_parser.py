"""
CV Parser Service

Extracts raw text from uploaded files (PDF, DOCX, TXT) and processes them
to detect technical skills and infer experience level.
"""
import io
import re
from typing import List, Dict, Any
import pypdf
import docx

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
    Extracts text, parses skills, and infers experience level.
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

    # Processing and skill extraction
    extracted_skills = extract_skills_from_text(raw_text)
    experience_level = infer_experience_level(raw_text)
    
    return {
        "raw_text": raw_text,
        "skills": extracted_skills,
        "experience_level": experience_level
    }

def extract_skills_from_text(text: str) -> List[str]:
    """Detect skills in the CV using boundary word matching"""
    if not text:
        return []
        
    text_lower = f" {text.lower()} "
    # Replace common punctuation with spaces to allow easy word boundary matching
    text_processed = re.sub(r"[,\.\(\)\{\}\[\]\-\/\;]", " ", text_lower)
    # Shrink multiple spaces
    text_processed = re.sub(r"\s+", " ", text_processed)
    
    found_skills = set()
    for skill in SKILLS_DICTIONARY:
        # We look for the skill surrounded by non-alphanumeric boundaries
        # e.g., " react " or " spring boot "
        pattern = r"\b" + re.escape(skill) + r"\b"
        if re.search(pattern, text_processed):
            # Normalize display name for certain skills
            display_name = skill
            if skill in ["nodejs", "node.js"]:
                display_name = "Node.js"
            elif skill in ["nextjs", "next.js"]:
                display_name = "Next.js"
            elif skill in ["nestjs", "nest.js"]:
                display_name = "Nest.js"
            elif skill in ["postgres", "postgresql"]:
                display_name = "PostgreSQL"
            elif skill in ["aws", "amazon web services"]:
                display_name = "AWS"
            elif skill in ["gcp", "google cloud"]:
                display_name = "Google Cloud"
            elif skill in ["k8s", "kubernetes"]:
                display_name = "Kubernetes"
            else:
                # Capitalize nicely (first letter or acronyms)
                if len(skill) <= 3 or skill in ["html", "css", "rest", "soap", "mvc", "tdd", "grpc"]:
                    display_name = skill.upper()
                else:
                    display_name = skill.title()
            
            found_skills.add(display_name)
            
    return sorted(list(found_skills))

def infer_experience_level(text: str) -> str:
    """Infer the professional experience level from CV keywords"""
    if not text:
        return "mid"
        
    text_lower = text.lower()
    
    # Senior keywords
    senior_patterns = [
        r"\bsenior\b", r"\bsénior\b", r"\blead\b", r"\barchitect\b", r"\barchitecte\b",
        r"\bdirector\b", r"\bdirecteur\b", r"\bchef de projet\b", r"\btech lead\b",
        r"\b5\s*\+\s*ans\b", r"\b5\s*\+\s*years\b", r"\b8\s*ans\b", r"\b10\s*years\b"
    ]
    
    # Junior keywords
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
