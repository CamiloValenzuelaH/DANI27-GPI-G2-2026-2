from __future__ import annotations
from datetime import datetime
from enum import Enum
from typing import TYPE_CHECKING

from sqlalchemy import String, Text, DateTime, Enum as SAEnum, ForeignKey, Index, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.organization import Organization


class CycleFrequency(str, Enum):
    monthly = "monthly"
    quarterly = "quarterly"
    annual = "annual"


class AuditSchedule(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "audit_schedule"
    __table_args__ = (
        Index("ix_audit_schedule_organization_id", "organization_id"),
    )

    organization_id: Mapped[str] = mapped_column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    cycle_frequency: Mapped[str] = mapped_column(SAEnum(CycleFrequency, native_enum=False), nullable=False, default=CycleFrequency.monthly)
    next_audit_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    last_audit_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    audit_day_of_month: Mapped[int | None] = mapped_column(Integer, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_by: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.id"), nullable=True, index=True)

    organization: Mapped["Organization"] = relationship("Organization", lazy="select")
    creator: Mapped["User"] = relationship("User", lazy="select")

    def __repr__(self) -> str:
        return f"<AuditSchedule org={self.organization_id} next={self.next_audit_date}>"
