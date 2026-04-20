from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User, Job, Candidate, CandidateStatus
from app.schemas.schemas import StatsOut
from app.services.ollama_client import check_ollama_health

router = APIRouter(prefix="/api/stats", tags=["stats"])


@router.get("", response_model=StatsOut)
def get_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    total_jobs = db.query(func.count(Job.id)).filter(Job.is_active == True).scalar()
    total_candidates = db.query(func.count(Candidate.id)).scalar()
    shortlisted = db.query(func.count(Candidate.id)).filter(Candidate.status == CandidateStatus.shortlisted).scalar()
    avg_score = db.query(func.avg(Candidate.match_score)).filter(Candidate.match_score > 0).scalar() or 0.0
    pending = db.query(func.count(Candidate.id)).filter(Candidate.status == CandidateStatus.screening).scalar()
    return StatsOut(
        total_jobs=total_jobs,
        total_candidates=total_candidates,
        shortlisted=shortlisted,
        avg_match_score=round(avg_score, 1),
        pending_screening=pending,
    )


@router.get("/health")
async def health():
    ollama_ok = await check_ollama_health()
    return {"api": "ok", "ollama": "ok" if ollama_ok else "unavailable"}
