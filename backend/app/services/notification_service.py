from __future__ import annotations

import json
import smtplib
import asyncio
from email.message import EmailMessage
from datetime import datetime, timezone
from typing import Any
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.ws_manager import websocket_manager
from app.db.database import SessionLocal
from app.models.notification import Notification, NotificationPreference, NotificationChannel, NotificationType
from app.models.user import User


def _send_email_message(email: str, subject: str, html_body: str) -> None:
    if not (settings.smtp_host and settings.smtp_from_email):
        raise RuntimeError("SMTP is not configured")

    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = settings.smtp_from_email
    msg["To"] = email
    msg.set_content("Este mensaje requiere un cliente compatible con HTML.")
    msg.add_alternative(html_body, subtype="html")

    with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=10) as smtp:
        if settings.smtp_use_tls:
            smtp.starttls()
        if settings.smtp_username:
            smtp.login(settings.smtp_username, settings.smtp_password)
        smtp.send_message(msg)


def send_email_message(email: str, subject: str, html_body: str) -> None:
    _send_email_message(email, subject, html_body)


def _email_enabled(db: Session, user_id: str, notification_type: NotificationType) -> bool:
    preference = (
        db.query(NotificationPreference)
        .filter(
            NotificationPreference.user_id == user_id,
            NotificationPreference.notification_type == notification_type,
            NotificationPreference.channel == NotificationChannel.email,
        )
        .first()
    )
    return bool(preference and preference.enabled)


def _render_notification_message(notification_type: NotificationType, data: dict[str, Any]) -> tuple[str, str, str]:
    title = ""
    body = ""
    subject = ""

    if notification_type == NotificationType.evidence_expired:
        title = "Evidencia vencida"
        subject = "Alerta: evidencia vencida"
        body = (
            f"La evidencia {data.get('evidence_name', 'sin nombre')} ha expirado. "
            "Revisa el registro para tomar acción y actualizar la documentación."
        )
    elif notification_type == NotificationType.capa_overdue:
        title = "CAPA vencida"
        subject = "Recordatorio: acción correctiva pendiente"
        body = (
            f"La CAPA {data.get('capa_name', 'sin nombre')} está retrasada. "
            "Por favor, revisa el plan y actualiza el estado lo antes posible."
        )
    elif notification_type == NotificationType.approval_required:
        title = "Aprobación requerida"
        subject = "Solicitud de aprobación pendiente"
        body = (
            f"Se requiere tu aprobación para {data.get('resource_name', 'un elemento')}. "
            "Accede al sistema y revisa los detalles para continuar."
        )
    elif notification_type == NotificationType.document_published:
        title = "Documento publicado"
        subject = "Nuevo documento disponible"
        body = (
            f"Se ha publicado el documento {data.get('document_name', 'sin nombre')}. "
            "Puedes revisarlo desde el módulo de documentación."
        )
    else:
        title = "Nueva notificación"
        subject = "Notificación del sistema"
        body = "Tienes una nueva notificación en el sistema."

    html = (
        f"<html><body style=\"margin:0;padding:0;font-family:Arial,sans-serif;background:#f3f4f6;\">"
        f"<table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"max-width:600px;margin:0 auto;background:#ffffff;border-radius:8px;overflow:hidden;\">"
        f"<tr><td style=\"padding:24px;background:#0b5ed7;color:#ffffff;text-align:center;\">"
        f"<h1 style=\"margin:0;font-size:24px;\">{title}</h1></td></tr>"
        f"<tr><td style=\"padding:24px;color:#333333;line-height:1.6;\">"
        f"<p style=\"margin:0 0 16px;\">{body}</p>"
        f"<p style=\"margin:0;font-size:14px;color:#6b7280;\">"
        f"Accede al panel para ver el detalle y mantener tus acciones al día.</p>"
        f"</td></tr>"
        f"<tr><td style=\"padding:16px;text-align:center;background:#f8fafc;color:#6b7280;font-size:12px;\">"
        f"Dani27001 | Notificación automática</td></tr></table></body></html>"
    )

    return title, body, html


