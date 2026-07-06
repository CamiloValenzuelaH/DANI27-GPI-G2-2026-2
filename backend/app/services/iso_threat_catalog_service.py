from uuid import UUID
from uuid import uuid4

from fastapi import HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.iso_threat_catalog import ISOThreatCatalog
from app.models.risk import Risk
from app.models.threat import Threat, risk_threats
from app.schemas.iso_threat_catalog import ISOThreatCatalogResponse, ISOThreatCatalogByCategory


def get_iso_threat_catalog_all(db: Session) -> list[ISOThreatCatalogResponse]:
    """Obtener todas las amenazas del catálogo ISO 27005"""
    threats = db.query(ISOThreatCatalog).order_by(ISOThreatCatalog.code.asc()).all()
    return [ISOThreatCatalogResponse.model_validate(t) for t in threats]


def get_iso_threat_catalog_by_category(db: Session) -> list[ISOThreatCatalogByCategory]:
    """Obtener el catálogo de amenazas ISO agrupado por categoría"""
    # Obtener todas las categorías únicas
    categories = db.query(
        func.distinct(ISOThreatCatalog.category)
    ).order_by(ISOThreatCatalog.category.asc()).all()
    
    result = []
    for (category,) in categories:
        threats = db.query(ISOThreatCatalog).filter(
            ISOThreatCatalog.category == category
        ).order_by(ISOThreatCatalog.code.asc()).all()
        
        threat_responses = [ISOThreatCatalogResponse.model_validate(t) for t in threats]
        result.append(ISOThreatCatalogByCategory(
            category=category,
            threats=threat_responses
        ))
    
    return result


def get_iso_threat_catalog_by_code(code: str, db: Session) -> ISOThreatCatalog:
    """Obtener una amenaza del catálogo por código"""
    threat = db.query(ISOThreatCatalog).filter(ISOThreatCatalog.code == code).first()
    if not threat:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail=f"Amenaza del catálogo con código '{code}' no encontrada"
        )
    return threat


def add_iso_threat_to_risk(
    risk_id: UUID,
    catalog_threat_code: str,
    org_id: UUID,
    db: Session,
) -> Threat:
    """
    Agregar una amenaza del catálogo ISO a un riesgo.
    
    Esto crea una copia de la amenaza del catálogo como una amenaza organizacional
    y la vincula al riesgo.
    """
    # Verificar que el riesgo existe y pertenece a la organización
    risk = db.query(Risk).filter(
        Risk.id == risk_id,
        Risk.organization_id == org_id
    ).first()
    if not risk:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Riesgo no encontrado"
        )
    
    # Obtener la amenaza del catálogo
    catalog_threat = get_iso_threat_catalog_by_code(catalog_threat_code, db)
    
    # Verificar si ya existe una amenaza con el mismo nombre en la organización
    existing_threat = db.query(Threat).filter(
        Threat.organization_id == org_id,
        Threat.name == catalog_threat.name
    ).first()
    
    if existing_threat:
        # Si existe, usarla
        threat = existing_threat
    else:
        # Si no existe, crearla como una copia de la amenaza del catálogo
        threat = Threat(
            organization_id=org_id,
            name=catalog_threat.name,
            description=catalog_threat.description,
            category=catalog_threat.category,
            likelihood=3,  # Valor por defecto medio
        )
        db.add(threat)
        db.flush()  # Para obtener el ID generado
    
    # Vincular la amenaza al riesgo si no está ya vinculada
    if threat not in risk.linked_threats:
        db.execute(
            risk_threats.insert().values(
                id=uuid4(),
                organization_id=org_id,
                risk_id=risk.id,
                threat_id=threat.id,
            )
        )
        db.commit()
    
    db.refresh(threat)
    return threat
