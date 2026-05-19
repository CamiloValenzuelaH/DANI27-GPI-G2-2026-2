"""Tareas relacionadas con auditoría: limpieza y mantenimiento."""
from datetime import datetime, timezone, timedelta

from app.workers.celery_app import celery_app
from app.db.database import SessionLocal
from app.models.audit_log import AuditLog


@celery_app.task(name="audit.cleanup_old_logs")
def cleanup_old_logs(retention_days: int = 365 * 2):
    """Eliminar logs más antiguos que la retención (default 2 años).

    Nota: la tabla `audit_logs` es inmutable respecto a UPDATE/DELETE por diseño, pero
    esta tarea ejecuta DELETE como operación administrativa necesaria para cumplimiento.
    Ejecútela con permisos y revisiones apropiadas.
    """
    cutoff = datetime.now(timezone.utc) - timedelta(days=retention_days)
    db = SessionLocal()
    try:
        deleted = db.query(AuditLog).filter(AuditLog.timestamp < cutoff).delete()
        db.commit()
        return {"deleted": int(deleted)}
    except Exception as e:
        db.rollback()
        raise
    finally:
        db.close()
