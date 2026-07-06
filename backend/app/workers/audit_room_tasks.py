from __future__ import annotations

import asyncio
import base64
import io
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import redis.asyncio as aioredis
from PyPDF2 import PdfReader, PdfWriter
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from app.core.config import settings
from app.db.database import SessionLocal
from app.models.report_job import ReportJob
from app.workers.celery_app import celery_app

UPLOAD_ROOT = Path(__file__).resolve().parents[2] / "uploads" / "evidences"

JOB_KEY_PREFIX = "audit_room:job:"
JOB_TTL_SECONDS = 60 * 60 * 24 * 7


def _job_key(job_id: str) -> str:
    return f"{JOB_KEY_PREFIX}{job_id}"


async def _publish_binder_progress(
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
            "download_url": metadata.get("download_url", ""),
            "organization_id": metadata.get("organization_id", ""),
            "user_id": metadata.get("user_id", ""),
            "binder_title": metadata.get("binder_title", ""),
            "binder_description": metadata.get("binder_description", ""),
            "created_at": metadata.get("created_at", now),
            "created_date": metadata.get("created_date", now_date),
            "updated_at": now,
        }
        await redis_client.hset(_job_key(job_id), mapping=payload)
        await redis_client.expire(_job_key(job_id), JOB_TTL_SECONDS)
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
                    report_title=metadata.get("binder_title"),
                    report_template="audit_room_binder",
                    report_format="pdf",
                    created_date=metadata.get("created_date") or now_date,
                )
                db.add(record)
            else:
                existing.status = status
                existing.progress = progress
                existing.message = message
                existing.report_title = metadata.get("binder_title")
                existing.report_template = "audit_room_binder"
                existing.report_format = "pdf"
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


async def _write_initial_job_state(
    job_id: str,
    organization_id: str,
    user_id: str,
    binder_title: str,
    binder_description: str | None = None,
) -> None:
    await _publish_binder_progress(
        job_id=job_id,
        status="queued",
        progress=0,
        message="Binder encolado",
        metadata={
            "organization_id": organization_id,
            "user_id": user_id,
            "binder_title": binder_title,
            "binder_description": binder_description or "",
        },
    )


def _find_evidence_file_path(organization_id: str, evidence_id: str) -> Path | None:
    evidence_dir = UPLOAD_ROOT / organization_id
    if not evidence_dir.exists() or not evidence_dir.is_dir():
        return None

    matches = list(evidence_dir.glob(f"{evidence_id}.*"))
    return matches[0] if matches else None


def _build_evidence_file_map(selected_evidence: list[dict[str, Any]], organization_id: str) -> dict[str, Path | None]:
    evidence_map: dict[str, Path | None] = {}
    base_path = Path(__file__).resolve().parents[2]

    for item in selected_evidence:
        evidence_id = item.get("id", "")
        file_path_value = item.get("file_path")
        if file_path_value:
            evidence_path = Path(file_path_value)
            if not evidence_path.is_absolute():
                evidence_path = base_path / evidence_path
            if evidence_path.exists():
                evidence_map[evidence_id] = evidence_path
                continue

        evidence_map[evidence_id] = _find_evidence_file_path(organization_id, evidence_id)

    return evidence_map


def _generate_binder_summary_pdf(
    selected_evidence: list[dict[str, Any]],
    title: str,
    description: str | None,
    evidence_files: dict[str, Path | None],
) -> bytes:
    buffer = io.BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter

    pdf.setFont("Helvetica-Bold", 18)
    pdf.drawString(72, height - 72, title)

    pdf.setFont("Helvetica", 11)
    body = pdf.beginText(72, height - 100)
    body.setLeading(14)
    body.textLine(description or "No description provided.")
    body.textLine("")
    body.textLine("Selected Evidences:")
    body.textLine("")

    y = height - 100 - 14 * 4
    line_height = 14

    def add_line(line: str) -> None:
        nonlocal body, y
        if y < 72:
            pdf.drawText(body)
            pdf.showPage()
            body = pdf.beginText(72, height - 72)
            body.setLeading(line_height)
            y = height - 72
        body.textLine(line)
        y -= line_height

    for item in selected_evidence:
        evidence_id = item.get("id", "")
        file_path = evidence_files.get(evidence_id)
        add_line("------------------------------------------------------------")
        add_line(f"Name: {item.get('name', '')}")
        add_line(f"Original File: {item.get('original_file_name', '')}")
        add_line(f"Type: {item.get('type', '')}")
        add_line(f"Control ID: {item.get('control_id', '')}")
        add_line(f"Clause Ref: {item.get('clause_ref', '')}")
        add_line(f"Freshness: {item.get('freshness_status', '')}")
        add_line(f"Evidence Notes: {item.get('notes', '')}")
        add_line(f"Stored Path: {str(file_path) if file_path else 'missing'}")
        add_line("")

    pdf.drawText(body)
    pdf.showPage()
    pdf.save()
    return buffer.getvalue()


