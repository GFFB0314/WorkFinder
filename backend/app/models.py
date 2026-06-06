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
    role = Column(String, default="user")
    subscription_status = Column(String, default="free")  # 'free', 'premium', 'student'
    subscription_expires_at = Column(TIMESTAMP, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    watchlists = relationship("Watchlist", back_populates="user")
    cv_profile = relationship("CVProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")

    def __repr__(self):
        return f"<User(id={self.id}, email='{self.email}', role='{self.role}', sub='{self.subscription_status}')>"


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
    """CV Profile for storing parsed resume information (Premium Feature)"""
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

