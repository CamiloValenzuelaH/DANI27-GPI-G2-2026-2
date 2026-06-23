from __future__ import annotations

import base64
import io
import logging
import uuid
from datetime import datetime
from typing import Any
from urllib.parse import quote

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, require_roles
from app.core.redis import get_redis_client
from app.core.security import create_temporary_token, decode_access_token
from app.db.database import get_db
from app.models.audit_log import AuditLog
from app.models.user import User
from app.models.report_job import ReportJob
from app.schemas.report import (
    ReportGenerateRequest,
    ReportJobResponse,
    ReportStatusResponse,
    ReportTemplateResponse,
    ReportTemplatesResponse,
)
from app.workers.report_tasks import JOB_KEY_PREFIX, generate_report

router = APIRouter(prefix="/reports", tags=["reports"])

bearer_scheme_optional = HTTPBearer(auto_error=False)


def _job_key(job_id: str) -> str:
    return f"{JOB_KEY_PREFIX}{job_id}"


def _download_key(job_id: str) -> str:
    return f"report:download:{job_id}"


def _parse_datetime(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value)
    except ValueError:
        return None


def _has_role(current_user: User, role_name: str) -> bool:
    if current_user.is_superadmin:
        return True
    normalized = {r.role.name.lower() for r in current_user.user_roles if r.role and r.role.name}
    return role_name.lower() in normalized


async def _get_current_user_optional(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme_optional),
    db: Session = Depends(get_db),
) -> User | None:
    if not credentials:
        return None

    token = credentials.credentials
    try:
        payload = decode_access_token(token)
    except ValueError:
        return None

    user_id = payload.get("sub")
    if not user_id:
        return None

    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.is_active:
        return None

    return user


def _validate_report_download_token(token: str, job_id: str) -> dict[str, Any]:
    payload = decode_access_token(token)
    if payload.get("purpose") != "report_download":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de descarga inválido",
        )
    if payload.get("sub") != job_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de descarga no coincide con el reporte",
        )
    if not payload.get("organization_id"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de descarga inválido",
        )
    return payload


async def _read_job_state(job_id: str) -> dict[str, Any]:
    redis_client = get_redis_client()
    raw = await redis_client.hgetall(_job_key(job_id))
    if not raw:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reporte no encontrado")
    return raw


def _build_status_response(raw: dict[str, Any], download_url: str | None = None) -> ReportStatusResponse:
    return ReportStatusResponse(
        job_id=raw.get("job_id", ""),
        status=raw.get("status", "queued"),
        progress=int(raw.get("progress") or 0),
        message=raw.get("message") or None,
        report_title=raw.get("report_title") or None,
        report_template=raw.get("report_template") or None,
        report_format=raw.get("report_format") or None,
        download_url=download_url,
        created_at=_parse_datetime(raw.get("created_at")),
        updated_at=_parse_datetime(raw.get("updated_at")),
        created_date=(raw.get("created_date") or (raw.get("created_at") and _parse_datetime(raw.get("created_at")).date().isoformat())),
    )


def _create_download_token(job_id: str, organization_id: str) -> str:
    return create_temporary_token(
        subject=job_id,
        purpose="report_download",
        extra={"organization_id": organization_id},
        minutes=15,
    )


def _register_download_audit(db: Session, user_id: str | None, job_id: str) -> None:
    try:
        previous = db.execute(
            "SELECT current_hash FROM audit_logs ORDER BY timestamp DESC LIMIT 1"
        ).fetchone()
        previous_hash = previous[0] if previous else None
        record = AuditLog(
            user_id=user_id,
            user_role=None,
            action="DOWNLOAD",
            resource=f"report:{job_id}",
            details={"job_id": job_id},
            timestamp=datetime.utcnow(),
            ip_address=None,
            user_agent=None,
            http_status=200,
            success=True,
            previous_hash=previous_hash,
            current_hash="",
        )
        record.current_hash = record.compute_hash()
        db.add(record)
        db.commit()
    except Exception as exc:
        logging.warning("No se pudo registrar auditoría de descarga: %s", exc)
        db.rollback()


def _template_definitions() -> list[ReportTemplateResponse]:
    return [
        ReportTemplateResponse(
            id="soa",
            name="SOA",
            description="Control operativo, estado y justificación de controles.",
        ),
        ReportTemplateResponse(
            id="risk_register",
            name="Risk Register",
            description="Inventario de riesgos con matriz de probabilidad e impacto.",
        ),
        ReportTemplateResponse(
            id="audit_report",
            name="Audit Report",
            description="Puntaje de salud y brechas del programa de auditoría.",
        ),
        ReportTemplateResponse(
            id="gap_analysis",
            name="Gap Analysis",
            description="Progreso por fase y recomendaciones de cierre.",
        ),
    ]


