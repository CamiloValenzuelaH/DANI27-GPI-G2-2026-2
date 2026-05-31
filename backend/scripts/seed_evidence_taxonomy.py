"""
Seed de taxonomía documental de evidencias.

Uso desde `backend/`:

    python scripts/seed_evidence_taxonomy.py

Inserta los 5 tipos base por organización existente si todavía no existen.
"""

from __future__ import annotations

import sys
from pathlib import Path


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

    # Seeds solicitados: POLICY 365, PROCEDURE 365, INSTRUCTION 180, CONTROL NULL, RECORD 90
    SEEDS = [
        {"type": "POLICY", "name": "Política de Seguridad", "control_id": "ISO 27001 A.5.1", "clause_ref": "A.5.1", "validity_days": 365},
        {"type": "PROCEDURE", "name": "Procedimiento de Seguridad", "control_id": "ISO 27001 A.5.37", "clause_ref": "A.5.37", "validity_days": 365},
        {"type": "INSTRUCTION", "name": "Instrucción Operativa", "control_id": "ISO 27001 A.8.32", "clause_ref": "A.8.32", "validity_days": 180},
        {"type": "CONTROL", "name": "Control Anexo A", "control_id": "ISO 27001 A.8.15", "clause_ref": "A.8.15", "validity_days": None},
        {"type": "RECORD", "name": "Registro de Ejecución", "control_id": "ISO 27001 A.8.33", "clause_ref": "A.8.33", "validity_days": 90},
    ]

    db = SessionLocal()
    try:
        organizations = db.query(Organization).all()
        if not organizations:
            print("No hay organizaciones para sembrar taxonomy.")
            return

        inserted = 0
        for org in organizations:
            existing = {
                row.type
                for row in db.query(EvidenceTaxonomy).filter(EvidenceTaxonomy.organization_id == org.id).all()
            }

            for seed_row in SEEDS:
                if seed_row["type"] in existing:
                    continue

                db.add(
                    EvidenceTaxonomy(
                        organization_id=org.id,
                        name=seed_row["name"],
                        type=seed_row["type"],
                        control_id=seed_row["control_id"],
                        clause_ref=seed_row["clause_ref"],
                        validity_days=seed_row["validity_days"],
                    )
                )
                inserted += 1

        db.commit()
        print(f"Taxonomía de evidencias sembrada: {inserted} registros nuevos.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
