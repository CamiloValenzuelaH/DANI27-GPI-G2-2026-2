from __future__ import annotations

import asyncio
import json
from datetime import datetime
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, File, Form, UploadFile, status
from fastapi.responses import StreamingResponse
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.dependencies import get_current_user, require_roles
from app.core.redis import get_redis_client
from app.db.database import get_db
from app.models.user import User
from app.schemas.document import (
    DocumentDetailResponse,
    DocumentGenerationJobResponse,
    DocumentGenerationProgressResponse,
    DocumentGenerationRequest,
    DocumentMetadata,
    DocumentUploadResponse,
)
from app.workers.document_tasks import generate_document_full, JOB_KEY_PREFIX

router = APIRouter(prefix="/documents", tags=["documents"])


USER_DOCUMENT_PREFIX = "document:doc:"
USER_DOCUMENT_SET_PREFIX = "document:set:"
USER_DOCUMENT_TTL_SECONDS = 60 * 60 * 24 * 30


def _job_key(job_id: str) -> str:
    return f"{JOB_KEY_PREFIX}{job_id}"


def _user_document_key(document_id: str) -> str:
    return f"{USER_DOCUMENT_PREFIX}{document_id}"


def _user_document_index_key(org_id: str) -> str:
    return f"{USER_DOCUMENT_SET_PREFIX}{org_id}"


async def _load_user_document(document_id: str, current_user: User) -> dict[str, str]:
    redis_client = get_redis_client()
    raw = await redis_client.hgetall(_user_document_key(document_id))
    if not raw:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Documento no encontrado")

    org_id = raw.get("organization_id")
    if not org_id or str(org_id) != str(current_user.organization_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Documento fuera de alcance")

    return raw


async def _list_user_documents(current_user: User) -> list[DocumentMetadata]:
    redis_client = get_redis_client()
    document_ids = await redis_client.smembers(_user_document_index_key(str(current_user.organization_id)))
    documents: list[DocumentMetadata] = []

    for document_id in sorted(document_ids):
        raw = await redis_client.hgetall(_user_document_key(document_id))
        if not raw:
            await redis_client.srem(_user_document_index_key(str(current_user.organization_id)), document_id)
            continue

        created_date = raw.get("created_date")
        if not created_date and raw.get("created_at"):
            try:
                created_date = datetime.fromisoformat(raw.get("created_at")).date().isoformat()
            except Exception:
                created_date = None

        documents.append(DocumentMetadata(
            documentId=document_id,
            title=raw.get("title", "Documento sin título"),
            description=raw.get("description"),
            created_at=datetime.fromisoformat(raw.get("created_at")) if raw.get("created_at") else None,
            created_date=created_date,
        ))

    return documents


def _load_control_contexts(db: Session, control_ids: list[str] | None) -> list[dict[str, str]]:
    if not control_ids:
        return []

    contexts: list[dict[str, str]] = []
    seen: set[str] = set()

    for control_id in control_ids:
        if not control_id:
            continue
        normalized_id = str(control_id).strip()
        if not normalized_id or normalized_id in seen:
            continue
        seen.add(normalized_id)

        result = db.execute(
            text(
                """
                SELECT id, clause_ref, title, content
                FROM iso_27001_chunks
                WHERE CAST(id AS TEXT) = :control_id
                   OR clause_ref = :control_id
                LIMIT 1
                """
            ),
            {"control_id": normalized_id},
        ).fetchone()

        if not result:
            continue

        contexts.append({
            "id": str(result[0]),
            "clause_ref": str(result[1] or ""),
            "title": str(result[2] or ""),
            "content": str(result[3] or ""),
        })

    return contexts


async def _read_job_state(job_id: str) -> DocumentGenerationProgressResponse:
    redis_client = get_redis_client()
    raw = await redis_client.hgetall(_job_key(job_id))
    if not raw:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job no encontrado")

    try:
        last_event_data = json.loads(raw.get("event_data") or "null")
    except json.JSONDecodeError:
        last_event_data = None

    def _parse_int(value: str | None) -> int:
        try:
            return int(float(value or "0"))
        except (TypeError, ValueError):
            return 0

    def _parse_uuid(value: str | None):
        if not value:
            return None
        try:
            return UUID(value)
        except Exception:
            return None

    def _parse_datetime(value: str | None) -> datetime | None:
        if not value:
            return None
        try:
            return datetime.fromisoformat(value)
        except ValueError:
            return None

    sections_raw = raw.get("sections") or "[]"
    try:
        sections = json.loads(sections_raw)
    except json.JSONDecodeError:
        sections = []

    return DocumentGenerationProgressResponse(
        job_id=raw.get("job_id", job_id),
        status=raw.get("status", "queued"),
        progress=_parse_int(raw.get("progress")),
        message=raw.get("message") or None,
        organization_id=_parse_uuid(raw.get("organization_id")),
        user_id=_parse_uuid(raw.get("user_id")),
        document_title=raw.get("document_title") or None,
        total_sections=_parse_int(raw.get("total_sections")),
        completed_sections=_parse_int(raw.get("completed_sections")),
        current_section_index=_parse_int(raw.get("current_section_index")),
        current_section_title=raw.get("current_section_title") or None,
        current_attempt=_parse_int(raw.get("current_attempt")),
        last_event=raw.get("last_event") or None,
        last_event_data=last_event_data,
        document_text=raw.get("document_text") or None,
        sections=sections,
        created_at=_parse_datetime(raw.get("created_at")),
        updated_at=_parse_datetime(raw.get("updated_at")),
        created_date=(raw.get("created_date")
                      or (datetime.fromisoformat(raw.get("created_at")).date().isoformat() if raw.get("created_at") else None)),
    )


def _get_user_from_access_token(access_token: str | None, db: Session) -> User:
    if not access_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token requerido")

    from app.core.security import decode_access_token

    try:
        payload = decode_access_token(access_token)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado",
        )

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token without subject")

    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found or inactive")

    return user


