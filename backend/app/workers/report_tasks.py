from __future__ import annotations

import asyncio
import base64
import csv
import io
import json
import shutil
import subprocess
import textwrap
import uuid
from abc import ABC, abstractmethod
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import docx as python_docx
import openpyxl
import pandas as pd
from jinja2 import Environment, FileSystemLoader, select_autoescape
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
import redis.asyncio as aioredis
from app.core.config import settings
from app.db.database import SessionLocal
from app.models.organization import Organization
from celery.exceptions import SoftTimeLimitExceeded
from app.models.report_job import ReportJob
from app.models.assessment_progress import AssessmentProgress
from app.models.audit_checklist import AuditChecklist
from app.models.notification import NotificationType
from app.models.risk import Risk
from app.services.notification_service import notification_service
from app.workers.celery_app import celery_app


JOB_KEY_PREFIX = "report:job:"
JOB_TTL_SECONDS = 60 * 60 * 24 * 7
REPORT_DIR = "/tmp/reports"
TEMPLATES_DIR = Path(__file__).resolve().parent.parent / "templates"


class BaseReportService(ABC):
    def __init__(self, organization_id: str, request_data: dict[str, Any], user_id: str | None = None):
        self.organization_id = organization_id
        self.request_data = request_data
        self.user_id = user_id
        self.template = request_data.get("template")
        self.title = request_data.get("title")
        self.description = request_data.get("description")
        self.branding = request_data.get("branding") or {}
        self.health_score = 0
        self.findings: list[dict[str, Any]] = []
        self.controls: list[dict[str, Any]] = []
        self.documents: list[dict[str, Any]] = []
        self.progress_data: dict[str, Any] = {}
        self.organization_name: str | None = None
        self.rendered: dict[str, Any] = {}

    def generate(self, output_format: str, generated_at: str) -> bytes:
        self.validate_security()
        self.fetch_tenant_data()
        self.transform_data()
        document = self.build_report_document(generated_at)
        return self.generate_file(output_format, document)

    @abstractmethod
    def validate_security(self) -> None:
        raise NotImplementedError

    @abstractmethod
    def fetch_tenant_data(self) -> None:
        raise NotImplementedError

    @abstractmethod
    def transform_data(self) -> None:
        raise NotImplementedError

    @abstractmethod
    def generate_file(self, output_format: str, document: dict[str, Any]) -> bytes:
        raise NotImplementedError

    def build_report_document(self, generated_at: str) -> dict[str, Any]:
        document = _build_report_document(
            self.template,
            self.rendered,
            self.title,
            self.description,
            generated_at,
        )
        document.update(
            {
                "health_score": self.health_score,
                "findings": self.findings,
                "controls": self.controls,
                "documents": self.documents,
            }
        )
        return document

    def generate_signed_url(self, job_id: str) -> str:
        return f"/api/v1/reports/{job_id}/download"


