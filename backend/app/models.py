from sqlalchemy import Column, Integer, String, Boolean, Text, ForeignKey, TIMESTAMP, ARRAY
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, default="user")
    created_at = Column(TIMESTAMP, server_default=func.now())

class Source(Base):
    __tablename__ = "sources"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    url = Column(Text, nullable=False)
    status = Column(Boolean, default=True)

class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(Text, nullable=False)
    company = Column(Text, nullable=False)
    location = Column(Text)
    remote = Column(Boolean, default=False)
    description = Column(Text)
    skills = Column(ARRAY(Text))
    normalized_hash = Column(String, unique=True, index=True)
    raw_json = Column(JSONB)
    source_id = Column(Integer, ForeignKey("sources.id"))

class Watchlist(Base):
    __tablename__ = "watchlists"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    keywords = Column(ARRAY(Text), nullable=False)
    frequency = Column(String, default="daily")
