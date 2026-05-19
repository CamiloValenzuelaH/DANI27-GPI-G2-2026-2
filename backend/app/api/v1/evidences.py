from pathlib import Path
from typing import Optional
from uuid import uuid4

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_org
from app.models.evidence_taxonomy import (
    EVIDENCE_TAXONOMY_ORDER,
    EVIDENCE_TAXONOMY_TYPES,
    EvidenceTaxonomy,
)
from app.models.organization import Organization
from app.db.database import get_db
from app.schemas.evidence_taxonomy import EvidenceTaxonomyGroup, EvidenceTaxonomyItem
from app.services.file_extraction_service import extract_text_from_file

router = APIRouter(prefix="/evidences", tags=["evidences"])

UPLOAD_ROOT = Path("uploads") / "evidences"
ALLOWED_EXTENSIONS = {".pdf", ".docx", ".xlsx", ".png", ".jpg", ".jpeg"}


class EvidenceMetadataIn(BaseModel):
    name: Optional[str] = None
    control_id: Optional[str] = None
    type: Optional[str] = None
    valid_until: Optional[str] = None


class ClassifyEvidenceIn(BaseModel):
    evidence_id: Optional[str] = None
    file_name: Optional[str] = None
    file_path: Optional[str] = None
    metadata: Optional[EvidenceMetadataIn] = None


def _taxonomy_item_from_row(row: EvidenceTaxonomy) -> EvidenceTaxonomyItem:
    return EvidenceTaxonomyItem(
        id=row.id,
        name=row.name,
        type=row.type,  # type: ignore[arg-type]
        control_id=row.control_id,
        clause_ref=row.clause_ref,
        organization_id=str(row.organization_id),
        validity_days=row.validity_days,
        freshness_status=row.freshness_status,
    )


@router.get("", response_model=list[EvidenceTaxonomyGroup])
def get_evidence_taxonomy(
    org: Organization = Depends(get_current_org),
    db: Session = Depends(get_db),
):
    rows = (
        db.query(EvidenceTaxonomy)
        .filter(EvidenceTaxonomy.organization_id == org.id)
        .order_by(EvidenceTaxonomy.type.asc(), EvidenceTaxonomy.name.asc())
        .all()
    )

    grouped: dict[str, list[EvidenceTaxonomyItem]] = {key: [] for key in EVIDENCE_TAXONOMY_TYPES}
    for row in rows:
        grouped.setdefault(row.type, []).append(_taxonomy_item_from_row(row))

    return [
        EvidenceTaxonomyGroup(type=taxonomy_type, evidences=grouped.get(taxonomy_type, []))
        for taxonomy_type in EVIDENCE_TAXONOMY_ORDER.keys()
    ]


def _safe_extension(filename: str) -> str:
    return Path(filename).suffix.lower()


def _resolve_evidence_file(
    org: Organization,
    evidence_id: Optional[str],
    file_path: Optional[str],
) -> Optional[Path]:
    if file_path:
        candidate = Path(file_path)
        if candidate.exists() and candidate.is_file():
            return candidate
        relative_candidate = Path.cwd() / file_path
        if relative_candidate.exists() and relative_candidate.is_file():
            return relative_candidate

    if evidence_id:
        org_dir = UPLOAD_ROOT / str(org.id)
        if org_dir.exists():
            matches = list(org_dir.glob(f"{evidence_id}.*"))
            if matches:
                return matches[0]

    return None


def _classify_control(file_name: str, text: str, metadata: Optional[EvidenceMetadataIn]) -> dict:
    if metadata and metadata.control_id:
        return {
            "control_id": metadata.control_id,
            "control_name": "Control definido por metadata",
            "confidence": 0.99,
            "rationale": "Se utilizó control_id ingresado manualmente en metadata.",
        }

    haystack = f"{file_name} {text}".lower()
    rules = [
        (
            ["password", "contraseña", "contrasena", "credencial"],
            "ISO 27001 A.5.17",
            "Authentication Information",
            0.86,
            "Se detectaron términos relacionados con gestión de credenciales.",
        ),
        (
            ["backup", "respaldo", "restore", "recuperación", "recuperacion"],
            "ISO 27001 A.8.13",
            "Information backup",
            0.82,
            "Se detectaron términos de respaldo/recuperación.",
        ),
        (
            ["incidente", "incident", "brecha", "vulnerabilidad"],
            "ISO 27001 A.5.24",
            "Information security incident management planning and preparation",
            0.80,
            "Se detectaron términos vinculados a incidentes de seguridad.",
        ),
        (
            ["politica", "policy", "procedimiento", "scope", "alcance"],
            "ISO 27001 A.5.1",
            "Policies for information security",
            0.78,
            "Se detectaron patrones de política/procedimiento.",
        ),
    ]

    for keywords, control_id, control_name, confidence, rationale in rules:
        if any(keyword in haystack for keyword in keywords):
            return {
                "control_id": control_id,
                "control_name": control_name,
                "confidence": confidence,
                "rationale": rationale,
            }

    return {
        "control_id": "ISO 27001 A.5.1",
        "control_name": "Policies for information security",
        "confidence": 0.65,
        "rationale": "No se detectaron patrones fuertes; se asigna una sugerencia base.",
    }


@router.post("", status_code=status.HTTP_201_CREATED)
async def upload_evidence(
    file: UploadFile = File(...),
    name: Optional[str] = Form(None),
    org: Organization = Depends(get_current_org),
):
    if not file.filename:
        raise HTTPException(status_code=400, detail="Archivo inválido")

    extension = _safe_extension(file.filename)
    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Formato no soportado: {extension}",
        )

    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="El archivo está vacío")

    evidence_id = str(uuid4())
    org_dir = UPLOAD_ROOT / str(org.id)
    org_dir.mkdir(parents=True, exist_ok=True)

    stored_name = f"{evidence_id}{extension}"
    destination = org_dir / stored_name
    destination.write_bytes(content)

    return {
        "evidence_id": evidence_id,
        "id": evidence_id,
        "file_name": name or file.filename,
        "original_file_name": file.filename,
        "content_type": file.content_type,
        "size_bytes": len(content),
        "file_path": str(destination.as_posix()),
    }


@router.post("/classify")
def classify_evidence(
    payload: ClassifyEvidenceIn,
    org: Organization = Depends(get_current_org),
):
    source_path = _resolve_evidence_file(org, payload.evidence_id, payload.file_path)
    file_name = payload.file_name or (source_path.name if source_path else "evidence")

    extracted_text = ""
    if source_path and source_path.exists():
        extension = source_path.suffix.lower()
        try:
            extracted_text = extract_text_from_file(source_path.read_bytes(), extension, max_chars=10000)
        except Exception:
            extracted_text = ""

    suggestion = _classify_control(file_name=file_name, text=extracted_text, metadata=payload.metadata)

    return {
        **suggestion,
        "evidence_id": payload.evidence_id,
        "file_name": file_name,
        "source": "rule-based",
        "matched_file": str(source_path.as_posix()) if source_path else None,
    }
