from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import Column, ForeignKey, Index, String, Table, Text
from sqlalchemy.dialects.postgresql import ARRAY, UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.organization import Organization


class ISOThreatCatalog(Base, UUIDMixin, TimestampMixin):
    """Catálogo de amenazas estandarizado basado en ISO 27005.
    
    Esta es una tabla de referencia global (no vinculada a organización).
    Contiene amenazas predefinidas que pueden ser reutilizadas en múltiples riesgos.
    """
    __tablename__ = "iso_threat_catalog"
    __table_args__ = (
        Index("ix_iso_threat_catalog_code", "code"),
        Index("ix_iso_threat_catalog_category", "category"),
    )

    code: Mapped[str] = mapped_column(String(20), nullable=False, unique=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    category: Mapped[str] = mapped_column(
        String(50), 
        nullable=False,
        comment="HUMAN, TECHNICAL, ENVIRONMENTAL, ORGANIZATIONAL"
    )
    description: Mapped[str] = mapped_column(Text, nullable=False)
    affected_controls: Mapped[list[str]] = mapped_column(
        ARRAY(String(20)),
        nullable=False,
        default=list,
        comment="Array de clause_ref del Anexo A relacionados (ej: ['A.5.1', 'A.8.32'])"
    )

    def __repr__(self) -> str:
        return f"<ISOThreatCatalog {self.code}: {self.name} category={self.category}>"
