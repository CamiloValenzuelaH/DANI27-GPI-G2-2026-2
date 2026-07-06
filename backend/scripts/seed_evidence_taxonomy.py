"""
Seed de taxonomía documental de evidencias.

Uso desde `backend/`:

    python scripts/seed_evidence_taxonomy.py

Inserta registros de taxonomía por organización existente, incluyendo:
- 5 tipos base (compatibilidad inicial)
- Catálogo completo de controles del Anexo A (93)
- Texto enriquecido de búsqueda para consultas en lenguaje natural

Es idempotente por `clause_ref` para evitar duplicados en reinicios.
"""

from __future__ import annotations

import sys
from pathlib import Path


def build_search_text(clause_ref: str, control_label: str, taxonomy_type: str) -> str:
    return (
        f"Control ISO 27001 {clause_ref}. "
        f"Tema: {control_label}. "
        f"Tipo documental sugerido: {taxonomy_type}. "
        "Incluye evidencia de implementación, responsable, periodicidad, "
        "procedimiento aplicable y registros de verificación. "
        "Palabras clave: seguridad de la información, control anexo A, cumplimiento ISO 27001."
    )


def ensure_backend_on_path() -> None:
    script_path = Path(__file__).resolve()
    backend_dir = script_path.parent.parent
    if str(backend_dir) not in sys.path:
        sys.path.insert(0, str(backend_dir))


def seed() -> None:
    ensure_backend_on_path()

    from app.db.database import SessionLocal
    from app.models.organization import Organization
    from app.models.evidence_taxonomy import EvidenceTaxonomy
    from sqlalchemy import or_, func
    from scripts.seed_assessment_questions import ANNEX_A_CONTROLS

    # Seeds solicitados: POLICY 365, PROCEDURE 365, INSTRUCTION 180, CONTROL NULL, RECORD 90
    BASE_SEEDS = [
        {
            "type": "POLICY",
            "name": "Política de Seguridad",
            "control_id": "ISO 27001 A.5.1",
            "clause_ref": "A.5.1",
            "validity_days": 365,
            "search_text": build_search_text("A.5.1", "políticas de seguridad de la información", "POLICY"),
        },
        {
            "type": "PROCEDURE",
            "name": "Procedimiento de Seguridad",
            "control_id": "ISO 27001 A.5.37",
            "clause_ref": "A.5.37",
            "validity_days": 365,
            "search_text": build_search_text("A.5.37", "procedimientos operativos documentados", "PROCEDURE"),
        },
        {
            "type": "INSTRUCTION",
            "name": "Instrucción Operativa",
            "control_id": "ISO 27001 A.8.32",
            "clause_ref": "A.8.32",
            "validity_days": 180,
            "search_text": build_search_text("A.8.32", "gestión de cambios", "INSTRUCTION"),
        },
        {
            "type": "CONTROL",
            "name": "Control Anexo A",
            "control_id": "ISO 27001 A.8.15",
            "clause_ref": "A.8.15",
            "validity_days": None,
            "search_text": build_search_text("A.8.15", "registro de eventos", "CONTROL"),
        },
        {
            "type": "RECORD",
            "name": "Registro de Ejecución",
            "control_id": "ISO 27001 A.8.33",
            "clause_ref": "A.8.33",
            "validity_days": 90,
            "search_text": build_search_text("A.8.33", "información de prueba", "RECORD"),
        },
    ]

    ANNEX_SEEDS = [
        {
            "type": "CONTROL",
            "name": f"Control {clause_ref}: {control_label.capitalize()}",
            "control_id": f"ISO 27001 {clause_ref}",
            "clause_ref": clause_ref,
            "validity_days": None,
            "search_text": build_search_text(clause_ref, control_label, "CONTROL"),
        }
        for clause_ref, control_label, _is_critical in ANNEX_A_CONTROLS
    ]

    # Primero base y luego anexo; deduplicado por clause_ref.
    ALL_SEEDS = BASE_SEEDS + ANNEX_SEEDS

    db = SessionLocal()
    try:
        organizations = db.query(Organization).all()
        if not organizations:
            print("No hay organizaciones para sembrar taxonomy.")
            return

        inserted = 0
        updated = 0
        for org in organizations:
            existing_clause_refs = {
                row.clause_ref
                for row in db.query(EvidenceTaxonomy)
                .filter(EvidenceTaxonomy.organization_id == org.id)
                .all()
            }

            for seed_row in ALL_SEEDS:
                if seed_row["clause_ref"] in existing_clause_refs:
                    affected = (
                        db.query(EvidenceTaxonomy)
                        .filter(EvidenceTaxonomy.organization_id == org.id)
                        .filter(EvidenceTaxonomy.clause_ref == seed_row["clause_ref"])
                        .filter(
                            or_(
                                EvidenceTaxonomy.search_text.is_(None),
                                func.btrim(EvidenceTaxonomy.search_text) == "",
                                EvidenceTaxonomy.search_text == EvidenceTaxonomy.name,
                            )
                        )
                        .update({EvidenceTaxonomy.search_text: seed_row.get("search_text")}, synchronize_session=False)
                    )
                    updated += int(affected or 0)
                    continue

                db.add(
                    EvidenceTaxonomy(
                        organization_id=org.id,
                        name=seed_row["name"],
                        type=seed_row["type"],
                        control_id=seed_row["control_id"],
                        clause_ref=seed_row["clause_ref"],
                        search_text=seed_row.get("search_text"),
                        validity_days=seed_row["validity_days"],
                    )
                )
                inserted += 1
                existing_clause_refs.add(seed_row["clause_ref"])

        db.commit()
        print(
            "Taxonomía de evidencias sembrada: "
            f"{inserted} registros nuevos, {updated} enriquecidos con search_text (base + anexo A)."
        )
    finally:
        db.close()


if __name__ == "__main__":
    seed()
