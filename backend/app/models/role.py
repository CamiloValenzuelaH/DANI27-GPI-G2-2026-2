from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import ForeignKey, String, Text, Boolean
from app.db.base import Base, UUIDMixin, TimestampMixin
import uuid

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.organization import Organization
    from app.models.user_role import UserRole
    from app.models.role_permission import RolePermission

class Role(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "roles"
    
    organization_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    
    name: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    description: Mapped[str | None] = mapped_column(String(255), nullable=True) 
    is_system_role: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    
    # Relationship
    organization: Mapped["Organization"] = relationship(
        back_populates="roles",
        lazy="select"
    )
    
    role_permissions: Mapped[list["RolePermission"]] = relationship(
        back_populates="role",
        lazy="select",
        cascade="all, delete-orphan",
    )
    
    user_roles: Mapped[list["UserRole"]] = relationship(
        back_populates="role",
        lazy="select",
        cascade="all, delete-orphan"
    )
    
    def __repr__(self) -> str:
        return f"<Role {self.name}>"
    
    