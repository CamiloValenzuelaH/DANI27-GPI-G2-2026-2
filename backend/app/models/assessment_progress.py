<<<<<<< HEAD
import uuid

from sqlalchemy import ForeignKey, JSON, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin, UUIDMixin


class AssessmentProgress(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "assessment_progresses"
    __table_args__ = (
        UniqueConstraint("organization_id", name="uq_assessment_progresses_organization"),
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
    progress_data: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
=======
import uuid

from sqlalchemy import ForeignKey, JSON, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin, UUIDMixin


class AssessmentProgress(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "assessment_progresses"
    __table_args__ = (
        UniqueConstraint("organization_id", name="uq_assessment_progresses_organization"),
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
    progress_data: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
>>>>>>> Chat-bot
