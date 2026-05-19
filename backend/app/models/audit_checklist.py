import uuid

from sqlalchemy import ForeignKey, JSON, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin, UUIDMixin


class AuditChecklist(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "audit_checklists"
    __table_args__ = (
        UniqueConstraint("organization_id", name="uq_audit_checklists_organization"),
    )

    organization_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    updated_by_user_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    checklist_data: Mapped[list[dict]] = mapped_column(JSON, nullable=False, default=list)
