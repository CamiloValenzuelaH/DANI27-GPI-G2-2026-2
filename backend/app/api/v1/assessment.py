from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.database import get_db
from app.models import AssessmentPhase, AssessmentQuestion, AssessmentAnswer

router = APIRouter(prefix="/assessment", tags=["assessment"])


class PhaseOut(BaseModel):
    id: str
    name: str
    description: Optional[str]
    sort_order: Optional[int]
    progress: float = 0.0


class QuestionOut(BaseModel):
    id: str
    text: str
    clause_ref: Optional[str]
    is_critical: bool
    evidence_hint: Optional[str]


class AnswerIn(BaseModel):
    question_id: str
    answer: str
    notes: Optional[str] = None


class ProgressOut(BaseModel):
    overall: float
    per_phase: dict


@router.get("/phases", response_model=List[PhaseOut])
def list_phases(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    phases = db.query(AssessmentPhase).order_by(AssessmentPhase.sort_order).all()

    out = []
    for p in phases:
        total = len(p.questions or [])
        # count answers in DB for this organization and this phase
        q_ids = [q.id for q in (p.questions or [])]
        answered = 0
        if q_ids:
            answered = db.query(AssessmentAnswer).filter(
                AssessmentAnswer.organization_id == current_user.organization_id,
                AssessmentAnswer.question_id.in_(q_ids),
            ).distinct(AssessmentAnswer.question_id).count()
        percent = round((answered / total) * 100, 2) if total else 0.0
        out.append(PhaseOut(id=str(p.id), name=p.name, description=p.description, sort_order=p.sort_order, progress=percent))
    return out


@router.get("/phases/{phase_id}/questions", response_model=List[QuestionOut])
def get_phase_questions(phase_id: str, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    phase = db.query(AssessmentPhase).filter(AssessmentPhase.id == phase_id).one_or_none()
    if not phase:
        raise HTTPException(status_code=404, detail="Phase not found")
    qs = []
    for q in phase.questions or []:
        qs.append(QuestionOut(id=str(q.id), text=q.text, clause_ref=q.clause_ref, is_critical=q.is_critical, evidence_hint=q.evidence_hint))
    return qs


@router.post("/answers")
def post_answer(payload: AnswerIn, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    q = db.query(AssessmentQuestion).filter(AssessmentQuestion.id == payload.question_id).one_or_none()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")

    # create or update a row in assessment_answers
    existing = db.query(AssessmentAnswer).filter(
        AssessmentAnswer.organization_id == current_user.organization_id,
        AssessmentAnswer.question_id == q.id,
    ).one_or_none()

    if existing:
        existing.answer = payload.answer
        existing.notes = payload.notes
    else:
        a = AssessmentAnswer(
            organization_id=current_user.organization_id,
            question_id=q.id,
            answer=payload.answer,
            notes=payload.notes,
        )
        db.add(a)

    db.commit()
    return {"status": "ok"}


@router.get("/progress", response_model=ProgressOut)
def get_progress(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    phases = db.query(AssessmentPhase).order_by(AssessmentPhase.sort_order).all()
    per_phase = {}
    total_questions = 0
    total_answered = 0
    for p in phases:
        total = len(p.questions or [])
        answered = 0
        q_ids = [q.id for q in (p.questions or [])]
        if q_ids:
            answered = db.query(AssessmentAnswer).filter(
                AssessmentAnswer.organization_id == current_user.organization_id,
                AssessmentAnswer.question_id.in_(q_ids),
            ).distinct(AssessmentAnswer.question_id).count()
        per = round((answered / total) * 100, 2) if total else 0.0
        per_phase[str(p.id)] = {"answered": answered, "total": total, "percent": per}
        total_questions += total
        total_answered += answered

    overall = round((total_answered / total_questions) * 100, 2) if total_questions else 0.0
    return ProgressOut(overall=overall, per_phase=per_phase)
