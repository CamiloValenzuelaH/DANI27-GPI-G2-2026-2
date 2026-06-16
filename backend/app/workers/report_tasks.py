from __future__ import annotations

import asyncio
import base64
import csv
import io
import json
import textwrap
import uuid
from datetime import datetime, timezone
from typing import Any

import docx as python_docx
import openpyxl
from openpyxl.styles import Font
import redis.asyncio as aioredis
from app.core.config import settings
from app.db.database import SessionLocal
from celery.exceptions import SoftTimeLimitExceeded
from app.models.report_job import ReportJob
from app.models.assessment_progress import AssessmentProgress
from app.models.audit_checklist import AuditChecklist
from app.models.notification import NotificationType
from app.models.risk import Risk
from app.services.notification_service import notification_service
from app.workers.celery_app import celery_app
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

JOB_KEY_PREFIX = "report:job:"
JOB_TTL_SECONDS = 60 * 60 * 24 * 7
REPORT_DIR = "/tmp/reports"


def _job_key(job_id: str) -> str:
    return f"{JOB_KEY_PREFIX}{job_id}"


async def _publish_report_progress(
    job_id: str,
    status: str,
    progress: int,
    message: str,
    metadata: dict[str, Any],
) -> None:
    redis_client = aioredis.from_url(settings.redis_url, decode_responses=True)
    try:
        now = datetime.now(timezone.utc).isoformat()
        now_date = datetime.now(timezone.utc).date().isoformat()
        payload = {
            "job_id": job_id,
            "status": status,
            "progress": str(progress),
            "message": message,
            "report_title": metadata.get("report_title", ""),
            "report_template": metadata.get("report_template", ""),
            "report_format": metadata.get("report_format", ""),
            "download_url": metadata.get("download_url", ""),
            "organization_id": metadata.get("organization_id", ""),
            "user_id": metadata.get("user_id", ""),
            "created_at": metadata.get("created_at", now),
            "created_date": metadata.get("created_date", now_date),
            "updated_at": now,
        }
        await redis_client.hset(_job_key(job_id), mapping=payload)
        await redis_client.expire(_job_key(job_id), JOB_TTL_SECONDS)
        # Persist/update job in the DB
        try:
            db = SessionLocal()
            existing = db.query(ReportJob).filter(ReportJob.job_id == job_id).first()
            if existing is None:
                record = ReportJob(
                    job_id=job_id,
                    organization_id=metadata.get("organization_id") or "",
                    user_id=metadata.get("user_id") or None,
                    status=status,
                    progress=progress,
                    message=message,
                    report_title=metadata.get("report_title"),
                    report_template=metadata.get("report_template"),
                    report_format=metadata.get("report_format"),
                    created_date=metadata.get("created_date") or now_date,
                )
                db.add(record)
            else:
                existing.status = status
                existing.progress = progress
                existing.message = message
                existing.report_title = metadata.get("report_title")
                existing.report_template = metadata.get("report_template")
                existing.report_format = metadata.get("report_format")
                existing.created_date = metadata.get("created_date") or existing.created_date
            db.commit()
        except Exception:
            try:
                db.rollback()
            except Exception:
                pass
        finally:
            try:
                db.close()
            except Exception:
                pass
    finally:
        await redis_client.close()


async def _write_initial_job_state(job_id: str, metadata: dict[str, Any]) -> None:
    await _publish_report_progress(
        job_id=job_id,
        status="queued",
        progress=0,
        message="Reporte encolado.",
        metadata=metadata,
    )