@router.post("/generate", response_model=ReportJobResponse, status_code=status.HTTP_202_ACCEPTED)
async def generate_report_job(
    payload: ReportGenerateRequest,
    current_user: User = Depends(require_roles("admin", "ciso", "auditor")),
    db: Session = Depends(get_db),
):
    if _has_role(current_user, "auditor") and not _has_role(current_user, "admin") and not _has_role(current_user, "ciso"):
        if payload.template != "audit_report":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Auditores solo pueden generar Audit Report.",
            )

    job_id = str(uuid.uuid4())
    # Persist initial job in DB for historical traceability
    try:
        report_record = ReportJob(
            job_id=job_id,
            organization_id=str(current_user.organization_id),
            user_id=str(current_user.id),
            status="queued",
            progress=0,
            message="Reporte encolado",
            report_title=payload.title,
            report_template=payload.template,
            report_format=payload.format,
            created_date=datetime.utcnow().date().isoformat(),
        )
        db.add(report_record)
        db.commit()
    except Exception:
        try:
            db.rollback()
        except Exception:
            pass
    redis_client = get_redis_client()
    await redis_client.hset(
        _job_key(job_id),
        mapping={
            "job_id": job_id,
            "status": "queued",
            "progress": "0",
            "message": "Reporte encolado",
            "report_title": payload.title,
            "report_template": payload.template,
            "report_format": payload.format,
            "organization_id": str(current_user.organization_id),
            "user_id": str(current_user.id),
            "created_at": datetime.utcnow().isoformat(),
            "created_date": datetime.utcnow().date().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
            "updated_date": datetime.utcnow().date().isoformat(),
        },
    )
    await redis_client.expire(_job_key(job_id), 7 * 24 * 60 * 60)

    generate_report.delay(
        job_id=job_id,
        request_data=payload.model_dump(),
        organization_id=str(current_user.organization_id),
        user_id=str(current_user.id),
    )

    return ReportJobResponse(
        job_id=job_id,
        status="queued",
        status_url=f"/api/v1/reports/{job_id}/status",
    )


@router.get("/{job_id}/status", response_model=ReportStatusResponse)
async def get_report_status(
    job_id: str,
    current_user: User = Depends(get_current_user),
):
    raw = await _read_job_state(job_id)
    if str(raw.get("organization_id")) != str(current_user.organization_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acceso denegado al reporte")

    download_url = None
    if raw.get("status") == "completed":
        token = _create_download_token(job_id, str(current_user.organization_id))
        download_url = f"/api/v1/reports/{quote(job_id)}/download?token={quote(token)}"

    return _build_status_response(raw, download_url=download_url)


@router.get("/{job_id}/download")
async def get_report_download(
    job_id: str,
    token: str | None = Query(None),
    current_user: User | None = Depends(_get_current_user_optional),
    db: Session = Depends(get_db),
):
    raw = await _read_job_state(job_id)
    if raw.get("status") != "completed":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reporte no disponible para descarga")

    if token:
        token_payload = _validate_report_download_token(token, job_id)
        if str(token_payload.get("organization_id")) != str(raw.get("organization_id")):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Token no válido para esta organización")
    elif current_user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Autenticación o token de descarga requeridos")
    else:
        if str(raw.get("organization_id")) != str(current_user.organization_id):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acceso denegado al reporte")

    redis_client = get_redis_client()
    encoded = await redis_client.get(_download_key(job_id))
    if not encoded:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Archivo de reporte no encontrado o expirado")

    try:
        report_bytes = base64.b64decode(encoded)
    except Exception:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error al decodificar el reporte")

    report_format = raw.get("report_format")
    title_safe = quote((raw.get("report_title") or job_id).replace(" ", "_"))
    filename = f"{title_safe}.{report_format}"
    content_type = {
        "pdf": "application/pdf",
        "xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "csv": "text/csv; charset=utf-8",
    }.get(report_format, "application/octet-stream")

    _register_download_audit(db, str(current_user.id) if current_user else None, job_id)

    return StreamingResponse(
        io.BytesIO(report_bytes),
        media_type=content_type,
        headers={
            "Content-Disposition": f"attachment; filename=\"{filename}\"",
        },
    )


@router.get("/templates", response_model=ReportTemplatesResponse)
def get_report_templates():
    return ReportTemplatesResponse(templates=_template_definitions())
