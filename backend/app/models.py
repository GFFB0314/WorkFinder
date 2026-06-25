from sqlalchemy import Column, Integer, String, Boolean, Text, ForeignKey, TIMESTAMP, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base


class User(Base):
    """User model for authentication and watchlists"""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, default="candidate")  # 'candidate', 'recruiter', 'university_admin'
    created_at = Column(TIMESTAMP, server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    watchlists = relationship("Watchlist", back_populates="user")
    cv_profile = relationship("CVProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    
    # WorkFinder V3 Profiles
    student_profile = relationship("StudentProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    company_profile = relationship("CompanyProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    university_profile = relationship("University", back_populates="user", uselist=False, cascade="all, delete-orphan")
    applications = relationship("JobApplication", back_populates="candidate", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<User(id={self.id}, email='{self.email}', role='{self.role}')>"


class StudentProfile(Base):
    """Profile for student candidates (WorkFinder Campus)"""
    __tablename__ = "student_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    student_matricule = Column(String, unique=True, index=True, nullable=False)
    school_email = Column(String, unique=True, index=True, nullable=False)
    department = Column(String, nullable=False)  # Filière
    graduation_year = Column(Integer, nullable=False)
    is_verified = Column(Boolean, default=False)
    university_id = Column(Integer, ForeignKey("universities.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    user = relationship("User", back_populates="student_profile")
    university = relationship("University", back_populates="students")

    def __repr__(self):
        return f"<StudentProfile(id={self.id}, matricule='{self.student_matricule}', verified={self.is_verified})>"


class CompanyProfile(Base):
    """Profile for recruiters/companies (WorkFinder Recruit)"""
    __tablename__ = "company_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    company_name = Column(String, nullable=False, index=True)
    company_website = Column(String, nullable=True)  # Optional
    company_industry = Column(String, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    user = relationship("User", back_populates="company_profile")

    def __repr__(self):
        return f"<CompanyProfile(id={self.id}, name='{self.company_name}')>"


class University(Base):
    """University profile (WorkFinder Campus)"""
    __tablename__ = "universities"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True, unique=True)  # Admin account
    name = Column(String, nullable=False)
    acronym = Column(String, nullable=False, index=True)
    domain = Column(String, nullable=False)  # e.g. 'iut-douala.cm'
    subscription_status = Column(String, default="inactive")  # 'active', 'inactive'
    subscription_expires_at = Column(TIMESTAMP, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    user = relationship("User", back_populates="university_profile")
    students = relationship("StudentProfile", back_populates="university")
    transactions = relationship("Transaction", back_populates="university", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<University(id={self.id}, acronym='{self.acronym}', sub='{self.subscription_status}')>"


class Source(Base):
    """Source model for tracking job data sources"""
    __tablename__ = "sources"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    url = Column(Text, nullable=False)
    source_type = Column(String, nullable=False)  # 'api', 'rss', 'html'
    status = Column(Boolean, default=True)  # Active/Inactive
    scrape_frequency = Column(String, default="daily")  # 'hourly', 'daily', 'weekly'
    last_scraped_at = Column(TIMESTAMP, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    jobs = relationship("Job", back_populates="source")

    def __repr__(self):
        return f"<Source(id={self.id}, name='{self.name}', type='{self.source_type}', status={self.status})>"


class Job(Base):
    """Job model for storing job postings"""
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(Text, nullable=False, index=True)
    company = Column(Text, nullable=False, index=True)
    location = Column(Text)
    remote = Column(Boolean, default=False, index=True)
    description = Column(Text)
    url = Column(Text)  # Original job posting URL
    skills = Column(JSON)
    normalized_hash = Column(String, unique=True, index=True)  # For deduplication
    raw_json = Column(JSON)  # Store original data
    posted_at = Column(TIMESTAMP, nullable=True)  # When the job was originally posted
    source_id = Column(Integer, ForeignKey("sources.id"), nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    source = relationship("Source", back_populates="jobs")
    applications = relationship("JobApplication", back_populates="job", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Job(id={self.id}, title='{self.title}', company='{self.company}', remote={self.remote})>"


class Watchlist(Base):
    """Watchlist model for user job alerts with comprehensive filtering"""
    __tablename__ = "watchlists"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Core filters
    keywords = Column(JSON, nullable=False)  # List of keywords to match
    location = Column(String, nullable=True)  # Location filter (optional)
    remote_only = Column(Boolean, default=False)  # Remote jobs only
    experience_level = Column(String, nullable=True)  # junior, mid, senior, lead
    
    # Salary range (optional)
    min_salary = Column(Integer, nullable=True)  # Minimum salary
    max_salary = Column(Integer, nullable=True)  # Maximum salary
    
    # Notification settings
    frequency = Column(String, default="daily")  # 'instant', 'daily', 'weekly'
    active = Column(Boolean, default=True)  # Active/inactive status
    
    # Tracking
    last_notified_at = Column(TIMESTAMP, nullable=True)  # Track last notification time
    created_at = Column(TIMESTAMP, server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    user = relationship("User", back_populates="watchlists")

    def __repr__(self):
        return f"<Watchlist(id={self.id}, user_id={self.user_id}, keywords={self.keywords}, active={self.active})>"


class CVProfile(Base):
    """CV Profile for storing parsed resume information"""
    __tablename__ = "cv_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    raw_text = Column(Text, nullable=True)
    skills = Column(JSON, nullable=True)  # Extracted skills list e.g. ["python", "react"]
    experience_level = Column(String, nullable=True)  # junior, mid, senior, lead
    created_at = Column(TIMESTAMP, server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    user = relationship("User", back_populates="cv_profile")

    def __repr__(self):
        return f"<CVProfile(id={self.id}, user_id={self.user_id}, skills={self.skills}, exp='{self.experience_level}')>"


class Transaction(Base):
    """Payment transaction model (PayDunya Mobile Money)"""
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    university_id = Column(Integer, ForeignKey("universities.id", ondelete="CASCADE"), nullable=False)
    transaction_ref = Column(String, unique=True, index=True, nullable=False)
    amount = Column(Integer, nullable=False)
    status = Column(String, default="pending")  # 'pending', 'success', 'failed'
    created_at = Column(TIMESTAMP, server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    university = relationship("University", back_populates="transactions")

    def __repr__(self):
        return f"<Transaction(id={self.id}, ref='{self.transaction_ref}', status='{self.status}')>"


class JobApplication(Base):
    """Job application / candidate match matching record"""
    __tablename__ = "job_applications"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False)
    candidate_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    matching_score = Column(Integer, nullable=True)
    status = Column(String, default="applied")  # 'applied', 'reviewed', 'rejected', 'hired'
    created_at = Column(TIMESTAMP, server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    job = relationship("Job", back_populates="applications")
    candidate = relationship("User", back_populates="applications")

    def __repr__(self):
        return f"<JobApplication(id={self.id}, job_id={self.job_id}, candidate_id={self.candidate_id}, score={self.matching_score})>"
