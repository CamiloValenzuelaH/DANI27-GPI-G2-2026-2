"""Tareas Celery para validación de auditorías."""

import asyncio
import json
import logging
from datetime import datetime
from math import sqrt

from redis.asyncio import Redis
from sqlalchemy.exc import SQLAlchemyError

from app.db.database import SessionLocal
from app.workers.celery_app import celery_app
from app.workers.file_extraction import extract_text_from_file
from app.workers.gemini_service import (
    generate_embedding,
    analyze_chunk_with_deepseek,
    verify_document_evidence_with_deepseek,
)
from app.core.config import settings
from app.models.external_validation_job import ExternalValidationJob


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
        "title": "Verificación de antecedentes",
        "content": "Verificar antecedentes de empleados y contratistas antes de otorgar acceso a información sensible.",
    },
    {
        "id": "fallback-a-7-2",
        "clause_ref": "A.7.2",
        "title": "Controles de entrada física",
        "content": "Implementar controles de acceso físico, registros de entrada y barreras para proteger áreas sensibles.",
    },
    {
        "id": "fallback-a-8-1",
        "clause_ref": "A.8.1",
        "title": "Dispositivos de usuario final",
        "content": "Asegurar que los dispositivos de usuario final estén protegidos y gestionados según políticas de seguridad de activos.",
    },
    {
        "id": "fallback-a-8-7",
        "clause_ref": "A.8.7",
        "title": "Protección contra malware",
        "content": "Implementar detección, prevención y respuesta a malware para proteger sistemas y datos.",
    },
]

logger = logging.getLogger(__name__)


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
    # Preparar campos para Redis (serializar listas/dicts) y para BD (valores nativos)
    redis_fields = {**fields}
    db_fields = {k: v for k, v in fields.items()}

    for key, value in redis_fields.items():
        if value is None:
            redis_fields[key] = ""
        elif isinstance(value, (list, dict)):
            redis_fields[key] = json.dumps(value)

    # Escribir en Redis siempre
    redis_client = Redis.from_url(settings.redis_url, decode_responses=True)
    try:
        await redis_client.hset(f"validation:job:{job_id}", mapping=redis_fields)
        await redis_client.expire(f"validation:job:{job_id}", 7 * 24 * 60 * 60)
    finally:
        await redis_client.close()

    # Persistir en BD solo al finalizar (completed | failed)
    if str(db_fields.get("status", "")).lower() in ("completed", "failed"):
        db = SessionLocal()
        try:
            job = db.query(ExternalValidationJob).filter(ExternalValidationJob.job_id == job_id).first()
            if not job:
                job = ExternalValidationJob(job_id=job_id)
                db.add(job)

            for key, value in db_fields.items():
                # Skip computed/read-only date properties provided by TimestampMixin
                if key in ("created_date", "updated_date"):
                    continue
                # Avoid setting read-only properties (like @property without setter)
                cls_attr = getattr(type(job), key, None)
                if isinstance(cls_attr, property) and getattr(cls_attr, 'fset', None) is None:
                    continue
                if hasattr(job, key):
                    setattr(job, key, value)

            print(f"[DB PERSIST] guardando job {job_id} status={db_fields.get('status')}")
            db.commit()
            print(f"[DB PERSIST] commit OK job {job_id}")
        except SQLAlchemyError:
            db.rollback()
        finally:
            db.close()