def _generate_pdf(
    content: str,
    branding: dict[str, str] | None,
    title: str | None,
    description: str | None,
    template: str,
    generated_at: str,
) -> bytes:
    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=letter)
    width, height = letter
    x_margin = 40
    y = height - 60

    def _new_page() -> None:
        nonlocal y
        c.showPage()
        y = height - 60

    def _draw_line(text: str, font_name: str, font_size: int, leading: int) -> None:
        nonlocal y
        if y < 80:
            _new_page()
        c.setFont(font_name, font_size)
        wrapped = textwrap.wrap(text, width=100)
        for part in wrapped:
            if y < 80:
                _new_page()
            c.drawString(x_margin, y, part)
            y -= leading

    # Portada simple
    c.setFont("Helvetica-Bold", 22)
    c.drawString(x_margin, y, title or "Reporte Ejecutivo")
    y -= 28

    c.setFont("Helvetica", 11)
    if description:
        for line in textwrap.wrap(description, width=95):
            c.drawString(x_margin, y, line)
            y -= 14
        y -= 10

    c.setFont("Helvetica-Oblique", 9)
    c.drawString(x_margin, y, f"Plantilla: {template.replace('_', ' ').title()}    Generado: {generated_at}")
    y -= 16

    c.setStrokeColorRGB(0.65, 0.65, 0.65)
    c.setLineWidth(0.8)
    c.line(x_margin, y, width - x_margin, y)
    y -= 26

    # Contenido principal
    for line in content.split("\n"):
        if not line.strip():
            y -= 10
            continue
        if line.endswith(":") and not line.startswith("•"):
            c.setFont("Helvetica-Bold", 12)
            if y < 80:
                _new_page()
            c.drawString(x_margin, y, line)
            y -= 18
            continue

        if line.startswith("•"):
            c.setFont("Helvetica", 10)
            if y < 80:
                _new_page()
            wrapped = textwrap.wrap(line[2:], width=92)
            c.drawString(x_margin + 12, y, "• " + wrapped[0])
            y -= 14
            for part in wrapped[1:]:
                if y < 80:
                    _new_page()
                c.drawString(x_margin + 20, y, part)
                y -= 14
            continue

        _draw_line(line, "Helvetica", 10, 14)

    c.save()
    buf.seek(0)
    return buf.read()


def _generate_csv(document: dict[str, Any]) -> bytes:
    buf = io.StringIO()
    writer = csv.writer(buf)
    for section in document.get("sections", []):
        heading = section.get("heading")
        if heading:
            writer.writerow([heading])
        if section.get("paragraphs"):
            for paragraph in section.get("paragraphs", []):
                writer.writerow(["", paragraph])
        if section.get("rows"):
            rows = section.get("rows", [])
            if rows:
                writer.writerow(["", ""])
                writer.writerow(rows[0])
                for row in rows[1:]:
                    writer.writerow(row)
        writer.writerow([])
    return buf.getvalue().encode("utf-8")


def _generate_docx(document: dict[str, Any]) -> bytes:
    doc = python_docx.Document()
    if document.get("title"):
        doc.add_heading(document["title"], level=1)
    if document.get("description"):
        doc.add_paragraph(document["description"])
    for section in document.get("sections", []):
        if section.get("heading"):
            doc.add_heading(section["heading"], level=2)
        for paragraph in section.get("paragraphs", []):
            doc.add_paragraph(paragraph)
        if section.get("rows"):
            table = doc.add_table(rows=0, cols=len(section["rows"][0]))
            table.style = "LightShading-Accent1"
            for row in section["rows"]:
                cells = table.add_row().cells
                for idx, cell_text in enumerate(row):
                    cells[idx].text = str(cell_text)
    out = io.BytesIO()
    doc.save(out)
    out.seek(0)
    return out.read()


def _generate_xlsx(document: dict[str, Any]) -> bytes:
    workbook = openpyxl.Workbook()
    sheet = workbook.active
    row_index = 1
    for section in document.get("sections", []):
        if section.get("heading"):
            cell = sheet.cell(row=row_index, column=1, value=section["heading"])
            cell.font = Font(bold=True, size=12)
            row_index += 1
        if section.get("paragraphs"):
            for paragraph in section.get("paragraphs", []):
                sheet.cell(row=row_index, column=1, value=paragraph)
                row_index += 1
        if section.get("rows"):
            rows = section.get("rows", [])
            if rows:
                header = rows[0]
                for col_index, cell_value in enumerate(header, start=1):
                    cell = sheet.cell(row=row_index, column=col_index, value=cell_value)
                    cell.font = Font(bold=True)
                row_index += 1
                for row in rows[1:]:
                    for col_index, cell_value in enumerate(row, start=1):
                        sheet.cell(row=row_index, column=col_index, value=cell_value)
                    row_index += 1
        row_index += 1
    for column_cells in sheet.columns:
        length = max(len(str(cell.value or "")) for cell in column_cells)
        if length:
            sheet.column_dimensions[column_cells[0].column_letter].width = min(length + 4, 40)
    out = io.BytesIO()
    workbook.save(out)
    out.seek(0)
    return out.read()


