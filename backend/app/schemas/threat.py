from __future__ import annotations

from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, Field, field_validator


def _validate_likelihood(value: int) -> int:
    if not 1 <= value <= 5:
        raise ValueError("El valor debe estar entre 1 y 5")
    return value


class CreateThreatRequest(BaseModel):
    name: str
    description: str | None = None
    category: str
    likelihood: int

    @field_validator("likelihood", mode="before")
    @classmethod
    def validate_likelihood(cls, value: int) -> int:
        return _validate_likelihood(int(value))


class UpdateThreatRequest(BaseModel):
    name: str | None = None
    description: str | None = None
    category: str | None = None
    likelihood: int | None = None

    @field_validator("likelihood", mode="before")
    @classmethod
    def validate_likelihood(cls, value: int | None) -> int | None:
        if value is None:
            return value
        return _validate_likelihood(int(value))


class LinkRiskThreatRequest(BaseModel):
    threat_id: UUID


class ThreatResponse(BaseModel):
    id: UUID
    organization_id: UUID
    name: str
    description: str | None
    category: str
    likelihood: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
