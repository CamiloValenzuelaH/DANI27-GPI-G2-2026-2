import uuid
from datetime import datetime
from typing import Any, List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.dependencies import get_current_user
from app.db.database import get_db
from app.models import AssessmentPhase, AssessmentQuestion, AssessmentAnswer
from app.models.evidence_taxonomy import EvidenceTaxonomy

router = APIRouter(prefix="/assessment", tags=["assessment"])


OPEN_GAP_ANSWERS = {"no", "partial"}


def _normalize_answer(value: str | None) -> str:
    return str(value or "").strip().lower()


def _is_open_gap_answer(value: str | None) -> bool:
    return _normalize_answer(value) in OPEN_GAP_ANSWERS


def compute_gaps_summary(organization_id: uuid.UUID, db: Session) -> dict[str, Any]:
    phases = db.query(AssessmentPhase).order_by(AssessmentPhase.sort_order).all()
    per_phase: dict[str, Any] = {}
    total_questions = 0
    total_answered = 0
    total_critical_unanswered = 0
    phase_details: list[dict[str, Any]] = []

    for p in phases:
        questions = p.questions or []
        total = len(questions)
        q_ids = [q.id for q in questions]
        answer_by_question_id: dict[str, str] = {}

        answered = 0
        critical_questions = 0
        critical_answered = 0

        if q_ids:
            answer_rows = db.query(
                AssessmentAnswer.question_id,
                AssessmentAnswer.answer,
            ).filter(
                AssessmentAnswer.organization_id == organization_id,
                AssessmentAnswer.question_id.in_(q_ids),
                func.trim(AssessmentAnswer.answer) != '',
            ).all()

            # DB already filtered-out empty/whitespace-only answers; build map and count answered.
            answer_by_question_id = {str(question_id): answer for question_id, answer in answer_rows}
            answered = len(answer_by_question_id)

            critical_question_list = [q for q in questions if q.is_critical]
            critical_questions = len(critical_question_list)
            if critical_questions:
                critical_open = 0
                for question in critical_question_list:
                    answer_value = answer_by_question_id.get(str(question.id))
                    if answer_value is None or _is_open_gap_answer(answer_value):
                        critical_open += 1
                critical_answered = max(0, critical_questions - critical_open)

        unanswered = total - answered
        critical_unanswered = max(0, critical_questions - critical_answered)
        percent = round((answered / total) * 100, 2) if total else 0.0

        per_phase[str(p.id)] = {
            "answered": answered,
            "total": total,
            "unanswered": unanswered,
            "critical_questions": critical_questions,
            "critical_answered": critical_answered,
            "critical_unanswered": critical_unanswered,
            "percent": percent,
        }

        phase_details.append({
            "phase_name": p.name,
            "phase_code": p.code,
            "total": total,
            "answered": answered,
            "unanswered": unanswered,
            "critical_unanswered": critical_unanswered,
            "percent": percent,
        })

        total_questions += total
        total_answered += answered
        total_critical_unanswered += critical_unanswered

    overall_progress = round((total_answered / total_questions) * 100, 2) if total_questions else 0.0
    return {
        "total_questions": total_questions,
        "critical_unanswered": total_critical_unanswered,
        "answered": total_answered,
        "overall_progress": overall_progress,
        "per_phase": per_phase,
        "phase_details": phase_details,
    }


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


class GapsPhaseOut(BaseModel):
    answered: int
    total: int
    unanswered: int
    critical_questions: int
    critical_answered: int
    critical_unanswered: int
    percent: float


class GapsSummaryOut(BaseModel):
    total_questions: int
    critical_unanswered: int
    answered: int
    overall_progress: float
    per_phase: dict


