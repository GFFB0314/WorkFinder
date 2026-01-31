"""
WorkFinder API - Main Application

This is the main FastAPI application that orchestrates all routers and middleware.
"""

from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.database import engine, Base
from app import models
from app.routers import jobs, sources, auth, watchlists


# Lifespan context manager for startup/shutdown events
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan events for the application
    - Startup: Create database tables
    - Shutdown: Cleanup (if needed)
    """
    # Startup: Create all tables
    print("Starting WorkFinder API...")
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully!")
    
    yield
    
    # Shutdown
    print("Shutting down WorkFinder API...")


# Create FastAPI application
app = FastAPI(
    title="WorkFinder API",
    description="""
    **WorkFinder API** - A comprehensive job aggregation platform
    
    This API provides endpoints for:
    - Searching and filtering job postings
    - Managing job data sources (Source Registry)
    - User authentication and watchlists (coming soon)
    
    ## Features
    - **Job Search**: Advanced filtering by location, skills, remote status
    - **Source Registry**: Manage multiple job data sources
    - **Deduplication**: Automatic duplicate job detection
    - **Real-time Updates**: Scheduled scraping from multiple sources
    """,
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)


# CORS Configuration
# Allow frontend to access the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # React dev server
        "http://localhost:5173",  # Vite dev server
        "http://localhost:8080",  # Alternative frontend port
    ],
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers
)


# Include routers
app.include_router(jobs.router)
app.include_router(sources.router)
app.include_router(auth.router)
app.include_router(watchlists.router)


# Health check endpoint
@app.get("/health", tags=["health"])
def health_check() -> dict[str, str]:
    """
    Health check endpoint
    
    Returns the API status. Useful for monitoring and load balancers.
    """
    return {
        "status": "ok",
        "service": "WorkFinder API",
        "version": "1.0.0"
    }


# Root endpoint
@app.get("/", tags=["root"])
def read_root() -> dict[str, str]:
    """
    Root endpoint
    
    Provides basic API information and links to documentation.
    """
    return {
        "message": "Welcome to WorkFinder API",
        "docs": "/docs",
        "redoc": "/redoc",
        "health": "/health"
    }

