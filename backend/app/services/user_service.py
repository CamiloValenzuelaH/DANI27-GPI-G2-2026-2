from uuid import UUID
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.user import User
from app.models.role import Role
from app.models.user_role import UserRole
from app.schemas.user import InviteUserRequest, UpdateUserRequest
from app.core.security import hash_password


def _get_user_or_404(user_id: UUID, org_id: UUID, db: Session) -> User:
    user = db.query(User).filter(
        User.id == user_id,
        User.organization_id == org_id,
    ).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")
    return user


def _get_role_or_404(role_id: UUID, org_id: UUID, db: Session) -> Role:
    role = db.query(Role).filter(
        Role.id == role_id,
        Role.organization_id == org_id,
    ).first()
    if not role:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rol no encontrado")
    return role


def list_users(org_id: UUID, db: Session) -> list[User]:
    return db.query(User).filter(User.organization_id == org_id).all()


def get_user(user_id: UUID, org_id: UUID, db: Session) -> User:
    return _get_user_or_404(user_id, org_id, db)


def invite_user(data: InviteUserRequest, org_id: UUID, db: Session) -> User:
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ya existe un usuario con ese email",
        )

    role = _get_role_or_404(data.role_id, org_id, db)

    user = User(
        organization_id=org_id,
        email=data.email,
        hashed_password=hash_password(data.password),
        full_name=data.full_name,
        is_active=True,
    )
    db.add(user)
    db.flush()

    db.add(UserRole(user_id=user.id, role_id=role.id))
    db.commit()
    db.refresh(user)
    return user


def update_user(user_id: UUID, data: UpdateUserRequest, org_id: UUID, db: Session) -> User:
    user = _get_user_or_404(user_id, org_id, db)

    if data.full_name is not None:
        user.full_name = data.full_name
    if data.is_active is not None:
        user.is_active = data.is_active

    db.commit()
    db.refresh(user)
    return user


def delete_user(user_id: UUID, org_id: UUID, db: Session) -> None:
    user = _get_user_or_404(user_id, org_id, db)
    user.is_active = False
    db.commit()


def assign_role(user_id: UUID, role_id: UUID, org_id: UUID, db: Session) -> User:
    user = _get_user_or_404(user_id, org_id, db)
    role = _get_role_or_404(role_id, org_id, db)

    existing = db.query(UserRole).filter(
        UserRole.user_id == user_id,
        UserRole.role_id == role_id,
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="El usuario ya tiene ese rol asignado",
        )

    db.add(UserRole(user_id=user.id, role_id=role.id))
    db.commit()
    db.refresh(user)
    return user


def remove_role(user_id: UUID, role_id: UUID, org_id: UUID, db: Session) -> None:
    user_role = db.query(UserRole).filter(
        UserRole.user_id == user_id,
        UserRole.role_id == role_id,
    ).first()

    if not user_role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El usuario no tiene ese rol",
        )

    db.delete(user_role)
    db.commit()