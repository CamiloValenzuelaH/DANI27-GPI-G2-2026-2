from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


def _validate_score(value: int) -> int:
    if not 1 <= value <= 5:
        raise ValueError("El valor debe estar entre 1 y 5")
    return value


def _classify_risk(score: int) -> tuple[str, str]:
    if score <= 4:
        return "bajo", "verde"
    if score <= 9:
        return "medio", "amarillo"
    if score <= 16:
        return "alto", "naranja"
    return "critico", "rojo"


class CreateRiskRequest(BaseModel):
    name: str
    description: str | None = None
    asset_id: UUID
    probability: int
    impact: int
    treatment_probability: int | None = None
    treatment_impact: int | None = None

    @field_validator("probability", "impact", "treatment_probability", "treatment_impact", mode="before")
    @classmethod
    def validate_risk_scores(cls, value: int | None) -> int | None:
        if value is None:
            return value
        return _validate_score(int(value))


class UpdateRiskRequest(BaseModel):
    name: str | None = None
    description: str | None = None
    asset_id: UUID | None = None
    probability: int | None = None
    impact: int | None = None
    treatment_probability: int | None = None
    treatment_impact: int | None = None

    @field_validator("probability", "impact", "treatment_probability", "treatment_impact", mode="before")
    @classmethod
    def validate_risk_scores(cls, value: int | None) -> int | None:
        if value is None:
            return value
        return _validate_score(int(value))


class RiskEvaluationResponse(BaseModel):
    id: UUID
    operation: str
    probability: int
    impact: int
    inherent_risk: int
    inherent_risk_level: str
    inherent_risk_color: str
    treatment_probability: int | None
    treatment_impact: int | None
    residual_risk: int
    residual_risk_level: str
    residual_risk_color: str
    notes: str | None
    evaluated_at: datetime

    model_config = {"from_attributes": True}


class RiskResponse(BaseModel):
    id: UUID
    organization_id: UUID
    asset_id: UUID
    name: str
    description: str | None
    probability: int
    impact: int
    inherent_risk: int
    inherent_risk_level: str
    inherent_risk_color: str
    treatment_probability: int | None
    treatment_impact: int | None
    residual_risk: int
    residual_risk_level: str
    residual_risk_color: str
    created_at: datetime
    updated_at: datetime
    evaluations: list[RiskEvaluationResponse] = Field(default_factory=list)

    model_config = {"from_attributes": True}


class RiskLinkedAssetResponse(BaseModel):
    id: UUID
    name: str
    asset_type: str
    clause_ref: str | None

    model_config = {"from_attributes": True}


class LinkRiskAssetsRequest(BaseModel):
    asset_ids: list[UUID] = Field(min_length=1)


class RiskMatrixRiskResponse(BaseModel):
    id: UUID
    name: str
    probability: int
    impact: int
    inherent_risk: int
    residual_risk: int
    assets: list[RiskLinkedAssetResponse] = Field(default_factory=list)
    controls_soa: list[str] = Field(default_factory=list)

    model_config = {"from_attributes": True}


class RiskMatrixResponse(BaseModel):
    matrix: dict[str, list[RiskMatrixRiskResponse]] = Field(default_factory=dict)