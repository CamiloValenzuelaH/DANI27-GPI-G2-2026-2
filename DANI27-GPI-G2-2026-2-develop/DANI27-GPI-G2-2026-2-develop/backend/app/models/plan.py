from sqlalchemy import String, Boolean, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, TimestampMixin, UUIDMixin

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.organization import Organization


class Plan(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "plans"

    name: Mapped[str] = mapped_column(String(100), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    max_users: Mapped[int] = mapped_column(Integer, nullable=False, default=5)
    max_documents: Mapped[int] = mapped_column(Integer, nullable=False, default=10)

    # Feature gating
    has_ai_features: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    has_audit_room: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    has_integrations: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    has_capa_tracker: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Relationships
    organizations: Mapped[list["Organization"]] = relationship(
        back_populates="plan",
        lazy="select",
    )

    def __repr__(self) -> str:
        return f"<Plan {self.slug}>"