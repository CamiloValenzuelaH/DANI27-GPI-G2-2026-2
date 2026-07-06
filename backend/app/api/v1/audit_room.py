from __future__ import annotations

import asyncio
import base64
from datetime import datetime
import unicodedata
from typing import Any
from urllib.parse import quote
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy import and_, or_, func
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.dependencies import get_current_org, get_current_user
from app.core.redis import get_redis_client
from app.core.security import create_temporary_token, decode_access_token
from app.db.database import get_db
from app.models.evidence_taxonomy import EvidenceTaxonomy
from app.schemas.audit_room import (
    AuditRoomEvidenceItem,
    AuditRoomFolderResponse,
    AuditRoomBinderRequest,
    AuditRoomBinderResponse,
    AuditRoomBinderStatusResponse,
    AuditRoomSearchRequest,
    AuditRoomSearchResponse,
)
from app.workers.gemini_service import generate_embedding
from app.workers.audit_room_tasks import JOB_KEY_PREFIX, generate_audit_room_binder
from app.workers.validation_tasks import get_top_iso_chunks

router = APIRouter(prefix="/audit-room", tags=["audit-room"])

_ACCENTED_CHARS = "áéíóúüñÁÉÍÓÚÜÑ"
_UNACCENTED_CHARS = "aeiouunAEIOUUN"
_LEXICAL_WEIGHT = 0.7
_SEMANTIC_WEIGHT = 0.3


def _normalize_text_for_search(value: str) -> str:
    # Keep SQL and Python normalization aligned to support no-tilde queries.
    normalized = unicodedata.normalize("NFD", value)
    stripped = "".join(ch for ch in normalized if unicodedata.category(ch) != "Mn")
    return stripped.lower().strip()


def _clamp_score(value: float) -> float:
    return max(0.0, min(1.0, value))


def _clause_prefix_candidates(clause_ref: str) -> list[str]:
    value = (clause_ref or "").strip()
    if not value:
        return []

    parts = value.split(".")
    prefixes: list[str] = [value]

    if value.upper().startswith("A.") and len(parts) >= 2:
        # A.5.12 -> [A.5.12, A.5, A]
        for length in range(len(parts) - 1, 0, -1):
            prefix = ".".join(parts[:length])
            if prefix not in prefixes:
                prefixes.append(prefix)

    return prefixes


async def _semantic_candidates_for_query(
    *,
    db: Session,
    org_id: str,
    query_text: str,
    max_results: int,
) -> dict[str, float]:
    if not settings.audit_room_search_semantic_enabled:
        return {}

    timeout = max(0.5, float(settings.audit_room_search_semantic_timeout_seconds))
    embedding = await asyncio.wait_for(generate_embedding(query_text), timeout=timeout)
    chunks = await asyncio.wait_for(get_top_iso_chunks(embedding, limit=max_results), timeout=timeout)

    semantic_scores: dict[str, float] = {}
    for chunk in chunks:
        clause_ref = (chunk.get("clause_ref") or "").strip()
        if not clause_ref:
            continue

        candidate = None
        for prefix in _clause_prefix_candidates(clause_ref):
            candidate = (
                db.query(EvidenceTaxonomy)
                .filter(EvidenceTaxonomy.organization_id == org_id)
                .filter(EvidenceTaxonomy.clause_ref.ilike(f"{prefix}%"))
                .order_by(EvidenceTaxonomy.clause_ref.asc())
                .first()
            )
            if candidate:
                break
        if not candidate:
            continue

        relevance = _clamp_score(float(chunk.get("relevance_score") or 0.0))
        existing = semantic_scores.get(candidate.id)
        semantic_scores[candidate.id] = max(existing or 0.0, relevance)

        if len(semantic_scores) >= max_results:
            break

    return semantic_scores


def _folders_for_org(db: Session, org_id: str) -> list[AuditRoomFolderResponse]:
    folders = [
        {"id": "A.5", "label": "Anexo A / A.5", "control_ref_prefix": "A.5"},
        {"id": "A.6", "label": "Anexo A / A.6", "control_ref_prefix": "A.6"},
        {"id": "A.7", "label": "Anexo A / A.7", "control_ref_prefix": "A.7"},
        {"id": "A.8", "label": "Anexo A / A.8", "control_ref_prefix": "A.8"},
    ]

    results: list[AuditRoomFolderResponse] = []
    for folder in folders:
        folder_prefix = folder["control_ref_prefix"]
        count = db.query(EvidenceTaxonomy).filter(
            EvidenceTaxonomy.organization_id == org_id,
            EvidenceTaxonomy.clause_ref.startswith(folder_prefix),
        ).count()
        results.append(AuditRoomFolderResponse(
            id=folder["id"],
            label=folder["label"],
            control_ref_prefix=folder_prefix,
            item_count=count,
        ))
    return results


def _normalize_search_result(row: EvidenceTaxonomy) -> AuditRoomEvidenceItem:
    return AuditRoomEvidenceItem(
        id=row.id,
        name=row.name,
        type=row.type,
        control_id=row.control_id,
        clause_ref=row.clause_ref,
        organization_id=str(row.organization_id),
        question_id=str(row.question_id) if row.question_id else None,
        answer_id=str(row.answer_id) if row.answer_id else None,
        validity_days=row.validity_days,
        freshness_status=row.freshness_status,
        created_at=row.created_at,
    )


def _job_key(job_id: str) -> str:
    return f"{JOB_KEY_PREFIX}{job_id}"


def _download_key(job_id: str) -> str:
    return f"audit_room:download:{job_id}"


async def _read_job_state(job_id: str) -> dict[str, Any]:
    redis_client = get_redis_client()
    raw = await redis_client.hgetall(_job_key(job_id))
    if not raw:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Binder no encontrado")
    return raw


def _validate_download_token(token: str, job_id: str) -> dict[str, Any]:
    payload = decode_access_token(token)
    if payload.get("purpose") != "audit_room_binder_download":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token de descarga inválido")
    if payload.get("sub") != job_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token no coincide con el binder")
    return payload


@router.get("/folders", response_model=list[AuditRoomFolderResponse])
async def list_audit_room_folders(
    org=Depends(get_current_org),
    db: Session = Depends(get_db),
):
    return _folders_for_org(db, str(org.id))


@router.get("/folders/{control_id}/evidences", response_model=list[AuditRoomEvidenceItem])
async def list_folder_evidences(
    control_id: str,
    org=Depends(get_current_org),
    db: Session = Depends(get_db),
):
    rows = (
        db.query(EvidenceTaxonomy)
        .filter(EvidenceTaxonomy.organization_id == org.id)
        .filter(EvidenceTaxonomy.clause_ref.startswith(control_id))
        .order_by(EvidenceTaxonomy.clause_ref.asc())
        .all()
    )
    return [_normalize_search_result(row) for row in rows]