class TenantReportService(BaseReportService):
    def validate_security(self) -> None:
        if not self.organization_id:
            raise ValueError("Organization ID requerido para generar reportes.")
        if self.template not in {"soa", "risk_register", "audit_report", "gap_analysis"}:
            raise ValueError("Template de reporte no soportado.")

    def fetch_tenant_data(self) -> None:
        with SessionLocal() as db:
            org = db.query(Organization).filter(Organization.id == self.organization_id).first()
            self.organization_name = org.name if org else "Organización"
            audit = db.query(AuditChecklist).filter(AuditChecklist.organization_id == self.organization_id).first()
            progress = db.query(AssessmentProgress).filter(AssessmentProgress.organization_id == self.organization_id).first()

        self.controls = self._build_controls(audit)
        self.documents = self._extract_documents(self.controls)
        self.findings = self._build_findings(self.controls)
        self.health_score = self._calculate_health_score(self.controls)
        self.progress_data = progress.progress_data if progress and isinstance(progress.progress_data, dict) else {}

    def transform_data(self) -> None:
        self.rendered = {
            "summary": self._build_summary(),
            "controls": self.controls,
            "implemented_controls": sum(1 for c in self.controls if c["status"] == "implemented"),
            "pending_controls": sum(1 for c in self.controls if c["status"] == "planned"),
            "not_implemented_controls": sum(1 for c in self.controls if c["status"] == "not_implemented"),
            "risk_counts": self._build_risk_counts(),
            "breaches": [f for f in self.findings if f["severity"] in {"critical", "major", "minor"}],
            "phases": self._build_phase_summary(),
            "score": self.health_score,
            "trend": self.progress_data.get("status", "Estable"),
            "health_score": self.health_score,
            "findings": self.findings,
        }

    def generate_file(self, output_format: str, document: dict[str, Any]) -> bytes:
        if output_format == "pdf":
            return _generate_pdf(
                document,
                self.title,
                self.description,
                self.template,
                datetime.now(timezone.utc).isoformat(),
                self.organization_name,
                self.branding,
            )
        if output_format == "csv":
            return _generate_csv(document)
        if output_format == "docx":
            return _generate_docx(document)
        if output_format == "xlsx":
            return _generate_xlsx(document)
        raise ValueError("Formato de reporte no soportado.")

    def _build_controls(self, audit: AuditChecklist | None) -> list[dict[str, Any]]:
        controls: list[dict[str, Any]] = []
        if audit and isinstance(audit.checklist_data, list):
            for idx, item in enumerate(audit.checklist_data, start=1):
                status = self._normalize_status(str(item.get("status", "not_implemented")))
                severity = self._normalize_severity(str(item.get("severity") or item.get("risk_level") or "minor"))
                controls.append(
                    {
                        "code": str(item.get("control_code") or f"CTRL-{idx:03}"),
                        "domain": str(item.get("domain") or self._guess_domain(idx)),
                        "name": str(item.get("control") or item.get("name") or f"Control {idx}"),
                        "status": status,
                        "documents": item.get("documents", []),
                        "evidence_freshness": str(item.get("evidence_freshness") or item.get("freshness") or "unknown"),
                        "severity": severity,
                        "recommendation": str(item.get("recommendation") or "Revisar el control para establecer estado y evidencia documental."),
                    }
                )
        if len(controls) < 93:
            controls.extend(self._generate_placeholder_controls(len(controls)))
        return controls[:93]

    def _normalize_status(self, status: str) -> str:
        normalized = status.strip().lower()
        if normalized in {"implemented", "implementado", "done", "completo", "cerrado"}:
            return "implemented"
        if normalized in {"planned", "planificado", "pendiente", "scheduled"}:
            return "planned"
        return "not_implemented"

    def _normalize_severity(self, severity: str) -> str:
        normalized = severity.strip().lower()
        if normalized in {"critical", "critico", "crítico"}:
            return "critical"
        if normalized in {"major", "alto", "high"}:
            return "major"
        if normalized in {"minor", "bajo", "low"}:
            return "minor"
        return "suggestion"

    def _guess_domain(self, index: int) -> str:
        if index <= 20:
            return "A.5 Organizacional"
        if index <= 45:
            return "A.6 Personas"
        if index <= 65:
            return "A.7 Físico"
        return "A.8 Tecnológico"

    def _generate_placeholder_controls(self, start_index: int) -> list[dict[str, Any]]:
        placeholders: list[dict[str, Any]] = []
        for idx in range(start_index + 1, 94):
            placeholders.append(
                {
                    "code": f"ISO-{idx:03}",
                    "domain": self._guess_domain(idx),
                    "name": f"Control ISO {idx}",
                    "status": "not_implemented",
                    "documents": [],
                    "evidence_freshness": "unknown",
                    "severity": "minor",
                    "recommendation": "Registrar evidencia y completar el control según ISO 27001.",
                }
            )
        return placeholders

    def _extract_documents(self, controls: list[dict[str, Any]]) -> list[dict[str, Any]]:
        documents: list[dict[str, Any]] = []
        for control in controls:
            for document in control.get("documents", []):
                documents.append(
                    {
                        "control_code": control["code"],
                        "type": document.get("type", "UNKNOWN"),
                        "name": document.get("name", "Documento de evidencia"),
                        "status": document.get("status", "unknown"),
                        "freshness": document.get("freshness", "unknown"),
                    }
                )
        return documents

    def _build_findings(self, controls: list[dict[str, Any]]) -> list[dict[str, Any]]:
        findings = []
        for control in controls:
            if control["status"] != "implemented" or control["severity"] in {"critical", "major"}:
                findings.append(
                    {
                        "item": f"{control['code']} - {control['name']}",
                        "status": control["status"],
                        "severity": control["severity"],
                        "recommendation": control["recommendation"],
                    }
                )
        if not findings:
            findings.append(
                {
                    "item": "No hay hallazgos relevantes",
                    "status": "implemented",
                    "severity": "minor",
                    "recommendation": "El programa cumple con los controles disponibles.",
                }
            )
        return findings

    def _calculate_health_score(self, controls: list[dict[str, Any]]) -> int:
        if not controls:
            return 0
        implemented = sum(1 for control in controls if control["status"] == "implemented")
        return int((implemented / len(controls)) * 100)

    def _build_summary(self) -> str:
        return (
            f"Reporte ISO 27001 para {self.organization_name}. "
            f"Se evaluaron {len(self.controls)} controles con {self.health_score}% implementados. "
            f"Se identificaron {sum(1 for c in self.controls if c['status'] != 'implemented')} controles por atender."
        )

    def _build_risk_counts(self) -> dict[str, int]:
        counts: dict[str, int] = {}
        for control in self.controls:
            bucket = control["severity"].capitalize()
            counts[bucket] = counts.get(bucket, 0) + 1
        return counts

    def _build_phase_summary(self) -> list[dict[str, Any]]:
        if not self.progress_data:
            return []
        phases = self.progress_data.get("phases", [])
        if isinstance(phases, list):
            return [
                {
                    "phase": phase.get("name", f"Fase {idx + 1}"),
                    "status": phase.get("status", "Pendiente"),
                    "recommendation": phase.get("recommendation", "Revisar fase."),
                }
                for idx, phase in enumerate(phases)
            ]
        return []


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


