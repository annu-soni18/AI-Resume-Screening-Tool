import os
import json
import aiofiles
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from app.core.database import get_db
from app.core.security import get_current_user
from app.core.config import get_settings
from app.models.user import User, Job, Candidate, CandidateStatus
from app.schemas.schemas import CandidateOut, CandidateStatusUpdate, BulkStatusUpdate
from app.services.resume_parser import extract_text, extract_email, extract_phone, extract_name_heuristic
from app.services.ollama_client import screen_resume

router = APIRouter(prefix="/api/candidates", tags=["candidates"])
settings = get_settings()


async def process_candidate(candidate_id: int, job_description: str, db_url: str):
    print("🔥 PROCESS STARTED for candidate:", candidate_id)
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    import traceback
    
    connect_args = {"check_same_thread": False} if "sqlite" in db_url else {}
    engine = create_engine(db_url, connect_args=connect_args)
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()
    try:
        candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
        if not candidate:
            print("❌ Candidate not found")
            return
        candidate.status = CandidateStatus.screening
        db.commit()
        print("🚀 Calling LLM...")

        result = await screen_resume(job_description, candidate.raw_text)
        print("✅ LLM RESULT:", result)
        candidate.match_score = result["match_score"]
        candidate.ai_summary = result["ai_summary"]
        candidate.matching_skills = json.dumps(result["matching_skills"])
        candidate.missing_skills = json.dumps(result["missing_skills"])
        candidate.green_flags = json.dumps(result["green_flags"])
        candidate.red_flags = json.dumps(result["red_flags"])
        candidate.years_experience = result["years_experience"]
        if result["candidate_name"] != "Unknown":
            candidate.name = result["candidate_name"]
        if result["candidate_email"]:
            candidate.email = result["candidate_email"]
        if result["candidate_phone"]:
            candidate.phone = result["candidate_phone"]
        candidate.status = CandidateStatus.pending
        candidate.screened_at = datetime.utcnow()
        db.commit()
    except Exception as e:
        print("❌ ERROR IN PROCESS:", e)   # 🔥 ADD THIS
        traceback.print_exc()
        candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
        if candidate:
            candidate.status = CandidateStatus.pending
            candidate.screening_error = str(e)
            db.commit()
    finally:
        db.close()


@router.post("/upload/{job_id}", status_code=202)
async def upload_resumes(
    job_id: int,
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    os.makedirs(settings.upload_dir, exist_ok=True)
    uploaded = []

    for file in files:
        content = await file.read()
        if len(content) > settings.max_upload_size_mb * 1024 * 1024:
            continue

        safe_name = f"{job_id}_{datetime.utcnow().timestamp()}_{file.filename}"
        file_path = os.path.join(settings.upload_dir, safe_name)

        async with aiofiles.open(file_path, "wb") as f:
            await f.write(content)

        raw_text = extract_text(content, file.filename)
        name = extract_name_heuristic(raw_text)
        email = extract_email(raw_text)
        phone = extract_phone(raw_text)

        candidate = Candidate(
            name=name,
            email=email,
            phone=phone,
            filename=file.filename,
            file_path=file_path,
            raw_text=raw_text,
            job_id=job_id,
            status=CandidateStatus.screening,
        )
        db.add(candidate)
        db.commit()
        db.refresh(candidate)

        background_tasks.add_task(
            process_candidate,
            candidate.id,
            job.description,
            settings.database_url,
        )
        uploaded.append(candidate.id)

    return {"message": f"{len(uploaded)} resumes uploaded and queued for screening", "candidate_ids": uploaded}


@router.get("/job/{job_id}", response_model=List[CandidateOut])
def list_candidates(
    job_id: int,
    status: str = None,
    min_score: float = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Candidate).filter(Candidate.job_id == job_id)
    if status:
        query = query.filter(Candidate.status == status)
    if min_score > 0:
        query = query.filter(Candidate.match_score >= min_score)
    candidates = query.order_by(Candidate.match_score.desc()).all()
    return candidates


@router.get("/{candidate_id}", response_model=CandidateOut)
def get_candidate(candidate_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    c = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Candidate not found")
    return c


@router.patch("/{candidate_id}/status", response_model=CandidateOut)
def update_status(
    candidate_id: int,
    payload: CandidateStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    c = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Candidate not found")
    c.status = payload.status
    db.commit()
    db.refresh(c)
    return c


@router.post("/bulk-status", response_model=dict)
def bulk_update_status(
    payload: BulkStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    updated = db.query(Candidate).filter(Candidate.id.in_(payload.candidate_ids)).all()
    for c in updated:
        c.status = payload.status
    db.commit()
    return {"updated": len(updated)}


@router.delete("/{candidate_id}", status_code=204)
def delete_candidate(candidate_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    c = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Candidate not found")
    if os.path.exists(c.file_path):
        os.remove(c.file_path)
    db.delete(c)
    db.commit()
