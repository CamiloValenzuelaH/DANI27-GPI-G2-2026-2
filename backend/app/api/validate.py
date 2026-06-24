from __future__ import annotations

import asyncio
import json
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.core.config import settings
from app.core.dependencies import get_current_user
from app.core.security import decode_access_token
from app.core.redis import get_redis_client
from app.db.database import get_db
from app.models.user import User
from app.models.external_validation_job import ExternalValidationJob
from app.schemas.validation import (
    GenerateMissingRequest,
    GenerateMissingResponse,
    ValidationJobResponse,
    ValidationReportResponse,
)
from app.workers.file_extraction import extract_text_from_file
from app.workers.gemini_service import (
    generate_missing_content_with_deepseek,
    validate_generated_missing_content_with_deepseek,
)
from app.workers.validation_tasks import validate_external_audit

# Definimos el router sin prefijo aquí. El prefijo se gestionará en main.py
router = APIRouter()

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
    now_date = datetime.now(timezone.utc).date().isoformat()
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
            "created_date": now_date,
            "updated_at": now,
            "updated_date": now_date,
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
        created_date=(raw.get("created_date") or (datetime.fromisoformat(raw.get("created_at")).date().isoformat() if raw.get("created_at") else None)),
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


def _find_finding(report: ValidationReportResponse, chunk_id: str) -> dict | None:
    for finding in report.findings:
        payload = finding.model_dump(mode="python")
        if payload.get("clause_ref") == chunk_id:
            return payload
    return None


def _load_iso_chunk(db: Session, chunk_id: str, fallback_clause_ref: str | None = None) -> dict | None:
    result = db.execute(
        text(
            """
            SELECT id, clause_ref, title, content
            FROM iso_27001_chunks
            WHERE CAST(id AS TEXT) = :chunk_id
               OR clause_ref = :chunk_id
               OR (:fallback_clause_ref IS NOT NULL AND clause_ref = :fallback_clause_ref)
            LIMIT 1
            """
        ),
        {
            "chunk_id": chunk_id,
            "fallback_clause_ref": fallback_clause_ref,
        },
    ).fetchone()

    if not result:
        return None

    return {
        "id": str(result[0]),
        "clause_ref": str(result[1]),
        "title": str(result[2]),
        "content": str(result[3]),
    }


@router.post("/external", response_model=ValidationJobResponse, status_code=status.HTTP_202_ACCEPTED)
async def create_external_validation_job(
    file: UploadFile = File(...),
    clause_refs: list[str] | None = Query(None),
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
        clause_refs=clause_refs,
    )

    return ValidationJobResponse(
        job_id=job_id,
        status="queued",
        stream_url=f"/api/validate/external/{job_id}/events",
    )


@router.get("/external/history", response_model=list[ValidationReportResponse])
async def list_external_validation_jobs(
    limit: int = 50,
    search: str | None = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Lista trabajos de validación externos persistidos para la organización del usuario.
    """
    q = db.query(ExternalValidationJob).filter(
        ExternalValidationJob.organization_id == str(current_user.organization_id)
    )
    if search:
        # case-insensitive partial match on file_name
        q = q.filter(ExternalValidationJob.file_name.ilike(f"%{search}%"))

    rows = q.order_by(ExternalValidationJob.created_at.desc()).limit(limit).all()

    results: list[ValidationReportResponse] = []
    for job in rows:
        findings = job.findings if job.findings is not None else []
        results.append(
            ValidationReportResponse(
                job_id=job.job_id,
                status=job.status,
                progress=int(job.progress or 0),
                message=job.message,
                organization_id=job.organization_id,
                user_id=job.user_id,
                file_name=job.file_name,
                file_path=job.file_path,
                total_chunks=int(job.total_chunks or 0),
                overall_score=int(job.overall_score) if job.overall_score not in (None, "") else None,
                findings=findings,
                summary=job.summary,
                error=job.error,
                created_at=job.created_at,
                updated_at=job.updated_at,
                created_date=job.created_date,
            )
        )

    return results


@router.get("/external/{job_id}", response_model=ValidationReportResponse)
async def get_external_validation_job(job_id: str, current_user: User = Depends(get_current_user)):
    report = await _read_job_state(job_id)
    if report.organization_id and str(report.organization_id) != str(current_user.organization_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Job fuera de alcance")
    return report


@router.get("/external/{job_id}/result", response_model=ValidationReportResponse)
async def get_external_validation_result(job_id: str, current_user: User = Depends(get_current_user)):
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


@router.post("/external/{job_id}/generate-missing", response_model=GenerateMissingResponse)
async def generate_missing_for_chunk(
    job_id: str,
    payload: GenerateMissingRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    report = await _read_job_state(job_id)
    if report.organization_id and str(report.organization_id) != str(current_user.organization_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Job fuera de alcance")

    if report.status != "completed":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="La validación debe estar completada antes de generar contenido faltante",
        )

    finding = _find_finding(report, payload.chunk_id)
    clause_ref_hint = finding.get("clause_ref") if finding else None
    chunk = _load_iso_chunk(db, payload.chunk_id, fallback_clause_ref=clause_ref_hint)
    if not chunk:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Control ISO no encontrado")

    if finding is None and clause_ref_hint:
        finding = _find_finding(report, clause_ref_hint)
    if finding is None and chunk.get("clause_ref"):
        finding = _find_finding(report, str(chunk["clause_ref"]))

    document_status = str((finding or {}).get("document_status") or "")
    missing_elements = [str(item).strip() for item in (finding or {}).get("missing_elements", []) if str(item).strip()]

    if document_status and document_status != "INCOMPLETO":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Solo se puede generar contenido faltante para controles en estado INCOMPLETO",
        )
    if not missing_elements:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No hay elementos faltantes para este control",
        )

    source_text = ""
    if report.file_path:
        try:
            source_text = await extract_text_from_file(report.file_path, 30000)
        except Exception:
            source_text = ""

    feedback: str | None = None
    generated_text = ""
    validation_score = 0
    validation_feedback: str | None = None
    validation_passed = False
    iterations = 0

    for attempt in range(1, 4):
        iterations = attempt
        generated_text = await generate_missing_content_with_deepseek(
            document_text=source_text[:12000],
            chunk=chunk,
            missing_elements=missing_elements,
            feedback=feedback,
        )

        validation = await validate_generated_missing_content_with_deepseek(
            generated_text=generated_text,
            chunk=chunk,
            missing_elements=missing_elements,
        )

        validation_score = int(validation.get("score", 0))
        validation_passed = bool(validation.get("is_valid"))
        issues = validation.get("issues", []) or []
        feedback = str(validation.get("feedback") or "").strip() or "; ".join(str(item) for item in issues)
        validation_feedback = feedback or None

        if validation_passed:
            break

    return GenerateMissingResponse(
        job_id=job_id,
        chunk_id=payload.chunk_id,
        generated_text=generated_text,
        validation_passed=validation_passed,
        validation_score=validation_score,
        iterations=iterations,
        validation_feedback=validation_feedback,
    )
