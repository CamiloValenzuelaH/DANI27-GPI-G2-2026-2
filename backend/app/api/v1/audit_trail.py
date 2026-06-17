<<<<<<< HEAD
from __future__ import annotations

from fastapi import APIRouter, Depends, Query, Response, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from datetime import datetime, timezone
import csv
import io
import json
from typing import Optional

from app.db.database import get_db
from app.core.dependencies import get_current_user
from app.models.audit_log import AuditLog

router = APIRouter(prefix="/audit-trail", tags=["audit-trail"])


@router.get("", response_model=dict)
def list_audit_logs(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    user_id: Optional[str] = Query(None),
    action: Optional[str] = Query(None),
    resource: Optional[str] = Query(None),
    start: Optional[str] = Query(None),
    end: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
):
    query = db.query(AuditLog)
    if user_id:
        query = query.filter(AuditLog.user_id == user_id)
    if action:
        query = query.filter(AuditLog.action.ilike(f"%{action}%"))
    if resource:
        query = query.filter(AuditLog.resource.ilike(f"%{resource}%"))
    if start:
        try:
            start_dt = datetime.fromisoformat(start)
            query = query.filter(AuditLog.timestamp >= start_dt)
        except Exception:
            raise HTTPException(status_code=400, detail="start must be ISO datetime")
    if end:
        try:
            end_dt = datetime.fromisoformat(end)
            query = query.filter(AuditLog.timestamp <= end_dt)
        except Exception:
            raise HTTPException(status_code=400, detail="end must be ISO datetime")

    total = query.count()
    results = query.order_by(AuditLog.timestamp.desc()).offset(skip).limit(limit).all()

    items = [
        {
            "id": str(r.id),
            "user_id": r.user_id,
            "user_role": r.user_role,
            "action": r.action,
            "resource": r.resource,
            "details": r.details,
            "timestamp": r.timestamp.isoformat() if r.timestamp else None,
            "ip_address": r.ip_address,
            "user_agent": r.user_agent,
            "http_status": r.http_status,
            "success": r.success,
            "current_hash": r.current_hash,
        }
        for r in results
    ]

    return {"total": total, "items": items}


@router.get("/export")
def export_audit_logs(
    format: str = Query("csv", regex="^(csv|json|pdf)$"),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    user_id: Optional[str] = Query(None),
    action: Optional[str] = Query(None),
    resource: Optional[str] = Query(None),
    start: Optional[str] = Query(None),
    end: Optional[str] = Query(None),
):
    # Reuse listing filters
    query = db.query(AuditLog)
    if user_id:
        query = query.filter(AuditLog.user_id == user_id)
    if action:
        query = query.filter(AuditLog.action.ilike(f"%{action}%"))
    if resource:
        query = query.filter(AuditLog.resource.ilike(f"%{resource}%"))
    if start:
        start_dt = datetime.fromisoformat(start)
        query = query.filter(AuditLog.timestamp >= start_dt)
    if end:
        end_dt = datetime.fromisoformat(end)
        query = query.filter(AuditLog.timestamp <= end_dt)

    results = query.order_by(AuditLog.timestamp.desc()).all()

    if format == "json":
        data = [
            {
                "id": str(r.id),
                "user_id": r.user_id,
                "user_role": r.user_role,
                "action": r.action,
                "resource": r.resource,
                "details": r.details,
                "timestamp": r.timestamp.isoformat() if r.timestamp else None,
                "ip_address": r.ip_address,
                "user_agent": r.user_agent,
                "http_status": r.http_status,
                "success": r.success,
                "current_hash": r.current_hash,
            }
            for r in results
        ]
        return Response(content=json.dumps(data, ensure_ascii=False, default=str), media_type="application/json")

    if format == "csv":
        buf = io.StringIO()
        writer = csv.writer(buf)
        writer.writerow(["id", "timestamp", "user_id", "user_role", "action", "resource", "http_status", "success", "ip_address", "user_agent", "details", "current_hash"])
        for r in results:
            writer.writerow([
                str(r.id),
                r.timestamp.isoformat() if r.timestamp else "",
                r.user_id or "",
                r.user_role or "",
                r.action,
                r.resource,
                r.http_status,
                r.success,
                r.ip_address or "",
                (r.user_agent or "").replace("\n", " "),
                json.dumps(r.details, ensure_ascii=False) if r.details else "",
                r.current_hash,
            ])
        buf.seek(0)
        return StreamingResponse(iter([buf.getvalue().encode("utf-8")]), media_type="text/csv", headers={"Content-Disposition": "attachment; filename=export.csv"})

    # PDF: generate simple tabular pdf using reportlab
    if format == "pdf":
        try:
            from reportlab.lib.pagesizes import letter
            from reportlab.pdfgen import canvas
        except Exception:
            raise HTTPException(status_code=500, detail="PDF export requires reportlab in requirements")

        buf = io.BytesIO()
        c = canvas.Canvas(buf, pagesize=letter)
        w, h = letter
        y = h - 40
        c.setFont("Helvetica-Bold", 12)
        c.drawString(40, y, "Audit Trail Export")
        y -= 20
        c.setFont("Helvetica", 8)
        for r in results:
            text = f"{r.timestamp.isoformat() if r.timestamp else ''} | {r.user_id or ''} | {r.action} {r.resource} | {r.http_status} | {r.current_hash[:8]}"
            c.drawString(40, y, text[:120])
            y -= 12
            if y < 60:
                c.showPage()
                y = h - 40
        c.save()
        buf.seek(0)
        return StreamingResponse(buf, media_type="application/pdf", headers={"Content-Disposition": "attachment; filename=export.pdf"})
=======
from __future__ import annotations

from fastapi import APIRouter, Depends, Query, Response, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from datetime import datetime, timezone
import csv
import io
import json
from typing import Optional

from app.db.database import get_db
from app.core.dependencies import get_current_user, require_superadmin
from app.models.audit_log import AuditLog

router = APIRouter(prefix="/audit-trail", tags=["audit-trail"])


@router.get("", response_model=dict)
def list_audit_logs(
    db: Session = Depends(get_db),
    current_user=Depends(require_superadmin),
    user_id: Optional[str] = Query(None),
    action: Optional[str] = Query(None),
    resource: Optional[str] = Query(None),
    start: Optional[str] = Query(None),
    end: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
):
    query = db.query(AuditLog)
    if user_id:
        query = query.filter(AuditLog.user_id == user_id)
    if action:
        query = query.filter(AuditLog.action.ilike(f"%{action}%"))
    if resource:
        query = query.filter(AuditLog.resource.ilike(f"%{resource}%"))
    if start:
        try:
            start_dt = datetime.fromisoformat(start)
            query = query.filter(AuditLog.timestamp >= start_dt)
        except Exception:
            raise HTTPException(status_code=400, detail="start must be ISO datetime")
    if end:
        try:
            end_dt = datetime.fromisoformat(end)
            query = query.filter(AuditLog.timestamp <= end_dt)
        except Exception:
            raise HTTPException(status_code=400, detail="end must be ISO datetime")

    total = query.count()
    results = query.order_by(AuditLog.timestamp.desc()).offset(skip).limit(limit).all()

    items = [
        {
            "id": str(r.id),
            "user_id": r.user_id,
            "user_role": r.user_role,
            "action": r.action,
            "resource": r.resource,
            "details": r.details,
            "timestamp": r.timestamp.isoformat() if r.timestamp else None,
            "ip_address": r.ip_address,
            "user_agent": r.user_agent,
            "http_status": r.http_status,
            "success": r.success,
            "current_hash": r.current_hash,
        }
        for r in results
    ]

    return {"total": total, "items": items}


@router.get("/export")
def export_audit_logs(
    format: str = Query("csv", regex="^(csv|json|pdf)$"),
    db: Session = Depends(get_db),
    current_user=Depends(require_superadmin),
    user_id: Optional[str] = Query(None),
    action: Optional[str] = Query(None),
    resource: Optional[str] = Query(None),
    start: Optional[str] = Query(None),
    end: Optional[str] = Query(None),
):
    # Reuse listing filters
    query = db.query(AuditLog)
    if user_id:
        query = query.filter(AuditLog.user_id == user_id)
    if action:
        query = query.filter(AuditLog.action.ilike(f"%{action}%"))
    if resource:
        query = query.filter(AuditLog.resource.ilike(f"%{resource}%"))
    if start:
        start_dt = datetime.fromisoformat(start)
        query = query.filter(AuditLog.timestamp >= start_dt)
    if end:
        end_dt = datetime.fromisoformat(end)
        query = query.filter(AuditLog.timestamp <= end_dt)

    results = query.order_by(AuditLog.timestamp.desc()).all()

    if format == "json":
        data = [
            {
                "id": str(r.id),
                "user_id": r.user_id,
                "user_role": r.user_role,
                "action": r.action,
                "resource": r.resource,
                "details": r.details,
                "timestamp": r.timestamp.isoformat() if r.timestamp else None,
                "ip_address": r.ip_address,
                "user_agent": r.user_agent,
                "http_status": r.http_status,
                "success": r.success,
                "current_hash": r.current_hash,
            }
            for r in results
        ]
        return Response(content=json.dumps(data, ensure_ascii=False, default=str), media_type="application/json")

    if format == "csv":
        buf = io.StringIO()
        writer = csv.writer(buf)
        writer.writerow(["id", "timestamp", "user_id", "user_role", "action", "resource", "http_status", "success", "ip_address", "user_agent", "details", "current_hash"])
        for r in results:
            writer.writerow([
                str(r.id),
                r.timestamp.isoformat() if r.timestamp else "",
                r.user_id or "",
                r.user_role or "",
                r.action,
                r.resource,
                r.http_status,
                r.success,
                r.ip_address or "",
                (r.user_agent or "").replace("\n", " "),
                json.dumps(r.details, ensure_ascii=False) if r.details else "",
                r.current_hash,
            ])
        buf.seek(0)
        return StreamingResponse(iter([buf.getvalue().encode("utf-8")]), media_type="text/csv", headers={"Content-Disposition": "attachment; filename=export.csv"})

    # PDF: generate simple tabular pdf using reportlab
    if format == "pdf":
        try:
            from reportlab.lib.pagesizes import letter
            from reportlab.pdfgen import canvas
        except Exception:
            raise HTTPException(status_code=500, detail="PDF export requires reportlab in requirements")

        buf = io.BytesIO()
        c = canvas.Canvas(buf, pagesize=letter)
        w, h = letter
        y = h - 40
        c.setFont("Helvetica-Bold", 12)
        c.drawString(40, y, "Audit Trail Export")
        y -= 20
        c.setFont("Helvetica", 8)
        for r in results:
            text = f"{r.timestamp.isoformat() if r.timestamp else ''} | {r.user_id or ''} | {r.action} {r.resource} | {r.http_status} | {r.current_hash[:8]}"
            c.drawString(40, y, text[:120])
            y -= 12
            if y < 60:
                c.showPage()
                y = h - 40
        c.save()
        buf.seek(0)
        return StreamingResponse(buf, media_type="application/pdf", headers={"Content-Disposition": "attachment; filename=export.pdf"})


@router.get("/me", response_model=dict)
def get_my_audit_logs(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    start: Optional[str] = Query(None),
    end: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
):
    query = db.query(AuditLog).filter(AuditLog.user_id == str(current_user.id))

    if start:
        try:
            start_dt = datetime.fromisoformat(start)
            query = query.filter(AuditLog.timestamp >= start_dt)
        except Exception:
            raise HTTPException(status_code=400, detail="start must be ISO datetime")
    if end:
        try:
            end_dt = datetime.fromisoformat(end)
            query = query.filter(AuditLog.timestamp <= end_dt)
        except Exception:
            raise HTTPException(status_code=400, detail="end must be ISO datetime")

    total = query.count()
    results = query.order_by(AuditLog.timestamp.desc()).offset(skip).limit(limit).all()

    items = [
        {
            "id": str(r.id),
            "user_id": r.user_id,
            "user_role": r.user_role,
            "action": r.action,
            "resource": r.resource,
            "details": r.details,
            "timestamp": r.timestamp.isoformat() if r.timestamp else None,
            "ip_address": r.ip_address,
            "user_agent": r.user_agent,
            "http_status": r.http_status,
            "success": r.success,
            "current_hash": r.current_hash,
        }
        for r in results
    ]

    return {"total": total, "items": items}
>>>>>>> Chat-bot
