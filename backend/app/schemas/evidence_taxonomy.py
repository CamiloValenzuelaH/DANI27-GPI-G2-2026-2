from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


EvidenceTaxonomyType = Literal["POLICY", "PROCEDURE", "INSTRUCTION", "CONTROL", "RECORD"]


class EvidenceTaxonomyItem(BaseModel):
    id: str
    name: str
    type: EvidenceTaxonomyType
    control_id: str | None = None
    clause_ref: str | None = None
    organization_id: str
    validity_days: int = Field(gt=0)
    freshness_status: Literal["fresh", "expiring", "expired"]


class EvidenceTaxonomyGroup(BaseModel):
    type: EvidenceTaxonomyType
    evidences: list[EvidenceTaxonomyItem] = Field(default_factory=list)
