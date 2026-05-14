"""
seed_demo.py

Uso: ejecutar desde la carpeta `backend/` como:

    python scripts/seed_demo.py

El script intentará importar la aplicación (`app`) asumiendo que se ejecuta
con la carpeta `backend` en `PYTHONPATH` (es decir, ejecutado desde `backend/`).

Qué hace:
- Asegura que exista un `Plan` (usa el primero disponible o crea uno "demo").
- Crea la organización `Alloxentric Demo` (si no existe).
- Crea varios usuarios (1 admin + 4 usuarios) y 25 assets distribuidos en los
  últimos 5 meses.
- Marca algunos assets como documentados (tienen `description` y `clause_ref`),
  implementados (tienen `owner_id`) y testeados (tienen `updated_at > created_at`).

No configura entornos ni instala dependencias — ejecútalo en el contenedor
backend o en un entorno Python ya preparado con las dependencias del proyecto.
"""

from __future__ import annotations

import random
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path


def ensure_backend_on_path():
    # Si ejecutas desde backend/, esto ya funciona. Si ejecutas desde repo root,
    # el script también inserta backend/ en sys.path para poder importar `app`.
    script_path = Path(__file__).resolve()
    backend_dir = script_path.parent.parent
    if str(backend_dir) not in sys.path:
        sys.path.insert(0, str(backend_dir))


def random_date_in_month(year: int, month: int) -> datetime:
    start = datetime(year, month, 1, tzinfo=timezone.utc)
    if month == 12:
        end = datetime(year + 1, 1, 1, tzinfo=timezone.utc)
    else:
        end = datetime(year, month + 1, 1, tzinfo=timezone.utc)
    delta = end - start
    return start + timedelta(seconds=random.randint(0, int(delta.total_seconds()) - 1))


def compute_criticality_score(c, i, a):
    # Promedio simple
    return round((c + i + a) / 3.0, 2)


def criticality_level_from_score(score: float) -> str:
    if score <= 1.5:
        return "low"
    if score <= 2.5:
        return "medium"
    return "high"


def seed():
    ensure_backend_on_path()

    from app.db.database import SessionLocal
    from app.models.plan import Plan
    from app.models.organization import Organization
    from app.models.user import User
    from app.models.asset import Asset
    from app.core.security import hash_password

    db = SessionLocal()
    try:
        # Plan: usa uno existente o crea uno demo
        plan = db.query(Plan).filter(Plan.slug == "starter").first()
        if not plan:
            plan = db.query(Plan).first()
        if not plan:
            plan = Plan(name="Demo", slug="demo", max_users=50, max_documents=999,
                        has_ai_features=False, has_audit_room=False,
                        has_integrations=False, has_capa_tracker=False)
            db.add(plan)
            db.commit()
            db.refresh(plan)

        org_slug = "alloxentric-demo"
        org = db.query(Organization).filter(Organization.slug == org_slug).first()
        if org:
            print(f"Organización existente encontrada: {org.slug}")
        else:
            org = Organization(name="Alloxentric Demo", slug=org_slug, plan_id=plan.id)
            db.add(org)
            db.commit()
            db.refresh(org)
            print(f"Organización creada: {org.slug}")

        # Usuarios
        users = []
        admin_email = "admin@alloxentric.demo"
        existing_admin = db.query(User).filter(User.email == admin_email).first()
        if existing_admin:
            users.append(existing_admin)
            print("Usuario admin ya existe")
        else:
            admin = User(
                organization_id=org.id,
                email=admin_email,
                hashed_password=hash_password("DemoPass123!"),
                full_name="Admin Demo",
                is_active=True,
                is_superadmin=True,
            )
            db.add(admin)
            db.commit()
            db.refresh(admin)
            users.append(admin)
            print(f"Usuario admin creado: {admin.email} / DemoPass123!")

        # Crear algunos usuarios adicionales
        for idx in range(1, 5):
            email = f"user{idx}@alloxentric.demo"
            u = db.query(User).filter(User.email == email).first()
            if u:
                users.append(u)
                continue
            u = User(
                organization_id=org.id,
                email=email,
                hashed_password=hash_password("UserPass123!"),
                full_name=f"User {idx}",
                is_active=(idx % 4 != 0),
            )
            db.add(u)
            db.commit()
            db.refresh(u)
            users.append(u)

        # Assets: generar 25 assets distribuidos en los últimos 5 meses
        now = datetime.now(timezone.utc)
        month_starts = []
        for offset in range(4, -1, -1):
            m = (now.month - offset - 1) % 12 + 1
            y = now.year + ((now.month - offset - 1) // 12)
            month_starts.append((y, m))

        asset_types = ["hardware", "software", "data", "service", "people", "facility"]

        created_assets = 0
        for i in range(25):
            # elegir mes aleatorio entre los últimos 5
            y, m = random.choice(month_starts)
            created_at = random_date_in_month(y, m)

            name = f"Asset {i+1}"
            description = None
            clause_ref = None
            if random.random() < 0.6:
                description = f"Descripción de {name} - ejemplo de documentación."
                clause_ref = f"A.{random.randint(1,9)}.{random.randint(1,9)}"

            owner = None
            if random.random() < 0.5:
                owner = random.choice(users)

            confidentiality = random.randint(1, 3)
            integrity = random.randint(1, 3)
            availability = random.randint(1, 3)
            score = compute_criticality_score(confidentiality, integrity, availability)
            level = criticality_level_from_score(score)

            status = "active" if random.random() < 0.85 else "inactive"

            asset = Asset(
                organization_id=org.id,
                name=name,
                description=description,
                asset_type=random.choice(asset_types),
                owner_id=(owner.id if owner else None),
                location=None,
                status=status,
                confidentiality=confidentiality,
                integrity=integrity,
                availability=availability,
                criticality_score=score,
                criticality_level=level,
                clause_ref=clause_ref,
                created_at=created_at,
            )

            # marcar algunos como testeados (updated_at > created_at)
            if random.random() < 0.35:
                asset.updated_at = created_at + timedelta(days=random.randint(1, 20))

            db.add(asset)
            created_assets += 1

        db.commit()

        total_assets = db.query(Asset).filter(Asset.organization_id == org.id).count()
        total_users = db.query(User).filter(User.organization_id == org.id).count()

        print(f"Seed completo: organización={org.slug}, assets_creados={created_assets}, total_assets={total_assets}, total_users={total_users}")

    finally:
        db.close()


if __name__ == "__main__":
    seed()
