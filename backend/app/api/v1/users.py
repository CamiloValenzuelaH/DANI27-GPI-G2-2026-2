<<<<<<< HEAD
from uuid import UUID
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.core.dependencies import get_current_user, get_current_org
from app.models.user import User
from app.models.organization import Organization
from app.schemas.user import (
    InviteUserRequest,
    UpdateUserRequest,
    UserResponse,
    UserDetailResponse,
    AssignRoleRequest,
)
from app.services import user_service

router = APIRouter(prefix="/users", tags=["users"])


@router.get("", response_model=list[UserResponse])
def list_users(
    db: Session = Depends(get_db),
    org: Organization = Depends(get_current_org),
):
    return user_service.list_users(org.id, db)


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def invite_user(
    data: InviteUserRequest,
    db: Session = Depends(get_db),
    org: Organization = Depends(get_current_org),
):
    return user_service.invite_user(data, org.id, db)


@router.get("/{user_id}", response_model=UserDetailResponse)
def get_user(
    user_id: UUID,
    db: Session = Depends(get_db),
    org: Organization = Depends(get_current_org),
):
    return user_service.get_user(user_id, org.id, db)


@router.patch("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: UUID,
    data: UpdateUserRequest,
    db: Session = Depends(get_db),
    org: Organization = Depends(get_current_org),
):
    return user_service.update_user(user_id, data, org.id, db)


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: UUID,
    db: Session = Depends(get_db),
    org: Organization = Depends(get_current_org),
):
    user_service.delete_user(user_id, org.id, db)


@router.post("/{user_id}/roles", response_model=UserResponse)
def assign_role(
    user_id: UUID,
    data: AssignRoleRequest,
    db: Session = Depends(get_db),
    org: Organization = Depends(get_current_org),
):
    return user_service.assign_role(user_id, data.role_id, org.id, db)


@router.delete("/{user_id}/roles/{role_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_role(
    user_id: UUID,
    role_id: UUID,
    db: Session = Depends(get_db),
    org: Organization = Depends(get_current_org),
):
=======
from uuid import UUID
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.core.dependencies import get_current_user, get_current_org
from app.models.user import User
from app.models.organization import Organization
from app.schemas.user import (
    InviteUserRequest,
    UpdateUserRequest,
    UserResponse,
    UserDetailResponse,
    AssignRoleRequest,
)
from app.services import user_service

router = APIRouter(prefix="/users", tags=["users"])


@router.get("", response_model=list[UserResponse])
def list_users(
    db: Session = Depends(get_db),
    org: Organization = Depends(get_current_org),
):
    return user_service.list_users(org.id, db)


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def invite_user(
    data: InviteUserRequest,
    db: Session = Depends(get_db),
    org: Organization = Depends(get_current_org),
):
    return user_service.invite_user(data, org.id, db)


@router.get("/{user_id}", response_model=UserDetailResponse)
def get_user(
    user_id: UUID,
    db: Session = Depends(get_db),
    org: Organization = Depends(get_current_org),
):
    return user_service.get_user(user_id, org.id, db)


@router.patch("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: UUID,
    data: UpdateUserRequest,
    db: Session = Depends(get_db),
    org: Organization = Depends(get_current_org),
):
    return user_service.update_user(user_id, data, org.id, db)


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: UUID,
    db: Session = Depends(get_db),
    org: Organization = Depends(get_current_org),
):
    user_service.delete_user(user_id, org.id, db)


@router.post("/{user_id}/roles", response_model=UserResponse)
def assign_role(
    user_id: UUID,
    data: AssignRoleRequest,
    db: Session = Depends(get_db),
    org: Organization = Depends(get_current_org),
):
    return user_service.assign_role(user_id, data.role_id, org.id, db)


@router.delete("/{user_id}/roles/{role_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_role(
    user_id: UUID,
    role_id: UUID,
    db: Session = Depends(get_db),
    org: Organization = Depends(get_current_org),
):
>>>>>>> Chat-bot
    user_service.remove_role(user_id, role_id, org.id, db)