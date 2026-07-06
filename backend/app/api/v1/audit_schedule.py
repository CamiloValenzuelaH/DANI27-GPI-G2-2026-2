from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, conint
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.db.database import get_db
from app.core.dependencies import get_current_user, require_roles
from app.models.user import User
from app.models.audit_schedule import AuditSchedule, CycleFrequency

router = APIRouter(prefix="/audit-schedule", tags=["audit-schedule"])


class AuditScheduleResponse(BaseModel):
    cycle_frequency: str
    next_audit_date: str | None
    last_audit_date: str | None
    audit_day_of_month: int | None = None
    notes: str | None
    created_by: str | None
    created_at: str | None
    updated_at: str | None
    history: list[str] = []


class AuditScheduleUpdateRequest(BaseModel):
    cycle_frequency: str | None = None
    next_audit_date: str | None = None
    audit_day_of_month: conint(ge=1, le=28) | None = None
    notes: str | None = None


class MarkCompletedRequest(BaseModel):
    completed_at: str | None = None


def _add_months(orig: datetime, months: int) -> datetime:
    year = orig.year + ((orig.month - 1 + months) // 12)
    month = ((orig.month - 1 + months) % 12) + 1
    day = min(orig.day, 28)
    return datetime(year, month, day, orig.hour, orig.minute, orig.second, orig.microsecond, orig.tzinfo)


def _compute_next_date(
    last: datetime | None,
    freq: str,
    audit_day: int | None = None,
    today: datetime | None = None,
) -> datetime:
    if today is None:
        today = datetime.now(timezone.utc)

    months = 1 if freq == "monthly" else 3 if freq == "quarterly" else 12
    day = min(28, max(1, int(audit_day))) if audit_day is not None else None

    if last is None and day is not None:
        candidate = datetime(
            today.year,
            today.month,
            day,
            today.hour,
            today.minute,
            today.second,
            today.microsecond,
            today.tzinfo,
        )
    else:
        base = last or today
        candidate = _add_months(base, months)
        if day is not None:
            candidate = datetime(
                candidate.year,
                candidate.month,
                day,
                candidate.hour,
                candidate.minute,
                candidate.second,
                candidate.microsecond,
                candidate.tzinfo,
            )

    while candidate < today:
        candidate = _add_months(candidate, months)
        if day is not None:
            candidate = datetime(
                candidate.year,
                candidate.month,
                day,
                candidate.hour,
                candidate.minute,
                candidate.second,
                candidate.microsecond,
                candidate.tzinfo,
            )

    return candidate


def _build_response(record: AuditSchedule | None) -> AuditScheduleResponse:
    if record is None:
        return AuditScheduleResponse(
            cycle_frequency="monthly",
            next_audit_date=None,
            last_audit_date=None,
            audit_day_of_month=None,
            notes=None,
            created_by=None,
            created_at=None,
            updated_at=None,
            history=[],
        )

    # determine freq string
    freq = record.cycle_frequency.value if hasattr(record.cycle_frequency, "value") else record.cycle_frequency

    next_date = record.next_audit_date or _compute_next_date(record.last_audit_date, freq, record.audit_day_of_month)

    history = []
    if record.last_audit_date:
        history.append(record.last_audit_date.isoformat())

    return AuditScheduleResponse(
        cycle_frequency=freq,
        next_audit_date=next_date.isoformat() if next_date else None,
        last_audit_date=record.last_audit_date.isoformat() if record.last_audit_date else None,
        audit_day_of_month=record.audit_day_of_month,
        notes=record.notes,
        created_by=str(record.created_by) if record.created_by else None,
        created_at=record.created_at.isoformat() if record.created_at else None,
        updated_at=record.updated_at.isoformat() if record.updated_at else None,
        history=history,
    )


@router.get("", response_model=AuditScheduleResponse)
def get_audit_schedule(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    record = (
        db.query(AuditSchedule)
        .filter(AuditSchedule.organization_id == current_user.organization_id)
        .one_or_none()
    )

    return _build_response(record)


@router.put("", response_model=AuditScheduleResponse, dependencies=[Depends(require_roles("admin", "ciso"))])
def upsert_audit_schedule(
    payload: AuditScheduleUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    record = (
        db.query(AuditSchedule)
        .filter(AuditSchedule.organization_id == current_user.organization_id)
        .one_or_none()
    )

    # Basic validation of audit_day_of_month is handled by Pydantic `conint`
    if record is None:
        if payload.next_audit_date:
            next_audit_date = datetime.fromisoformat(payload.next_audit_date)
        elif payload.cycle_frequency or payload.audit_day_of_month is not None:
            next_audit_date = _compute_next_date(
                None,
                payload.cycle_frequency or "monthly",
                payload.audit_day_of_month,
            )
        else:
            next_audit_date = None

        record = AuditSchedule(
            organization_id=current_user.organization_id,
            created_by=current_user.id,
            cycle_frequency=(payload.cycle_frequency or "monthly"),
            next_audit_date=next_audit_date,
            audit_day_of_month=payload.audit_day_of_month,
            notes=payload.notes,
        )
        db.add(record)
    else:
        if payload.cycle_frequency:
            record.cycle_frequency = payload.cycle_frequency
        if payload.next_audit_date:
            record.next_audit_date = datetime.fromisoformat(payload.next_audit_date)
        if payload.audit_day_of_month is not None:
            record.audit_day_of_month = payload.audit_day_of_month
        if payload.notes is not None:
            record.notes = payload.notes

        if not payload.next_audit_date and (payload.cycle_frequency or payload.audit_day_of_month is not None):
            freq = record.cycle_frequency.value if hasattr(record.cycle_frequency, "value") else record.cycle_frequency
            record.next_audit_date = _compute_next_date(record.last_audit_date, freq, record.audit_day_of_month)

    db.commit()
    db.refresh(record)

    return _build_response(record)


@router.post("/mark-completed", response_model=AuditScheduleResponse, dependencies=[Depends(require_roles("admin", "ciso"))])
def mark_audit_completed(
    payload: MarkCompletedRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    record = (
        db.query(AuditSchedule)
        .filter(AuditSchedule.organization_id == current_user.organization_id)
        .one_or_none()
    )

    completed_at = datetime.fromisoformat(payload.completed_at) if payload.completed_at else datetime.now(timezone.utc)

    if record is None:
        record = AuditSchedule(
            organization_id=current_user.organization_id,
            created_by=current_user.id,
            last_audit_date=completed_at,
            next_audit_date=_compute_next_date(completed_at, "monthly"),
            cycle_frequency="monthly",
        )
        db.add(record)
    else:
        record.last_audit_date = completed_at
        freq = (record.cycle_frequency.value if hasattr(record.cycle_frequency, "value") else record.cycle_frequency)
        record.next_audit_date = _compute_next_date(completed_at, freq, record.audit_day_of_month)

    db.commit()
    db.refresh(record)

    return _build_response(record)
