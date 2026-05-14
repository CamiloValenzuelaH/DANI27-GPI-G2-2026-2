from pydantic import BaseModel, field_validator
from uuid import UUID
from datetime import datetime


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


class CreateAssetRequest(BaseModel):
    name: str
    description: str | None = None
    asset_type: str
    owner_id: UUID | None = None
    location: str | None = None
    confidentiality: int = 1
    integrity: int = 1
    availability: int = 1
    clause_ref: str | None = None

    @field_validator("confidentiality", "integrity", "availability")
    @classmethod
    def validate_cia(cls, v: int) -> int:
        if not 1 <= v <= 3:
            raise ValueError("El valor C-I-A debe estar entre 1 y 3")
        return v

    @field_validator("asset_type")
    @classmethod
    def validate_type(cls, v: str) -> str:
        valid = {"hardware", "software", "data", "service", "people", "facility"}
        if v not in valid:
            raise ValueError(f"Tipo inválido. Opciones: {', '.join(valid)}")
        return v


class UpdateAssetRequest(BaseModel):
    name: str | None = None
    description: str | None = None
    asset_type: str | None = None
    owner_id: UUID | None = None
    location: str | None = None
    status: str | None = None
    confidentiality: int | None = None
    integrity: int | None = None
    availability: int | None = None
    clause_ref: str | None = None

    @field_validator("confidentiality", "integrity", "availability", mode="before")
    @classmethod
    def validate_cia(cls, v: int | None) -> int | None:
        if v is not None and not 1 <= v <= 3:
            raise ValueError("El valor C-I-A debe estar entre 1 y 3")
        return v


class AssetResponse(BaseModel):
    id: UUID
    name: str
    description: str | None
    asset_type: str
    owner_id: UUID | None
    location: str | None
    status: str
    confidentiality: int
    integrity: int
    availability: int
    criticality_score: float
    criticality_level: str
    clause_ref: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class AssetSummaryResponse(BaseModel):
    total: int
    by_type: dict[str, int]
    by_level: dict[str, int]
    critical_assets: list[AssetResponse]