from __future__ import annotations

import uuid
from enum import Enum
from datetime import date
from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint, Date, Enum as SQLEnum, ForeignKey, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.organization import Organization
    from app.models.user import User


class CAPAStatus(str, Enum):
    open = "open"
    inProgress = "inProgress"
    resolved = "resolved"
    closed = "closed"


class CAPAPriority(str, Enum):
    critical = "critical"
    high = "high"
    medium = "medium"
    low = "low"


class CAPASource(str, Enum):
    internal_audit = "internal_audit"
    external_audit = "external_audit"
    incident = "incident"
    management_review = "management_review"


class CAPA(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "capas"
    __table_args__ = (
        Index("ix_capas_org_created_at", "organization_id", "created_at"),
        Index("ix_capas_org_status", "organization_id", "status"),
        Index("ix_capas_org_priority", "organization_id", "priority"),
        Index("ix_capas_org_source", "organization_id", "source"),
        CheckConstraint("progress BETWEEN 0 AND 100", name="ck_capas_progress_range"),
    )

    organization_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[CAPAStatus] = mapped_column(
        SQLEnum(CAPAStatus, name="capa_status"),
        nullable=False,
        default=CAPAStatus.open,
    )
    priority: Mapped[CAPAPriority] = mapped_column(
        SQLEnum(CAPAPriority, name="capa_priority"),
        nullable=False,
    )
    source: Mapped[CAPASource] = mapped_column(
        SQLEnum(CAPASource, name="capa_source"),
        nullable=False,
    )
    due_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    progress: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    assigned_to: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    control_id: Mapped[uuid.UUID | None] = mapped_column(String(36), nullable=True, index=True)

    organization: Mapped["Organization"] = relationship(lazy="select")
    assigned_user: Mapped["User"] = relationship(
        "User",
        lazy="select",
        foreign_keys=[assigned_to],
    )

    def __repr__(self) -> str:
        return f"<CAPA {self.title} status={self.status} priority={self.priority}>"
