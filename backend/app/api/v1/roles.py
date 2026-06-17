<<<<<<< HEAD
from uuid import UUID
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.core.dependencies import get_current_org
from app.models.organization import Organization
from app.schemas.role import CreateRoleRequest, UpdateRoleRequest, RoleResponse
from app.services import role_service

router = APIRouter(prefix="/roles", tags=["roles"])


@router.get("", response_model=list[RoleResponse])
def list_roles(
    db: Session = Depends(get_db),
    org: Organization = Depends(get_current_org),
):
    return role_service.list_roles(org.id, db)


@router.post("", response_model=RoleResponse, status_code=status.HTTP_201_CREATED)
def create_role(
    data: CreateRoleRequest,
    db: Session = Depends(get_db),
    org: Organization = Depends(get_current_org),
):
    return role_service.create_role(data, org.id, db)


@router.patch("/{role_id}", response_model=RoleResponse)
def update_role(
    role_id: UUID,
    data: UpdateRoleRequest,
    db: Session = Depends(get_db),
    org: Organization = Depends(get_current_org),
):
    return role_service.update_role(role_id, data, org.id, db)


@router.delete("/{role_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_role(
    role_id: UUID,
    db: Session = Depends(get_db),
    org: Organization = Depends(get_current_org),
):
=======
from uuid import UUID
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.core.dependencies import get_current_org
from app.models.organization import Organization
from app.schemas.role import CreateRoleRequest, UpdateRoleRequest, RoleResponse
from app.services import role_service

router = APIRouter(prefix="/roles", tags=["roles"])


@router.get("", response_model=list[RoleResponse])
def list_roles(
    db: Session = Depends(get_db),
    org: Organization = Depends(get_current_org),
):
    return role_service.list_roles(org.id, db)


@router.post("", response_model=RoleResponse, status_code=status.HTTP_201_CREATED)
def create_role(
    data: CreateRoleRequest,
    db: Session = Depends(get_db),
    org: Organization = Depends(get_current_org),
):
    return role_service.create_role(data, org.id, db)


@router.patch("/{role_id}", response_model=RoleResponse)
def update_role(
    role_id: UUID,
    data: UpdateRoleRequest,
    db: Session = Depends(get_db),
    org: Organization = Depends(get_current_org),
):
    return role_service.update_role(role_id, data, org.id, db)


@router.delete("/{role_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_role(
    role_id: UUID,
    db: Session = Depends(get_db),
    org: Organization = Depends(get_current_org),
):
>>>>>>> Chat-bot
    role_service.delete_role(role_id, org.id, db)