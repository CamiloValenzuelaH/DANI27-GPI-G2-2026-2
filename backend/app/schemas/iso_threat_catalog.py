from __future__ import annotations

from uuid import UUID
from datetime import datetime
from pydantic import BaseModel


class ISOThreatCatalogResponse(BaseModel):
    id: UUID
    code: str
    name: str
    category: str
    description: str
    affected_controls: list[str]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ISOThreatCatalogByCategory(BaseModel):
    """Catálogo agrupado por categoría"""
    category: str
    threats: list[ISOThreatCatalogResponse]
