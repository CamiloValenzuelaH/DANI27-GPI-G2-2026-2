import uuid
from datetime import datetime
from app.db.base import Base
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import ForeignKey, DateTime, func

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.role import Role

class UserRole(Base):
    __tablename__ = "user_roles"
    
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users_id", ondelete="CASCADE"),
        primary_key=True
    )
    
    role_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("roles_id", ondelete="CASCADE"),
        primary_key=True
    )
    
    assigned_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )
    
    # Relationship
    user: Mapped["User"] = relationship(
        back_populates="user_roles"
    )
    
    role: Mapped["Role"] = relationship(
        back_populates="user_role"
    )