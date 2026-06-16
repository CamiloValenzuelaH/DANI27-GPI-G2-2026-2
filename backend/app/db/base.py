import uuid
from datetime import datetime, timezone
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy import DateTime, String


class Base(DeclarativeBase):
    pass


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    @property
    def created_date(self) -> str | None:
        if getattr(self, "created_at", None):
            try:
                return self.created_at.date().isoformat()
            except Exception:
                return None
        return None

    @property
    def updated_date(self) -> str | None:
        if getattr(self, "updated_at", None):
            try:
                return self.updated_at.date().isoformat()
            except Exception:
                return None
        return None


class UUIDMixin:
    # Use String(36) to match migrations that create id as varchar(36).
    # Default is a stringified UUID to avoid DB type-casting issues.
    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )