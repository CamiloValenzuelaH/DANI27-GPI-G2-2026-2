<<<<<<< HEAD
from __future__ import annotations

import json
import hashlib
from datetime import datetime, timezone
from typing import Callable

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.types import Scope, Receive, Send

from app.db.database import SessionLocal
from sqlalchemy import text
from app.models.audit_log import AuditLog
from app.core.security import decode_access_token
from app.models.user import User
import logging

logger = logging.getLogger("audit_middleware")


class AuditMiddleware(BaseHTTPMiddleware):
    """Middleware compatible con `app.add_middleware` que registra auditoría por petición."""

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint):
        start_ts = datetime.now(timezone.utc)

        # Attempt to extract user info from Authorization header
        user_id = None
        user_role = None
        auth = request.headers.get("authorization")
        db = None
        try:
            if auth and auth.lower().startswith("bearer "):
                token = auth.split(" ", 1)[1].strip()
                payload = decode_access_token(token)
                uid = payload.get("sub")
                if uid:
                    db = SessionLocal()
                    user = db.query(User).filter(User.id == uid).first()
                    if user:
                        user_id = str(user.id)
                        user_role = getattr(user, "role", None) or getattr(user, "primary_role", None) or None
        except Exception:
            # Silence auth errors; audit still records anonymous access
            pass

        # Read body (best-effort)
        details = {}
        try:
            body = await request.body()
            if body:
                try:
                    details = json.loads(body.decode("utf-8"))
                except Exception:
                    details = {"raw": body.decode("utf-8", errors="ignore")[:1000]}
        except Exception:
            details = {}

        response = await call_next(request)

        status_code = getattr(response, "status_code", 0)

        try:
            ip = request.client.host if request.client else request.headers.get("x-forwarded-for")
        except Exception:
            ip = None

        user_agent = request.headers.get("user-agent")
        method = request.method
        path = request.url.path

        action = f"{method}".upper()
        resource = path

        # Persist audit log (best-effort, don't block response)
        try:
            session = db or SessionLocal()
            # Get previous hash
            prev = session.execute(
                text("SELECT current_hash FROM audit_logs ORDER BY timestamp DESC LIMIT 1")
            ).fetchone()
            previous_hash = prev[0] if prev else None
            record = AuditLog(
                user_id=user_id,
                user_role=user_role,
                action=action,
                resource=resource,
                details=details,
                timestamp=start_ts,
                ip_address=ip,
                user_agent=user_agent,
                http_status=int(status_code or 0),
                success=(200 <= int(status_code) < 400),
                previous_hash=previous_hash,
                current_hash="",
            )
            record.current_hash = record.compute_hash()
            session.add(record)
            session.commit()
        except Exception as exc:
            try:
                session.rollback()
            except Exception:
                pass
            logger.exception("Failed to write audit log: %s", exc)
        finally:
            try:
                if db:
                    db.close()
                else:
                    session.close()
            except Exception:
                pass

        return response
=======
from __future__ import annotations

import json
import hashlib
from datetime import datetime, timezone
from typing import Callable

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.types import Scope, Receive, Send

from app.db.database import SessionLocal
from sqlalchemy import text
from app.models.audit_log import AuditLog
from app.core.security import decode_access_token
from app.models.user import User
import logging

logger = logging.getLogger("audit_middleware")


class AuditMiddleware(BaseHTTPMiddleware):
    """Middleware compatible con `app.add_middleware` que registra auditoría por petición."""

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint):
        start_ts = datetime.now(timezone.utc)

        # Attempt to extract user info from Authorization header
        user_id = None
        user_role = None
        auth = request.headers.get("authorization")
        db = None
        try:
            if auth and auth.lower().startswith("bearer "):
                token = auth.split(" ", 1)[1].strip()
                payload = decode_access_token(token)
                uid = payload.get("sub")
                if uid:
                    db = SessionLocal()
                    user = db.query(User).filter(User.id == uid).first()
                    if user:
                        user_id = str(user.id)
                        user_role = getattr(user, "role", None) or getattr(user, "primary_role", None) or None
        except Exception:
            # Silence auth errors; audit still records anonymous access
            pass

        # Read body (best-effort)
        details = {}
        try:
            body = await request.body()
            if body:
                try:
                    details = json.loads(body.decode("utf-8"))
                except Exception:
                    details = {"raw": body.decode("utf-8", errors="ignore")[:1000]}
        except Exception:
            details = {}

        response = await call_next(request)

        status_code = getattr(response, "status_code", 0)

        try:
            ip = request.client.host if request.client else request.headers.get("x-forwarded-for")
        except Exception:
            ip = None

        user_agent = request.headers.get("user-agent")
        method = request.method
        path = request.url.path

        action = f"{method}".upper()
        resource = path

        # Persist audit log (best-effort, don't block response)
        try:
            session = db or SessionLocal()
            # Get previous hash
            prev = session.execute(
                text("SELECT current_hash FROM audit_logs ORDER BY timestamp DESC LIMIT 1")
            ).fetchone()
            previous_hash = prev[0] if prev else None
            record = AuditLog(
                user_id=user_id,
                user_role=user_role,
                action=action,
                resource=resource,
                details=details,
                timestamp=start_ts,
                ip_address=ip,
                user_agent=user_agent,
                http_status=int(status_code or 0),
                success=(200 <= int(status_code) < 400),
                previous_hash=previous_hash,
                current_hash="",
            )
            record.current_hash = record.compute_hash()
            session.add(record)
            session.commit()
        except Exception as exc:
            try:
                session.rollback()
            except Exception:
                pass
            logger.exception("Failed to write audit log: %s", exc)
        finally:
            try:
                if db:
                    db.close()
                else:
                    session.close()
            except Exception:
                pass

        return response
>>>>>>> Chat-bot
