from __future__ import annotations

from uuid import uuid4
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session, selectinload

from app.models.asset import Asset
from app.models.evidence_taxonomy import EvidenceTaxonomy
from app.models.risk import Risk, RiskEvaluation, risk_assets
from app.models.threat import Threat, risk_threats
from app.schemas.risk import (
    CreateRiskRequest,
    LinkRiskAssetsRequest,
    RiskLinkedAssetResponse,
    RiskMatrixResponse,
    RiskMatrixRiskResponse,
    UpdateRiskRequest,
)


def _classify(score: int) -> tuple[str, str]:
    if score <= 4:
        return "bajo", "verde"
    if score <= 9:
        return "medio", "amarillo"
    if score <= 16:
        return "alto", "naranja"
    return "critico", "rojo"


def _validate_asset(asset_id: UUID, org_id: UUID, db: Session) -> Asset:
    asset = db.query(Asset).filter(Asset.id == asset_id, Asset.organization_id == org_id).first()
    if not asset:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Activo no encontrado")
    return asset


def _get_risk_or_404(risk_id: UUID, org_id: UUID, db: Session) -> Risk:
    risk = (
        db.query(Risk)
        .options(selectinload(Risk.evaluations), selectinload(Risk.linked_assets), selectinload(Risk.linked_threats))
        .filter(Risk.id == risk_id, Risk.organization_id == org_id)
        .first()
    )
    if not risk:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Riesgo no encontrado")
    return risk


def _get_threat_or_404(threat_id: UUID, org_id: UUID, db: Session) -> Threat:
    threat = db.query(Threat).filter(Threat.id == threat_id, Threat.organization_id == org_id).first()
    if not threat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Amenaza no encontrada")
    return threat


def _compute_residual(
    probability: int,
    impact: int,
    treatment_probability: int | None,
    treatment_impact: int | None,
) -> tuple[int, str, str]:
    residual_probability = treatment_probability if treatment_probability is not None else probability
    residual_impact = treatment_impact if treatment_impact is not None else impact
    residual = residual_probability * residual_impact
    level, color = _classify(residual)
    return residual, level, color


def _append_evaluation(db: Session, risk: Risk, operation: str, notes: str | None = None) -> None:
    evaluation = RiskEvaluation(
        risk_id=risk.id,
        organization_id=risk.organization_id,
        operation=operation,
        probability=risk.probability,
        impact=risk.impact,
        inherent_risk=risk.inherent_risk,
        inherent_risk_level=risk.inherent_risk_level,
        inherent_risk_color=risk.inherent_risk_color,
        treatment_probability=risk.treatment_probability,
        treatment_impact=risk.treatment_impact,
        residual_risk=risk.residual_risk,
        residual_risk_level=risk.residual_risk_level,
        residual_risk_color=risk.residual_risk_color,
        notes=notes,
    )
    db.add(evaluation)


def _get_assets_or_404(asset_ids: list[UUID], org_id: UUID, db: Session) -> list[Asset]:
    unique_ids = list(dict.fromkeys(asset_ids))
    if not unique_ids:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Se requiere al menos un activo")

    assets = (
        db.query(Asset)
        .filter(Asset.organization_id == org_id, Asset.id.in_(unique_ids))
        .all()
    )
    if len(assets) != len(unique_ids):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Uno o más activos no encontrados")
    return assets


def _asset_response(asset: Asset) -> RiskLinkedAssetResponse:
    return RiskLinkedAssetResponse(
        id=asset.id,
        name=asset.name,
        asset_type=asset.asset_type,
        clause_ref=asset.clause_ref,
    )


def _soa_controls_for_assets(assets: list[Asset], org_id: UUID, db: Session) -> list[str]:
    clause_refs = {asset.clause_ref for asset in assets if asset.clause_ref}
    if not clause_refs:
        return []

    rows = (
        db.query(EvidenceTaxonomy.control_id)
        .filter(
            EvidenceTaxonomy.organization_id == org_id,
            EvidenceTaxonomy.clause_ref.in_(clause_refs),
        )
        .order_by(EvidenceTaxonomy.control_id.asc())
        .all()
    )
    controls = []
    seen = set()
    for (control_id,) in rows:
        if control_id not in seen:
            controls.append(control_id)
            seen.add(control_id)
    return controls


def _risk_matrix_item(risk: Risk, org_id: UUID, db: Session) -> RiskMatrixRiskResponse:
    assets = [_asset_response(asset) for asset in risk.linked_assets]
    controls_soa = _soa_controls_for_assets(risk.linked_assets, org_id, db)
    return RiskMatrixRiskResponse(
        id=risk.id,
        name=risk.name,
        probability=risk.probability,
        impact=risk.impact,
        inherent_risk=risk.inherent_risk,
        residual_risk=risk.residual_risk,
        assets=assets,
        controls_soa=controls_soa,
    )


