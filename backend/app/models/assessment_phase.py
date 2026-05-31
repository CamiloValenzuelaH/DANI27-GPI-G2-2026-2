from sqlalchemy import Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDMixin


class AssessmentPhase(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "assessment_phases"
    __table_args__ = (
        UniqueConstraint("code", name="uq_assessment_phases_code"),
    )

    code: Mapped[str] = mapped_column(String(50), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    questions = relationship(
        "AssessmentQuestion",
        back_populates="phase",
        cascade="all, delete-orphan",
        lazy="select",
    )