def _append_pdf_bytes_to_writer(writer: PdfWriter, pdf_bytes: bytes) -> None:
    try:
        reader = PdfReader(io.BytesIO(pdf_bytes))
        for page in reader.pages:
            writer.add_page(page)
    except Exception:
        # If a PDF is invalid, skip it and continue
        return


def _generate_file_note_pdf(evidence_id: str, name: str, control_id: str, clause_ref: str, note: str) -> bytes:
    buffer = io.BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter

    pdf.setFont("Helvetica-Bold", 16)
    pdf.drawString(72, height - 72, "Documento no incluido")

    pdf.setFont("Helvetica", 11)
    body = pdf.beginText(72, height - 108)
    body.setLeading(14)
    body.textLine(f"Evidence ID: {evidence_id}")
    body.textLine(f"Name: {name}")
    body.textLine(f"Control ID: {control_id}")
    body.textLine(f"Clause Ref: {clause_ref}")
    body.textLine("")
    for line in note.splitlines():
        body.textLine(line)

    pdf.drawText(body)
    pdf.showPage()
    pdf.save()
    return buffer.getvalue()


def _generate_binder_pdf(
    selected_evidence: list[dict[str, Any]],
    title: str,
    description: str | None,
    organization_id: str,
) -> bytes:
    evidence_files = _build_evidence_file_map(selected_evidence, organization_id)
    summary_bytes = _generate_binder_summary_pdf(selected_evidence, title, description, evidence_files)

    writer = PdfWriter()
    _append_pdf_bytes_to_writer(writer, summary_bytes)

    for item in selected_evidence:
        evidence_id = item.get("id", "")
        file_path = evidence_files.get(evidence_id)
        if file_path and file_path.exists():
            if file_path.suffix.lower() == ".pdf":
                try:
                    _append_pdf_bytes_to_writer(writer, file_path.read_bytes())
                    continue
                except Exception:
                    pass

            note = (
                f"El archivo asociado no se pudo incluir en el binder.\n"
                f"Ruta: {file_path}\n"
                "Solo se adjuntan PDFs al binder."
            )
        else:
            note = "No se encontró el archivo asociado a esta evidencia."

        failure_pdf = _generate_file_note_pdf(
            evidence_id=evidence_id,
            name=str(item.get("name", "")),
            control_id=str(item.get("control_id", "")),
            clause_ref=str(item.get("clause_ref", "")),
            note=note,
        )
        _append_pdf_bytes_to_writer(writer, failure_pdf)

    output_buffer = io.BytesIO()
    writer.write(output_buffer)
    return output_buffer.getvalue()


async def _store_download_token(job_id: str, encoded: str) -> None:
    redis_client = aioredis.from_url(settings.redis_url, decode_responses=True)
    try:
        download_key = f"audit_room:download:{job_id}"
        await redis_client.set(download_key, encoded, ex=15 * 60)
    finally:
        await redis_client.close()


@celery_app.task(bind=True, name="generate_audit_room_binder")
def generate_audit_room_binder(
    self,
    job_id: str,
    selected_evidence: list[dict[str, Any]],
    title: str,
    description: str | None,
    organization_id: str,
    user_id: str,
):
    try:
        _ = self
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        loop.run_until_complete(_write_initial_job_state(
            job_id=job_id,
            organization_id=organization_id,
            user_id=user_id,
            binder_title=title,
            binder_description=description,
        ))

        binder_bytes = _generate_binder_pdf(selected_evidence, title, description, organization_id)
        encoded = base64.b64encode(binder_bytes).decode("utf-8")

        loop.run_until_complete(_store_download_token(job_id, encoded))
        loop.run_until_complete(_publish_binder_progress(
            job_id=job_id,
            status="completed",
            progress=100,
            message="Binder generado exitosamente",
            metadata={
                "organization_id": organization_id,
                "user_id": user_id,
                "binder_title": title,
                "binder_description": description or "",
                "download_url": "",
            },
        ))
    except Exception as exc:
        loop.run_until_complete(_publish_binder_progress(
            job_id=job_id,
            status="failed",
            progress=0,
            message=str(exc),
            metadata={
                "organization_id": organization_id,
                "user_id": user_id,
                "binder_title": title,
                "binder_description": description or "",
            },
        ))
        raise
    finally:
        try:
            loop.shutdown_asyncgens()
        except Exception:
            pass
        loop.close()
