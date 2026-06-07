"""Tareas Celery para generación y orquestación de documentos IA."""

import asyncio
import json
from datetime import datetime, timezone
from typing import Any

from app.core.redis import get_redis_client
from app.services.ai.document_agent import DocumentAgentOrchestrator
from app.workers.celery_app import celery_app

JOB_KEY_PREFIX = "document:job:"
JOB_TTL_SECONDS = 60 * 60 * 24 * 7


def _job_key(job_id: str) -> str:
    return f"{JOB_KEY_PREFIX}{job_id}"


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
    total_sections: int | None = None,
    current_section_index: int | None = None,
    current_section_title: str | None = None,
    current_attempt: int | None = None,
    completed_sections: int | None = None,
) -> None:
    client = get_redis_client()
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
        "total_sections": str(total_sections or 0),
        "completed_sections": str(completed_sections or 0),
        "current_section_index": str(current_section_index or 0),
        "current_section_title": current_section_title or "",
        "current_attempt": str(current_attempt or 0),
        "last_event": event,
        "created_at": now,
        "updated_at": now,
    }

    if isinstance(event_data.get("document_text"), str):
        mapping["document_text"] = event_data["document_text"]

    if isinstance(event_data.get("sections"), list):
        mapping["sections"] = json.dumps(event_data["sections"], ensure_ascii=False)

    await client.hset(_job_key(job_id), mapping=mapping)
    await client.expire(_job_key(job_id), JOB_TTL_SECONDS)


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
        current_attempt: int | None = None,
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
            total_sections=total_sections,
            current_section_index=section_index,
            current_section_title=current_section_title,
            current_attempt=current_attempt,
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
        loop.close()
