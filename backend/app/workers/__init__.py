"""Inicializador del paquete workers."""

from app.workers.celery_app import celery_app

# Importar tareas para registrarlas
from app.workers import validation_tasks  # noqa

__all__ = ["celery_app", "validation_tasks"]
