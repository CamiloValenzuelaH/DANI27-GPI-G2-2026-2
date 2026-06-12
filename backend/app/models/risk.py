from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING

from sqlalchemy import Column, DateTime, ForeignKey, Index, Integer, String, Table, Text
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.asset import Asset
    from app.models.organization import Organization
    from app.models.threat import Threat


risk_assets = Table(
    "risk_assets",
    Base.metadata,
    Column("organization_id", PGUUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), primary_key=True),
    Column("risk_id", PGUUID(as_uuid=True), ForeignKey("risks.id", ondelete="CASCADE"), primary_key=True),
    Column("asset_id", PGUUID(as_uuid=True), ForeignKey("assets.id", ondelete="CASCADE"), primary_key=True),
    Index("ix_risk_assets_org_risk", "organization_id", "risk_id"),
    Index("ix_risk_assets_org_asset", "organization_id", "asset_id"),
)


class Risk(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "risks"
    __table_args__ = (
        Index("ix_risks_org_created_at", "organization_id", "created_at"),
        Index("ix_risks_org_inherent_level", "organization_id", "inherent_risk_level"),
        Index("ix_risks_org_residual_level", "organization_id", "residual_risk_level"),
    )

    organization_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    asset_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("assets.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    probability: Mapped[int] = mapped_column(Integer, nullable=False)
    impact: Mapped[int] = mapped_column(Integer, nullable=False)
    inherent_risk: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    inherent_risk_level: Mapped[str] = mapped_column(String(20), nullable=False, default="bajo")
    inherent_risk_color: Mapped[str] = mapped_column(String(20), nullable=False, default="verde")
    treatment_probability: Mapped[int | None] = mapped_column(Integer, nullable=True)
    treatment_impact: Mapped[int | None] = mapped_column(Integer, nullable=True)
    residual_risk: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    residual_risk_level: Mapped[str] = mapped_column(String(20), nullable=False, default="bajo")
    residual_risk_color: Mapped[str] = mapped_column(String(20), nullable=False, default="verde")

    organization: Mapped["Organization"] = relationship(lazy="select")
    asset: Mapped["Asset"] = relationship(lazy="select")
    linked_assets: Mapped[list["Asset"]] = relationship(
        "Asset",
        secondary=risk_assets,
        lazy="selectin",
        back_populates="linked_risks",
    )
    linked_threats: Mapped[list["Threat"]] = relationship(
        "Threat",
        secondary="risk_threats",
        lazy="selectin",
        back_populates="linked_risks",
    )
    evaluations: Mapped[list["RiskEvaluation"]] = relationship(
        back_populates="risk",
        lazy="selectin",
        passive_deletes=True,
    )

    def __repr__(self) -> str:
        return f"<Risk {self.name} inherent={self.inherent_risk} residual={self.residual_risk}>"


class RiskEvaluation(Base, UUIDMixin):
    __tablename__ = "risk_evaluations"
    __table_args__ = (
        Index("ix_risk_evaluations_risk_id_evaluated_at", "risk_id", "evaluated_at"),
        Index("ix_risk_evaluations_org_evaluated_at", "organization_id", "evaluated_at"),
    )

    risk_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("risks.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    operation: Mapped[str] = mapped_column(String(20), nullable=False)
    probability: Mapped[int] = mapped_column(Integer, nullable=False)
    impact: Mapped[int] = mapped_column(Integer, nullable=False)
    inherent_risk: Mapped[int] = mapped_column(Integer, nullable=False)
    inherent_risk_level: Mapped[str] = mapped_column(String(20), nullable=False)
    inherent_risk_color: Mapped[str] = mapped_column(String(20), nullable=False)
    treatment_probability: Mapped[int | None] = mapped_column(Integer, nullable=True)
    treatment_impact: Mapped[int | None] = mapped_column(Integer, nullable=True)
    residual_risk: Mapped[int] = mapped_column(Integer, nullable=False)
    residual_risk_level: Mapped[str] = mapped_column(String(20), nullable=False)
    residual_risk_color: Mapped[str] = mapped_column(String(20), nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    evaluated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    risk: Mapped[Risk | None] = relationship(back_populates="evaluations", lazy="select")