class CriticalGapItemOut(BaseModel):
    phase_id: str
    phase_name: str
    question_id: str
    question_text: str
    clause_ref: Optional[str]
    answer: Optional[str]
    open_reason: str
    missing_requirement: str
    suggested_evidence: Optional[str]
    has_evidence: bool


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
                func.trim(AssessmentAnswer.answer) != '',
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

    # NOTE: Removed backend validation for critical yes answers.
    # Frontend validates the UI flow. Users answer first, then attach evidence.

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

    # Keep equivalent controls in sync between "X.Y" and "A.X.Y",
    # and also from non-critical duplicates to critical ones with same clause_ref.
    clause_ref = (q.clause_ref or "").strip()
    if clause_ref:
        equivalents = {clause_ref}
        if clause_ref.startswith("A."):
            equivalents.add(clause_ref[2:])
        else:
            equivalents.add(f"A.{clause_ref}")

        equivalent_questions = db.query(AssessmentQuestion).filter(
            AssessmentQuestion.clause_ref.in_(list(equivalents)),
            AssessmentQuestion.is_critical == True,
            AssessmentQuestion.id != q.id,
        ).all()

        for equivalent_question in equivalent_questions:
            equivalent_answer = db.query(AssessmentAnswer).filter(
                AssessmentAnswer.organization_id == current_user.organization_id,
                AssessmentAnswer.question_id == equivalent_question.id,
            ).one_or_none()

            if equivalent_answer:
                equivalent_answer.answer = payload.answer
                equivalent_answer.notes = payload.notes
            else:
                db.add(AssessmentAnswer(
                    organization_id=current_user.organization_id,
                    question_id=equivalent_question.id,
                    answer=payload.answer,
                    notes=payload.notes,
                ))

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



