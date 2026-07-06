"""Tareas Celery para generación y orquestación de documentos IA."""

import asyncio
import hashlib
import json
import logging
import uuid
from datetime import datetime, timezone
from typing import Any

from app.core.redis import get_redis_client
from app.core.config import settings
from app.db.database import SessionLocal
from app.models.document import Document, DocumentSection, DocumentType, DocumentVersion
from app.services.ai.document_agent import DocumentAgentOrchestrator
from app.workers.celery_app import celery_app

logger = logging.getLogger(__name__)

JOB_KEY_PREFIX = "document:job:"
JOB_TTL_SECONDS = 60 * 60 * 24 * 7


def _job_key(job_id: str) -> str:
    return f"{JOB_KEY_PREFIX}{job_id}"


def _persist_generated_document(
    organization_id: str,
    user_id: str,
    request_payload: dict[str, Any],
    document_text: str,
    sections: list[dict[str, Any]],
) -> None:
    db = SessionLocal()
    try:
        document_type_value = str(request_payload.get("type") or "general").lower()
        try:
            document_type = DocumentType(document_type_value)
        except ValueError:
            document_type = DocumentType.general

        document = Document(
            organization_id=uuid.UUID(organization_id),
            created_by=uuid.UUID(user_id),
            updated_by=uuid.UUID(user_id),
            type=document_type,
            title=str(request_payload.get("title") or "Documento generado"),
            description=str(request_payload.get("description") or ""),
            summary=str(request_payload.get("description") or document_text[:200] or "Documento generado por IA."),
        )
        db.add(document)
        db.flush()

        content_hash = hashlib.sha256(document_text.encode("utf-8")).hexdigest()
        version = DocumentVersion(
            document_id=document.id,
            version_number="1",
            title=document.title,
            description=document.description,
            summary=document.summary,
            content=document_text,
            content_hash=content_hash,
            created_by=uuid.UUID(user_id),
        )
        db.add(version)
        db.flush()

        control_contexts = request_payload.get("control_contexts") or request_payload.get("control_refs") or []
        if not isinstance(control_contexts, list):
            control_contexts = []

        for index, section in enumerate(sections, start=1):
            section_title = str(section.get("title") or f"Sección {index}")
            section_content = str(section.get("content") or section.get("summary") or "").strip()
            if not section_content:
                continue

            document_section = DocumentSection(
                document_version_id=version.id,
                section_index=index,
                section_title=section_title,
                section_content=section_content,
                control_contexts=control_contexts,
            )
            db.add(document_section)

        db.commit()
    except Exception:
        try:
            db.rollback()
        except Exception:
            pass
        raise
    finally:
        try:
            db.close()
        except Exception:
            pass


async def publish_document_progress(
    job_id: str,
    event: str,
    payload: dict[str, Any],
    status: str,
    progress: int,
    message: str,
    organization_id: str,
    user_id: str,
    document_title: str | None = None,
    document_type: str | None = None,
    total_sections: int | None = None,
    current_section_index: int | None = None,
    current_section_title: str | None = None,
    current_attempt: int | None = None,
    completed_sections: int | None = None,
) -> None:
    import redis.asyncio as aioredis
    client = aioredis.from_url(
        str(settings.redis_url),
        encoding="utf-8",
        decode_responses=True,
    )
    now = datetime.now(timezone.utc).isoformat()
    event_data = payload.copy()
    if event == "document_complete" and isinstance(event_data.get("document_text"), str):
        # Evitar almacenar documentos excesivamente largos en Redis
        full_text = event_data["document_text"]
        if len(full_text) > 20000:
            event_data["document_text"] = full_text[:20000] + "\n... (truncated)"

    mapping: dict[str, str] = {
        "job_id": job_id,
        "event": event,
        "event_data": json.dumps(event_data, ensure_ascii=False),
        "status": status,
        "progress": str(progress),
        "message": message,
        "organization_id": organization_id,
        "user_id": user_id,
        "document_title": document_title or "",
        "document_type": document_type or "",
        "total_sections": str(total_sections or 0),
        "completed_sections": str(completed_sections or 0),
        "current_section_index": str(current_section_index or 0),
        "current_section_title": current_section_title or "",
        "current_attempt": str(current_attempt or 0),
        "last_event": event,
        "created_at": now,
        "created_date": datetime.now(timezone.utc).date().isoformat(),
        "updated_at": now,
        "updated_date": datetime.now(timezone.utc).date().isoformat(),
    }

    if isinstance(event_data.get("document_text"), str):
        mapping["document_text"] = event_data["document_text"]

    if isinstance(event_data.get("sections"), list):
        mapping["sections"] = json.dumps(event_data["sections"], ensure_ascii=False)

    await client.hset(_job_key(job_id), mapping=mapping)
    await client.expire(_job_key(job_id), JOB_TTL_SECONDS)
    await client.aclose()


