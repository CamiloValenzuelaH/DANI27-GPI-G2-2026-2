<<<<<<< HEAD
import uuid
from sqlalchemy import String, ForeignKey, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from app.db.base import Base, TimestampMixin, UUIDMixin

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.plan import Plan
    from app.models.user import User
    from app.models.role import Role


class Organization(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "organizations"

    plan_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("plans.id", ondelete="RESTRICT"),
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    status: Mapped[str] = mapped_column(
        String(50), nullable=False, default="active"
    )
    trial_ends_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Relationships
    plan: Mapped["Plan"] = relationship(
        back_populates="organizations",
        lazy="select",
    )
    users: Mapped[list["User"]] = relationship(
        back_populates="organization",
        lazy="select",
        cascade="all, delete-orphan",
    )
    roles: Mapped[list["Role"]] = relationship(
        back_populates="organization",
        lazy="select",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
=======
import uuid
from sqlalchemy import String, ForeignKey, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from app.db.base import Base, TimestampMixin, UUIDMixin

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.plan import Plan
    from app.models.user import User
    from app.models.role import Role


class Organization(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "organizations"

    plan_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("plans.id", ondelete="RESTRICT"),
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    status: Mapped[str] = mapped_column(
        String(50), nullable=False, default="active"
    )
    trial_ends_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Relationships
    plan: Mapped["Plan"] = relationship(
        back_populates="organizations",
        lazy="select",
    )
    users: Mapped[list["User"]] = relationship(
        back_populates="organization",
        lazy="select",
        cascade="all, delete-orphan",
    )
    roles: Mapped[list["Role"]] = relationship(
        back_populates="organization",
        lazy="select",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
>>>>>>> Chat-bot
        return f"<Organization {self.slug}>"