def _render_template_data(template: str, organization_id: str, db_payload: dict[str, Any]) -> dict[str, Any]:
    org_id = organization_id
    try:
        org_id = uuid.UUID(organization_id)
    except ValueError:
        pass

    with SessionLocal() as db:
        if template == "soa":
            audit = db.query(AuditChecklist).filter(AuditChecklist.organization_id == org_id).first()
            controls = []
            implemented = 0
            pending = 0
            if audit and isinstance(audit.checklist_data, list):
                for idx, item in enumerate(audit.checklist_data):
                    status = item.get("status", "Desconocido")
                    if status.lower() in {"implementado", "completo", "cerrado", "done"}:
                        implemented += 1
                    else:
                        pending += 1
                    controls.append(
                        {
                            "control": item.get("control", f"Control {idx + 1}"),
                            "status": status,
                            "justification": item.get("justification", "Sin justificación"),
                        }
                    )
            if not controls:
                controls = [
                    {
                        "control": "Sin controles definidos",
                        "status": "No disponible",
                        "justification": "No se encontraron datos de checklist.",
                    }
                ]
            coverage = f"{implemented}/{len(controls)} controles implementados" if controls else "Sin datos de controles"
            summary = (
                "Evaluación del SOA con foco en la madurez de controles y la identificación de brechas. "
                f"Actualmente se identifican {coverage}."
            )
            return {
                "summary": summary,
                "controls": controls,
                "implemented_controls": implemented,
                "pending_controls": pending,
            }

        if template == "risk_register":
            risks = db.query(Risk).filter(Risk.organization_id == org_id).all()
            rows = [["Riesgo", "Activo", "Probabilidad", "Impacto", "Nivel"]]
            counts: dict[str, int] = {}
            for risk in risks:
                asset_name = getattr(risk.asset, "name", "Desconocido") if getattr(risk, "asset", None) else "Desconocido"
                level = risk.residual_risk_level or "Desconocido"
                counts[level] = counts.get(level, 0) + 1
                rows.append([
                    risk.name,
                    asset_name,
                    str(risk.probability),
                    str(risk.impact),
                    level,
                ])
            if len(rows) == 1:
                rows.append(["No hay riesgos registrados", "", "", "", ""])
            risk_summary = ", ".join(f"{count} {level}" for level, count in counts.items()) if counts else "No se registraron riesgos"
            return {
                "summary": (
                    "Inventario de riesgos con evaluación de probabilidad e impacto. "
                    f"Clasificación actual: {risk_summary}."
                ),
                "rows": rows,
                "risk_counts": counts,
            }

        if template == "audit_report":
            audit = db.query(AuditChecklist).filter(AuditChecklist.organization_id == org_id).first()
            progress = db.query(AssessmentProgress).filter(AssessmentProgress.organization_id == org_id).first()
            breaches = []
            for item in (audit.checklist_data if audit and isinstance(audit.checklist_data, list) else [])[:12]:
                breaches.append(
                    {
                        "item": item.get("control", "Control"),
                        "status": item.get("status", "Pendiente"),
                        "recommendation": item.get("recommendation", "Revisar el control."),
                    }
                )
            if not breaches:
                breaches = [
                    {
                        "item": "No hay hallazgos disponibles",
                        "status": "N/A",
                        "recommendation": "Agregar datos de checklist para generar un audit report completo.",
                    }
                ]
            score = 0
            total = len(breaches)
            if total > 0:
                score = sum(1 for breach in breaches if breach["status"].lower() in {"implementado", "completo", "cerrado", "done"}) * 100 // total
            overall_status = "Satisfactorio" if score >= 70 else "Moderado" if score >= 40 else "Crítico"
            trend = "Estable" if not progress or not isinstance(progress.progress_data, dict) else progress.progress_data.get("status", "Estable")
            return {
                "summary": (
                    "Audit report con hallazgos clave y estado de cumplimiento. "
                    f"Health score estimado: {score}% ({overall_status})."
                ),
                "breaches": breaches,
                "score": score,
                "trend": trend,
            }

        if template == "gap_analysis":
            progress = db.query(AssessmentProgress).filter(AssessmentProgress.organization_id == org_id).first()
            phases = []
            completed = 0
            pending = 0
            if progress and isinstance(progress.progress_data, dict):
                for phase, value in progress.progress_data.items():
                    status = "Completo" if value in {"complete", "completed", True, 1} else "Pendiente"
                    if status == "Completo":
                        completed += 1
                    else:
                        pending += 1
                    phases.append(
                        {
                            "phase": phase.capitalize(),
                            "status": status,
                            "recommendation": "Revisar y actualizar el estado de la fase.",
                        }
                    )
            if not phases:
                phases = [
                    {
                        "phase": "Planificación",
                        "status": "Pendiente",
                        "recommendation": "Registre el progreso de la evaluación para iniciar el gap analysis.",
                    }
                ]
            phase_summary = f"{completed} fases completas, {pending} pendientes"
            return {
                "summary": (
                    "Gap analysis con enfoque en la brecha entre estado actual y objetivos de cumplimiento. "
                    f"Resumen: {phase_summary}."
                ),
                "phases": phases,
                "completed_phases": completed,
                "pending_phases": pending,
            }

    return {"summary": "Datos del reporte no disponibles."}


