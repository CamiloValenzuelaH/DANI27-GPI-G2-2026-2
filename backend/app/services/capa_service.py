from __future__ import annotations

from datetime import date
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.capa import CAPA
from app.schemas.capa import (
    CAPAPriority,
    CAPASource,
    CAPAStatus,
    CreateCAPARequest,
    UpdateCAPARequest,
)


def _get_capa_or_404(capa_id: UUID, org_id: UUID, db: Session) -> CAPA:
    capa = db.query(CAPA).filter(CAPA.id == capa_id, CAPA.organization_id == org_id).first()
    if not capa:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="CAPA no encontrada")
    return capa


def list_capas(
    org_id: UUID,
    status: CAPAStatus | None,
    priority: CAPAPriority | None,
    source: CAPASource | None,
    limit: int,
    offset: int,
    db: Session,
) -> list[CAPA]:
    query = db.query(CAPA).filter(CAPA.organization_id == org_id)
    if status is not None:
        query = query.filter(CAPA.status == status)
    if priority is not None:
        query = query.filter(CAPA.priority == priority)
    if source is not None:
        query = query.filter(CAPA.source == source)
    return query.order_by(CAPA.updated_at.desc()).limit(limit).offset(offset).all()


def get_capa(capa_id: UUID, org_id: UUID, db: Session) -> CAPA:
    return _get_capa_or_404(capa_id, org_id, db)


def create_capa(data: CreateCAPARequest, org_id: UUID, db: Session) -> CAPA:
    capa = CAPA(
        organization_id=org_id,
        title=data.title,
        description=data.description,
        status=data.status,
        priority=data.priority,
        source=data.source,
        due_date=data.due_date,
        progress=data.progress or 0,
        assigned_to=data.assigned_to,
        control_id=data.control_id,
    )
    db.add(capa)
    db.commit()
    db.refresh(capa)
    return capa


def update_capa(capa_id: UUID, data: UpdateCAPARequest, org_id: UUID, db: Session) -> CAPA:
    capa = _get_capa_or_404(capa_id, org_id, db)
    if data.title is not None:
        capa.title = data.title
    if data.description is not None:
        capa.description = data.description
    if data.status is not None:
        capa.status = data.status
    if data.priority is not None:
        capa.priority = data.priority
    if data.source is not None:
        capa.source = data.source
    if data.due_date is not None:
        capa.due_date = data.due_date
    if data.progress is not None:
        capa.progress = data.progress
    if data.assigned_to is not None:
        capa.assigned_to = data.assigned_to
    if data.control_id is not None:
        capa.control_id = data.control_id
    db.commit()
    db.refresh(capa)
    return capa


def update_capa_status(capa_id: UUID, status: CAPAStatus, org_id: UUID, db: Session) -> CAPA:
    capa = _get_capa_or_404(capa_id, org_id, db)
    capa.status = status
    db.commit()
    db.refresh(capa)
    return capa


def update_capa_progress(capa_id: UUID, progress: int, org_id: UUID, db: Session) -> CAPA:
    capa = _get_capa_or_404(capa_id, org_id, db)
    capa.progress = progress
    db.commit()
    db.refresh(capa)
    return capa


def get_capa_summary(org_id: UUID, db: Session) -> dict[str, object]:
    total = db.query(CAPA).filter(CAPA.organization_id == org_id).count()
    by_status = {status.value: 0 for status in CAPAStatus}
    by_priority = {priority.value: 0 for priority in CAPAPriority}
    rows = db.query(CAPA.status, CAPA.priority, CAPA.due_date).filter(CAPA.organization_id == org_id).all()
    overdue_count = 0
    for row_status, row_priority, due_date in rows:
        by_status[row_status] += 1
        by_priority[row_priority] += 1
        if due_date is not None and due_date < date.today() and row_status != CAPAStatus.closed:
            overdue_count += 1
    return {
        "total": total,
        "by_status": by_status,
        "by_priority": by_priority,
        "overdue_count": overdue_count,
    }