@router.post("/search", response_model=AuditRoomSearchResponse)
async def search_audit_room(
    payload: AuditRoomSearchRequest,
    org=Depends(get_current_org),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query_text = payload.query.strip()
    if not query_text:
        return AuditRoomSearchResponse(query=payload.query, results=[])

    normalized_query = _normalize_text_for_search(query_text)
    query_tokens = [token for token in normalized_query.split() if token]
    search_pattern = f"%{normalized_query}%"
    normalized_name = func.translate(func.lower(EvidenceTaxonomy.name), _ACCENTED_CHARS, _UNACCENTED_CHARS)
    normalized_control = func.translate(func.lower(EvidenceTaxonomy.control_id), _ACCENTED_CHARS, _UNACCENTED_CHARS)
    normalized_clause = func.translate(func.lower(EvidenceTaxonomy.clause_ref), _ACCENTED_CHARS, _UNACCENTED_CHARS)
    normalized_text_blob = func.translate(
        func.lower(
            func.concat(
                func.coalesce(EvidenceTaxonomy.name, ""),
                " ",
                func.coalesce(EvidenceTaxonomy.control_id, ""),
                " ",
                func.coalesce(EvidenceTaxonomy.clause_ref, ""),
                " ",
                func.coalesce(EvidenceTaxonomy.search_text, ""),
            )
        ),
        _ACCENTED_CHARS,
        _UNACCENTED_CHARS,
    )
    token_filters = [normalized_text_blob.like(f"%{token}%") for token in query_tokens]
    max_results = max(1, int(settings.audit_room_search_max_results))
    rows = (
        db.query(EvidenceTaxonomy)
        .filter(EvidenceTaxonomy.organization_id == org.id)
        .filter(
            or_(
                normalized_name.like(search_pattern),
                normalized_control.like(search_pattern),
                normalized_clause.like(search_pattern),
            )
        )
        .filter(and_(*token_filters) if token_filters else True)
        .order_by(EvidenceTaxonomy.clause_ref.asc())
        .limit(max_results)
        .all()
    )

    row_by_id: dict[str, EvidenceTaxonomy] = {row.id: row for row in rows}
    lexical_score_by_id: dict[str, float] = {}
    if rows:
        denominator = max(1, len(rows) - 1)
        for index, row in enumerate(rows):
            lexical_score_by_id[row.id] = 1.0 - (index / denominator)

    semantic_score_by_id: dict[str, float] = {}
    try:
        semantic_score_by_id = await _semantic_candidates_for_query(
            db=db,
            org_id=str(org.id),
            query_text=query_text,
            max_results=max_results,
        )
    except Exception:
        # Keep service responsive if embeddings or vector search fail.
        semantic_score_by_id = {}

    if semantic_score_by_id:
        semantic_ids = [evidence_id for evidence_id in semantic_score_by_id if evidence_id not in row_by_id]
        if semantic_ids:
            semantic_rows = (
                db.query(EvidenceTaxonomy)
                .filter(EvidenceTaxonomy.organization_id == org.id)
                .filter(EvidenceTaxonomy.id.in_(semantic_ids))
                .all()
            )
            for row in semantic_rows:
                row_by_id[row.id] = row

    scored_rows: list[tuple[EvidenceTaxonomy, float]] = []
    for evidence_id, row in row_by_id.items():
        lexical_score = lexical_score_by_id.get(evidence_id, 0.0)
        semantic_score = semantic_score_by_id.get(evidence_id, 0.0)
        hybrid_score = _clamp_score((_LEXICAL_WEIGHT * lexical_score) + (_SEMANTIC_WEIGHT * semantic_score))
        scored_rows.append((row, hybrid_score))

    scored_rows.sort(key=lambda item: (item[1], item[0].clause_ref or "", item[0].name or ""), reverse=True)
    scored_rows = scored_rows[:max_results]

    results = [
        {
            "id": row.id,
            "clause_ref": row.clause_ref,
            "title": row.name,
            "content": row.search_text or row.name,
            "relevance_score": score,
        }
        for row, score in scored_rows
    ]

    return AuditRoomSearchResponse(query=payload.query, results=results)


@router.post("/binder", response_model=AuditRoomBinderResponse, status_code=status.HTTP_202_ACCEPTED)
async def create_audit_room_binder(
    payload: AuditRoomBinderRequest,
    org=Depends(get_current_org),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    job_id = str(uuid4())
    rows = (
        db.query(EvidenceTaxonomy)
        .filter(EvidenceTaxonomy.organization_id == org.id)
        .filter(EvidenceTaxonomy.id.in_(payload.selected_evidence_ids))
        .all()
    )
    row_map = {row.id: row for row in rows}
    missing_ids = [evidence_id for evidence_id in payload.selected_evidence_ids if evidence_id not in row_map]
    if missing_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Algunas evidencias seleccionadas no existen o no pertenecen a su organización",
        )

    selected_evidence = [
        {
            "id": row_map[evidence_id].id,
            "name": row_map[evidence_id].name,
            "type": row_map[evidence_id].type,
            "control_id": row_map[evidence_id].control_id,
            "clause_ref": row_map[evidence_id].clause_ref,
            "freshness_status": row_map[evidence_id].freshness_status,
            "file_path": row_map[evidence_id].file_path,
            "original_file_name": row_map[evidence_id].original_file_name,
            "notes": "",
        }
        for evidence_id in payload.selected_evidence_ids
    ]

    await get_redis_client().hset(
        _job_key(job_id),
        mapping={
            "job_id": job_id,
            "status": "queued",
            "progress": "0",
            "message": "Binder encolado",
            "organization_id": str(org.id),
            "user_id": str(current_user.id),
            "binder_title": payload.title,
            "binder_description": payload.description or "",
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
        },
    )
    await get_redis_client().expire(_job_key(job_id), 7 * 24 * 60 * 60)

    generate_audit_room_binder.delay(
        job_id=job_id,
        selected_evidence=selected_evidence,
        title=payload.title,
        description=payload.description,
        organization_id=str(org.id),
        user_id=str(current_user.id),
    )

    return AuditRoomBinderResponse(job_id=job_id, status_url=f"/api/v1/audit-room/binder/{job_id}/status")


@router.get("/binder/{job_id}/status", response_model=AuditRoomBinderStatusResponse)
async def get_audit_room_binder_status(
    job_id: str,
    org=Depends(get_current_org),
    current_user=Depends(get_current_user),
):
    raw = await _read_job_state(job_id)
    if str(raw.get("organization_id")) != str(org.id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Binder fuera de alcance")

    download_url = None
    if raw.get("status") == "completed":
        token = _create_download_token(job_id, str(org.id))
        download_url = f"/api/v1/audit-room/binder/{quote(job_id)}/download?token={quote(token)}"
    return AuditRoomBinderStatusResponse(
        job_id=raw.get("job_id", job_id),
        status=raw.get("status", "queued"),
        progress=int(raw.get("progress") or 0),
        message=raw.get("message") or None,
        download_url=download_url,
        created_at=_parse_datetime(raw.get("created_at")),
        updated_at=_parse_datetime(raw.get("updated_at")),
    )


def _parse_datetime(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value)
    except ValueError:
        return None


@router.get("/binder/{job_id}/download")
async def download_audit_room_binder(
    job_id: str,
    token: str,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    payload = _validate_download_token(token, job_id)
    if str(payload.get("organization_id")) != str(current_user.organization_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Binder fuera de alcance")

    redis_client = get_redis_client()
    encoded = await redis_client.get(_download_key(job_id))
    if not encoded:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Descarga no disponible")

    try:
        binder_bytes = base64.b64decode(encoded)
    except Exception:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error decoding binder")

    return StreamingResponse(
        content=iter([binder_bytes]),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=AuditRoomBinder_{job_id}.pdf",
        },
    )


def _create_download_token(job_id: str, organization_id: str) -> str:
    return create_temporary_token(
        subject=job_id,
        purpose="audit_room_binder_download",
        extra={"organization_id": organization_id},
        minutes=15,
    )
