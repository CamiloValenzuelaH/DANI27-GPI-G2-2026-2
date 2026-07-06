from __future__ import annotations

import asyncio
import json
import logging
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from typing import Any

import redis.asyncio as aioredis
from celery import Task

from app.core.config import settings
from app.db.database import SessionLocal
from app.models.audit_log import AuditLog
from app.models.capa import CAPA, CAPAStatus
from app.models.connector import Connector
from app.models.evidence_taxonomy import EvidenceTaxonomy, compute_freshness_status
from app.models.notification import Notification, NotificationChannel, NotificationType
from app.models.organization import Organization
from app.models.role import Role
from app.models.user import User
from app.models.user_role import UserRole
from app.services.connector_service import (
    sync_aws,
    sync_github,
    sync_google_workspace,
    sync_microsoft_365,
)
from app.services.notification_service import _send_email_message
from app.workers.celery_app import celery_app

logger = logging.getLogger(__name__)

JWT_REDIS_KEY_PATTERNS = (
    "auth:jwt:*",
    "jwt:blacklist:*",
    "jwt:token:*",
)
TOKEN_EXPIRY_FIELDS = ("expires_at", "exp", "expires", "expires_at_ts")
MAINTENANCE_MAX_RETRIES = 3


class MaintenanceTask(Task):
    autoretry_for = (Exception,)
    retry_backoff = True
    retry_backoff_max = 300
    retry_jitter = True
    max_retries = MAINTENANCE_MAX_RETRIES
    acks_late = True
    reject_on_worker_lost = True

    def on_failure(self, exc, task_id, args, kwargs, einfo):  # noqa: ANN001
        logger.error(
            "maintenance task failed task=%s retries=%s error=%s",
            self.name,
            getattr(self.request, "retries", 0),
            exc,
        )
        if getattr(self.request, "retries", 0) >= self.max_retries:
            logger.error(
                "maintenance task exhausted retries task=%s task_id=%s",
                self.name,
                task_id,
            )


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _parse_expiry(raw_value: str | None) -> datetime | None:
    if not raw_value:
        return None

    try:
        return datetime.fromtimestamp(int(float(raw_value)), tz=timezone.utc)
    except Exception:
        pass

    try:
        parsed = datetime.fromisoformat(raw_value.replace("Z", "+00:00"))
        if parsed.tzinfo is None:
            return parsed.replace(tzinfo=timezone.utc)
        return parsed.astimezone(timezone.utc)
    except Exception:
        return None


async def _cleanup_expired_token_keys_async() -> dict[str, int]:
    redis_client = aioredis.from_url(settings.redis_url, decode_responses=True)
    scanned = 0
    deleted = 0
    try:
        now = _utcnow()
        for pattern in JWT_REDIS_KEY_PATTERNS:
            async for key in redis_client.scan_iter(match=pattern, count=500):
                scanned += 1
                key_type = await redis_client.type(key)

                if key_type not in {"hash", "string"}:
                    continue

                expiry_at = None
                if key_type == "hash":
                    values = await redis_client.hmget(key, *TOKEN_EXPIRY_FIELDS)
                    for candidate in values:
                        expiry_at = _parse_expiry(candidate)
                        if expiry_at is not None:
                            break
                else:
                    ttl = await redis_client.ttl(key)
                    if ttl is not None and ttl < 0:
                        await redis_client.delete(key)
                        deleted += 1
                    continue

                if expiry_at is not None and expiry_at <= now:
                    await redis_client.delete(key)
                    deleted += 1
    finally:
        await redis_client.aclose()

    return {"scanned": scanned, "deleted": deleted}


def _organization_admins(db, organization_id):  # noqa: ANN001
    return (
        db.query(User)
        .join(UserRole, UserRole.user_id == User.id)
        .join(Role, Role.id == UserRole.role_id)
        .filter(
            User.organization_id == organization_id,
            User.is_active.is_(True),
            User.email.isnot(None),
            Role.name.in_(["owner", "admin"]),
        )
        .distinct()
        .all()
    )


def _connector_is_due(connector: Connector, now: datetime) -> bool:
    if not connector.auto_sync_enabled:
        return False
    if connector.status != "connected":
        return False
    if connector.last_sync_at is None:
        return True

    interval_hours = max(int(connector.sync_interval_hours or 24), 1)
    return now - connector.last_sync_at >= timedelta(hours=interval_hours)


def _sync_connector(db, connector: Connector) -> dict[str, Any]:  # noqa: ANN001
    sync_handlers = {
        "google_workspace": sync_google_workspace,
        "microsoft_365": sync_microsoft_365,
        "aws": sync_aws,
        "github": sync_github,
    }
    handler = sync_handlers.get(connector.type)
    if handler is None:
        return {"status": "skipped", "reason": "unsupported_connector_type"}

    result = handler(connector.organization_id, db)
    return {"status": "ok", "result": result}


@celery_app.task(bind=True, base=MaintenanceTask, name="maintenance.cleanup_expired_tokens")
def cleanup_expired_tokens(self) -> dict[str, int]:  # noqa: ANN001
    result = asyncio.run(_cleanup_expired_token_keys_async())
    logger.info(
        "maintenance cleanup_expired_tokens scanned=%s deleted=%s",
        result["scanned"],
        result["deleted"],
    )
    return result


