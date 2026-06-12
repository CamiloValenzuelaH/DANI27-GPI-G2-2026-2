from __future__ import annotations

from datetime import datetime, timezone
import uuid

from sqlalchemy import CheckConstraint, ForeignKey, Integer, String, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin, UUIDMixin


EVIDENCE_TAXONOMY_TYPES = ("POLICY", "PROCEDURE", "INSTRUCTION", "CONTROL", "RECORD")
EVIDENCE_TAXONOMY_ORDER = {value: index for index, value in enumerate(EVIDENCE_TAXONOMY_TYPES)}

# Default validity mapping used in upload flows; some types may have no fixed validity (None)
DEFAULT_VALIDITY_DAYS = {
    "POLICY": 365,
    "PROCEDURE": 365,
    "INSTRUCTION": 180,
    "CONTROL": None,
    "RECORD": 90,
}

DEFAULT_TAXONOMY_SEEDS = [
    {
        "type": "POLICY",
        "name": "Política de Seguridad",
        "control_id": "ISO 27001 A.5.1",
        "clause_ref": "A.5.1",
        "validity_days": DEFAULT_VALIDITY_DAYS["POLICY"],
    },
    {
        "type": "PROCEDURE",
        "name": "Procedimiento de Seguridad",
        "control_id": "ISO 27001 A.5.37",
        "clause_ref": "A.5.37",
        "validity_days": DEFAULT_VALIDITY_DAYS["PROCEDURE"],
    },
    {
        "type": "INSTRUCTION",
        "name": "Instrucción Operativa",
        "control_id": "ISO 27001 A.8.32",
        "clause_ref": "A.8.32",
        "validity_days": DEFAULT_VALIDITY_DAYS["INSTRUCTION"],
    },
    {
        "type": "CONTROL",
        "name": "Control Anexo A",
        "control_id": "ISO 27001 A.8.15",
        "clause_ref": "A.8.15",
        "validity_days": DEFAULT_VALIDITY_DAYS["CONTROL"],
    },
    {
        "type": "RECORD",
        "name": "Registro de Ejecución",
        "control_id": "ISO 27001 A.8.33",
        "clause_ref": "A.8.33",
        "validity_days": DEFAULT_VALIDITY_DAYS["RECORD"],
    },
]


def compute_freshness_status(created_at: datetime, validity_days: int | None, now: datetime | None = None) -> str:
    # If there's no fixed validity, consider it always fresh
    if validity_days is None:
        return "fresh"

    reference = now or datetime.now(timezone.utc)
    age_days = max((reference - created_at).days, 0)

    if age_days >= validity_days:
        return "expired"

    expiring_threshold = max(1, int(validity_days * 0.8))
    if age_days >= expiring_threshold:
        return "expiring"

    return "fresh"


class EvidenceTaxonomy(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "evidence_taxonomy"
    __table_args__ = (
        CheckConstraint(
            "type IN ('POLICY', 'PROCEDURE', 'INSTRUCTION', 'CONTROL', 'RECORD')",
            name="ck_evidence_taxonomy_type",
        ),
        CheckConstraint(
            r"control_id ~ '^ISO 27001 A\.[5-8](\.[0-9]+){1,2}$'",
            name="ck_evidence_taxonomy_control_id_format",
        ),
        CheckConstraint(
            r"clause_ref ~ '^(([4-9]|10)(\.[0-9]+){0,2}|A\.[5-8](\.[0-9]+){0,2})$'",
            name="ck_evidence_taxonomy_clause_ref_format",
        ),
        CheckConstraint("(validity_days IS NULL) OR (validity_days > 0)", name="ck_evidence_taxonomy_validity_days_positive"),
        Index("ix_evidence_taxonomy_org_type", "organization_id", "type"),
    )

    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    type: Mapped[str] = mapped_column(String(20), nullable=False)
    control_id: Mapped[str] = mapped_column(String(64), nullable=False)
    clause_ref: Mapped[str] = mapped_column(String(32), nullable=False)
    # Allow NULL for types that have no fixed validity (e.g. CONTROL)
    validity_days: Mapped[int | None] = mapped_column(Integer, nullable=True)

    @property
    def freshness_status(self) -> str:
        return compute_freshness_status(self.created_at, self.validity_days)
