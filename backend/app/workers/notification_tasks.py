from datetime import datetime, timezone

from app.workers.celery_app import celery_app
from app.db.database import SessionLocal
from app.models.notification import Notification
from app.models.user import User
from app.services.notification_service import _email_enabled, _render_reminder_email, _send_email_message


@celery_app.task(name="notifications.send_reminder_emails")
def send_reminder_emails() -> dict:
    db = SessionLocal()
    try:
        users = (
            db.query(User)
            .join(Notification, Notification.user_id == User.id)
            .filter(
                Notification.is_read.is_(False),
                Notification.organization_id == User.organization_id,
            )
            .distinct()
            .all()
        )

        sent = 0
        for user in users:
            if not user.email:
                continue

            unread_notifications = (
                db.query(Notification)
                .filter(
                    Notification.user_id == user.id,
                    Notification.organization_id == user.organization_id,
                    Notification.is_read.is_(False),
                )
                .order_by(Notification.created_at.desc())
                .all()
            )

            reminders = [
                notification
                for notification in unread_notifications
                if _email_enabled(db, user.id, notification.notification_type, user.organization_id)
            ]
            if not reminders:
                continue

            subject, html = _render_reminder_email(user, reminders)
            try:
                _send_email_message(user.email, subject, html)
                sent += 1
            except Exception:
                continue

        return {"sent": sent}
    finally:
        db.close()
