"""Configuración de Celery para tareas asincrónicas."""

from celery import Celery
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

# Auto-descubrir tareas
celery_app.autodiscover_tasks(["app.workers"])