def _build_report_document(
    template: str,
    rendered: dict[str, Any],
    title: str | None = None,
    description: str | None = None,
    generated_at: str | None = None,
) -> dict[str, Any]:
    sections: list[dict[str, Any]] = []
    if title or description:
        intro_lines: list[str] = []
        if title:
            intro_lines.append(title)
        if description:
            intro_lines.extend(textwrap.wrap(description, width=100))
        sections.append({"heading": "Resumen ejecutivo", "paragraphs": intro_lines})

    sections.append({"heading": "Hallazgos", "paragraphs": [rendered.get("summary", "") or "No hay resumen disponible."]})

    if template == "soa":
        controls = rendered.get("controls", [])
        sections.append({
            "heading": "Controles de seguridad",
            "rows": [["Control", "Estado", "Justificación"]] + [[c["control"], c["status"], c["justification"]] for c in controls],
        })
        sections.append({
            "heading": "Conclusiones",
            "paragraphs": [
                f"Controles implementados: {rendered.get('implemented_controls', 0)}.",
                f"Controles pendientes: {rendered.get('pending_controls', 0)}.",
                "Recomendación: priorizar el cierre de controles pendientes y documentar evidencia clara para cada uno.",
            ],
        })
    elif template == "risk_register":
        rows = rendered.get("rows", [])
        counts = rendered.get("risk_counts", {})
        sections.append({
            "heading": "Inventario de riesgos",
            "rows": rows,
        })
        if counts:
            sections.append({
                "heading": "Clasificación de riesgos",
                "paragraphs": [f"{count} riesgos en nivel {level}." for level, count in counts.items()],
            })
    elif template == "audit_report":
        breaches = rendered.get("breaches", [])
        sections.append({
            "heading": "Hallazgos clave",
            "rows": [["Hallazgo", "Estado", "Recomendación"]] + [[b["item"], b["status"], b["recommendation"]] for b in breaches],
        })
        sections.append({
            "heading": "Indicadores",
            "paragraphs": [
                f"Health score estimado: {rendered.get('score', 0)}%.",
                f"Tendencia: {rendered.get('trend', 'No definido')}.",
            ],
        })
    elif template == "gap_analysis":
        phases = rendered.get("phases", [])
        sections.append({
            "heading": "Estado por fase",
            "rows": [["Fase", "Estado", "Recomendación"]] + [[p["phase"], p["status"], p["recommendation"]] for p in phases],
        })
        sections.append({
            "heading": "Progreso",
            "paragraphs": [
                f"Fases completadas: {rendered.get('completed_phases', 0)}.",
                f"Fases pendientes: {rendered.get('pending_phases', 0)}.",
            ],
        })

    if generated_at:
        sections.insert(0, {"heading": "Metadatos", "paragraphs": [f"Generado: {generated_at}", f"Plantilla: {template.replace('_', ' ').title()}"]})

    return {"title": title, "description": description, "template": template, "generated_at": generated_at, "sections": sections}


