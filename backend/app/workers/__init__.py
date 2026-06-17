<<<<<<< HEAD
"""Inicializador del paquete workers."""

from app.workers.celery_app import celery_app

# Importar tareas para registrarlas
from app.workers import validation_tasks  # noqa

__all__ = ["celery_app", "validation_tasks"]
=======
"""Inicializador del paquete workers."""

from app.workers.celery_app import celery_app

# Importar tareas para registrarlas
from app.workers import validation_tasks  # noqa
from app.workers import notification_tasks  # noqa
from app.workers import document_tasks  # noqa
from app.workers import report_tasks  # noqa

__all__ = ["celery_app", "validation_tasks", "notification_tasks", "document_tasks", "report_tasks"]
>>>>>>> Chat-bot
