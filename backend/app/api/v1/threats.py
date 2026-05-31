from uuid import UUID
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_org
from app.db.database import get_db
from app.models.organization import Organization
from app.schemas.threat import (
    CreateThreatRequest,
    ThreatResponse,
    UpdateThreatRequest,
)
from app.schemas.iso_threat_catalog import ISOThreatCatalogByCategory
from app.services import threat_service, iso_threat_catalog_service

router = APIRouter(prefix="/threats", tags=["threats"])


@router.get("/catalog", response_model=list[ISOThreatCatalogByCategory])
def get_iso_threat_catalog(
    db: Session = Depends(get_db),
):
    """Obtener el catálogo de amenazas ISO 27005 agrupado por categoría"""
    return iso_threat_catalog_service.get_iso_threat_catalog_by_category(db)


@router.get("", response_model=list[ThreatResponse])
def list_threats(
    db: Session = Depends(get_db),
    org: Organization = Depends(get_current_org),
):
    return threat_service.list_threats(org.id, db)


@router.post("", response_model=ThreatResponse, status_code=status.HTTP_201_CREATED)
def create_threat(
    data: CreateThreatRequest,
    db: Session = Depends(get_db),
    org: Organization = Depends(get_current_org),
):
    return threat_service.create_threat(data, org.id, db)


@router.get("/{threat_id}", response_model=ThreatResponse)
def get_threat(
    threat_id: UUID,
    db: Session = Depends(get_db),
    org: Organization = Depends(get_current_org),
):
    return threat_service.get_threat(threat_id, org.id, db)


@router.patch("/{threat_id}", response_model=ThreatResponse)
def update_threat(
    threat_id: UUID,
    data: UpdateThreatRequest,
    db: Session = Depends(get_db),
    org: Organization = Depends(get_current_org),
):
    return threat_service.update_threat(threat_id, data, org.id, db)


@router.delete("/{threat_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_threat(
    threat_id: UUID,
    db: Session = Depends(get_db),
    org: Organization = Depends(get_current_org),
):
    threat_service.delete_threat(threat_id, org.id, db)