def _render_report_text(
    template: str,
    rendered: dict[str, Any],
    title: str | None = None,
    description: str | None = None,
) -> str:
    lines: list[str] = []
    if title:
        lines.append(title)
    if description:
        lines.append(description)
    lines.append(f"Plantilla: {template.replace('_', ' ').title()}")
    lines.append("")
    lines.append("Resumen ejecutivo:")
    lines.append(rendered.get("summary", ""))
    lines.append("")

    if template == "soa":
        implemented = rendered.get("implemented_controls")
        pending = rendered.get("pending_controls")
        if implemented is not None and pending is not None:
            lines.append("Estado actual de controles:")
            lines.append(f"- Controles implementados: {implemented}")
            lines.append(f"- Controles pendientes: {pending}")
            lines.append("")
        lines.append("Detalles de controles:")
        for control in rendered.get("controls", []):
            lines.append(
                f"• {control['control']} — Estado: {control['status']}. Justificación: {control['justification']}"
            )
        lines.append("")
        lines.append("Recomendaciones principales:")
        lines.append(
            "Priorice la completitud de controles con estado pendiente y documente evidencia concreta para cada hallazgo."
        )
    elif template == "risk_register":
        counts = rendered.get("risk_counts", {})
        if counts:
            lines.append("Distribución de riesgos:")
            for level, count in counts.items():
                lines.append(f"- {level}: {count}")
            lines.append("")
        lines.append("Riesgos clave:")
        for row in rendered.get("rows", []):
            if row and row[0] != "Riesgo":
                lines.append(
                    f"• {row[0]} (Activo: {row[1]}, Probabilidad: {row[2]}, Impacto: {row[3]}, Nivel: {row[4]})"
                )
        lines.append("")
        lines.append("Implicaciones:")
        lines.append(
            "A partir de esta clasificación, enfoque las mitigaciones en riesgos de nivel alto y medio-alto."
        )
    elif template == "audit_report":
        score = rendered.get("score")
        trend = rendered.get("trend")
        if score is not None:
            lines.append("Métrica de cumplimiento:")
            lines.append(f"- Health score estimado: {score}%")
            lines.append(f"- Tendencia del programa: {trend}")
            lines.append("")
        lines.append("Hallazgos operativos:")
        for breach in rendered.get("breaches", []):
            lines.append(
                f"• {breach['item']} — Estado: {breach['status']}. Recomendación: {breach['recommendation']}"
            )
        lines.append("")
        lines.append("Acciones recomendadas:")
        lines.append(
            "Focalice esfuerzos en cerrar los hallazgos con mayor impacto operativo y validar evidencia de cierre."
        )
    elif template == "gap_analysis":
        completed = rendered.get("completed_phases")
        pending = rendered.get("pending_phases")
        if completed is not None and pending is not None:
            lines.append("Progreso del programa:")
            lines.append(f"- Fases completadas: {completed}")
            lines.append(f"- Fases pendientes: {pending}")
            lines.append("")
        lines.append("Estado por fase:")
        for phase in rendered.get("phases", []):
            lines.append(
                f"• {phase['phase']} — Estado: {phase['status']}. Recomendación: {phase['recommendation']}"
            )
        lines.append("")
        lines.append("Siguiente pasos:")
        lines.append(
            "Alinee el cierre de fases pendientes con el cronograma de riesgo y la capacidad del equipo."
        )
    return "\n".join(lines)


