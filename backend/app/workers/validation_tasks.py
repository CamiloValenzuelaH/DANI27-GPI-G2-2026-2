"""Tareas Celery para validación de auditorías."""

import asyncio
import json
from datetime import datetime
from math import sqrt

from redis.asyncio import Redis
from sqlalchemy.exc import SQLAlchemyError

from app.db.database import SessionLocal
from app.workers.celery_app import celery_app
from app.workers.file_extraction import extract_text_from_file
from app.workers.gemini_service import generate_embedding, analyze_chunk_with_deepseek
from app.core.config import settings


_FALLBACK_ISO_CHUNKS = [
    {
        "id": "fallback-a-5-1",
        "clause_ref": "A.5.1",
        "title": "Gobierno y políticas de seguridad",
        "content": "Definir políticas, responsabilidades y revisiones periódicas para la gestión de seguridad de la información.",
    },
    {
        "id": "fallback-a-6-1",
        "clause_ref": "A.6.1",
        "title": "Roles y responsabilidades",
        "content": "Asignar responsables claros, separar funciones críticas y documentar la rendición de cuentas en procesos de seguridad.",
    },
    {
        "id": "fallback-a-7-2",
        "clause_ref": "A.7.2",
        "title": "Concientización y formación",
        "content": "Asegurar que el personal reciba formación y recordatorios sobre prácticas seguras y manejo correcto de evidencias.",
    },
    {
        "id": "fallback-a-8-1",
        "clause_ref": "A.8.1",
        "title": "Controles de acceso",
        "content": "Restringir el acceso a información, sistemas y ubicaciones físicas según necesidad de negocio y privilegio mínimo.",
    },
    {
        "id": "fallback-a-8-7",
        "clause_ref": "A.8.7",
        "title": "Registro y monitoreo",
        "content": "Conservar registros y monitorear eventos relevantes para detectar incidentes, trazabilidad y desviaciones.",
    },
]


def _cosine_similarity(left: list[float], right: list[float]) -> float:
    if not left or not right:
        return 0.0
    length = min(len(left), len(right))
    left_slice = left[:length]
    right_slice = right[:length]
    dot_product = sum(a * b for a, b in zip(left_slice, right_slice))
    left_norm = sqrt(sum(value * value for value in left_slice))
    right_norm = sqrt(sum(value * value for value in right_slice))
    if left_norm == 0 or right_norm == 0:
        return 0.0
    return dot_product / (left_norm * right_norm)


def _fallback_iso_chunks(limit: int) -> list[dict]:
    return [dict(chunk, relevance_score=0.0) for chunk in _FALLBACK_ISO_CHUNKS[:limit]]


def clamp_score(score: int | float) -> int:
    """Clamp de score entre 0-100."""
    return max(0, min(100, int(score or 0)))


def summarize_results(findings: list) -> str:
    """Genera un resumen de los resultados."""
    if not findings:
        return "No se encontraron fragmentos relevantes para validar."

    average = clamp_score(
        sum(f.get("compliance_score", 0) for f in findings) / len(findings)
    )
    critical_count = sum(
        len([o for o in f.get("observations", []) if o.get("severity") == "critical"])
        for f in findings
    )
    major_count = sum(
        len([o for o in f.get("observations", []) if o.get("severity") == "major"])
        for f in findings
    )

    return (
        f"Validación granular completada sobre {len(findings)} fragmentos ISO. "
        f"Score promedio {average}. "
        f"Hallazgos críticos: {critical_count}. "
        f"Hallazgos mayores: {major_count}."
    )


async def get_top_iso_chunks(embedding: list[float], limit: int = 5) -> list[dict]:
    """Obtiene los chunks ISO más relevantes usando similitud coseno en pgvector."""
    db = SessionLocal()
    try:
        from sqlalchemy import text

        embedding_literal = "[" + ",".join(f"{float(value):.8f}" for value in embedding) + "]"

        query = text("""
            SELECT
                id,
                clause_ref,
                title,
                content,
                1 - (embedding <=> CAST(:embedding AS vector)) as relevance_score
            FROM iso_27001_chunks
            WHERE embedding IS NOT NULL
            ORDER BY embedding <=> CAST(:embedding AS vector)
            LIMIT :limit
        """)

        result = db.execute(query, {"embedding": embedding_literal, "limit": limit})
        rows = result.fetchall()

        if not rows:
            return []

        chunks = []
        for row in rows:
            chunks.append({
                "id": str(row[0]),
                "clause_ref": row[1],
                "title": row[2],
                "content": row[3],
                "relevance_score": float(row[4]),
            })
        return chunks
    except SQLAlchemyError:
        return []
    finally:
        db.close()


