from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum
from typing import TYPE_CHECKING
import uuid

from sqlalchemy import String, Text, DateTime, Enum as SAEnum, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.user import User


class PolicyStatus(str, Enum):
    draft = "draft"
    published = "published"
    archived = "archived"


class Policy(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "policies"
    __table_args__ = (
        Index("ix_policies_org_status", "organization_id", "status"),
    )

    organization_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(SAEnum(PolicyStatus, native_enum=False), nullable=False, default=PolicyStatus.draft)
    document_version: Mapped[str] = mapped_column(String(50), nullable=False, default="1.0")
    mandatory: Mapped[bool] = mapped_column(default=True, nullable=False)
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    acknowledgments: Mapped[list["PolicyAcknowledgment"]] = relationship(
        back_populates="policy",
        cascade="all, delete-orphan",
        lazy="select",
    )

    def __repr__(self) -> str:
        return f"<Policy {self.title}>"


class PolicyAcknowledgment(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "policy_acknowledgments"
    __table_args__ = (
        Index("ix_policy_ack_user_version", "user_id", "policy_id", "document_version"),
    )

    user_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    policy_id: Mapped[str] = mapped_column(String(36), ForeignKey("policies.id"), nullable=False, index=True)
    acknowledged_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    ip_address: Mapped[str | None] = mapped_column(String(64), nullable=True)
    document_version: Mapped[str] = mapped_column(String(50), nullable=False)
    content_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    organization_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)

    policy: Mapped["Policy"] = relationship(back_populates="acknowledgments", lazy="select")

    def __repr__(self) -> str:
        return f"<PolicyAcknowledgment user_id={self.user_id} policy_id={self.policy_id}>"
