"""Seed de chunks ISO 27001 para validación semántica.

Uso:

    python scripts/seed_iso_chunks.py

Este script usa un catálogo normalizado/parafraseado derivado del cuestionario
interno del proyecto porque el texto literal de ISO 27001 no puede
redistribuirse aquí. Si tienes una fuente licenciada del estándar, puedes
reemplazar el contenido del catálogo sin tocar el resto del pipeline.
"""

from __future__ import annotations

import asyncio
import os
import sys
import uuid
from dataclasses import dataclass
from pathlib import Path


def ensure_backend_on_path() -> None:
    script_path = Path(__file__).resolve()
    backend_dir = script_path.parent.parent
    if str(backend_dir) not in sys.path:
        sys.path.insert(0, str(backend_dir))


ensure_backend_on_path()
from scripts.seed_assessment_questions import ANNEX_A_CONTROLS, PHASES  # noqa: E402


EMBEDDING_DIMENSIONS = int(os.getenv("ISO_EMBEDDING_DIMENSIONS", "1536"))
UUID_NAMESPACE = uuid.UUID("c8f5a1a8-5f6d-4d2f-9a0b-63a2f6d9bc01")


@dataclass(frozen=True)
class ChunkSeed:
    clause_ref: str
    title: str
    content: str


def build_phase_chunks() -> list[ChunkSeed]:
    chunks: list[ChunkSeed] = []
    for phase in PHASES:
        for question in phase["questions"]:
            clause_ref = question["clause_ref"]
            title = f"{phase['name']} - {clause_ref}"
            content = " ".join(
                part
                for part in [
                    question["text"],
                    question.get("evidence_hint") or "",
                ]
                if part
            )
            chunks.append(ChunkSeed(clause_ref=clause_ref, title=title, content=content))
    return chunks


def build_annex_chunks() -> list[ChunkSeed]:
    chunks: list[ChunkSeed] = []
    for clause_ref, control_label, _is_critical in ANNEX_A_CONTROLS:
        title = f"Anexo A - {clause_ref}"
        content = (
            f"Control {clause_ref}: {control_label}. "
            "Resumen operativo del control para fines de validación. "
            "Adjunta política, procedimiento, registro o evidencia asociada."
        )
        chunks.append(ChunkSeed(clause_ref=clause_ref, title=title, content=content))
    return chunks


def build_chunk_catalog() -> list[ChunkSeed]:
    return build_phase_chunks() + build_annex_chunks()


def embedding_to_literal(values: list[float]) -> str:
    if len(values) != EMBEDDING_DIMENSIONS:
        raise ValueError(
            f"Embedding con {len(values)} dimensiones, se esperaban {EMBEDDING_DIMENSIONS}"
        )
    return "[" + ",".join(f"{float(value):.8f}" for value in values) + "]"


def chunk_id(chunk: ChunkSeed) -> uuid.UUID:
    return uuid.uuid5(UUID_NAMESPACE, f"iso-27001::{chunk.clause_ref}::{chunk.title}")


async def seed_async() -> None:
    from app.db.database import SessionLocal
    from app.workers.gemini_service import generate_embedding

    db = SessionLocal()
    try:
        force_reseed = os.getenv("FORCE_RESEED_ISO_CHUNKS", "0").lower() in {"1", "true", "yes"}
        catalog = build_chunk_catalog()
        if not catalog:
            print("No hay chunks para insertar.")
            return

        from sqlalchemy import text

        existing_count = db.execute(text("SELECT COUNT(*) FROM iso_27001_chunks")).scalar_one()
        if existing_count and not force_reseed:
            print(
                "Seed ISO omitido: iso_27001_chunks ya tiene datos "
                f"(rows={existing_count}). Define FORCE_RESEED_ISO_CHUNKS=1 para regenerar embeddings."
            )
            return

        insert_sql = text(
            """
            INSERT INTO iso_27001_chunks (id, clause_ref, title, content, embedding)
            VALUES (:id, :clause_ref, :title, :content, CAST(:embedding AS vector))
            ON CONFLICT (id) DO UPDATE SET
                clause_ref = EXCLUDED.clause_ref,
                title = EXCLUDED.title,
                content = EXCLUDED.content,
                embedding = EXCLUDED.embedding
            """
        )

        inserted = 0
        for chunk in catalog:
            if not chunk.content.strip():
                continue

            embedding = await generate_embedding(chunk.content)
            embedding_literal = embedding_to_literal(embedding)
            db.execute(
                insert_sql,
                {
                    "id": str(chunk_id(chunk)),
                    "clause_ref": chunk.clause_ref,
                    "title": chunk.title,
                    "content": chunk.content,
                    "embedding": embedding_literal,
                },
            )
            inserted += 1

        db.commit()
        print(f"Seed ISO completado: chunks_guardados={inserted}")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def seed() -> None:
    asyncio.run(seed_async())


if __name__ == "__main__":
    seed()