async def publish_progress(job_id: str, fields: dict) -> None:
    """Publica el progreso de un job en Redis."""
    now_iso = datetime.utcnow().isoformat()
    now_date = datetime.utcnow().date().isoformat()
    fields["updated_at"] = fields.get("updated_at") or now_iso
    fields["updated_date"] = fields.get("updated_date") or now_date
    
    # Convertir listas/dicts a JSON strings para Redis
    for key, value in fields.items():
        if isinstance(value, (list, dict)):
            fields[key] = json.dumps(value)

    # Crear cliente Redis para esta operación
    redis_client = Redis.from_url(settings.redis_url, decode_responses=True)
    try:
        await redis_client.hset(f"validation:job:{job_id}", mapping=fields)
        await redis_client.expire(f"validation:job:{job_id}", 7 * 24 * 60 * 60)
    finally:
        await redis_client.close()


@celery_app.task(bind=True, name="validate_external_audit")
def validate_external_audit(
    self,
    job_id: str,
    file_path: str,
    file_name: str,
    organization_id: str,
    user_id: str,
    content_type: str = "application/octet-stream",
):
    """Tarea principal de validación de auditoría externa."""
    
    # Usar asyncio para ejecutar código async
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    
    try:
        result = loop.run_until_complete(
            _validate_external_audit_async(
                job_id=job_id,
                file_path=file_path,
                file_name=file_name,
                organization_id=organization_id,
                user_id=user_id,
            )
        )
        return result
    except Exception as e:
        loop.run_until_complete(
            publish_progress(job_id, {
                "status": "failed",
                "error": str(e),
                "progress": 0,
            })
        )
        raise
    finally:
        loop.close()


async def _validate_external_audit_async(
    job_id: str,
    file_path: str,
    file_name: str,
    organization_id: str,
    user_id: str,
) -> dict:
    """Lógica async de validación."""
    
    # Paso 1: Extraer texto
    await publish_progress(job_id, {
        "job_id": job_id,
        "status": "processing",
        "progress": 3,
        "message": "Extrayendo texto del documento",
        "organization_id": organization_id,
        "user_id": user_id,
        "file_name": file_name,
        "file_path": file_path,
        "total_chunks": 0,
        "overall_score": "",
        "findings": [],
        "summary": "",
        "error": "",
    })

    document_text = await extract_text_from_file(file_path, 100000)
    normalized_text = document_text.strip()

    if len(normalized_text) < 20:
        raise ValueError("No se pudo extraer suficiente texto del documento")

    # Paso 2: Generar embedding
    await publish_progress(job_id, {
        "status": "processing",
        "progress": 15,
        "message": "Generando embedding del documento",
    })

    embedding = await generate_embedding(normalized_text)

    # Paso 3: Buscar chunks relevantes
    await publish_progress(job_id, {
        "status": "processing",
        "progress": 30,
        "message": "Buscando fragmentos ISO relevantes con pgvector",
    })

    chunks = await get_top_iso_chunks(embedding, 5)
    findings = []

    # Paso 4: Analizar cada chunk
    for index, chunk in enumerate(chunks):
        progress = 30 + int(((index + 1) / max(len(chunks), 1)) * 60)

        await publish_progress(job_id, {
            "status": "processing",
            "progress": progress,
            "message": f"Comparando contra {chunk['clause_ref']}",
            "total_chunks": len(chunks),
        })

        analysis = await analyze_chunk_with_deepseek(
            normalized_text[:8000],
            chunk,
            max_output_tokens=2048,
        )

        findings.append({
            "clause_ref": chunk["clause_ref"],
            "title": chunk["title"],
            "relevance_score": chunk["relevance_score"],
            "compliance_score": analysis["score"],
            "document_status": analysis.get("document_status", "INCOMPLETO"),
            "missing_elements": analysis.get("missing_elements", []),
            "observations": analysis["observations"],
            "suggestions": analysis["suggestions"],
        })

    # Paso 5: Calcular score general
    overall_score = (
        clamp_score(sum(f["compliance_score"] for f in findings) / len(findings))
        if findings
        else 0
    )
    summary = summarize_results(findings)

    # Paso 6: Completar
    result = {
        "job_id": job_id,
        "status": "completed",
        "progress": 100,
        "message": "Validación completada",
        "organization_id": organization_id,
        "user_id": user_id,
        "file_name": file_name,
        "file_path": file_path,
        "total_chunks": len(chunks),
        "overall_score": overall_score,
        "findings": findings,
        "summary": summary,
        "error": "",
    }

    await publish_progress(job_id, result)

    return result
