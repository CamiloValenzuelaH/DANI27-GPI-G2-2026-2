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
    from app.models.evidence_taxonomy import EvidenceTaxonomy, DEFAULT_TAXONOMY_SEEDS

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

            for seed_row in DEFAULT_TAXONOMY_SEEDS:
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
