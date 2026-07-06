from __future__ import annotations

from sqlalchemy import Boolean, JSON, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin, UUIDMixin


class ExternalValidationJob(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "external_validation_jobs"

    job_id: Mapped[str] = mapped_column(String(36), nullable=False, unique=True)
    organization_id: Mapped[str] = mapped_column(String(36), nullable=False)
    user_id: Mapped[str] = mapped_column(String(36), nullable=True)
    status: Mapped[str] = mapped_column(String(50), nullable=False)
    progress: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    message: Mapped[str] = mapped_column(String(1024), nullable=True)
    file_name: Mapped[str] = mapped_column(String(255), nullable=True)
    file_path: Mapped[str] = mapped_column(String(512), nullable=True)
    total_chunks: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    overall_score: Mapped[int] = mapped_column(Integer, nullable=True)
    findings: Mapped[list[dict]] = mapped_column(JSON, nullable=False, default=list)
    summary: Mapped[str] = mapped_column(String(1024), nullable=True)
    evidence_verified: Mapped[bool] = mapped_column(Boolean, nullable=True)
    evidence_gaps: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    error: Mapped[str] = mapped_column(String(1024), nullable=True)
