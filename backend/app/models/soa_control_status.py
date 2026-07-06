import uuid
from enum import Enum

from sqlalchemy import Boolean, Enum as SQLEnum, ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDMixin


class ImplementationStatus(str, Enum):
    """Estados de implementación del control en SOA."""
    NO_IMPLEMENTADO = "no_implementado"
    PARCIAL = "parcial"
    IMPLEMENTADO = "implementado"


class SOAControlStatus(Base, UUIDMixin, TimestampMixin):
    """
    Estado operativo de un control del Anexo A para la organización.
    Vinculada por FK a AssessmentQuestion (solo fase 4 / Anexo A).
    
    Un registro por (organization_id, question_id) indica si el control
    es aplicable, su estado de implementación y la justificación si aplica exclusión.
    """
    __tablename__ = "soa_control_status"
    __table_args__ = (
        UniqueConstraint(
            "organization_id", 
            "question_id", 
            name="uq_soa_control_status_org_question"
        ),
    )

    organization_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    question_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("assessment_questions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    applicable: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    implementation_status: Mapped[ImplementationStatus] = mapped_column(
        SQLEnum(ImplementationStatus, values_callable=lambda enum: [e.value for e in enum], name="implementationstatus"),
        nullable=False,
        default=ImplementationStatus.NO_IMPLEMENTADO,
    )
    exclusion_justification: Mapped[str] = mapped_column(
        Text, nullable=True, default=None
    )
    policy_reference: Mapped[str] = mapped_column(
        Text, nullable=True, default=None
    )

    # Relationships
    organization = relationship(
        "Organization",
        back_populates="soa_control_statuses",
        lazy="select",
    )
    question = relationship(
        "AssessmentQuestion",
        lazy="select",
    )
