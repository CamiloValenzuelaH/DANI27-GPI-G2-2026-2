from __future__ import annotations

import hashlib
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.database import get_db
from app.models.audit_log import AuditLog
from app.models.policy import Policy, PolicyAcknowledgment, PolicyStatus
from app.models.user import User
from app.schemas.policy import (
    PolicyAcknowledgeRequest,
    PolicyAcknowledgmentOut,
    PolicyComplianceReportItem,
    PolicyOut,
)

router = APIRouter(prefix="/portal/policies", tags=["portal-policies"])


def _hash_content(content: str) -> str:
    return hashlib.sha256(content.encode("utf-8")).hexdigest()


def _serialize_policy(policy: Policy) -> PolicyOut:
    return PolicyOut(
        id=str(policy.id),
        title=policy.title,
        summary=policy.summary,
        content=policy.content,
        status=policy.status.value if isinstance(policy.status, PolicyStatus) else str(policy.status),
        document_version=policy.document_version,
        mandatory=policy.mandatory,
        published_at=policy.published_at,
    )


@router.get("", response_model=list[PolicyOut], summary="Listar políticas publicadas del portal")
def list_policies(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    policies = (
        db.query(Policy)
        .filter(
            Policy.organization_id == str(current_user.organization_id),
            Policy.status == PolicyStatus.published,
        )
        .order_by(Policy.published_at.desc().nullslast(), Policy.created_at.desc())
        .all()
    )
    result: list[PolicyOut] = []
    for policy in policies:
        ack_exists = (
            db.query(PolicyAcknowledgment)
            .filter(
                PolicyAcknowledgment.user_id == str(current_user.id),
                PolicyAcknowledgment.policy_id == str(policy.id),
                PolicyAcknowledgment.document_version == policy.document_version,
            )
            .first()
            is not None
        )
        p = _serialize_policy(policy)
        p.acknowledged = ack_exists
        result.append(p)
    return result


@router.get("/{policy_id}", response_model=PolicyOut, summary="Obtener detalle de una política")
def get_policy(
    policy_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    policy = (
        db.query(Policy)
        .filter(
            Policy.id == policy_id,
            Policy.organization_id == str(current_user.organization_id),
        )
        .first()
    )
    if not policy:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Política no encontrada")
    if policy.status != PolicyStatus.published:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="La política no está publicada")
    return _serialize_policy(policy)


@router.post("/{policy_id}/acknowledge", response_model=PolicyAcknowledgmentOut, summary="Aceptar una política")
def acknowledge_policy(
    policy_id: str,
    payload: PolicyAcknowledgeRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    policy = (
        db.query(Policy)
        .filter(
            Policy.id == policy_id,
            Policy.organization_id == str(current_user.organization_id),
            Policy.status == PolicyStatus.published,
        )
        .first()
    )
    if not policy:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Política no encontrada")

    if payload.document_version != policy.document_version:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Versión de documento no coincide")

    existing = (
        db.query(PolicyAcknowledgment)
        .filter(
            PolicyAcknowledgment.user_id == str(current_user.id),
            PolicyAcknowledgment.policy_id == policy_id,
            PolicyAcknowledgment.document_version == payload.document_version,
        )
        .first()
    )
    if existing:
        return PolicyAcknowledgmentOut(
            id=str(existing.id),
            policy_id=str(existing.policy_id),
            user_id=str(existing.user_id),
            acknowledged_at=existing.acknowledged_at,
            ip_address=existing.ip_address,
            document_version=existing.document_version,
            content_hash=existing.content_hash,
        )

    content_hash = _hash_content(policy.content)
    acknowledgment = PolicyAcknowledgment(
        user_id=str(current_user.id),
        policy_id=policy_id,
        acknowledged_at=datetime.now(timezone.utc),
        ip_address=request.client.host if request.client else None,
        document_version=payload.document_version,
        content_hash=content_hash,
        organization_id=str(current_user.organization_id),
    )
    db.add(acknowledgment)
    db.flush()

    previous = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).first()
    audit = AuditLog(
        user_id=str(current_user.id),
        user_role=None,
        action="portal.policy.acknowledged",
        resource=f"policy:{policy_id}",
        details={
            "policy_id": policy_id,
            "document_version": payload.document_version,
            "content_hash": content_hash,
            "organization_id": str(current_user.organization_id),
        },
        timestamp=datetime.now(timezone.utc),
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
        http_status=200,
        success=True,
        previous_hash=previous.current_hash if previous else None,
        current_hash="",
    )
    audit.current_hash = audit.compute_hash()
    db.add(audit)
    db.commit()

    return PolicyAcknowledgmentOut(
        id=str(acknowledgment.id),
        policy_id=str(acknowledgment.policy_id),
        user_id=str(acknowledgment.user_id),
        acknowledged_at=acknowledgment.acknowledged_at,
        ip_address=acknowledgment.ip_address,
        document_version=acknowledgment.document_version,
        content_hash=acknowledgment.content_hash,
    )


@router.get("/compliance/report", response_model=list[PolicyComplianceReportItem], summary="Reporte de cumplimiento por política")
def compliance_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    total_users = (
        db.query(func.count(User.id))
        .filter(User.organization_id == str(current_user.organization_id), User.is_active.is_(True))
        .scalar()
    )

    policies = (
        db.query(Policy)
        .filter(
            Policy.organization_id == str(current_user.organization_id),
            Policy.status == PolicyStatus.published,
        )
        .all()
    )

    result: list[PolicyComplianceReportItem] = []
    for policy in policies:
        accepted_count = (
            db.query(func.count(PolicyAcknowledgment.id))
            .filter(
                PolicyAcknowledgment.policy_id == str(policy.id),
                PolicyAcknowledgment.organization_id == str(current_user.organization_id),
            )
            .scalar()
        )
        compliance_percent = round((accepted_count / total_users * 100) if total_users else 0.0, 2)
        result.append(
            PolicyComplianceReportItem(
                policy_id=str(policy.id),
                title=policy.title,
                document_version=policy.document_version,
                mandatory=policy.mandatory,
                accepted_count=accepted_count,
                total_users=total_users or 0,
                compliance_percent=compliance_percent,
            )
        )
    return result