def _get_template_environment() -> Environment:
    return Environment(
        loader=FileSystemLoader(str(TEMPLATES_DIR)),
        autoescape=select_autoescape(["html", "xml"]),
        trim_blocks=True,
        lstrip_blocks=True,
    )


def _render_report_html(template_name: str, context: dict[str, Any]) -> str:
    env = _get_template_environment()
    template = env.get_template(template_name)
    return template.render(**context)


def _get_organization_name(organization_id: str) -> str | None:
    try:
        org_id = uuid.UUID(organization_id)
    except ValueError:
        org_id = organization_id

    with SessionLocal() as db:
        org = db.query(Organization).filter(Organization.id == org_id).first()
        return org.name if org else None


def _generate_pdf(
    document: dict[str, Any],
    title: str | None,
    description: str | None,
    template: str,
    generated_at: str,
    organization_name: str | None,
    branding: dict[str, Any] | None = None,
) -> bytes:
    branding = branding or {}
    context = {
        "title": title or "Reporte Ejecutivo",
        "description": description or "",
        "template_name": template.replace("_", " ").title(),
        "generated_at": generated_at,
        "organization_name": organization_name or "Empresa auditada",
        "sections": document.get("sections", []),
        "health_score": document.get("health_score", 0),
        "findings": document.get("findings", []),
        "logo_url": branding.get("logo_url"),
        "primary_color": branding.get("primary_color", "#0b4f6c"),
        "accent_color": branding.get("accent_color", "#2a9d8f"),
        "implemented_controls": document.get("implemented_controls", 0),
        "pending_controls": document.get("pending_controls", 0),
        "not_implemented_controls": document.get("not_implemented_controls", 0),
        "controls": document.get("controls", []),
    }
    template_name = "reports/soa_report.html" if template == "soa" else f"reports/{template}.html"
    html = _render_report_html(template_name, context)

    weasy_error: Exception | None = None
    try:
        from weasyprint import HTML
        from weasyprint.text.fonts import FontConfiguration

        font_config = FontConfiguration()
        return HTML(string=html, base_url=str(TEMPLATES_DIR)).write_pdf(font_config=font_config)
    except Exception as exc:
        weasy_error = exc

    wkhtmltopdf_path = shutil.which("wkhtmltopdf")
    if not wkhtmltopdf_path:
        possible_paths = [
            Path("/usr/bin/wkhtmltopdf"),
            Path("/usr/local/bin/wkhtmltopdf"),
            Path(r"C:/Program Files/wkhtmltopdf/bin/wkhtmltopdf.exe"),
            Path(r"C:/Program Files (x86)/wkhtmltopdf/bin/wkhtmltopdf.exe"),
        ]
        for possible_path in possible_paths:
            if possible_path.exists():
                wkhtmltopdf_path = str(possible_path)
                break

    if wkhtmltopdf_path:
        process = subprocess.run(
            [
                wkhtmltopdf_path,
                "--enable-local-file-access",
                "--page-size",
                "A4",
                "--margin-top",
                "25mm",
                "--margin-bottom",
                "25mm",
                "--margin-left",
                "20mm",
                "--margin-right",
                "20mm",
                "-",
                "-",
            ],
            input=html.encode("utf-8"),
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )
        if process.returncode == 0:
            return process.stdout

        raise RuntimeError(
            "WeasyPrint falló y fallback wkhtmltopdf también falló: "
            + process.stderr.decode("utf-8", errors="replace")
            + f". Error WeasyPrint: {weasy_error}"
        )

    raise RuntimeError(
        "No se pudo generar el PDF. WeasyPrint falló con: "
        f"{weasy_error}. Instale las dependencias nativas de WeasyPrint "
        "(GTK, gobject, pango) o asegúrese de que wkhtmltopdf esté instalado en el contenedor."
    )


