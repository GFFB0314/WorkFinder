"""
Pydantic Schemas for Request/Response Validation

This module defines all Pydantic models used for API request validation
and response serialization in the WorkFinder application.
"""

from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional, List
from datetime import datetime


# ============================================================================
# Job Schemas
# ============================================================================

class JobBase(BaseModel):
    """Base schema for Job with common fields"""
    title: str = Field(..., min_length=1, max_length=500, description="Job title")
    company: str = Field(..., min_length=1, max_length=200, description="Company name")
    location: Optional[str] = Field(None, max_length=200, description="Job location")
    remote: bool = Field(default=False, description="Whether the job is remote")
    description: Optional[str] = Field(None, description="Job description")
    url: Optional[str] = Field(None, description="Original job posting URL")
    skills: Optional[List[str]] = Field(default=None, description="Required skills")


class JobCreate(JobBase):
    """Schema for creating a new job"""
    source_id: int = Field(..., gt=0, description="ID of the source this job came from")
    raw_json: Optional[dict] = Field(None, description="Raw data from the source")
    posted_at: Optional[datetime] = Field(None, description="When the job was posted")


class JobResponse(JobBase):
    """Schema for job response"""
    id: int
    source_id: int
    normalized_hash: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class JobListResponse(BaseModel):
    """Schema for paginated job list response"""
    total: int
    page: int
    page_size: int
    jobs: List[JobResponse]


# ============================================================================
# Source Schemas
# ============================================================================

class SourceBase(BaseModel):
    """Base schema for Source with common fields"""
    name: str = Field(..., min_length=1, max_length=100, description="Source name (e.g., 'Remotive')")
    url: str = Field(..., description="Base URL of the source")
    source_type: str = Field(..., description="Type: 'api', 'rss', or 'html'")


class SourceCreate(SourceBase):
    """Schema for creating a new source"""
    scrape_frequency: Optional[str] = Field(default="daily", description="How often to scrape: 'hourly', 'daily', 'weekly'")


class SourceUpdate(BaseModel):
    """Schema for updating a source"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    url: Optional[str] = None
    source_type: Optional[str] = None
    status: Optional[bool] = None
    scrape_frequency: Optional[str] = None


class SourceResponse(SourceBase):
    """Schema for source response"""
    id: int
    status: bool
    scrape_frequency: str
    last_scraped_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class SourceStatusUpdate(BaseModel):
    """Schema for toggling source status"""
    status: bool = Field(..., description="Active status of the source")


# ============================================================================
# User Schemas
# ============================================================================

class UserBase(BaseModel):
    """Base schema for User with common fields"""
    email: EmailStr = Field(..., description="User email address")


class UserCreate(UserBase):
    """Schema for creating a new user"""
    password: str = Field(..., min_length=8, description="User password (min 8 characters)")


class UserResponse(UserBase):
    """Schema for user response"""
    id: int
    role: str
    subscription_status: str
    subscription_expires_at: Optional[datetime] = None
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


# ============================================================================
# CV Profile Schemas (Premium Feature)
# ============================================================================

class CVProfileBase(BaseModel):
    """Base CV profile schema"""
    skills: List[str] = Field(default=[], description="Extracted tech skills")
    experience_level: Optional[str] = Field(None, description="Inferred experience level (junior, mid, senior, lead)")

class CVProfileCreate(CVProfileBase):
    """Schema for creating a CV Profile"""
    raw_text: Optional[str] = Field(None, description="Extracted CV raw text")

class CVProfileResponse(CVProfileBase):
    """Schema for CV profile response"""
    id: int
    user_id: int
    raw_text: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ============================================================================
# Subscription & Payment Schemas
# ============================================================================

class SubscriptionRequest(BaseModel):
    """Schema for simulating premium subscription purchase"""
    plan: str = Field(..., description="Target plan: 'premium' or 'student'")
    payment_method: str = Field(..., description="Target method: 'momo_mtn', 'momo_orange', or 'card'")
    phone_number: Optional[str] = Field(None, description="Mobile Money number (required if MoMo selected)")
    card_number: Optional[str] = Field(None, description="Card number (optional)")

class SubscriptionResponse(BaseModel):
    """Schema for subscription response"""
    status: str
    message: str
    plan: str
    subscription_status: str
    subscription_expires_at: datetime


# ============================================================================
# Watchlist Schemas
# ============================================================================

class WatchlistBase(BaseModel):
    """Base schema for Watchlist with comprehensive filtering options"""
    keywords: List[str] = Field(..., min_length=1, description="Keywords to watch for (e.g., 'Python', 'React')")
    location: Optional[str] = Field(None, description="Location filter (e.g., 'London', 'Remote')")
    remote_only: bool = Field(default=False, description="Only show remote jobs")
    experience_level: Optional[str] = Field(None, description="Experience level: junior, mid, senior, lead")
    min_salary: Optional[int] = Field(None, ge=0, description="Minimum salary (optional)")
    max_salary: Optional[int] = Field(None, ge=0, description="Maximum salary (optional)")
    frequency: str = Field(default="daily", description="Notification frequency: instant, daily, weekly")
    active: bool = Field(default=True, description="Whether watchlist is active")


class WatchlistCreate(WatchlistBase):
    """Schema for creating a new watchlist"""
    pass


class WatchlistUpdate(BaseModel):
    """Schema for updating an existing watchlist"""
    keywords: Optional[List[str]] = None
    location: Optional[str] = None
    remote_only: Optional[bool] = None
    experience_level: Optional[str] = None
    min_salary: Optional[int] = None
    max_salary: Optional[int] = None
    frequency: Optional[str] = None
    active: Optional[bool] = None


class WatchlistResponse(WatchlistBase):
    """Schema for watchlist response"""
    id: int
    user_id: int
    last_notified_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)
