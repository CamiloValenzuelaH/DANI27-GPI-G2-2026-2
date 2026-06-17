from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import Boolean, CheckConstraint, DateTime, ForeignKey, Index, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin, UUIDMixin


# Tipos de conector soportados
CONNECTOR_TYPES = ("google_workspace", "microsoft_365", "aws", "github")

# Estado de la conexión
CONNECTOR_STATUSES = ("connected", "disconnected", "error", "syncing")


class Connector(Base, UUIDMixin, TimestampMixin):
    """
    Almacena la configuración y tokens OAuth/API de cada integración
    externa por organización. Un solo registro por tipo por organización.
    Los tokens se guardan encriptados (via crypto.py del core).
    """

    __tablename__ = "connectors"
    __table_args__ = (
        CheckConstraint(
            "type IN ('google_workspace', 'microsoft_365', 'aws', 'github')",
            name="ck_connector_type",
        ),
        CheckConstraint(
            "status IN ('connected', 'disconnected', 'error', 'syncing')",
            name="ck_connector_status",
        ),
        # Un solo conector por tipo por organización
        Index(
            "uq_connector_org_type",
            "organization_id",
            "type",
            unique=True,
        ),
        Index("ix_connector_org_id", "organization_id"),
    )

    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
    )

    # Tipo de conector: google_workspace | microsoft_365 | aws | github
    type: Mapped[str] = mapped_column(String(32), nullable=False)

    # Estado actual de la conexión
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="disconnected"
    )

    # ── Campos OAuth (Google, Microsoft, GitHub) ──────────────────────
    # Tokens guardados como texto encriptado con app.core.crypto
    encrypted_access_token: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    encrypted_refresh_token: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    token_expires_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    oauth_scopes: Mapped[Optional[str]] = mapped_column(
        String(1024), nullable=True, comment="Scopes concedidos, separados por espacio"
    )

    # ── Campos AWS (IAM) ──────────────────────────────────────────────
    # Access Key encriptada; para IAM Role se deja en None
    encrypted_aws_access_key_id: Mapped[Optional[str]] = mapped_column(
        Text, nullable=True
    )
    encrypted_aws_secret_access_key: Mapped[Optional[str]] = mapped_column(
        Text, nullable=True
    )
    aws_region: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)

    # ── Metadata de sincronización ────────────────────────────────────
    last_sync_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    last_sync_error: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    # Activa/desactiva sync automático cada 24h
    auto_sync_enabled: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True
    )

    # ── Helpers ───────────────────────────────────────────────────────

    @property
    def is_connected(self) -> bool:
        return self.status == "connected"

    @property
    def is_token_expired(self) -> bool:
        if self.token_expires_at is None:
            return False
        return datetime.now(timezone.utc) >= self.token_expires_at

    def mark_sync_success(self) -> None:
        self.last_sync_at = datetime.now(timezone.utc)
        self.last_sync_error = None
        self.status = "connected"

    def mark_sync_error(self, error: str) -> None:
        self.last_sync_error = error
        self.status = "error"
