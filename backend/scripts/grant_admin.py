#!/usr/bin/env python3
from app.db.database import SessionLocal
from app.models.user import User
from app.models.role import Role
from app.models.user_role import UserRole
from sqlalchemy.exc import IntegrityError

EMAIL = "admin@alloxentric.demo"

def main():
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == EMAIL).first()
        if not user:
            print(f"Usuario {EMAIL} no encontrado")
            return

        org_id = user.organization_id

        role = db.query(Role).filter(Role.name == 'admin', Role.organization_id == org_id).first()
        if not role:
            role = Role(organization_id=org_id, name='admin', description='Administrator role', is_system_role=True)
            db.add(role)
            db.commit()
            db.refresh(role)
            print(f"Creado role admin id={role.id}")
        else:
            print(f"Role admin ya existe id={role.id}")

        # assign user role
        existing = db.query(UserRole).filter(UserRole.user_id == user.id, UserRole.role_id == role.id).first()
        if existing:
            print(f"UserRole ya existente: user={user.email} role=admin")
            return

        ur = UserRole(user_id=user.id, role_id=role.id)
        db.add(ur)
        try:
            db.commit()
            print(f"Asignado role admin a {user.email}")
        except IntegrityError:
            db.rollback()
            print("Error: conflicto al asignar role (probablemente ya existe)")
    finally:
        db.close()

if __name__ == '__main__':
    main()
