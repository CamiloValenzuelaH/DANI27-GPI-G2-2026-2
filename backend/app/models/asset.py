<<<<<<< HEAD
import uuid
from sqlalchemy import String, ForeignKey, Text, Integer, Float, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, TimestampMixin, UUIDMixin

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.organization import Organization
    from app.models.user import User


class Asset(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "assets"
    __table_args__ = (
        Index("ix_assets_org_created_at", "organization_id", "created_at"),
        Index("ix_assets_org_owner_status", "organization_id", "owner_id", "status"),
        Index("ix_assets_org_updated_at", "organization_id", "updated_at"),
    )

    organization_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    asset_type: Mapped[str] = mapped_column(
        String(50), nullable=False
    )  # hardware | software | data | service | people | facility
    owner_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    location: Mapped[str | None] = mapped_column(String(255), nullable=True)
    status: Mapped[str] = mapped_column(
        String(50), nullable=False, default="active"
    )  # active | inactive | disposed

    # Clasificación C-I-A (1=Bajo, 2=Medio, 3=Alto)
    confidentiality: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    integrity: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    availability: Mapped[int] = mapped_column(Integer, nullable=False, default=1)

    # Score calculado automáticamente: promedio ponderado C-I-A
    criticality_score: Mapped[float] = mapped_column(Float, nullable=False, default=1.0)

    # Nivel de criticidad derivado del score
    criticality_level: Mapped[str] = mapped_column(
        String(20), nullable=False, default="low"
    )  # low | medium | high | critical

    clause_ref: Mapped[str | None] = mapped_column(String(50), nullable=True)

    organization: Mapped["Organization"] = relationship(lazy="select")
    owner: Mapped["User"] = relationship(lazy="select")

    def __repr__(self) -> str:
=======
import uuid
from sqlalchemy import String, ForeignKey, Text, Integer, Float, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, TimestampMixin, UUIDMixin

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.organization import Organization
    from app.models.user import User
    from app.models.risk import Risk


class Asset(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "assets"
    __table_args__ = (
        Index("ix_assets_org_created_at", "organization_id", "created_at"),
        Index("ix_assets_org_owner_status", "organization_id", "owner_id", "status"),
        Index("ix_assets_org_updated_at", "organization_id", "updated_at"),
    )

    organization_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    asset_type: Mapped[str] = mapped_column(
        String(50), nullable=False
    )  # hardware | software | data | service | people | facility
    owner_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    location: Mapped[str | None] = mapped_column(String(255), nullable=True)
    status: Mapped[str] = mapped_column(
        String(50), nullable=False, default="active"
    )  # active | inactive | disposed

    # Clasificación C-I-A (1=Bajo, 2=Medio, 3=Alto)
    confidentiality: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    integrity: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    availability: Mapped[int] = mapped_column(Integer, nullable=False, default=1)

    # Score calculado automáticamente: promedio ponderado C-I-A
    criticality_score: Mapped[float] = mapped_column(Float, nullable=False, default=1.0)

    # Nivel de criticidad derivado del score
    criticality_level: Mapped[str] = mapped_column(
        String(20), nullable=False, default="low"
    )  # low | medium | high | critical

    clause_ref: Mapped[str | None] = mapped_column(String(50), nullable=True)

    organization: Mapped["Organization"] = relationship(lazy="select")
    owner: Mapped["User"] = relationship(lazy="select")
    linked_risks: Mapped[list["Risk"]] = relationship(
        "Risk",
        secondary="risk_assets",
        lazy="selectin",
        back_populates="linked_assets",
    )

    def __repr__(self) -> str:
>>>>>>> Chat-bot
        return f"<Asset {self.name} level={self.criticality_level}>"