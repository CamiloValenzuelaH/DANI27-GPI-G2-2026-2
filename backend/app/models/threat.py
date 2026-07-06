import uuid
from sqlalchemy import Column, ForeignKey, Index, Integer, String, Table, Text
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDMixin

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.organization import Organization
    from app.models.risk import Risk


risk_threats = Table(
    "risk_threats",
    Base.metadata,
    Column("id", PGUUID(as_uuid=True), primary_key=True),
    Column("organization_id", PGUUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), primary_key=True),
    Column("risk_id", PGUUID(as_uuid=True), ForeignKey("risks.id", ondelete="CASCADE"), primary_key=True),
    Column("threat_id", PGUUID(as_uuid=True), ForeignKey("threats.id", ondelete="CASCADE"), primary_key=True),
    Index("ix_risk_threats_org_risk", "organization_id", "risk_id"),
    Index("ix_risk_threats_org_threat", "organization_id", "threat_id"),
)


class Threat(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "threats"
    __table_args__ = (
        Index("ix_threats_org_created_at", "organization_id", "created_at"),
    )

    organization_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    category: Mapped[str] = mapped_column(String(50), nullable=False)
    likelihood: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    impact: Mapped[int] = mapped_column(Integer, nullable=False)

    organization: Mapped["Organization"] = relationship(lazy="select")
    linked_risks: Mapped[list["Risk"]] = relationship(
        "Risk",
        secondary=risk_threats,
        lazy="selectin",
        back_populates="linked_threats",
    )

    def __repr__(self) -> str:
        return f"<Threat {self.name} category={self.category} likelihood={self.likelihood}>"
