"""
Database Configuration Module

This module configures the SQLAlchemy database connection and session management
for the WorkFinder application.

Components:
    - engine: SQLAlchemy engine instance
    - SessionLocal: Session factory for database operations
    - Base: Declarative base for ORM models
    - get_db(): Dependency injection for FastAPI routes
    - init_db(): Initialize database tables

Environment Variables:
    DATABASE_URL: Database connection string (default: sqlite:///./workfinder.db)
"""
from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# Determine the base directory (backend folder)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, "workfinder.db")

SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{DB_PATH}")

# Normalization safeguard for postgresql:// connection strings
if SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgres://", "postgresql://", 1)

def create_database_if_not_exists(url: str):
    """Programmatically create PostgreSQL database if it does not exist"""
    if "postgresql" in url:
        try:
            from sqlalchemy import create_engine, text
            # Split the URL to connect to the default 'postgres' database
            base_url, db_name = url.rsplit('/', 1)
            if '?' in db_name:
                db_name, query = db_name.split('?', 1)
                default_url = f"{base_url}/postgres?{query}"
            else:
                default_url = f"{base_url}/postgres"
            
            temp_engine = create_engine(default_url, isolation_level="AUTOCOMMIT")
            with temp_engine.connect() as conn:
                result = conn.execute(text(f"SELECT 1 FROM pg_database WHERE datname='{db_name}'"))
                exists = result.scalar()
                if not exists:
                    print(f"Database '{db_name}' does not exist. Creating programmatically...")
                    conn.execute(text(f"CREATE DATABASE {db_name}"))
                    print(f"Database '{db_name}' created successfully!")
            temp_engine.dispose()
        except Exception as e:
            print("Warning: Auto-creation of database failed (might already exist or connection issue):", e)

# Trigger auto-creation if using postgres
create_database_if_not_exists(SQLALCHEMY_DATABASE_URL)

connect_args = {}
if "sqlite" in SQLALCHEMY_DATABASE_URL:
    connect_args = {"check_same_thread": False}

engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db() -> Generator:
    """
    Database session dependency for FastAPI routes.
    
    Yields:
        Session: SQLAlchemy database session
    
    Example:
        @app.get("/items")
        def read_items(db: Session = Depends(get_db)):
            return db.query(Item).all()
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """
    Initialize database tables.
    
    Creates all tables defined in models.py if they don't exist.
    Safe to call multiple times (won't recreate existing tables).
    
    Note:
        Must import models to register them with Base before creating tables.
    """
    from app import models  # Import models to register them with Base
    Base.metadata.create_all(bind=engine)