def list_risks(org_id: UUID, db: Session) -> list[Risk]:
    return (
        db.query(Risk)
        .options(selectinload(Risk.evaluations), selectinload(Risk.linked_assets))
        .filter(Risk.organization_id == org_id)
        .order_by(Risk.updated_at.desc())
        .all()
    )


def create_risk(data: CreateRiskRequest, org_id: UUID, db: Session) -> Risk:
    asset = _validate_asset(data.asset_id, org_id, db)
    inherent_risk = data.probability * data.impact
    inherent_level, inherent_color = _classify(inherent_risk)
    residual_risk, residual_level, residual_color = _compute_residual(
        data.probability,
        data.impact,
        data.treatment_probability,
        data.treatment_impact,
    )

    risk = Risk(
        organization_id=org_id,
        asset_id=data.asset_id,
        name=data.name,
        description=data.description,
        probability=data.probability,
        impact=data.impact,
        inherent_risk=inherent_risk,
        inherent_risk_level=inherent_level,
        inherent_risk_color=inherent_color,
        treatment_probability=data.treatment_probability,
        treatment_impact=data.treatment_impact,
        residual_risk=residual_risk,
        residual_risk_level=residual_level,
        residual_risk_color=residual_color,
    )
    db.add(risk)
    db.flush()
    db.execute(
        risk_assets.insert().values(
            organization_id=org_id,
            risk_id=risk.id,
            asset_id=asset.id,
        )
    )
    _append_evaluation(db, risk, "created")
    db.commit()
    db.refresh(risk)
    return _get_risk_or_404(risk.id, org_id, db)


def update_risk(risk_id: UUID, data: UpdateRiskRequest, org_id: UUID, db: Session) -> Risk:
    risk = _get_risk_or_404(risk_id, org_id, db)

    if data.asset_id is not None:
        asset = _validate_asset(data.asset_id, org_id, db)
        risk.asset_id = data.asset_id
        if all(existing.id != asset.id for existing in risk.linked_assets):
            db.execute(
                risk_assets.insert().values(
                    organization_id=org_id,
                    risk_id=risk.id,
                    asset_id=asset.id,
                )
            )
    if data.name is not None:
        risk.name = data.name
    if data.description is not None:
        risk.description = data.description
    if data.probability is not None:
        risk.probability = data.probability
    if data.impact is not None:
        risk.impact = data.impact
    if data.treatment_probability is not None:
        risk.treatment_probability = data.treatment_probability
    if data.treatment_impact is not None:
        risk.treatment_impact = data.treatment_impact

    risk.inherent_risk = risk.probability * risk.impact
    risk.inherent_risk_level, risk.inherent_risk_color = _classify(risk.inherent_risk)
    risk.residual_risk, risk.residual_risk_level, risk.residual_risk_color = _compute_residual(
        risk.probability,
        risk.impact,
        risk.treatment_probability,
        risk.treatment_impact,
    )

    db.flush()
    _append_evaluation(db, risk, "updated")
    db.commit()
    db.refresh(risk)
    return _get_risk_or_404(risk.id, org_id, db)


def delete_risk(risk_id: UUID, org_id: UUID, db: Session) -> None:
    risk = _get_risk_or_404(risk_id, org_id, db)
    db.delete(risk)
    db.commit()


def link_assets_to_risk(risk_id: UUID, data: LinkRiskAssetsRequest, org_id: UUID, db: Session) -> RiskMatrixRiskResponse:
    risk = _get_risk_or_404(risk_id, org_id, db)
    assets = _get_assets_or_404(data.asset_ids, org_id, db)

    existing_ids = {asset.id for asset in risk.linked_assets}
    for asset in assets:
        if asset.id not in existing_ids:
            db.execute(
                risk_assets.insert().values(
                    organization_id=org_id,
                    risk_id=risk.id,
                    asset_id=asset.id,
                )
            )
            existing_ids.add(asset.id)

    if risk.asset_id not in existing_ids and assets:
        risk.asset_id = assets[0].id

    db.commit()
    db.refresh(risk)
    return _risk_matrix_item(_get_risk_or_404(risk.id, org_id, db), org_id, db)


def link_threat_to_risk(risk_id: UUID, threat_id: UUID, org_id: UUID, db: Session) -> Threat:
    risk = _get_risk_or_404(risk_id, org_id, db)
    threat = _get_threat_or_404(threat_id, org_id, db)

    if all(existing.id != threat.id for existing in risk.linked_threats):
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


def get_risk_matrix(org_id: UUID, db: Session) -> RiskMatrixResponse:
    risks = (
        db.query(Risk)
        .options(selectinload(Risk.linked_assets))
        .filter(Risk.organization_id == org_id)
        .order_by(Risk.name.asc())
        .all()
    )

    matrix: dict[str, list[RiskMatrixRiskResponse]] = {
        f"{probability}_{impact}": []
        for probability in range(1, 6)
        for impact in range(1, 6)
    }

    for risk in risks:
        key = f"{risk.probability}_{risk.impact}"
        matrix[key].append(_risk_matrix_item(risk, org_id, db))

    return RiskMatrixResponse(matrix=matrix)
