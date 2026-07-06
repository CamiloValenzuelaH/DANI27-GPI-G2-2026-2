from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_org
from app.db.database import get_db
from app.models.organization import Organization
from app.schemas.capa import (
    CAPAPriority,
    CAPASource,
    CAPAStatus,
    CAPAResponse,
    CAPASummaryResponse,
    CreateCAPARequest,
    UpdateCAPARequest,
    UpdateCAPAStatusRequest,
    UpdateCAPAProgressRequest,
)
from app.services.capa_service import (
    create_capa,
    get_capa,
    get_capa_summary,
    list_capas,
    update_capa,
    update_capa_status,
    update_capa_progress,
)

router = APIRouter(prefix="/capas", tags=["capas"])


@router.get("", response_model=list[CAPAResponse])
def list_capas_endpoint(
    status: CAPAStatus | None = None,
    priority: CAPAPriority | None = None,
    source: CAPASource | None = None,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
    org: Organization = Depends(get_current_org),
):
    return list_capas(org.id, status, priority, source, limit, offset, db)


@router.get("/summary", response_model=CAPASummaryResponse)
def get_capa_summary_endpoint(
    db: Session = Depends(get_db),
    org: Organization = Depends(get_current_org),
):
    return get_capa_summary(org.id, db)


@router.get("/{capa_id}", response_model=CAPAResponse)
def get_capa_endpoint(
    capa_id: UUID,
    db: Session = Depends(get_db),
    org: Organization = Depends(get_current_org),
):
    return get_capa(capa_id, org.id, db)


@router.post("", response_model=CAPAResponse, status_code=status.HTTP_201_CREATED)
def create_capa_endpoint(
    data: CreateCAPARequest,
    db: Session = Depends(get_db),
    org: Organization = Depends(get_current_org),
):
    return create_capa(data, org.id, db)


@router.put("/{capa_id}", response_model=CAPAResponse)
def update_capa_endpoint(
    capa_id: UUID,
    data: UpdateCAPARequest,
    db: Session = Depends(get_db),
    org: Organization = Depends(get_current_org),
):
    return update_capa(capa_id, data, org.id, db)


@router.patch("/{capa_id}/status", response_model=CAPAResponse)
def update_capa_status_endpoint(
    capa_id: UUID,
    data: UpdateCAPAStatusRequest,
    db: Session = Depends(get_db),
    org: Organization = Depends(get_current_org),
):
    return update_capa_status(capa_id, data.status, org.id, db)


@router.patch("/{capa_id}/progress", response_model=CAPAResponse)
def update_capa_progress_endpoint(
    capa_id: UUID,
    data: UpdateCAPAProgressRequest,
    db: Session = Depends(get_db),
    org: Organization = Depends(get_current_org),
):
    return update_capa_progress(capa_id, data.progress, org.id, db)