def _render_reminder_email(user: User, notifications: list[Notification]) -> tuple[str, str]:
    subject = "Tienes notificaciones pendientes en Dani27001"
    rows = ""
    for notification in notifications:
        rows += (
            "<tr>"
            f"<td style=\"padding:12px 16px;border-bottom:1px solid #e5e7eb;\">{notification.title}</td>"
            f"<td style=\"padding:12px 16px;border-bottom:1px solid #e5e7eb;\">{notification.body or 'Revisa el sistema para más detalles'}</td>"
            f"<td style=\"padding:12px 16px;border-bottom:1px solid #e5e7eb;\">{notification.created_at.strftime('%Y-%m-%d %H:%M')}</td>"
            "</tr>"
        )

    html = (
        "<html><body style=\"margin:0;padding:0;font-family:Arial,sans-serif;background:#f3f4f6;\">"
        "<table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"max-width:680px;margin:0 auto;background:#ffffff;border-radius:8px;overflow:hidden;\">"
        "<tr><td style=\"padding:24px;background:#0b5ed7;color:#ffffff;text-align:center;\">"
        "<h1 style=\"margin:0;font-size:24px;\">Recordatorio diario</h1>"
        "<p style=\"margin:8px 0 0;font-size:16px;\">Tienes notificaciones sin marcar como leídas en Dani27001.</p>"
        "</td></tr>"
        "<tr><td style=\"padding:24px;\">"
        f"<p>Hola {user.full_name},</p>"
        "<p>Estas son tus notificaciones pendientes:</p>"
        "<table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"border-collapse:collapse;font-size:14px;color:#111827;width:100%;\">"
        "<thead><tr style=\"background:#f8fafc;color:#111827;\">"
        "<th style=\"padding:12px 16px;text-align:left;\">Notificación</th>"
        "<th style=\"padding:12px 16px;text-align:left;\">Detalle</th>"
        "<th style=\"padding:12px 16px;text-align:left;\">Creada</th>"
        "</tr></thead>"
        f"<tbody>{rows}</tbody>"
        "</table>"
        "<p style=\"margin:24px 0 0;\">Accede a la aplicación para revisar y marcar como leídas.</p>"
        "</td></tr>"
        "<tr><td style=\"padding:16px;text-align:center;background:#f8fafc;color:#6b7280;font-size:12px;\">"
        "Dani27001 | Notificaciones</td></tr></table></body></html>"
    )
    return subject, html


class NotificationService:
    @staticmethod
    def send(
        notification_type: NotificationType,
        user_id: str,
        data: dict[str, Any],
        db: Session | None = None,
    ) -> Notification:
        close_db = False
        if db is None:
            db = SessionLocal()
            close_db = True

        try:
            user = db.query(User).filter(User.id == user_id, User.is_active.is_(True)).first()
            if not user:
                raise ValueError("Usuario no encontrado")

            title, body, html = _render_notification_message(notification_type, data)
            if data is None:
                payload = None
            elif isinstance(data, (dict, list)):
                payload = json.dumps(data, default=str)
            else:
                payload = str(data)

            notification = Notification(
                organization_id=user.organization_id,
                user_id=user.id,
                notification_type=notification_type,
                channel=NotificationChannel.in_app,
                title=title,
                body=body,
                payload=payload,
            )
            db.add(notification)
            db.commit()
            db.refresh(notification)

            if _email_enabled(db, user.id, notification_type):
                try:
                    _send_email_message(user.email, title, html)
                except Exception:
                    pass

            try:
                loop = asyncio.get_running_loop()
                payload_json = None
                if notification.payload:
                    try:
                        payload_json = json.loads(notification.payload)
                    except Exception:
                        payload_json = notification.payload

                loop.create_task(
                    websocket_manager.send_json(
                        user.id,
                        {
                            "event": "notification.created",
                            "notification": {
                                "id": notification.id,
                                "notification_type": notification.notification_type,
                                "channel": notification.channel,
                                "title": notification.title,
                                "body": notification.body,
                                "is_read": notification.is_read,
                                "created_at": notification.created_at.isoformat(),
                                "created_date": notification.created_at.date().isoformat(),
                                "payload": payload_json,
                            },
                        },
                    )
                )
            except RuntimeError:
                pass

            return notification
        finally:
            if close_db and db is not None:
                db.close()


notification_service = NotificationService()
