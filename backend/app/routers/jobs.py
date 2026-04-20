from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User, Job, Candidate
from app.schemas.schemas import JobCreate, JobOut

router = APIRouter(prefix="/api/jobs", tags=["jobs"])


@router.post("", response_model=JobOut, status_code=201)
def create_job(payload: JobCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    job = Job(**payload.model_dump(), created_by_id=current_user.id)
    db.add(job)
    db.commit()
    db.refresh(job)
    count = db.query(func.count(Candidate.id)).filter(Candidate.job_id == job.id).scalar()
    result = JobOut.model_validate(job)
    result.candidate_count = count
    return result


@router.get("", response_model=List[JobOut])
def list_jobs(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    jobs = db.query(Job).filter(Job.is_active == True).order_by(Job.created_at.desc()).all()
    result = []
    for job in jobs:
        count = db.query(func.count(Candidate.id)).filter(Candidate.job_id == job.id).scalar()
        j = JobOut.model_validate(job)
        j.candidate_count = count
        result.append(j)
    return result


@router.get("/{job_id}", response_model=JobOut)
def get_job(job_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    count = db.query(func.count(Candidate.id)).filter(Candidate.job_id == job.id).scalar()
    j = JobOut.model_validate(job)
    j.candidate_count = count
    return j


@router.delete("/{job_id}", status_code=204)
def delete_job(job_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    job.is_active = False
    db.commit()
