from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import CheckConstraint, ForeignKey, Integer, String, Index
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin, UUIDMixin


EVIDENCE_TAXONOMY_TYPES = ("POLICY", "PROCEDURE", "INSTRUCTION", "CONTROL", "RECORD")
EVIDENCE_TAXONOMY_ORDER = {value: index for index, value in enumerate(EVIDENCE_TAXONOMY_TYPES)}

DEFAULT_VALIDITY_DAYS = {
    "POLICY": 365,
    "PROCEDURE": 180,
    "INSTRUCTION": 90,
    "CONTROL": 365,
    "RECORD": 30,
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


def compute_freshness_status(created_at: datetime, validity_days: int, now: datetime | None = None) -> str:
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
        CheckConstraint("validity_days > 0", name="ck_evidence_taxonomy_validity_days_positive"),
        Index("ix_evidence_taxonomy_org_type", "organization_id", "type"),
    )

    organization_id: Mapped[str] = mapped_column(
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    type: Mapped[str] = mapped_column(String(20), nullable=False)
    control_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    clause_ref: Mapped[str | None] = mapped_column(String(32), nullable=True)
    validity_days: Mapped[int] = mapped_column(Integer, nullable=False)

    @property
    def freshness_status(self) -> str:
        return compute_freshness_status(self.created_at, self.validity_days)
