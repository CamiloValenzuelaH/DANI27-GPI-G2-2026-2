<<<<<<< HEAD
from __future__ import annotations
from pydantic import BaseModel, EmailStr, field_validator
from uuid import UUID
from datetime import datetime

"""
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.schemas.role import RoleSimpleResponse
"""

class InviteUserRequest(BaseModel):
    full_name: str
    email: EmailStr
    role_id: UUID
    password: str

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("The password must contain at least 8 characters")
        if not any(c.isupper() for c in v):
            raise ValueError("The password must contain at least one uppercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("The password must contain at least one number")
        return v


class UpdateUserRequest(BaseModel):
    full_name: str | None = None
    is_active: bool | None = None


class UserResponse(BaseModel):
    id: UUID
    email: str
    full_name: str
    is_active: bool
    organization_id: UUID
    last_login_at: datetime | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class UserDetailResponse(UserResponse):
    roles: list["RoleSimpleResponse"] = []

    model_config = {"from_attributes": True}


class AssignRoleRequest(BaseModel):
    role_id: UUID
    
    
from app.schemas.role import RoleSimpleResponse # Importación tardía
=======
from __future__ import annotations
from pydantic import BaseModel, EmailStr, field_validator
from uuid import UUID
from datetime import datetime

"""
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.schemas.role import RoleSimpleResponse
"""

class InviteUserRequest(BaseModel):
    full_name: str
    email: EmailStr
    role_id: UUID
    password: str

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("The password must contain at least 8 characters")
        if not any(c.isupper() for c in v):
            raise ValueError("The password must contain at least one uppercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("The password must contain at least one number")
        return v


class UpdateUserRequest(BaseModel):
    full_name: str | None = None
    is_active: bool | None = None


class UserResponse(BaseModel):
    id: UUID
    email: str
    full_name: str
    is_active: bool
    organization_id: UUID
    last_login_at: datetime | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class UserDetailResponse(UserResponse):
    roles: list["RoleSimpleResponse"] = []

    model_config = {"from_attributes": True}


class AssignRoleRequest(BaseModel):
    role_id: UUID
    
    
from app.schemas.role import RoleSimpleResponse # Importación tardía
>>>>>>> Chat-bot
UserDetailResponse.model_rebuild()