@celery_app.task(bind=True, base=MaintenanceTask, name="maintenance.check_evidence_freshness")
def check_evidence_freshness(self) -> dict[str, int]:  # noqa: ANN001
    db = SessionLocal()
    try:
        rows = (
            db.query(EvidenceTaxonomy)
            .filter(EvidenceTaxonomy.validity_days.isnot(None))
            .all()
        )

        expired_by_org: dict[str, list[EvidenceTaxonomy]] = defaultdict(list)
        evaluated = 0
        now = _utcnow()

        for row in rows:
            evaluated += 1
            freshness_status = compute_freshness_status(row.created_at, row.validity_days, now)
            if freshness_status == "expired":
                expired_by_org[str(row.organization_id)].append(row)

        notifications_sent = 0
        for organization_id, expired_rows in expired_by_org.items():
            admins = _organization_admins(db, organization_id)
            if not admins:
                logger.warning(
                    "maintenance check_evidence_freshness org=%s expired=%s skipped=no_admins",
                    organization_id,
                    len(expired_rows),
                )
                continue

            sample_names = ", ".join(row.name for row in expired_rows[:5])
            title = "Evidencias vencidas detectadas"
            body = (
                f"Se detectaron {len(expired_rows)} evidencias vencidas. "
                f"Primeras evidencias: {sample_names or 'sin detalle'}"
            )
            payload = {
                "expired_count": len(expired_rows),
                "evidence_ids": [row.id for row in expired_rows],
            }

            for admin in admins:
                notification = Notification(
                    organization_id=admin.organization_id,
                    user_id=admin.id,
                    notification_type=NotificationType.evidence_expired,
                    channel=NotificationChannel.in_app,
                    title=title,
                    body=body,
                    payload=json.dumps(payload, default=str),
                )
                db.add(notification)
                notifications_sent += 1

            logger.info(
                "maintenance check_evidence_freshness org=%s expired=%s recipients=%s",
                organization_id,
                len(expired_rows),
                len(admins),
            )

        db.commit()
        return {
            "evaluated": evaluated,
            "expired": sum(len(items) for items in expired_by_org.values()),
            "notifications_sent": notifications_sent,
        }
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def _render_reminder_email(org_name: str, capa_rows: list[CAPA], evidence_rows: list[EvidenceTaxonomy]) -> tuple[str, str]:
    capa_rows_html = "".join(
        (
            "<tr>"
            f"<td style=\"padding:10px 12px;border-bottom:1px solid #e5e7eb;\">{row.title}</td>"
            f"<td style=\"padding:10px 12px;border-bottom:1px solid #e5e7eb;\">{getattr(row.status, 'value', row.status)}</td>"
            f"<td style=\"padding:10px 12px;border-bottom:1px solid #e5e7eb;\">{row.due_date.isoformat() if row.due_date else '-'}</td>"
            "</tr>"
        )
        for row in capa_rows[:10]
    )
    evidence_rows_html = "".join(
        (
            "<tr>"
            f"<td style=\"padding:10px 12px;border-bottom:1px solid #e5e7eb;\">{row.name}</td>"
            f"<td style=\"padding:10px 12px;border-bottom:1px solid #e5e7eb;\">{row.control_id}</td>"
            f"<td style=\"padding:10px 12px;border-bottom:1px solid #e5e7eb;\">{row.freshness_status}</td>"
            "</tr>"
        )
        for row in evidence_rows[:10]
    )

    subject = f"[{org_name}] Resumen diario de CAPAs y evidencias"
    html = (
        "<html><body style=\"margin:0;padding:0;font-family:Arial,sans-serif;background:#f3f4f6;\">"
        "<table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"max-width:760px;margin:0 auto;background:#ffffff;border-radius:8px;overflow:hidden;\">"
        "<tr><td style=\"padding:24px;background:#0b5ed7;color:#ffffff;text-align:center;\">"
        "<h1 style=\"margin:0;font-size:24px;\">Resumen diario</h1>"
        "<p style=\"margin:8px 0 0;font-size:16px;\">CAPAs vencidas y evidencias por vencer</p>"
        "</td></tr>"
        "<tr><td style=\"padding:24px;\">"
        f"<p>Organización: <strong>{org_name}</strong></p>"
        f"<p>CAPAs vencidas: <strong>{len(capa_rows)}</strong></p>"
        "<table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"border-collapse:collapse;margin-bottom:24px;\">"
        "<thead><tr style=\"background:#f8fafc;\">"
        "<th style=\"padding:10px 12px;text-align:left;\">CAPA</th>"
        "<th style=\"padding:10px 12px;text-align:left;\">Estado</th>"
        "<th style=\"padding:10px 12px;text-align:left;\">Vence</th>"
        "</tr></thead>"
        f"<tbody>{capa_rows_html or '<tr><td colspan=\"3\" style=\"padding:12px;\">Sin CAPAs vencidas.</td></tr>'}</tbody>"
        "</table>"
        f"<p>Evidencias por vencer o vencidas: <strong>{len(evidence_rows)}</strong></p>"
        "<table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"border-collapse:collapse;\">"
        "<thead><tr style=\"background:#f8fafc;\">"
        "<th style=\"padding:10px 12px;text-align:left;\">Evidencia</th>"
        "<th style=\"padding:10px 12px;text-align:left;\">Control</th>"
        "<th style=\"padding:10px 12px;text-align:left;\">Estado</th>"
        "</tr></thead>"
        f"<tbody>{evidence_rows_html or '<tr><td colspan=\"3\" style=\"padding:12px;\">Sin evidencias por vencer.</td></tr>'}</tbody>"
        "</table>"
        "</td></tr></table></body></html>"
    )
    return subject, html