@router.post("/generate/full", response_model=DocumentGenerationJobResponse, status_code=status.HTTP_202_ACCEPTED)
async def create_document_generation_job(
    payload: DocumentGenerationRequest,
    current_user: User = Depends(require_roles("admin", "ciso")),
    db: Session = Depends(get_db),
):
    job_id = str(uuid4())

    control_contexts = _load_control_contexts(db, payload.control_ids)
    request_payload = payload.model_dump()
    if control_contexts:
        request_payload["control_contexts"] = control_contexts

    redis_client = get_redis_client()
    await redis_client.hset(
        _job_key(job_id),
        mapping={
            "job_id": job_id,
            "status": "queued",
            "progress": "0",
            "message": "Job encolado",
            "organization_id": str(current_user.organization_id),
            "user_id": str(current_user.id),
            "document_title": payload.title,
            "total_sections": "0",
            "completed_sections": "0",
            "current_section_index": "0",
            "current_section_title": "",
            "current_attempt": "0",
            "last_event": "job_queued",
            "event_data": json.dumps({"document_title": payload.title}, ensure_ascii=False),
            "created_at": datetime.utcnow().isoformat(),
            "created_date": datetime.utcnow().date().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
        },
    )
    await redis_client.expire(_job_key(job_id), 60 * 60 * 24 * 7)

    generate_document_full.delay(
        job_id=job_id,
        request_payload=request_payload,
        organization_id=str(current_user.organization_id),
        user_id=str(current_user.id),
    )

    return DocumentGenerationJobResponse(
        job_id=job_id,
        status="queued",
        stream_url=f"/api/v1/documents/generate/full/{job_id}/events",
    )


