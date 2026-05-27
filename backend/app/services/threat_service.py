from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.threat import Threat
from app.models.risk import Risk
from app.schemas.threat import CreateThreatRequest, UpdateThreatRequest


def _get_threat_or_404(threat_id: UUID, org_id: UUID, db: Session) -> Threat:
    threat = db.query(Threat).filter(Threat.id == threat_id, Threat.organization_id == org_id).first()
    if not threat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Amenaza no encontrada")
    return threat


def _get_risk_or_404(risk_id: UUID, org_id: UUID, db: Session) -> Risk:
    risk = db.query(Risk).filter(Risk.id == risk_id, Risk.organization_id == org_id).first()
    if not risk:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Riesgo no encontrado")
    return risk


def list_threats(org_id: UUID, db: Session) -> list[Threat]:
    return db.query(Threat).filter(Threat.organization_id == org_id).order_by(Threat.name.asc()).all()


def get_threat(threat_id: UUID, org_id: UUID, db: Session) -> Threat:
    return _get_threat_or_404(threat_id, org_id, db)


def create_threat(data: CreateThreatRequest, org_id: UUID, db: Session) -> Threat:
    threat = Threat(
        organization_id=org_id,
        name=data.name,
        description=data.description,
        category=data.category,
        likelihood=data.likelihood,
    )
    db.add(threat)
    db.commit()
    db.refresh(threat)
    return threat


def update_threat(threat_id: UUID, data: UpdateThreatRequest, org_id: UUID, db: Session) -> Threat:
    threat = _get_threat_or_404(threat_id, org_id, db)

    if data.name is not None:
        threat.name = data.name
    if data.description is not None:
        threat.description = data.description
    if data.category is not None:
        threat.category = data.category
    if data.likelihood is not None:
        threat.likelihood = data.likelihood

    db.commit()
    db.refresh(threat)
    return threat


def delete_threat(threat_id: UUID, org_id: UUID, db: Session) -> None:
    threat = _get_threat_or_404(threat_id, org_id, db)
    db.delete(threat)
    db.commit()


def link_threat_to_risk(risk_id: UUID, threat_id: UUID, org_id: UUID, db: Session) -> Threat:
    risk = _get_risk_or_404(risk_id, org_id, db)
    threat = _get_threat_or_404(threat_id, org_id, db)

    if all(existing.id != threat.id for existing in risk.linked_threats):
        risk.linked_threats.append(threat)
        db.commit()
    db.refresh(threat)
    return threat
