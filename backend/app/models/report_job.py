from __future__ import annotations

from datetime import date, datetime
from typing import Any

from sqlalchemy import Date, DateTime, String, Integer
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin, UUIDMixin


class ReportJob(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "report_jobs"

    job_id: Mapped[str] = mapped_column(String(36), nullable=False, unique=True)
    organization_id: Mapped[str] = mapped_column(String(36), nullable=False)
    user_id: Mapped[str] = mapped_column(String(36), nullable=True)
    status: Mapped[str] = mapped_column(String(50), nullable=False)
    progress: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    message: Mapped[str] = mapped_column(String(1024), nullable=True)
    report_title: Mapped[str] = mapped_column(String(255), nullable=True)
    report_template: Mapped[str] = mapped_column(String(64), nullable=True)
    report_format: Mapped[str] = mapped_column(String(10), nullable=True)
    created_date: Mapped[str] = mapped_column(String(10), nullable=True)

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "job_id": self.job_id,
            "organization_id": self.organization_id,
            "user_id": self.user_id,
            "status": self.status,
            "progress": self.progress,
            "message": self.message,
            "report_title": self.report_title,
            "report_template": self.report_template,
            "report_format": self.report_format,
            "created_at": self.created_at.isoformat() if isinstance(self.created_at, datetime) else None,
            "created_date": self.created_date,
            "updated_at": self.updated_at.isoformat() if isinstance(self.updated_at, datetime) else None,
        }
