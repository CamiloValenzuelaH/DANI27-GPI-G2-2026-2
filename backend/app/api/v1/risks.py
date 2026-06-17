from uuid import UUID

from fastapi import APIRouter, Depends, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_org
from app.db.database import get_db
from app.models.organization import Organization
from app.schemas.risk import (
    CreateRiskRequest,
    LinkRiskAssetsRequest,
    RiskMatrixResponse,
    RiskMatrixRiskResponse,
    RiskResponse,
    UpdateRiskRequest,
)
from app.schemas.threat import LinkRiskThreatRequest, ThreatResponse
from app.services import risk_service, iso_threat_catalog_service

router = APIRouter(prefix="/risks", tags=["risks"])


@router.get("", response_model=list[RiskResponse])
def list_risks(
    db: Session = Depends(get_db),
    org: Organization = Depends(get_current_org),
):
    return risk_service.list_risks(org.id, db)


@router.post("", response_model=RiskResponse, status_code=status.HTTP_201_CREATED)
def create_risk(
    data: CreateRiskRequest,
    db: Session = Depends(get_db),
    org: Organization = Depends(get_current_org),
):
    return risk_service.create_risk(data, org.id, db)


@router.get("/matrix", response_model=RiskMatrixResponse)
def get_matrix(
    db: Session = Depends(get_db),
    org: Organization = Depends(get_current_org),
):
    return risk_service.get_risk_matrix(org.id, db)


@router.post("/{risk_id}/assets", response_model=RiskMatrixRiskResponse)
def link_assets(
    risk_id: UUID,
    data: LinkRiskAssetsRequest,
    db: Session = Depends(get_db),
    org: Organization = Depends(get_current_org),
):
    return risk_service.link_assets_to_risk(risk_id, data, org.id, db)


@router.post("/{risk_id}/threats", response_model=ThreatResponse, status_code=status.HTTP_200_OK)
def link_threat(
    risk_id: UUID,
    data: LinkRiskThreatRequest,
    db: Session = Depends(get_db),
    org: Organization = Depends(get_current_org),
):
    return risk_service.link_threat_to_risk(risk_id, data.threat_id, org.id, db)


class LinkISOThreatRequest(BaseModel):
    """Solicitud para agregar una amenaza del catálogo ISO al riesgo"""
    catalog_threat_code: str


@router.post("/{risk_id}/threats/from-catalog", response_model=ThreatResponse, status_code=status.HTTP_200_OK)
def link_iso_catalog_threat(
    risk_id: UUID,
    data: LinkISOThreatRequest,
    db: Session = Depends(get_db),
    org: Organization = Depends(get_current_org),
):
    """Agregar una amenaza del catálogo ISO 27005 directamente a un riesgo.
    
    Esto crea una copia de la amenaza del catálogo en la organización y la vincula al riesgo.
    """
    return iso_threat_catalog_service.add_iso_threat_to_risk(
        risk_id, data.catalog_threat_code, org.id, db
    )


@router.put("/{risk_id}", response_model=RiskResponse)
def update_risk(
    risk_id: UUID,
    data: UpdateRiskRequest,
    db: Session = Depends(get_db),
    org: Organization = Depends(get_current_org),
):
    return risk_service.update_risk(risk_id, data, org.id, db)


@router.delete("/{risk_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_risk(
    risk_id: UUID,
    db: Session = Depends(get_db),
    org: Organization = Depends(get_current_org),
):
    risk_service.delete_risk(risk_id, org.id, db)