@celery_app.task(bind=True, base=MaintenanceTask, name="maintenance.send_reminder_emails")
def send_reminder_emails(self) -> dict[str, int]:  # noqa: ANN001
    db = SessionLocal()
    sent = 0
    skipped = 0
    try:
        organizations = db.query(Organization).all()
        today = _utcnow().date()

        for organization in organizations:
            capa_rows = (
                db.query(CAPA)
                .filter(
                    CAPA.organization_id == organization.id,
                    CAPA.status.in_([CAPAStatus.open, CAPAStatus.inProgress]),
                    CAPA.due_date.isnot(None),
                    CAPA.due_date < today,
                )
                .order_by(CAPA.due_date.asc())
                .all()
            )

            evidence_rows = []
            for row in (
                db.query(EvidenceTaxonomy)
                .filter(
                    EvidenceTaxonomy.organization_id == organization.id,
                    EvidenceTaxonomy.validity_days.isnot(None),
                )
                .all()
            ):
                freshness_status = compute_freshness_status(row.created_at, row.validity_days, _utcnow())
                if freshness_status in {"expiring", "expired"}:
                    evidence_rows.append(row)

            if not capa_rows and not evidence_rows:
                continue

            recipients = _organization_admins(db, organization.id)
            if not recipients:
                skipped += 1
                logger.warning(
                    "maintenance send_reminder_emails org=%s skipped=no_admins",
                    organization.id,
                )
                continue

            subject, html = _render_reminder_email(organization.name, capa_rows, evidence_rows)
            if settings.reminder_emails_dry_run:
                logger.info(
                    "maintenance send_reminder_emails dry_run org=%s recipients=%s capas=%s evidences=%s",
                    organization.id,
                    len(recipients),
                    len(capa_rows),
                    len(evidence_rows),
                )
                continue

            for recipient in recipients:
                try:
                    _send_email_message(recipient.email, subject, html)
                    sent += 1
                except Exception as exc:
                    logger.warning(
                        "maintenance send_reminder_emails org=%s recipient=%s failed=%s",
                        organization.id,
                        recipient.id,
                        exc,
                    )

        logger.info("maintenance send_reminder_emails sent=%s skipped=%s", sent, skipped)
        return {"sent": sent, "skipped": skipped}
    finally:
        db.close()


@celery_app.task(bind=True, base=MaintenanceTask, name="maintenance.cleanup_old_audit_logs")
def cleanup_old_audit_logs(self, retention_days: int = 365 * 2) -> dict[str, int]:  # noqa: ANN001
    db = SessionLocal()
    try:
        cutoff = _utcnow() - timedelta(days=retention_days)
        deleted = db.query(AuditLog).filter(AuditLog.timestamp < cutoff).delete(synchronize_session=False)
        db.commit()
        logger.info(
            "maintenance cleanup_old_audit_logs retention_days=%s deleted=%s",
            retention_days,
            int(deleted or 0),
        )
        return {"deleted": int(deleted or 0), "retention_days": retention_days}
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


@celery_app.task(bind=True, base=MaintenanceTask, name="maintenance.sync_connectors")
def sync_connectors(self, organization_id: str | None = None) -> dict[str, Any]:  # noqa: ANN001
    db = SessionLocal()
    results: list[dict[str, Any]] = []
    try:
        query = db.query(Connector).filter(Connector.auto_sync_enabled.is_(True))
        if organization_id:
            query = query.filter(Connector.organization_id == organization_id)

        connectors = query.all()
        now = _utcnow()

        for connector in connectors:
            if not _connector_is_due(connector, now):
                continue

            try:
                result = _sync_connector(db, connector)
                results.append(
                    {
                        "organization_id": str(connector.organization_id),
                        "connector_type": connector.type,
                        **result,
                    }
                )
                logger.info(
                    "maintenance sync_connectors org=%s type=%s status=%s",
                    connector.organization_id,
                    connector.type,
                    result.get("status"),
                )
            except Exception as exc:
                results.append(
                    {
                        "organization_id": str(connector.organization_id),
                        "connector_type": connector.type,
                        "status": "failed",
                        "error": str(exc),
                    }
                )
                logger.warning(
                    "maintenance sync_connectors org=%s type=%s failed=%s",
                    connector.organization_id,
                    connector.type,
                    exc,
                )

        return {"synced": len([item for item in results if item.get("status") == "ok"]), "results": results}
    finally:
        db.close()