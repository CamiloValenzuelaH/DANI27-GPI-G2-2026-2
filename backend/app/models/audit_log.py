from __future__ import annotations

import hashlib
import json
import uuid
from datetime import datetime, timezone, timedelta

from sqlalchemy import (
    Column,
    String,
    Boolean,
    Integer,
    DateTime,
    JSON,
    Text,
    event,
    DDL,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, UUIDMixin


class AuditLog(Base, UUIDMixin):
    __tablename__ = "audit_logs"

    # 5 dimensiones obligatorias + metadata
    user_id: Mapped[uuid.UUID] = mapped_column(String(36), nullable=True)
    user_role: Mapped[str] = mapped_column(String(64), nullable=True)
    action: Mapped[str] = mapped_column(String(128), nullable=False)
    resource: Mapped[str] = mapped_column(String(256), nullable=False)
    details: Mapped[dict] = mapped_column(JSON, nullable=True)
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    ip_address: Mapped[str] = mapped_column(String(64), nullable=True)
    user_agent: Mapped[str] = mapped_column(Text, nullable=True)
    http_status: Mapped[int] = mapped_column(Integer, nullable=False)
    success: Mapped[bool] = mapped_column(Boolean, nullable=False)

    # Chain integrity
    previous_hash: Mapped[str] = mapped_column(String(128), nullable=True)
    current_hash: Mapped[str] = mapped_column(String(128), nullable=False)

    def compute_hash(self) -> str:
        """Compute SHA256 hash over canonical fields and previous_hash."""
        payload = {
            "previous_hash": self.previous_hash or "",
            "timestamp": self.timestamp.isoformat(),
            "user_id": str(self.user_id) if self.user_id else "",
            "action": self.action,
            "resource": self.resource,
            "http_status": int(self.http_status),
            "success": bool(self.success),
            "details": self.details or {},
        }
        data = json.dumps(payload, sort_keys=True, ensure_ascii=False)
        return hashlib.sha256(data.encode("utf-8")).hexdigest()


# Prevent DELETE/UPDATE on audit_logs at the DB level (Postgres function + trigger)
_prevent_mutation_ddl = DDL(
    """
    CREATE OR REPLACE FUNCTION prevent_audit_logs_mutation()
    RETURNS trigger AS $$
    BEGIN
        RAISE EXCEPTION 'audit_logs is immutable: updates and deletes are forbidden';
        RETURN NULL;
    END;
    $$ LANGUAGE plpgsql;

    CREATE TRIGGER audit_logs_prevent_mutation
    BEFORE UPDATE OR DELETE ON audit_logs
    FOR EACH ROW EXECUTE PROCEDURE prevent_audit_logs_mutation();
    """
)


@event.listens_for(AuditLog.__table__, "after_create")
def _create_immutable_trigger(target, connection, **kw):
    # Only run on Postgres
    try:
        connection.execute(_prevent_mutation_ddl)
    except Exception:
        # Best-effort: if DB doesn't support plpgsql or permissions missing, skip.
        pass
