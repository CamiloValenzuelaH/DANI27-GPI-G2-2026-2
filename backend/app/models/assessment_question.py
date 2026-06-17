<<<<<<< HEAD
import uuid

from sqlalchemy import Boolean, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDMixin


class AssessmentQuestion(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "assessment_questions"
    __table_args__ = (
        UniqueConstraint("code", name="uq_assessment_questions_code"),
    )

    phase_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("assessment_phases.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    code: Mapped[str] = mapped_column(String(50), nullable=False)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    clause_ref: Mapped[str] = mapped_column(String(50), nullable=False)
    is_critical: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    evidence_hint: Mapped[str] = mapped_column(Text, nullable=False, default="")
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    phase = relationship(
        "AssessmentPhase",
        back_populates="questions",
        lazy="select",
=======
import uuid

from sqlalchemy import Boolean, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDMixin


class AssessmentQuestion(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "assessment_questions"
    __table_args__ = (
        UniqueConstraint("code", name="uq_assessment_questions_code"),
    )

    phase_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("assessment_phases.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    code: Mapped[str] = mapped_column(String(50), nullable=False)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    clause_ref: Mapped[str] = mapped_column(String(50), nullable=False)
    is_critical: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    evidence_hint: Mapped[str] = mapped_column(Text, nullable=False, default="")
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    phase = relationship(
        "AssessmentPhase",
        back_populates="questions",
        lazy="select",
>>>>>>> Chat-bot
    )