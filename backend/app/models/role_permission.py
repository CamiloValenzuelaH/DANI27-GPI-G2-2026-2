from app.db.base import Base
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import ForeignKey, UniqueConstraint
import uuid

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.role import Role
    from app.models.permission import Permission

class RolePermission(Base):
    __tablename__ = "role_permissions"
    
    role_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("roles.id", ondelete="CASCADE"),
        primary_key=True
    )
    
    permission_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("permissions.id", ondelete="CASCADE"),
        primary_key=True
    )
    
    # Relationship
    role: Mapped["Role"] = relationship(
        back_populates="role_permissions",
        lazy="select"
    )
    
    permission: Mapped["Permission"] = relationship(
        back_populates="role_permissions",
        lazy="select"
    )
    
    # Unique Restriction
    __table_args__ = (
        UniqueConstraint("role_id", "permission_id", name="uq_role_permission")
    )
    
    def __repr__(self) -> str:
        return f"<RolePermission role={self.role_id} permission={self.permission_id}>"