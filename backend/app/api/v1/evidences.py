from pathlib import Path
from typing import Optional
from uuid import uuid4

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_org
from app.models.evidence_taxonomy import (
    DEFAULT_VALIDITY_DAYS,
    EVIDENCE_TAXONOMY_ORDER,
    EVIDENCE_TAXONOMY_TYPES,
    EvidenceTaxonomy,
)
from app.models.organization import Organization
from app.db.database import get_db
from app.schemas.evidence_taxonomy import EvidenceTaxonomyGroup, EvidenceTaxonomyItem

router = APIRouter(prefix="/evidences", tags=["evidences"])

UPLOAD_ROOT = Path("uploads") / "evidences"
ALLOWED_EXTENSIONS = {".pdf", ".docx", ".xlsx", ".png", ".jpg", ".jpeg"}

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


def _normalize_evidence_type(value: Optional[str]) -> str:
    resolved = (value or "RECORD").strip().upper()
    if resolved not in EVIDENCE_TAXONOMY_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Tipo inválido. Use uno de: {', '.join(EVIDENCE_TAXONOMY_TYPES)}",
        )
    return resolved


def _derive_clause_ref(control_id: str) -> Optional[str]:
    if "A." not in control_id:
        return None
    start = control_id.find("A.")
    return control_id[start:].strip()


@router.post("", status_code=status.HTTP_201_CREATED)
async def upload_evidence(
    file: UploadFile = File(...),
    name: Optional[str] = Form(None),
    type: Optional[str] = Form(None),
    control_id: Optional[str] = Form(None),
    clause_ref: Optional[str] = Form(None),
    validity_days: Optional[int] = Form(None),
    org: Organization = Depends(get_current_org),
    db: Session = Depends(get_db),
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

    normalized_type = _normalize_evidence_type(type)
    normalized_control_id = (control_id or "").strip()
    if not normalized_control_id:
        default_control_map = {
            "POLICY": "ISO 27001 A.5.1",
            "PROCEDURE": "ISO 27001 A.5.37",
            "INSTRUCTION": "ISO 27001 A.8.32",
            "CONTROL": "ISO 27001 A.8.15",
            "RECORD": "ISO 27001 A.8.33",
        }
        normalized_control_id = default_control_map[normalized_type]

    normalized_clause_ref = (clause_ref or "").strip() or _derive_clause_ref(normalized_control_id)
    if not normalized_clause_ref:
        raise HTTPException(status_code=400, detail="No se pudo inferir clause_ref desde control_id")

    if validity_days is None:
        resolved_validity_days = DEFAULT_VALIDITY_DAYS[normalized_type]
    elif validity_days <= 0:
        raise HTTPException(status_code=400, detail="validity_days debe ser mayor a 0")
    else:
        resolved_validity_days = validity_days

    evidence_row = EvidenceTaxonomy(
        id=evidence_id,
        organization_id=org.id,
        name=(name or file.filename).strip(),
        type=normalized_type,
        control_id=normalized_control_id,
        clause_ref=normalized_clause_ref,
        validity_days=resolved_validity_days,
    )
    db.add(evidence_row)
    db.commit()
    db.refresh(evidence_row)

    return {
        "evidence_id": evidence_id,
        "id": evidence_id,
        "name": evidence_row.name,
        "type": evidence_row.type,
        "control_id": evidence_row.control_id,
        "clause_ref": evidence_row.clause_ref,
        "organization_id": str(evidence_row.organization_id),
        "validity_days": evidence_row.validity_days,
        "freshness_status": evidence_row.freshness_status,
        "file_name": evidence_row.name,
        "original_file_name": file.filename,
        "content_type": file.content_type,
        "size_bytes": len(content),
        "file_path": str(destination.as_posix()),
    }