async def _write_initial_job_state(
    job_id: str,
    organization_id: str,
    user_id: str,
    document_title: str,
    total_sections: int,
) -> None:
    await publish_document_progress(
        job_id=job_id,
        event="job_queued",
        payload={
            "document_title": document_title,
            "total_sections": total_sections,
        },
        status="queued",
        progress=0,
        message="Job encolado para generación de documento.",
        organization_id=organization_id,
        user_id=user_id,
        document_title=document_title,
        total_sections=total_sections,
        current_section_index=0,
        current_section_title="",
        current_attempt=0,
        completed_sections=0,
    )


@celery_app.task(bind=True, name="generate_document_full")
def generate_document_full(
    self,
    job_id: str,
    request_payload: dict[str, Any],
    organization_id: str,
    user_id: str,
):
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)

    async def _progress_callback(
        event: str,
        payload: dict[str, Any],
        status: str,
        progress: int,
        message: str,
        section_index: int | None = None,
        total_sections: int | None = None,
        attempts: int | None = None,
        current_section_title: str | None = None,
        completed_sections: int | None = None,
    ) -> None:
        await publish_document_progress(
            job_id=job_id,
            event=event,
            payload=payload,
            status=status,
            progress=progress,
            message=message,
            organization_id=organization_id,
            user_id=user_id,
            document_title=request_payload.get("title"),
            document_type=str(request_payload.get("type") or "general"),
            total_sections=total_sections,
            current_section_index=section_index,
            current_section_title=current_section_title,
            current_attempt=attempts,
            completed_sections=completed_sections,
        )

    try:
        loop.run_until_complete(_write_initial_job_state(
            job_id=job_id,
            organization_id=organization_id,
            user_id=user_id,
            document_title=str(request_payload.get("title") or "Documento ISO 27001"),
            total_sections=0,
        ))

        orchestrator = DocumentAgentOrchestrator(
            request_payload=request_payload,
            progress_callback=_progress_callback,
        )

        result = loop.run_until_complete(orchestrator.generate_full_document())

        try:
            _persist_generated_document(
                organization_id=organization_id,
                user_id=user_id,
                request_payload=request_payload,
                document_text=str(result.get("document_text") or ""),
                sections=result.get("sections") or [],
            )
        except Exception as e:
            logger.error(f"Error persisting generated document for job {job_id}: {str(e)}", exc_info=True)

        return result
    except Exception as exc:
        loop.run_until_complete(publish_document_progress(
            job_id=job_id,
            event="document_failed",
            payload={"error": str(exc)},
            status="failed",
            progress=0,
            message=str(exc),
            organization_id=organization_id,
            user_id=user_id,
            document_title=str(request_payload.get("title") or "Documento ISO 27001"),
            total_sections=0,
            current_section_index=0,
            current_section_title="",
            current_attempt=0,
            completed_sections=0,
        ))
        raise
    finally:
        try:
            loop.run_until_complete(loop.shutdown_asyncgens())
        except Exception:
            pass
        loop.close()
