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
import re
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
    contents_by_ref = load_annex_a_control_contents()
    chunks: list[ChunkSeed] = []
    for clause_ref, control_label, _is_critical in ANNEX_A_CONTROLS:
        title = f"Anexo A - {clause_ref}: {control_label.capitalize()}"
        generic_content = (
            f"Anexo A - {clause_ref}. "
            "Evidencia básica: documento o registro que demuestre su implementación."
        )
        content = contents_by_ref.get(clause_ref, generic_content)
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
    stable_text = f"iso-27001::{chunk.clause_ref}::{chunk.title}::{chunk.content}"
    return uuid.uuid5(UUID_NAMESPACE, stable_text)


def load_annex_a_control_contents() -> dict[str, str]:
    sql_path = Path(__file__).resolve().parent.parent.parent / "sql_updates_annex_a_93_fixed.sql"
    if not sql_path.exists():
        return {}

    pattern = re.compile(
        r"UPDATE\s+iso_27001_chunks\s+SET\s+content\s*=\s*'(?P<content>(?:[^']|'')*)'\s+WHERE\s+clause_ref\s*=\s*'(?P<ref>A\.\d+\.\d+)'\s+AND\s+section_type\s*=\s*'annex_a';",
        re.IGNORECASE,
    )

    contents: dict[str, str] = {}
    for line in sql_path.read_text(encoding="utf-8").splitlines():
        if not line.strip().upper().startswith("UPDATE"):
            continue
        match = pattern.match(line.strip())
        if not match:
            continue
        content = match.group("content").replace("''", "'")
        clause_ref = match.group("ref")
        contents[clause_ref] = content

    return contents


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

        existing_rows = db.execute(
            text(
                "SELECT id, clause_ref, title, content, embedding IS NOT NULL AS has_embedding "
                "FROM iso_27001_chunks WHERE section_type = 'annex_a'"
            )
        ).fetchall()
        existing_by_id = {
            str(row[0]): {
                "clause_ref": row[1],
                "title": row[2],
                "content": row[3],
                "has_embedding": bool(row[4]),
            }
            for row in existing_rows
        }

        insert_sql = text(
            "INSERT INTO iso_27001_chunks (id, clause_ref, title, content, section_type, embedding) "
            "VALUES (:id, :clause_ref, :title, :content, :section_type, CAST(:embedding AS vector))"
        )
        update_sql = text(
            "UPDATE iso_27001_chunks "
            "SET title = :title, content = :content, embedding = CAST(:embedding AS vector) "
            "WHERE id = :id"
        )

        inserted = 0
        updated = 0
        skipped = 0
        seen_ids: set[str] = set()
        for chunk in catalog:
            if not chunk.content.strip():
                skipped += 1
                continue

            chunk_uuid = chunk_id(chunk)
            chunk_id_str = str(chunk_uuid)
            if chunk_id_str in seen_ids:
                skipped += 1
                continue
            seen_ids.add(chunk_id_str)

            existing = existing_by_id.get(chunk_id_str)
            if existing and not force_reseed:
                if (
                    existing["title"] == chunk.title
                    and existing["content"] == chunk.content
                    and existing["has_embedding"]
                ):
                    skipped += 1
                    continue

            embedding = await generate_embedding(chunk.content)
            embedding_literal = embedding_to_literal(embedding)

            if existing:
                db.execute(
                    update_sql,
                    {
                        "id": chunk_id_str,
                        "title": chunk.title,
                        "content": chunk.content,
                        "embedding": embedding_literal,
                    },
                )
                updated += 1
            else:
                db.execute(
                    insert_sql,
                    {
                        "id": chunk_id_str,
                        "clause_ref": chunk.clause_ref,
                        "title": chunk.title,
                        "content": chunk.content,
                        "section_type": "annex_a",
                        "embedding": embedding_literal,
                    },
                )
                inserted += 1

        db.commit()
        print(
            f"Seed ISO completado: insertados={inserted}, actualizados={updated}, omitidos={skipped}"
        )
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def seed() -> None:
    asyncio.run(seed_async())


if __name__ == "__main__":
    seed()