def _render_rows(
    template: str,
    rendered: dict[str, Any],
    title: str | None = None,
    description: str | None = None,
) -> list[list[Any]]:
    rows: list[list[Any]] = []
    if title:
        rows.append(["Reporte", title])
    if description:
        rows.append(["Descripción", description])
    rows.append(["Plantilla", template.replace('_', ' ').title()])
    rows.append(["Generado", datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')])
    rows.append([])

    if template == "soa":
        rows.append(["Control", "Estado", "Justificación"])
        rows.extend([[c["control"], c["status"], c["justification"]] for c in rendered.get("controls", [])])
        rows.append([])
        rows.append(["Indicadores", "Valor"])
        rows.append(["Controles implementados", rendered.get("implemented_controls", "-")])
        rows.append(["Controles pendientes", rendered.get("pending_controls", "-")])
        return rows
    if template == "risk_register":
        rows.append(["Riesgo", "Activo", "Probabilidad", "Impacto", "Nivel"])
        rows.extend(rendered.get("rows", []))
        rows.append([])
        rows.append(["Nivel", "Cantidad"])
        for level, count in (rendered.get("risk_counts", {}) or {}).items():
            rows.append([level, str(count)])
        return rows
    if template == "audit_report":
        rows.append(["Brecha", "Estado", "Recomendación"])
        rows.extend([[b["item"], b["status"], b["recommendation"]] for b in rendered.get("breaches", [])])
        rows.append([])
        rows.append(["Métrica", "Valor"])
        rows.append(["Health score", rendered.get("score", "-")])
        rows.append(["Tendencia", rendered.get("trend", "-")])
        return rows
    if template == "gap_analysis":
        rows.append(["Fase", "Estado", "Recomendación"])
        rows.extend([[p["phase"], p["status"], p["recommendation"]] for p in rendered.get("phases", [])])
        rows.append([])
        rows.append(["Fases completadas", rendered.get("completed_phases", "-")])
        rows.append(["Fases pendientes", rendered.get("pending_phases", "-")])
        return rows
    return rows


@celery_app.task(bind=True, name="generate_report")
def generate_report(
    self,
    job_id: str,
    request_data: dict[str, Any],
    organization_id: str,
    user_id: str,
):
    async def _update_state(status: str, progress: int, message: str, metadata: dict[str, Any]) -> None:
        await _publish_report_progress(
            job_id=job_id,
            status=status,
            progress=progress,
            message=message,
            metadata=metadata,
        )

    async def _generate_job() -> dict[str, Any]:
        metadata = {
            "report_title": request_data.get("title"),
            "report_template": request_data.get("template"),
            "report_format": request_data.get("format"),
            "organization_id": organization_id,
            "user_id": user_id,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "created_date": datetime.now(timezone.utc).date().isoformat(),
        }

        await _update_state("started", 10, "Iniciando generación de reporte", metadata)
        rendered = _render_template_data(request_data.get("template"), organization_id, request_data)
        document = _build_report_document(
            request_data.get("template"),
            rendered,
            request_data.get("title"),
            request_data.get("description"),
            metadata["created_at"],
        )
        text_content = _render_report_text(
            request_data.get("template"),
            rendered,
            request_data.get("title"),
            request_data.get("description"),
        )

        await _update_state("processing", 50, "Generando contenido", metadata)

        report_format = request_data.get("format")
        if report_format == "pdf":
            report_bytes = _generate_pdf(
                text_content,
                request_data.get("branding") or {},
                request_data.get("title"),
                request_data.get("description"),
                request_data.get("template"),
                metadata["created_at"],
            )
        elif report_format == "csv":
            report_bytes = _generate_csv(document)
        elif report_format == "docx":
            report_bytes = _generate_docx(document)
        elif report_format == "xlsx":
            report_bytes = _generate_xlsx(document)
        else:
            raise ValueError("Formato de reporte no soportado")

        encoded = base64.b64encode(report_bytes).decode("utf-8")
        download_key = f"report:download:{job_id}"
        redis_client = aioredis.from_url(settings.redis_url, decode_responses=True)
        try:
            await redis_client.set(download_key, encoded, ex=15 * 60)
        finally:
            await redis_client.close()

        await _update_state("completed", 100, "Reporte generado exitosamente", {**metadata, "download_url": ""})
        try:
            notification_service.send(
                NotificationType.document_published,
                user_id,
                {"job_id": job_id, "title": request_data.get("title")},
            )
        except Exception as notify_exc:
            await _update_state(
                "completed",
                100,
                f"Reporte generado exitosamente, pero la notificación falló: {notify_exc}",
                {**metadata, "download_url": ""},
            )

        return {"job_id": job_id, "report_bytes": encoded}

    try:
        return asyncio.run(_generate_job())
    except SoftTimeLimitExceeded:
        metadata = {
            "report_title": request_data.get("title"),
            "report_template": request_data.get("template"),
            "report_format": request_data.get("format"),
            "organization_id": organization_id,
            "user_id": user_id,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "created_date": datetime.now(timezone.utc).date().isoformat(),
        }
        asyncio.run(_update_state("failed", 0, "Error: task time limit exceeded", metadata))
        raise
    except Exception as exc:
        metadata = {
            "report_title": request_data.get("title"),
            "report_template": request_data.get("template"),
            "report_format": request_data.get("format"),
            "organization_id": organization_id,
            "user_id": user_id,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "created_date": datetime.now(timezone.utc).date().isoformat(),
        }
        asyncio.run(_update_state("failed", 0, f"Error: {exc}", metadata))
        raise
