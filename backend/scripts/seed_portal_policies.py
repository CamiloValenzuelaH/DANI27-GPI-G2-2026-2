"""
seed_portal_policies.py

Uso: ejecutar desde la carpeta `backend/` como:

    python scripts/seed_portal_policies.py

El script inserta políticas publicadas de ejemplo para la organización
`Alloxentric Demo` (slug `alloxentric-demo`). Es idempotente: no crea
duplicados si ya existen políticas con el mismo título en estado published.
"""

from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path
import sys


def ensure_backend_on_path() -> None:
    script_path = Path(__file__).resolve()
    backend_dir = script_path.parent.parent
    if str(backend_dir) not in sys.path:
        sys.path.insert(0, str(backend_dir))


def seed() -> None:
    ensure_backend_on_path()

    from app.db.database import SessionLocal
    from app.models.organization import Organization
    from app.models.policy import Policy, PolicyStatus

    db = SessionLocal()
    try:
        org_slugs = ["alloxentric-demo", "employee-portal-org"]
        now = datetime.now(timezone.utc)

        policy_seeds = [
            {
                "title": "Política de Seguridad de la Información",
                "summary": "Esta política define los principios y controles para proteger la confidencialidad, integridad y disponibilidad de la información.",
                "content": (
                    "La organización establece un marco para gestionar la seguridad de la información en todos los activos tecnológicos y de datos. "
                    "Se aplican controles de acceso, cifrado y monitoreo para prevenir incidentes y reducir riesgos.\n\n"
                    "Todos los empleados deben reportar inmediatamente cualquier sospecha de pérdida, filtración o uso indebido de información. "
                    "La gestión de accesos se realiza con base en el principio de menor privilegio.\n\n"
                    "La política se revisa periódicamente para mantenerla alineada con cambios regulatorios y operativos. "
                    "Cualquier excepción debe documentarse y aprobarse por el equipo de seguridad."
                ),
                "mandatory": True,
                "document_version": "1.0",
            },
            {
                "title": "Política de Gestión de Contraseñas",
                "summary": "Establece los requisitos para crear, almacenar y rotar contraseñas seguras en los sistemas de la organización.",
                "content": (
                    "Las contraseñas deben contar con longitud y complejidad adecuadas para evitar accesos no autorizados. "
                    "Se prohíbe el reuso de contraseñas entre aplicaciones críticas y se recomienda el uso de gestores de contraseñas.\n\n"
                    "Los usuarios deben cambiar sus contraseñas cuando se sospeche que han sido comprometidas y cada cierto periodo definido por el equipo de seguridad. "
                    "Nunca se debe compartir la contraseña con terceros ni almacenarla en texto plano.\n\n"
                    "Los sistemas deben forzar bloqueos temporales después de múltiples intentos fallidos y soportar mecanismos de autenticación multifactor cuando sea posible."
                ),
                "mandatory": True,
                "document_version": "1.0",
            },
            {
                "title": "Política de Trabajo Remoto",
                "summary": "Define las reglas y buenas prácticas para trabajar de forma remota manteniendo la seguridad de la información y la continuidad operativa.",
                "content": (
                    "El trabajo remoto está permitido siempre que se utilicen dispositivos autorizados y conexiones seguras. "
                    "Los empleados deben usar redes privadas virtuales (VPN) para acceder a recursos internos.\n\n"
                    "Es obligatorio proteger los dispositivos con contraseñas fuertes, actualizaciones vigentes y software de seguridad instalado. "
                    "No se deben dejar dispositivos sin supervisión en espacios públicos y se debe evitar el uso de redes Wi-Fi abiertas sin protección.\n\n"
                    "Los datos sensibles no se deben almacenar localmente en dispositivos personales y se debe priorizar la utilización de servicios corporativos autorizados."
                ),
                "mandatory": False,
                "document_version": "1.0",
            },
            {
                "title": "Política de Uso Aceptable de Activos",
                "summary": "Describe el uso permitido de los activos de información para garantizar un entorno seguro y responsable.",
                "content": (
                    "Los activos de la organización, incluidos hardware, software y servicios, deben utilizarse exclusivamente para fines laborales autorizados. "
                    "El uso personal debe mantenerse al mínimo y siempre dentro de los límites aceptables definidos por la organización.\n\n"
                    "Se prohíbe instalar software no autorizado, modificar configuraciones críticas o conectar dispositivos externos sin la aprobación del equipo de TI. "
                    "Los usuarios deben informar cualquier mal funcionamiento, pérdida o daño de los activos de inmediato.\n\n"
                    "El acceso a sistemas y datos se otorga según necesidad comercial y se supervisa para detectar usos indebidos o incidentes de seguridad."
                ),
                "mandatory": False,
                "document_version": "1.0",
            },
        ]

        inserted = 0
        updated = 0

        for org_slug in org_slugs:
            org = db.query(Organization).filter(Organization.slug == org_slug).first()
            if not org:
                print(f"Organización con slug '{org_slug}' no encontrada. Omite seed para esta org.")
                continue

            print(f"Seed de políticas para org: {org.slug}")
            for seed_data in policy_seeds:
                existing = (
                    db.query(Policy)
                    .filter(
                        Policy.organization_id == str(org.id),
                        Policy.title == seed_data["title"],
                    )
                    .order_by(Policy.created_at.desc())
                    .first()
                )

                if existing:
                    changed = False
                    if existing.summary != seed_data["summary"]:
                        existing.summary = seed_data["summary"]
                        changed = True
                    if existing.content != seed_data["content"]:
                        existing.content = seed_data["content"]
                        changed = True
                    if existing.status != PolicyStatus.published:
                        existing.status = PolicyStatus.published
                        changed = True
                    if existing.mandatory != seed_data["mandatory"]:
                        existing.mandatory = seed_data["mandatory"]
                        changed = True
                    if existing.document_version != seed_data["document_version"]:
                        existing.document_version = seed_data["document_version"]
                        changed = True
                    if not existing.published_at:
                        existing.published_at = now
                        changed = True
                    if changed:
                        updated += 1
                        print(f"Actualizando política existente: {seed_data['title']} en {org.slug}")
                else:
                    policy = Policy(
                        organization_id=str(org.id),
                        title=seed_data["title"],
                        summary=seed_data["summary"],
                        content=seed_data["content"],
                        status=PolicyStatus.published,
                        document_version=seed_data["document_version"],
                        mandatory=seed_data["mandatory"],
                        published_at=now,
                    )
                    db.add(policy)
                    inserted += 1
                    print(f"Insertando política: {seed_data['title']} en {org.slug}")

        if inserted or updated:
            db.commit()

        total = (
            db.query(Policy)
            .filter(Policy.organization_id == str(org.id), Policy.status == PolicyStatus.published)
            .count()
        )

        print(f"Seed completo: insertadas={inserted}, actualizadas={updated}, publicadas totales={total}")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
