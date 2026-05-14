from __future__ import annotations

import asyncio
import json
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.dependencies import get_current_user
from app.core.security import decode_access_token
from app.core.redis import get_redis_client
from app.db.database import get_db
from app.models.user import User
from app.schemas.validation import ValidationJobResponse, ValidationReportResponse
from app.workers.validation_tasks import validate_external_audit

router = APIRouter(prefix="/validate", tags=["validation"])
JOB_KEY_PREFIX = "validation:job:"
JOB_TTL_SECONDS = 60 * 60 * 24 * 7


async def _save_upload(file: UploadFile, job_id: str) -> Path:
    target_dir = Path(settings.validation_jobs_dir)
    target_dir.mkdir(parents=True, exist_ok=True)

    filename = file.filename or f"{job_id}.bin"
    safe_name = Path(filename).name
    target_path = target_dir / f"{job_id}__{safe_name}"

    content = await file.read()
    target_path.write_bytes(content)
    return target_path


def _job_key(job_id: str) -> str:
    return f"{JOB_KEY_PREFIX}{job_id}"


async def _write_initial_job_state(
    job_id: str,
    org_id: str,
    user_id: str,
    file_name: str,
    file_path: str,
) -> None:
    redis_client = get_redis_client()
    now = datetime.now(timezone.utc).isoformat()
    await redis_client.hset(
        _job_key(job_id),
        mapping={
            "job_id": job_id,
            "status": "queued",
            "progress": 0,
            "message": "Job encolado",
            "organization_id": org_id,
            "user_id": user_id,
            "file_name": file_name,
            "file_path": file_path,
            "total_chunks": 0,
            "overall_score": "",
            "findings": "[]",
            "summary": "",
            "error": "",
            "created_at": now,
            "updated_at": now,
        },
    )
    await redis_client.expire(_job_key(job_id), JOB_TTL_SECONDS)


async def _read_job_state(job_id: str) -> ValidationReportResponse:
    redis_client = get_redis_client()
    raw = await redis_client.hgetall(_job_key(job_id))
    if not raw:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job no encontrado")

    findings_raw = raw.get("findings") or "[]"
    try:
        findings = json.loads(findings_raw)
    except json.JSONDecodeError:
        findings = []

    def _parse_dt(value: str | None) -> datetime | None:
        if not value:
            return None
        try:
            return datetime.fromisoformat(value)
        except ValueError:
            return None

    overall_score = raw.get("overall_score")
    return ValidationReportResponse(
        job_id=raw.get("job_id", job_id),
        status=raw.get("status", "queued"),
        progress=int(float(raw.get("progress", 0))),
        message=raw.get("message") or None,
        organization_id=raw.get("organization_id") or None,
        user_id=raw.get("user_id") or None,
        file_name=raw.get("file_name") or None,
        file_path=raw.get("file_path") or None,
        total_chunks=int(float(raw.get("total_chunks", 0))),
        overall_score=int(float(overall_score)) if overall_score not in (None, "") else None,
        findings=findings,
        summary=raw.get("summary") or None,
        error=raw.get("error") or None,
        created_at=_parse_dt(raw.get("created_at")),
        updated_at=_parse_dt(raw.get("updated_at")),
    )


def _get_user_from_access_token(access_token: str | None, db: Session) -> User:
    if not access_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token requerido")

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


@router.post("/external", response_model=ValidationJobResponse, status_code=status.HTTP_202_ACCEPTED)
async def create_external_validation_job(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    del db

    if not file.filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El archivo debe tener nombre")

    job_id = str(uuid4())
    file_path = await _save_upload(file, job_id)

    await _write_initial_job_state(
        job_id=job_id,
        org_id=str(current_user.organization_id),
        user_id=str(current_user.id),
        file_name=file.filename,
        file_path=str(file_path),
    )

    # Encolar en Celery
    validate_external_audit.delay(
        job_id=job_id,
        file_path=str(file_path),
        file_name=file.filename,
        organization_id=str(current_user.organization_id),
        user_id=str(current_user.id),
        content_type=file.content_type or "application/octet-stream",
    )

    return ValidationJobResponse(
        job_id=job_id,
        status="queued",
        stream_url=f"/api/validate/external/{job_id}/events",
    )


@router.get("/external/{job_id}", response_model=ValidationReportResponse)
async def get_external_validation_job(job_id: str, current_user: User = Depends(get_current_user)):
    report = await _read_job_state(job_id)
    if report.organization_id and str(report.organization_id) != str(current_user.organization_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Job fuera de alcance")
    return report


@router.get("/external/{job_id}/events")
async def stream_external_validation_job(
    job_id: str,
    access_token: str | None = None,
    db: Session = Depends(get_db),
):
    current_user = _get_user_from_access_token(access_token, db)

    async def event_generator():
        last_payload: str | None = None
        while True:
            state = await _read_job_state(job_id)
            if state.organization_id and str(state.organization_id) != str(current_user.organization_id):
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Job fuera de alcance")

            payload = state.model_dump(mode="json")
            serialized = json.dumps(payload, ensure_ascii=False)
            if serialized != last_payload:
                last_payload = serialized
                yield f"event: progress\ndata: {serialized}\n\n"

            if state.status in {"completed", "failed"}:
                yield f"event: done\ndata: {serialized}\n\n"
                break

            yield ": heartbeat\n\n"
            await asyncio.sleep(settings.validation_stream_poll_seconds)

    return StreamingResponse(event_generator(), media_type="text/event-stream")
