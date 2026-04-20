from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from app.models.user import CandidateStatus


# ── Auth ──────────────────────────────────────────────────────────────────────
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    name: str
    email: str
    role: str
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserOut


# ── Jobs ──────────────────────────────────────────────────────────────────────
class JobCreate(BaseModel):
    title: str
    description: str
    required_skills: Optional[str] = ""
    min_experience_years: Optional[int] = 0
    min_match_score: Optional[float] = 60.0


class JobOut(BaseModel):
    id: int
    title: str
    description: str
    required_skills: str
    min_experience_years: int
    min_match_score: float
    is_active: bool
    created_at: datetime
    candidate_count: Optional[int] = 0

    class Config:
        from_attributes = True


# ── Candidates ────────────────────────────────────────────────────────────────
class CandidateOut(BaseModel):
    id: int
    name: str
    email: str
    phone: str
    filename: str
    match_score: float
    ai_summary: str
    matching_skills: str
    missing_skills: str
    green_flags: str
    red_flags: str
    years_experience: float
    status: CandidateStatus
    screening_error: str
    job_id: int
    created_at: datetime
    screened_at: Optional[datetime]

    class Config:
        from_attributes = True


class CandidateStatusUpdate(BaseModel):
    status: CandidateStatus


class BulkStatusUpdate(BaseModel):
    candidate_ids: List[int]
    status: CandidateStatus


# ── Screening ─────────────────────────────────────────────────────────────────
class ScreeningResult(BaseModel):
    match_score: float
    ai_summary: str
    matching_skills: List[str]
    missing_skills: List[str]
    green_flags: List[str]
    red_flags: List[str]
    years_experience: float
    candidate_name: str
    candidate_email: str
    candidate_phone: str


class StatsOut(BaseModel):
    total_jobs: int
    total_candidates: int
    shortlisted: int
    avg_match_score: float
    pending_screening: int