def _generate_csv(document: dict[str, Any]) -> bytes:
    rows = _render_rows(document.get("template", ""), document, document.get("title"), document.get("description"))
    if not rows:
        return "".encode("utf-8-sig")
    max_cols = max(len(row) for row in rows)
    normalized = [row + [""] * (max_cols - len(row)) for row in rows]
    df = pd.DataFrame(normalized)
    csv_text = df.to_csv(index=False, header=False, encoding="utf-8-sig")
    return csv_text.encode("utf-8-sig")


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
    rows = _render_rows(document.get("template", ""), document, document.get("title"), document.get("description"))
    if not rows:
        return b""
    max_cols = max(len(row) for row in rows)
    normalized = [row + [""] * (max_cols - len(row)) for row in rows]
    df = pd.DataFrame(normalized)
    out = io.BytesIO()
    with pd.ExcelWriter(out, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, header=False, sheet_name="Reporte")
        sheet = writer.sheets["Reporte"]
        header_fill = PatternFill(fill_type="solid", fgColor="0B4F6C")
        header_font = Font(bold=True, color="FFFFFF")
        alignment = Alignment(vertical="top", wrap_text=True)
        for cell in sheet[1]:
            cell.font = header_font
            cell.fill = header_fill
            cell.alignment = alignment
        sheet.freeze_panes = sheet["A2"]
        for column_cells in sheet.columns:
            max_length = 0
            column_letter = column_cells[0].column_letter
            for cell in column_cells:
                if cell.value is not None:
                    max_length = max(max_length, len(str(cell.value)))
            sheet.column_dimensions[column_letter].width = min(max(max_length + 4, 15), 50)
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
                status = item.get("status", "Pendiente")
                severity = item.get("severity") or item.get("risk_level") or "Major"
                if severity.lower() not in {"critical", "major", "minor"}:
                    severity = "Major"
                breaches.append(
                    {
                        "item": item.get("control", "Control"),
                        "status": status,
                        "recommendation": item.get("recommendation", "Revisar el control."),
                        "severity": severity.capitalize(),
                    }
                )
            if not breaches:
                breaches = [
                    {
                        "item": "No hay hallazgos disponibles",
                        "status": "N/A",
                        "recommendation": "Agregar datos de checklist para generar un audit report completo.",
                        "severity": "Minor",
                    }
                ]
            score = 0
            total = len(breaches)
            if total > 0:
                score = sum(
                    1 for breach in breaches if breach["status"].lower() in {"implementado", "completo", "cerrado", "done"}
                ) * 100 // total
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
                "health_score": score,
                "findings": breaches,
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
            "rows": [["Control", "Dominio", "Estado", "Severidad", "Evidencia", "Recomendación"]] + [[
                f"{c['code']} - {c['name']}",
                c.get("domain", ""),
                c["status"],
                c["severity"],
                c.get("evidence_freshness", ""),
                c["recommendation"],
            ] for c in controls],
        })
        sections.append({
            "heading": "Conclusiones",
            "paragraphs": [
                f"Controles implementados: {rendered.get('implemented_controls', 0)}.",
                f"Controles planificados: {rendered.get('pending_controls', 0)}.",
                f"Controles no implementados: {rendered.get('not_implemented_controls', 0)}.",
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
            "rows": [["Hallazgo", "Severidad", "Estado", "Recomendación"]] + [[
                b["item"],
                b.get("severity", "Major"),
                b["status"],
                b["recommendation"],
            ] for b in breaches],
        })
        sections.append({
            "heading": "Indicadores",
            "paragraphs": [
                f"Health score estimado: {rendered.get('score', 0)}%.",
                f"Tendencia: {rendered.get('trend', 'No definido')}.",
            ],
        })
        extra_fields = {
            "health_score": rendered.get("health_score", 0),
            "findings": rendered.get("findings", []),
        }
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

    document = {"title": title, "description": description, "template": template, "generated_at": generated_at, "sections": sections}
    if "extra_fields" in locals():
        document.update(extra_fields)
    return document


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
        not_implemented = rendered.get("not_implemented_controls")
        if implemented is not None and pending is not None:
            lines.append("Estado actual de controles:")
            lines.append(f"- Controles implementados: {implemented}")
            lines.append(f"- Controles planificados: {pending}")
            lines.append(f"- Controles no implementados: {not_implemented}")
            lines.append("")
        lines.append("Detalles de controles:")
        for control in rendered.get("controls", []):
            lines.append(
                f"• {control['code']} - {control['name']} — Estado: {control['status']}. Recomendación: {control['recommendation']}"
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
        rows.append(["Control", "Dominio", "Estado", "Severidad", "Evidencia", "Recomendación"])
        rows.extend([
            [
                control.get("code", ""),
                control.get("domain", ""),
                control.get("status", ""),
                control.get("severity", ""),
                control.get("evidence_freshness", ""),
                control.get("recommendation", ""),
            ]
            for control in rendered.get("controls", [])
        ])
        rows.append([])
        rows.append(["Indicadores", "Valor"])
        rows.append(["Controles implementados", rendered.get("implemented_controls", "-")])
        rows.append(["Controles planificados", rendered.get("pending_controls", "-")])
        rows.append(["Controles no implementados", rendered.get("not_implemented_controls", "-")])
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
        await _update_state("processing", 50, "Generando contenido", metadata)

        report_format = request_data.get("format")
        service = TenantReportService(organization_id, request_data, user_id)
        report_bytes = service.generate(report_format, metadata["created_at"])

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
