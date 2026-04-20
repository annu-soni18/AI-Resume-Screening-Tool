from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey, Boolean, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.core.database import Base


class CandidateStatus(str, enum.Enum):
    pending = "pending"
    screening = "screening"
    shortlisted = "shortlisted"
    rejected = "rejected"
    interviewing = "interviewing"
    hired = "hired"


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(50), default="recruiter")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    jobs = relationship("Job", back_populates="created_by")


class Job(Base):
    __tablename__ = "jobs"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    required_skills = Column(Text, default="")
    min_experience_years = Column(Integer, default=0)
    min_match_score = Column(Float, default=60.0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    created_by_id = Column(Integer, ForeignKey("users.id"))
    created_by = relationship("User", back_populates="jobs")
    candidates = relationship("Candidate", back_populates="job", cascade="all, delete-orphan")


class Candidate(Base):
    __tablename__ = "candidates"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), index=True, default="")
    phone = Column(String(50), default="")
    filename = Column(String(500), nullable=False)
    file_path = Column(String(1000), nullable=False)
    raw_text = Column(Text, default="")
    match_score = Column(Float, default=0.0)
    ai_summary = Column(Text, default="")
    matching_skills = Column(Text, default="")
    missing_skills = Column(Text, default="")
    green_flags = Column(Text, default="")
    red_flags = Column(Text, default="")
    years_experience = Column(Float, default=0.0)
    status = Column(Enum(CandidateStatus), default=CandidateStatus.pending)
    screening_error = Column(Text, default="")
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=False)
    job = relationship("Job", back_populates="candidates")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    screened_at = Column(DateTime(timezone=True), nullable=True)