@router.get("/questions", response_model=List[QuestionOut])
def list_questions(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    qs = db.query(AssessmentQuestion).order_by(AssessmentQuestion.sort_order).all()
    out = [QuestionOut(id=str(q.id), text=q.text, clause_ref=q.clause_ref, is_critical=q.is_critical, evidence_hint=q.evidence_hint) for q in qs]
    return out


@router.get("/gaps", response_model=GapsSummaryOut)
def get_gaps_summary(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    phases = db.query(AssessmentPhase).order_by(AssessmentPhase.sort_order).all()
    per_phase = {}
    total_questions = 0
    total_answered = 0
    total_critical_unanswered = 0

    gaps_data = compute_gaps_summary(current_user.organization_id, db)
    return GapsSummaryOut(
        total_questions=gaps_data["total_questions"],
        critical_unanswered=gaps_data["critical_unanswered"],
        answered=gaps_data["answered"],
        overall_progress=gaps_data["overall_progress"],
        per_phase=gaps_data["per_phase"],
    )


@router.get("/gaps/phase/{phase_id}/actions")
def get_gap_actions(phase_id: str, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    phase = db.query(AssessmentPhase).filter(AssessmentPhase.id == phase_id).one_or_none()
    if not phase:
        raise HTTPException(status_code=404, detail="Phase not found")

    questions = phase.questions or []
    total = len(questions)
    q_ids = [q.id for q in questions]

    answered = 0
    critical_unanswered = 0
    if q_ids:
        answer_rows = db.query(
            AssessmentAnswer.question_id,
            AssessmentAnswer.answer,
        ).filter(
            AssessmentAnswer.organization_id == current_user.organization_id,
            AssessmentAnswer.question_id.in_(q_ids),
            func.trim(AssessmentAnswer.answer) != '',
        ).all()

        answer_by_question_id = {str(question_id): answer for question_id, answer in answer_rows}
        answered = len(answer_by_question_id)

        critical_questions = [q for q in questions if q.is_critical]
        if critical_questions:
            critical_open = 0
            for question in critical_questions:
                answer_value = answer_by_question_id.get(str(question.id))
                if answer_value is None or _is_open_gap_answer(answer_value):
                    critical_open += 1
            critical_unanswered = critical_open

    unanswered = max(0, total - answered)

    # simple action rules:
    # can_create_document: if there are unanswered gaps
    # can_modify_document: if there are answered items (document exists)
    # can_audit: if there are critical_unanswered > 0
    return {
        "can_create_document": unanswered > 0 or critical_unanswered > 0,
        "can_modify_document": answered > 0,
        "can_audit": critical_unanswered > 0,
    }


@router.get("/gaps/critical", response_model=List[CriticalGapItemOut])
def get_critical_gaps(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    phases = db.query(AssessmentPhase).order_by(AssessmentPhase.sort_order).all()

    critical_items: list[CriticalGapItemOut] = []
    for phase in phases:
        questions = phase.questions or []
        q_ids = [q.id for q in questions]
        answer_by_question_id: dict[str, str] = {}

        if q_ids:
            answer_rows = db.query(
                AssessmentAnswer.question_id,
                AssessmentAnswer.answer,
            ).filter(
                AssessmentAnswer.organization_id == current_user.organization_id,
                AssessmentAnswer.question_id.in_(q_ids),
                func.trim(AssessmentAnswer.answer) != '',
            ).all()
            answer_by_question_id = {str(question_id): answer for question_id, answer in answer_rows}

        evidence_question_ids = set()
        if q_ids:
            evidence_rows = db.query(EvidenceTaxonomy.question_id).filter(
                EvidenceTaxonomy.organization_id == current_user.organization_id,
                EvidenceTaxonomy.question_id.in_(q_ids),
            ).all()
            evidence_question_ids = {str(question_id) for (question_id,) in evidence_rows if question_id is not None}

        for question in questions:
            if not question.is_critical:
                continue

            answer_value = answer_by_question_id.get(str(question.id))
            normalized_answer = _normalize_answer(answer_value)
            if answer_value is not None and not _is_open_gap_answer(answer_value):
                continue

            if answer_value is None:
                open_reason = "unanswered"
            elif normalized_answer == "no":
                open_reason = "answered_no"
            else:
                open_reason = "answered_partial"

            critical_items.append(CriticalGapItemOut(
                phase_id=str(phase.id),
                phase_name=phase.name,
                question_id=str(question.id),
                question_text=question.text,
                clause_ref=question.clause_ref,
                answer=normalized_answer or None,
                open_reason=open_reason,
                missing_requirement=question.text,
                suggested_evidence=question.evidence_hint,
                has_evidence=str(question.id) in evidence_question_ids,
            ))

    return critical_items


@router.get("/gaps-public")
def get_gaps_public(db: Session = Depends(get_db)):
    # public debug version: treat all questions as unanswered (for UI testing)
    phases = db.query(AssessmentPhase).order_by(AssessmentPhase.sort_order).all()
    per_phase = {}
    total_questions = 0
    total_answered = 0
    total_critical_unanswered = 0

    for p in phases:
        questions = p.questions or []
        total = len(questions)
        answered = 0
        critical_questions = sum(1 for q in questions if q.is_critical)
        critical_answered = 0
        unanswered = total - answered
        critical_unanswered = max(0, critical_questions - critical_answered)
        percent = round((answered / total) * 100, 2) if total else 0.0

        per_phase[str(p.id)] = {
            "answered": answered,
            "total": total,
            "unanswered": unanswered,
            "critical_questions": critical_questions,
            "critical_answered": critical_answered,
            "critical_unanswered": critical_unanswered,
            "percent": percent,
        }

        total_questions += total
        total_answered += answered
        total_critical_unanswered += critical_unanswered

    overall_progress = round((total_answered / total_questions) * 100, 2) if total_questions else 0.0

    return {
        "total_questions": total_questions,
        "critical_unanswered": total_critical_unanswered,
        "answered": total_answered,
        "overall_progress": overall_progress,
        "per_phase": per_phase,
    }


@router.get("/phases-public")
def list_phases_public(db: Session = Depends(get_db)):
    phases = db.query(AssessmentPhase).order_by(AssessmentPhase.sort_order).all()
    out = []
    for p in phases:
        total = len(p.questions or [])
        percent = 0.0
        out.append({"id": str(p.id), "name": p.name, "description": p.description, "sort_order": p.sort_order, "progress": percent})
    return out


@router.get("/questions-public")
def list_questions_public(db: Session = Depends(get_db)):
    qs = db.query(AssessmentQuestion).order_by(AssessmentQuestion.sort_order).all()
    out = [{"id": str(q.id), "text": q.text, "clause_ref": q.clause_ref, "is_critical": q.is_critical, "evidence_hint": q.evidence_hint} for q in qs]
    return out


@router.get("/gaps/phase/{phase_id}/actions-public")
def get_gap_actions_public(phase_id: str, db: Session = Depends(get_db)):
    phase = db.query(AssessmentPhase).filter(AssessmentPhase.id == phase_id).one_or_none()
    if not phase:
        raise HTTPException(status_code=404, detail="Phase not found")
    questions = phase.questions or []
    total = len(questions)
    # public: can_create if total>0, can_modify if total>0, can_audit if any critical
    critical_questions = sum(1 for q in questions if q.is_critical)
    return {"can_create_document": total > 0, "can_modify_document": total > 0, "can_audit": critical_questions > 0}
