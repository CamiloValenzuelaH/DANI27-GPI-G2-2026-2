"""Configuración de Celery para tareas asincrónicas."""

from celery import Celery
from celery.schedules import crontab
from app.core.config import settings

celery_app = Celery(
    "dani27_workers",
    broker=settings.redis_url,
    backend=settings.redis_url,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=30 * 60,
    task_soft_time_limit=25 * 60,
    worker_prefetch_multiplier=1,
    worker_max_tasks_per_child=1000,
)

# Schedule cleanup monthly (approx every 30 days) and daily reminder emails at 08:00 UTC.
celery_app.conf.beat_schedule = {
    "audit-cleanup-monthly": {
        "task": "audit.cleanup_old_logs",
        "schedule": 30 * 24 * 60 * 60,
        "args": (),
    },
    "notifications-send-reminder-emails": {
        "task": "notifications.send_reminder_emails",
        "schedule": crontab(hour=8, minute=0),
        "args": (),
    },
}

# Auto-descubrir tareas
celery_app.autodiscover_tasks(["app.workers"])