@celery_app.task(bind=True, name="validate_external_audit")
def validate_external_audit(
    self,
    job_id: str,
    file_path: str,
    file_name: str,
    organization_id: str,
    user_id: str,
    content_type: str = "application/octet-stream",
    clause_refs: list[str] | None = None,
    verify_evidence: bool = False,
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
                clause_refs=clause_refs,
                verify_evidence=verify_evidence,
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
    clause_refs: list[str] | None = None,
    verify_evidence: bool = False,
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

    evidence_verified: bool | None = None
    evidence_gaps: list[str] = []
    if verify_evidence:
        await publish_progress(job_id, {
            "status": "processing",
            "progress": 18,
            "message": "Verificando evidencia del documento",
        })
        try:
            evidence_result = await verify_document_evidence_with_deepseek(normalized_text)
            evidence_verified = evidence_result.get("evidence_verified")
            evidence_gaps = evidence_result.get("evidence_gaps", []) or []
        except Exception as exc:
            logger.exception("Error verifying evidence for job %s: %s", job_id, exc)
            evidence_verified = False
            evidence_gaps = [f"Error al verificar evidencia: {exc}"]

        await publish_progress(job_id, {
            "status": "processing",
            "progress": 22,
            "message": "Verificación de evidencia completada",
            "evidence_verified": evidence_verified,
            "evidence_gaps": evidence_gaps,
        })

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

    # If clause_refs provided by user, select those controls deterministically
    if clause_refs:
        selected_chunks: list[dict] = []
        db = SessionLocal()
        try:
            from sqlalchemy import text
            for ref in clause_refs:
                row = db.execute(
                    text(
                        "SELECT id, clause_ref, title, content "
                        "FROM iso_27001_chunks "
                        "WHERE clause_ref = :ref AND section_type = 'annex_a' LIMIT 1"
                    ),
                    {"ref": ref},
                ).fetchone()
                if not row:
                    continue
                selected_chunks.append({
                    "id": str(row[0]),
                    "clause_ref": row[1],
                    "title": row[2],
                    "content": row[3],
                    "relevance_score": None,
                })
        except SQLAlchemyError:
            selected_chunks = []
        finally:
            db.close()

        chunks = selected_chunks[:5]
    else:
        chunks = await get_top_iso_chunks(embedding, 5)
        # Fallback: si no hay chunks en BD (tabla vacía), usar fallback para que el pipeline funcione
        if not chunks:
            logger.warning(f"No chunks found in DB for job {job_id}; using fallback chunks")
            chunks = _fallback_iso_chunks(5)
    
    findings = []

    # Paso 4: Analizar cada chunk
    def build_document_context(normalized_text: str, clause_ref: str) -> str:
        if not normalized_text:
            return ""
        if not clause_ref:
            return normalized_text[:16000]

        idx = normalized_text.find(clause_ref)
        if clause_ref == "A.5.25":
            print("[DEBUG A.5.25] indexOf result:", idx)
            print("[DEBUG A.5.25] clause_ref:", repr(clause_ref))
            print("[DEBUG A.5.25] normalized_text length:", len(normalized_text))
            print("[DEBUG A.5.25] first 5000 chars search...")
            first_idx = normalized_text[:min(20000, len(normalized_text))].find(clause_ref)
            print("[DEBUG A.5.25] first 20k indexOf result:", first_idx)
            if first_idx != -1:
                snippet = normalized_text[max(0, first_idx - 50): min(len(normalized_text), first_idx + len(clause_ref) + 100)]
                print("[DEBUG A.5.25] text around:", repr(snippet))
            # Show content sample
            search_pattern = "5.25"
            if search_pattern in normalized_text:
                pos = normalized_text.find(search_pattern)
                print("[DEBUG A.5.25] found '5.25' at pos:", pos, "context:", repr(normalized_text[max(0, pos-100):pos+150]))

        if idx == -1:
            return normalized_text[:16000]

        before = 3000
        after = 3000
        prefix = normalized_text[:2000]
        start = max(0, idx - before)
        end = min(len(normalized_text), idx + len(clause_ref) + after)
        window = normalized_text[start:end]

        return f"{prefix}\n\n{window}"

    for index, chunk in enumerate(chunks):
        progress = 30 + int(((index + 1) / max(len(chunks), 1)) * 60)

        await publish_progress(job_id, {
            "status": "processing",
            "progress": progress,
            "message": f"Comparando contra {chunk['clause_ref']}",
            "total_chunks": len(chunks),
        })

        try:
            analysis = await analyze_chunk_with_deepseek(
                build_document_context(normalized_text, chunk["clause_ref"]),
                chunk,
                max_output_tokens=2048,
            )
        except Exception as e:
            logger.exception("Error analyzing chunk %s: %s", chunk.get("clause_ref"), e)
            analysis = {
                "score": 0,
                "document_status": "INCOMPLETO",
                "missing_elements": [],
                "observations": [],
                "suggestions": [],
            }

        # Safety: ensure analysis is a dict with expected keys
        if not isinstance(analysis, dict):
            logger.error("Unexpected analysis type for chunk %s: %r", chunk.get("clause_ref"), analysis)
            analysis = {
                "score": 0,
                "document_status": "INCOMPLETO",
                "missing_elements": [],
                "observations": [],
                "suggestions": [],
            }

        findings.append({
            "clause_ref": chunk["clause_ref"],
            "title": chunk["title"],
            "relevance_score": chunk["relevance_score"],
            "compliance_score": int(analysis.get("score", 0) or 0),
            "document_status": analysis.get("document_status", "INCOMPLETO"),
            "missing_elements": analysis.get("missing_elements", []),
            "observations": analysis.get("observations", []),
            "suggestions": analysis.get("suggestions", []),
        })

    # Paso 5: Calcular score general
    if findings:
        try:
            overall_score = clamp_score(sum(f["compliance_score"] for f in findings) / len(findings))
        except Exception as e:
            logger.exception("Error calculando overall_score: %s", e)
            overall_score = 0
            # attach error to summary/result later
    else:
        logger.warning("No findings were produced for job %s", job_id)
        overall_score = 0
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
        "evidence_verified": evidence_verified,
        "evidence_gaps": evidence_gaps,
        "error": "" if findings else "No se obtuvieron hallazgos del agente; revisar logs del worker",
    }

    await publish_progress(job_id, result)

    return result
