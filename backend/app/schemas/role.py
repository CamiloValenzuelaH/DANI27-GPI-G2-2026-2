from pydantic import BaseModel
from uuid import UUID
from datetime import datetime


class CreateRoleRequest(BaseModel):
    name: str
    description: str | None = None


class UpdateRoleRequest(BaseModel):
    name: str | None = None
    description: str | None = None


class RoleSimpleResponse(BaseModel):
    id: UUID
    name: str
    description: str | None = None
    is_system_role: bool

    model_config = {"from_attributes": True}


class RoleResponse(RoleSimpleResponse):
    organization_id: UUID
    created_at: datetime

    model_config = {"from_attributes": True}