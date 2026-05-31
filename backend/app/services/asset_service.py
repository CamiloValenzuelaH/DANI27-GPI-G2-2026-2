from uuid import UUID
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.asset import Asset
from app.schemas.asset import CreateAssetRequest, UpdateAssetRequest, AssetSummaryResponse, AssetResponse


def _calc_criticality(c: int, i: int, a: int) -> tuple[float, str]:
    score = round((c * 0.4 + i * 0.35 + a * 0.25), 2)
    if score >= 2.5:
        level = "critical"
    elif score >= 2.0:
        level = "high"
    elif score >= 1.5:
        level = "medium"
    else:
        level = "low"
    return score, level


def _get_asset_or_404(asset_id: UUID, org_id: UUID, db: Session) -> Asset:
    asset = db.query(Asset).filter(
        Asset.id == asset_id,
        Asset.organization_id == org_id,
    ).first()
    if not asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Activo no encontrado",
        )
    return asset


def list_assets(org_id: UUID, db: Session) -> list[Asset]:
    return db.query(Asset).filter(Asset.organization_id == org_id).all()


def get_asset(asset_id: UUID, org_id: UUID, db: Session) -> Asset:
    return _get_asset_or_404(asset_id, org_id, db)


def create_asset(data: CreateAssetRequest, org_id: UUID, db: Session) -> Asset:
    score, level = _calc_criticality(
        data.confidentiality, data.integrity, data.availability
    )
    asset = Asset(
        organization_id=org_id,
        name=data.name,
        description=data.description,
        asset_type=data.asset_type,
        owner_id=data.owner_id,
        location=data.location,
        status="active",
        confidentiality=data.confidentiality,
        integrity=data.integrity,
        availability=data.availability,
        criticality_score=score,
        criticality_level=level,
        clause_ref=data.clause_ref,
    )
    db.add(asset)
    db.commit()
    db.refresh(asset)
    return asset


def update_asset(asset_id: UUID, data: UpdateAssetRequest, org_id: UUID, db: Session) -> Asset:
    asset = _get_asset_or_404(asset_id, org_id, db)

    if data.name is not None:
        asset.name = data.name
    if data.description is not None:
        asset.description = data.description
    if data.asset_type is not None:
        asset.asset_type = data.asset_type
    if data.owner_id is not None:
        asset.owner_id = data.owner_id
    if data.location is not None:
        asset.location = data.location
    if data.status is not None:
        asset.status = data.status
    if data.clause_ref is not None:
        asset.clause_ref = data.clause_ref

    # Recalcular C-I-A si alguno cambió
    c = data.confidentiality if data.confidentiality is not None else asset.confidentiality
    i = data.integrity if data.integrity is not None else asset.integrity
    a = data.availability if data.availability is not None else asset.availability

    asset.confidentiality = c
    asset.integrity = i
    asset.availability = a
    asset.criticality_score, asset.criticality_level = _calc_criticality(c, i, a)

    db.commit()
    db.refresh(asset)
    return asset


def delete_asset(asset_id: UUID, org_id: UUID, db: Session) -> None:
    asset = _get_asset_or_404(asset_id, org_id, db)
    db.delete(asset)
    db.commit()


def get_summary(org_id: UUID, db: Session) -> AssetSummaryResponse:
    assets = list_assets(org_id, db)

    by_type: dict[str, int] = {}
    by_level: dict[str, int] = {"low": 0, "medium": 0, "high": 0, "critical": 0}

    for a in assets:
        by_type[a.asset_type] = by_type.get(a.asset_type, 0) + 1
        by_level[a.criticality_level] = by_level.get(a.criticality_level, 0) + 1

    critical = [AssetResponse.model_validate(a) for a in assets if a.criticality_level == "critical"]

    return AssetSummaryResponse(
        total=len(assets),
        by_type=by_type,
        by_level=by_level,
        critical_assets=critical,
    )