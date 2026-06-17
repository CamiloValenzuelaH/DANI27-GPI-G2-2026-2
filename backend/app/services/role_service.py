<<<<<<< HEAD
from uuid import UUID
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.role import Role
from app.schemas.role import CreateRoleRequest, UpdateRoleRequest


def _get_role_or_404(role_id: UUID, org_id: UUID, db: Session) -> Role:
    role = db.query(Role).filter(
        Role.id == role_id,
        Role.organization_id == org_id,
    ).first()
    if not role:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rol no encontrado")
    return role


def list_roles(org_id: UUID, db: Session) -> list[Role]:
    return db.query(Role).filter(Role.organization_id == org_id).all()


def create_role(data: CreateRoleRequest, org_id: UUID, db: Session) -> Role:
    existing = db.query(Role).filter(
        Role.organization_id == org_id,
        Role.name == data.name,
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ya existe un rol con ese nombre en tu organización",
        )

    role = Role(
        organization_id=org_id,
        name=data.name,
        description=data.description,
        is_system_role=False,
    )
    db.add(role)
    db.commit()
    db.refresh(role)
    return role


def update_role(role_id: UUID, data: UpdateRoleRequest, org_id: UUID, db: Session) -> Role:
    role = _get_role_or_404(role_id, org_id, db)

    if role.is_system_role:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Los roles de sistema no pueden modificarse",
        )

    if data.name is not None:
        role.name = data.name
    if data.description is not None:
        role.description = data.description

    db.commit()
    db.refresh(role)
    return role


def delete_role(role_id: UUID, org_id: UUID, db: Session) -> None:
    role = _get_role_or_404(role_id, org_id, db)

    if role.is_system_role:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Los roles de sistema no pueden eliminarse",
        )

    db.delete(role)
=======
from uuid import UUID
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.role import Role
from app.schemas.role import CreateRoleRequest, UpdateRoleRequest


def _get_role_or_404(role_id: UUID, org_id: UUID, db: Session) -> Role:
    role = db.query(Role).filter(
        Role.id == role_id,
        Role.organization_id == org_id,
    ).first()
    if not role:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rol no encontrado")
    return role


def list_roles(org_id: UUID, db: Session) -> list[Role]:
    return db.query(Role).filter(Role.organization_id == org_id).all()


def create_role(data: CreateRoleRequest, org_id: UUID, db: Session) -> Role:
    existing = db.query(Role).filter(
        Role.organization_id == org_id,
        Role.name == data.name,
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ya existe un rol con ese nombre en tu organización",
        )

    role = Role(
        organization_id=org_id,
        name=data.name,
        description=data.description,
        is_system_role=False,
    )
    db.add(role)
    db.commit()
    db.refresh(role)
    return role


def update_role(role_id: UUID, data: UpdateRoleRequest, org_id: UUID, db: Session) -> Role:
    role = _get_role_or_404(role_id, org_id, db)

    if role.is_system_role:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Los roles de sistema no pueden modificarse",
        )

    if data.name is not None:
        role.name = data.name
    if data.description is not None:
        role.description = data.description

    db.commit()
    db.refresh(role)
    return role


def delete_role(role_id: UUID, org_id: UUID, db: Session) -> None:
    role = _get_role_or_404(role_id, org_id, db)

    if role.is_system_role:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Los roles de sistema no pueden eliminarse",
        )

    db.delete(role)
>>>>>>> Chat-bot
    db.commit()