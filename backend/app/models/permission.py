
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Text, UniqueConstraint
from app.db.base import Base, TimestampMixin, UUIDMixin

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.role_permission import RolePermission

class Permission(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "permissions"
    
    resource: Mapped[str] = mapped_column(String(127), nullable=False, index=True)
    action: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    # Relationship
    role_permissions: Mapped[list["RolePermission"]] = relationship(
        back_populates="permission",
        cascade="all, delete-orphan"
    )
    
    # Unique restriction
    __table_args__ = (
        UniqueConstraint("resource", "action", name="uq_permission_resource_action")
    )
    
    def __repr__(self):
        return f"<Permission {self.resource}:{self.action}>"