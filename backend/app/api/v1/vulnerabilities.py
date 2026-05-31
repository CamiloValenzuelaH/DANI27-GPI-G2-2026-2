from uuid import UUID
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_org
from app.db.database import get_db
from app.models.organization import Organization
from app.schemas.vulnerability import (
    CreateVulnerabilityRequest,
    UpdateVulnerabilityRequest,
    VulnerabilityResponse,
)
from app.services import vulnerability_service

router = APIRouter(prefix="/vulnerabilities", tags=["vulnerabilities"])


@router.get("", response_model=list[VulnerabilityResponse])
def list_vulnerabilities(
    db: Session = Depends(get_db),
    org: Organization = Depends(get_current_org),
):
    return vulnerability_service.list_vulnerabilities(org.id, db)


@router.post("", response_model=VulnerabilityResponse, status_code=status.HTTP_201_CREATED)
def create_vulnerability(
    data: CreateVulnerabilityRequest,
    db: Session = Depends(get_db),
    org: Organization = Depends(get_current_org),
):
    return vulnerability_service.create_vulnerability(data, org.id, db)


@router.get("/{vulnerability_id}", response_model=VulnerabilityResponse)
def get_vulnerability(
    vulnerability_id: UUID,
    db: Session = Depends(get_db),
    org: Organization = Depends(get_current_org),
):
    return vulnerability_service.get_vulnerability(vulnerability_id, org.id, db)


@router.patch("/{vulnerability_id}", response_model=VulnerabilityResponse)
def update_vulnerability(
    vulnerability_id: UUID,
    data: UpdateVulnerabilityRequest,
    db: Session = Depends(get_db),
    org: Organization = Depends(get_current_org),
):
    return vulnerability_service.update_vulnerability(vulnerability_id, data, org.id, db)


@router.delete("/{vulnerability_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_vulnerability(
    vulnerability_id: UUID,
    db: Session = Depends(get_db),
    org: Organization = Depends(get_current_org),
):
    vulnerability_service.delete_vulnerability(vulnerability_id, org.id, db)
