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
    # Enforce 5 minutes maximum per task (300s)
    task_time_limit=5 * 60,
    task_soft_time_limit=4 * 60 + 30,
    worker_prefetch_multiplier=1,
    worker_max_tasks_per_child=1000,
)

# Maintenance beat schedule.
celery_app.conf.beat_schedule = {
    "maintenance-cleanup-expired-tokens": {
        "task": "maintenance.cleanup_expired_tokens",
        "schedule": 6 * 60 * 60,
        "args": (),
    },
    "maintenance-check-evidence-freshness": {
        "task": "maintenance.check_evidence_freshness",
        "schedule": crontab(hour=6, minute=0),
        "args": (),
    },
    "maintenance-send-reminder-emails": {
        "task": "maintenance.send_reminder_emails",
        "schedule": crontab(hour=8, minute=0),
        "args": (),
    },
    "maintenance-cleanup-old-audit-logs": {
        "task": "maintenance.cleanup_old_audit_logs",
        "schedule": crontab(day_of_month="1", hour=3, minute=0),
        "args": (),
    },
    "maintenance-sync-connectors": {
        "task": "maintenance.sync_connectors",
        "schedule": crontab(minute=0),
        "args": (),
    },
}

# Auto-descubrir tareas
celery_app.autodiscover_tasks(["app.workers"])

from app.workers import maintenance_tasks  # noqa: E402,F401