@router.post("/upload", response_model=DocumentUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    title: str = Form(...),
    description: str | None = Form(None),
    content: str | None = Form(None),
    file: UploadFile | None = File(None),
    current_user: User = Depends(get_current_user),
):
    document_id = str(uuid4())
    document_text = (content or "").strip()

    if file is not None and not document_text:
        raw_bytes = await file.read()
        document_text = raw_bytes.decode("utf-8", errors="replace").strip()

    if not document_text:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Se requiere contenido o archivo")

    title = title.strip() or (file.filename if file is not None else "Documento cargado")
    redis_client = get_redis_client()
    await redis_client.hset(
        _user_document_key(document_id),
        mapping={
            "document_id": document_id,
            "organization_id": str(current_user.organization_id),
            "user_id": str(current_user.id),
            "title": title,
            "description": description or "",
            "document_text": document_text,
            "created_at": datetime.utcnow().isoformat(),
            "created_date": datetime.utcnow().date().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
            "updated_date": datetime.utcnow().date().isoformat(),
            "last_event": "uploaded",
        },
    )
    await redis_client.sadd(_user_document_index_key(str(current_user.organization_id)), document_id)
    await redis_client.expire(_user_document_key(document_id), USER_DOCUMENT_TTL_SECONDS)
    await redis_client.expire(_user_document_index_key(str(current_user.organization_id)), USER_DOCUMENT_TTL_SECONDS)

    return DocumentUploadResponse(
        documentId=document_id,
        title=title,
        description=description,
        message="Documento subido correctamente",
        created_date=datetime.utcnow().date().isoformat(),
    )


@router.get("", response_model=list[DocumentMetadata])
async def list_documents(
    current_user: User = Depends(get_current_user),
):
    return await _list_user_documents(current_user)


@router.get("/{document_id}", response_model=DocumentDetailResponse)
async def get_document(
    document_id: str,
    current_user: User = Depends(get_current_user),
):
    raw = await _load_user_document(document_id, current_user)
    return DocumentDetailResponse(
        documentId=document_id,
        title=raw.get("title", "Documento sin título"),
        description=raw.get("description"),
        documentText=raw.get("document_text"),
        created_at=datetime.fromisoformat(raw.get("created_at")) if raw.get("created_at") else None,
    )


@router.get("/generate/full/{job_id}", response_model=DocumentGenerationProgressResponse)
async def get_document_generation_job(
    job_id: str,
    current_user: User = Depends(get_current_user),
):
    report = await _read_job_state(job_id)
    if report.organization_id and str(report.organization_id) != str(current_user.organization_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Job fuera de alcance")
    return report


@router.get("/generate/full/{job_id}/events")
async def stream_document_generation_job(
    job_id: str,
    access_token: str | None = None,
    db: Session = Depends(get_db),
):
    current_user = _get_user_from_access_token(access_token, db)

    async def event_generator():
        last_payload: str | None = None
        while True:
            report = await _read_job_state(job_id)
            if report.organization_id and str(report.organization_id) != str(current_user.organization_id):
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Job fuera de alcance")

            payload = {
                "event": report.last_event,
                "data": report.last_event_data,
                "status": report.status,
                "progress": report.progress,
                "message": report.message,
                "document_title": report.document_title,
                "current_section_index": report.current_section_index,
                "current_section_title": report.current_section_title,
                "current_attempt": report.current_attempt,
                "total_sections": report.total_sections,
                "completed_sections": report.completed_sections,
            }

            serialized = json.dumps(payload, ensure_ascii=False)
            if serialized != last_payload:
                last_payload = serialized
                yield f"event: {report.last_event or 'progress'}\ndata: {serialized}\n\n"

            if report.status in {"completed", "failed"}:
                yield f"event: done\ndata: {serialized}\n\n"
                break

            yield ": heartbeat\n\n"
            await asyncio.sleep(settings.validation_stream_poll_seconds)

    return StreamingResponse(event_generator(), media_type="text/event-stream")

@router.patch("/{document_id}", status_code=status.HTTP_200_OK)
async def update_document(
    document_id: str,
    title: str = Form(...),
    content: str = Form(...),
    current_user: User = Depends(get_current_user),
):
    raw = await _load_user_document(document_id, current_user)

    redis_client = get_redis_client()
    await redis_client.hset(
        _user_document_key(document_id),
        mapping={
            **raw,
            "title": title.strip(),
            "document_text": content.strip(),
            "updated_at": datetime.utcnow().isoformat(),
            "updated_date": datetime.utcnow().date().isoformat(),
        },
    )

    return {"message": "Documento actualizado correctamente", "document_id": document_id}

@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(
    document_id: str,
    current_user: User = Depends(get_current_user),
):
    # Verificamos que exista y pertenezca al usuario
    await _load_user_document(document_id, current_user)

    redis_client = get_redis_client()
    await redis_client.delete(_user_document_key(document_id))
    await redis_client.srem(_user_document_index_key(str(current_user.organization_id)), document_id)