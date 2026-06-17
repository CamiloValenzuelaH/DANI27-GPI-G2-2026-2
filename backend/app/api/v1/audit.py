<<<<<<< HEAD
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from pydantic import BaseModel
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.db.database import get_db
from app.core.dependencies import get_current_user
from app.models.assessment_progress import AssessmentProgress
from app.models.audit_checklist import AuditChecklist
from app.models.user import User
from app.services.audit_ai_service import analyze_audit_with_ai, analyze_file_with_ai
from app.services.file_extraction_service import extract_text_from_file

router = APIRouter(prefix="/audit", tags=["audit"])


ALLOWED_CHECKLIST_STATUS = {"pending", "in_progress", "done", "blocked"}

DEFAULT_AUDIT_CHECKLIST = [
    {
        "id": "scope-defined",
        "control_code": "PRE-AUD-01",
        "title": "Definir alcance y objetivos de auditoria",
        "status": "pending",
        "notes": "",
    },
    {
        "id": "evidence-collected",
        "control_code": "PRE-AUD-02",
        "title": "Recolectar evidencia clave por control",
        "status": "pending",
        "notes": "",
    },
    {
        "id": "owners-confirmed",
        "control_code": "PRE-AUD-03",
        "title": "Confirmar owners y responsables",
        "status": "pending",
        "notes": "",
    },
    {
        "id": "findings-reviewed",
        "control_code": "PRE-AUD-04",
        "title": "Revisar hallazgos abiertos y CAPAs",
        "status": "pending",
        "notes": "",
    },
    {
        "id": "dry-run-complete",
        "control_code": "PRE-AUD-05",
        "title": "Ejecutar simulacion de auditoria (dry run)",
        "status": "pending",
        "notes": "",
    },
]


class AuditEvidenceRequest(BaseModel):
    """Solicitud de validación de auditoría"""
    title: str
    description: str
    evidence_text: str
    audit_type: str  # "security", "compliance", "operational", "financial"
    priority: str = "medium"  # "low", "medium", "high", "critical"


class AuditFinding(BaseModel):
    """Hallazgo de auditoría"""
    issue: str
    severity: str
    recommendation: str
    impact: str


class AuditValidationResponse(BaseModel):
    """Respuesta de validación de auditoría"""
    audit_id: str
    status: str  # "compliant", "non_compliant", "needs_review"
    findings: list[AuditFinding]
    overall_compliance_score: int  # 0-100
    analyzed_at: str
    agent_notes: str


class AuditChecklistItem(BaseModel):
    id: str
    control_code: str
    title: str
    status: str
    notes: str = ""


class AuditChecklistUpsertRequest(BaseModel):
    items: list[AuditChecklistItem]


class AuditChecklistResponse(BaseModel):
    items: list[AuditChecklistItem]
    completion_percentage: float
    updated_at: str | None = None


class AssessmentProgressRequest(BaseModel):
    payload: dict


class AssessmentProgressResponse(BaseModel):
    payload: dict
    updated_at: str | None = None


class FileValidationResponse(BaseModel):
    """Respuesta de validación de archivo"""
    file_name: str
    compliance_score: int  # 0-100
    compliance_status: str  # "compliant", "non_compliant", "needs_review"
    findings: list[AuditFinding]
    summary: str


def _normalize_checklist_items(raw_items: list[dict] | None) -> list[dict]:
    default_map = {item["id"]: item for item in DEFAULT_AUDIT_CHECKLIST}
    incoming_map: dict[str, dict] = {}

    for item in raw_items or []:
        item_id = str(item.get("id", "")).strip()
        if not item_id:
            continue
        incoming_map[item_id] = item

    normalized: list[dict] = []
    for base in DEFAULT_AUDIT_CHECKLIST:
        incoming = incoming_map.get(base["id"], {})
        status_value = str(incoming.get("status", base["status"]))
        if status_value not in ALLOWED_CHECKLIST_STATUS:
            status_value = "pending"

        normalized.append(
            {
                "id": base["id"],
                "control_code": str(incoming.get("control_code", base["control_code"])),
                "title": str(incoming.get("title", base["title"])),
                "status": status_value,
                "notes": str(incoming.get("notes", "")),
            }
        )

    return normalized


def _completion_percentage(items: list[dict]) -> float:
    if not items:
        return 0.0
    done_count = sum(1 for item in items if item.get("status") == "done")
    return round((done_count / len(items)) * 100.0, 2)


def _build_checklist_response(items: list[dict], updated_at: datetime | None) -> AuditChecklistResponse:
    return AuditChecklistResponse(
        items=[AuditChecklistItem(**item) for item in items],
        completion_percentage=_completion_percentage(items),
        updated_at=updated_at.isoformat() if updated_at else None,
    )


def _build_assessment_response(record: AssessmentProgress | None) -> AssessmentProgressResponse:
    return AssessmentProgressResponse(
        payload=(record.progress_data if record else {}),
        updated_at=record.updated_at.isoformat() if record and record.updated_at else None,
    )


@router.get("/checklist", response_model=AuditChecklistResponse)
def get_audit_checklist(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    record = (
        db.query(AuditChecklist)
        .filter(AuditChecklist.organization_id == current_user.organization_id)
        .one_or_none()
    )

    if record is None:
        return _build_checklist_response(DEFAULT_AUDIT_CHECKLIST, None)

    normalized = _normalize_checklist_items(record.checklist_data)
    return _build_checklist_response(normalized, record.updated_at)


@router.put("/checklist", response_model=AuditChecklistResponse)
def upsert_audit_checklist(
    payload: AuditChecklistUpsertRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    normalized = _normalize_checklist_items([item.model_dump() for item in payload.items])

    record = (
        db.query(AuditChecklist)
        .filter(AuditChecklist.organization_id == current_user.organization_id)
        .one_or_none()
    )

    if record is None:
        record = AuditChecklist(
            organization_id=current_user.organization_id,
            updated_by_user_id=current_user.id,
            checklist_data=normalized,
        )
        db.add(record)
    else:
        record.checklist_data = normalized
        record.updated_by_user_id = current_user.id

    db.commit()
    db.refresh(record)

    return _build_checklist_response(normalized, record.updated_at)


@router.get("/assessment", response_model=AssessmentProgressResponse)
def get_assessment_progress(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    record = (
        db.query(AssessmentProgress)
        .filter(AssessmentProgress.organization_id == current_user.organization_id)
        .one_or_none()
    )
    return _build_assessment_response(record)


@router.put("/assessment", response_model=AssessmentProgressResponse)
def upsert_assessment_progress(
    payload: AssessmentProgressRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    record = (
        db.query(AssessmentProgress)
        .filter(AssessmentProgress.organization_id == current_user.organization_id)
        .one_or_none()
    )

    if record is None:
        record = AssessmentProgress(
            organization_id=current_user.organization_id,
            updated_by_user_id=current_user.id,
            progress_data=payload.payload,
        )
        db.add(record)
    else:
        record.progress_data = payload.payload
        record.updated_by_user_id = current_user.id

    db.commit()
    db.refresh(record)

    return _build_assessment_response(record)


@router.post("/validate", response_model=AuditValidationResponse)
async def validate_audit(
    data: AuditEvidenceRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Validar evidencia de auditoría
    
    El agente analizará:
    - Conformidad con estándares ISO 27001
    - Cumplimiento de políticas de seguridad
    - Riesgos identificados
    - Recomendaciones
    """
    
    # Validaciones básicas
    if not data.title or len(data.title) < 3:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El título debe tener al menos 3 caracteres"
        )
    
    if not data.evidence_text or len(data.evidence_text) < 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La evidencia debe tener al menos 10 caracteres"
        )
    
    if data.audit_type not in ["security", "compliance", "operational", "financial"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tipo de auditoría inválido"
        )
    
    audit_id = f"AUD-{current_user.organization_id}-{datetime.now(timezone.utc).timestamp()}"

    ai_payload = {
        "title": data.title,
        "description": data.description,
        "evidence_text": data.evidence_text,
        "audit_type": data.audit_type,
        "priority": data.priority,
    }
    ai_result = await analyze_audit_with_ai(ai_payload)

    if ai_result is not None:
        findings = [AuditFinding(**item) for item in ai_result["findings"]]
        compliance_score = int(ai_result["overall_compliance_score"])
        status_value = str(ai_result["status"])
        notes = str(ai_result["agent_notes"])
    else:
        findings = []
        compliance_score = 75

        evidence_lc = data.evidence_text.lower()

        if "servidor" in evidence_lc and "visible" in evidence_lc:
            findings.append(AuditFinding(
                issue="Servidores expuestos a visitantes",
                severity="high",
                recommendation="Restringir acceso fisico a servidores e implementar salas con acceso controlado",
                impact="Riesgo de manipulacion fisica de equipamiento critico"
            ))
            compliance_score = 45

        if "password" in evidence_lc or "contrasena" in evidence_lc or "contraseña" in evidence_lc:
            findings.append(AuditFinding(
                issue="Riesgo en gestion de credenciales",
                severity="medium",
                recommendation="Implementar MFA y politica de rotacion de contrasenas",
                impact="Acceso no autorizado potencial"
            ))

        if len(findings) == 0:
            findings.append(AuditFinding(
                issue="Sin hallazgos criticos detectados",
                severity="low",
                recommendation="Continuar con monitoreo regular",
                impact="Bajo"
            ))
            compliance_score = 85

        status_value = "compliant" if compliance_score >= 70 else "non_compliant"
        notes = (
            "Analisis ejecutado con motor heuristico local porque la IA no esta configurada "
            "o no estuvo disponible en esta solicitud."
        )
    
    return AuditValidationResponse(
        audit_id=audit_id,
        status=status_value,
        findings=findings,
        overall_compliance_score=compliance_score,
        analyzed_at=datetime.now(timezone.utc).isoformat(),
        agent_notes=notes,
    )


@router.post("/validate-file", response_model=FileValidationResponse)
async def validate_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Validar archivo de evidencia (PDF, Word, Excel, texto, imagen)
    Analiza el contenido y valida si cumple con estándares de evidencia
    """
    
    # Validar tipo de archivo
    allowed_extensions = {'.pdf', '.doc', '.docx', '.txt', '.jpg', '.png', '.xlsx', '.xls'}
    file_ext = f".{file.filename.split('.')[-1].lower()}" if file.filename else ''
    
    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Tipo de archivo no permitido. Use: {', '.join(allowed_extensions)}"
        )
    
    # Validar tamaño (máximo 10MB)
    max_size = 10 * 1024 * 1024  # 10MB
    file_size = 0
    content = b""
    
    chunk_size = 1024 * 1024  # 1MB chunks
    while True:
        chunk = await file.read(chunk_size)
        if not chunk:
            break
        file_size += len(chunk)
        content += chunk
        
        if file_size > max_size:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail="El archivo excede el tamaño máximo de 10MB"
            )
    
    # Intentar extraer texto del archivo usando el servicio especializado
    file_text = extract_text_from_file(content, file_ext, max_chars=100000)
    normalized_text = file_text.strip()
    extraction_failed = normalized_text.startswith("[") and (
        "Error" in normalized_text or "No se pudo extraer texto" in normalized_text or "no soportado" in normalized_text
    )
    extraction_insufficient = not extraction_failed and len(normalized_text) < 20
    
    # Analizar el contenido usando el agente IA especializado en archivos
    payload_for_ai = {
        "file_name": file.filename or "archivo",
        "file_size_bytes": file_size,
        "file_extension": file_ext,
        "content_preview": normalized_text,
        "analysis_context": "Evaluación de documento de evidencia para cumplimiento ISO 27001"
    }
    
    # Llamar al agente IA especializado en análisis de archivos
    ai_result = await analyze_file_with_ai(payload_for_ai)
    
    if ai_result:
        # Usar resultado del agente IA
        compliance_score = ai_result["overall_compliance_score"]
        compliance_status = ai_result["status"]
        summary = ai_result["agent_notes"]
        findings = [
            AuditFinding(
                issue=f["issue"],
                severity=f["severity"],
                recommendation=f["recommendation"],
                impact=f["impact"]
            )
            for f in ai_result.get("findings", [])
        ]
    else:
        # Fallback: heurística simple si el agente falla
        compliance_score = 70
        findings: list[AuditFinding] = []
        
        if extraction_failed or extraction_insufficient:
            compliance_score = 0
            findings.append(AuditFinding(
                issue="No se pudo leer contenido suficiente del documento",
                severity="high",
                recommendation="Verifica que el archivo sea un DOCX con texto editable y no una imagen escaneada; si es escaneado, conviértelo a PDF con OCR o agrega texto seleccionable.",
                impact="La evaluación automática no puede confirmar fecha, responsable, firma ni verificación"
            ))
            status_value = "needs_review"
            notes = (
                "El sistema no obtuvo texto suficiente del archivo para evaluar evidencia. "
                "Revisa que el documento tenga contenido editable y no solo imágenes."
            )
            return FileValidationResponse(
                file_name=file.filename or "archivo",
                compliance_score=compliance_score,
                compliance_status=status_value,
                findings=findings,
                summary=notes,
            )

        # Heurística simple de validación
        file_text_lower = normalized_text.lower()
        
        # Buscar indicadores de calidad de evidencia
        quality_indicators = {
            'fecha': 2,
            'dd/mm/yyyy': 2,
            'día': 1,
            'timestamp': 1,
            'responsable': 3,
            'elaborado por': 3,
            'autor': 1,
            'auditor': 2,
            'responsable': 2,
            'firmado por': 3,
            'firma': 3,
            'rúbrica': 3,
            'rubrica': 3,
            'sello': 1,
            'aprobado por': 2,
            'control': 2,
            'evidencia': 3,
            'cumplimiento': 3,
            'verificado': 3,
            'aprobado': 2,
            'validado': 2,
            'observación': 1,
            'observacion': 1,
        }
        
        indicator_score = 0
        for indicator, weight in quality_indicators.items():
            if indicator in file_text_lower:
                indicator_score += weight
        
        # Calcular score basado en indicadores encontrados
        max_score = sum(quality_indicators.values())
        if max_score > 0:
            compliance_score = min(100, int((indicator_score / max_score) * 100))
        else:
            compliance_score = 60
        
        # Generar hallazgos basados en el análisis
        if compliance_score < 50:
            findings.append(AuditFinding(
                issue="Documento con baja calidad de evidencia",
                severity="high",
                recommendation="Incluir fecha, responsable, firma y detalles de verificación",
                impact="Documento puede no ser aceptado en auditoría formal"
            ))
        elif compliance_score < 75:
            findings.append(AuditFinding(
                issue="Documento incompleto",
                severity="medium",
                recommendation="Incluir fecha, responsable, firma, detalle de verificación y una referencia clara al control evaluado",
                impact="Puede requerir validación adicional en auditoría"
            ))
        else:
            findings.append(AuditFinding(
                issue="Documento con buena calidad de evidencia",
                severity="low",
                recommendation="Agregar más detalles de cumplimiento, responsable de la evidencia y validación explícita",
                impact="Bajo - Documento cumple con estándares"
            ))
        
        # Determinar estado de conformidad
        if compliance_score >= 80:
            compliance_status = "compliant"
            summary = "✓ El documento contiene evidencia de buena calidad y cumple con estándares"
        elif compliance_score >= 60:
            compliance_status = "needs_review"
            summary = "⚠ El documento requiere revisión adicional y mejoras"
        else:
            compliance_status = "non_compliant"
            summary = "✗ El documento no cumple con estándares mínimos de evidencia"
    
    return FileValidationResponse(
        file_name=file.filename or "archivo",
        compliance_score=compliance_score,
        compliance_status=compliance_status,
        findings=findings,
        summary=summary
    )


@router.get("/history")
def get_audit_history(
    current_user: User = Depends(get_current_user),
    skip: int = 0,
    limit: int = 10
):
    """Obtener historial de auditorías del usuario"""
    return {
        "total": 0,
        "audits": [],
        "message": "Funcionalidad de historial será implementada en futuras versiones"
    }
=======
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from pydantic import BaseModel
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.db.database import get_db
from app.core.dependencies import get_current_user
from app.models.assessment_progress import AssessmentProgress
from app.models.audit_checklist import AuditChecklist
from app.models.user import User
from app.services.audit_ai_service import analyze_audit_with_ai, analyze_file_with_ai
from app.services.file_extraction_service import extract_text_from_file

router = APIRouter(prefix="/audit", tags=["audit"])


def normalize_text(text: str) -> str:
    return " ".join(str(text or "").split())


def build_document_context(document_text: str, max_chars: int = 12000) -> str:
    full_text = str(document_text or "")
    if len(full_text) <= max_chars:
        return full_text

    preview = [full_text[:3000], full_text[-3000:]]
    combined = "\n\n--- Fragmento relevante ---\n\n".join(preview)
    return combined[:max_chars]



ALLOWED_CHECKLIST_STATUS = {"pending", "in_progress", "done", "blocked"}

DEFAULT_AUDIT_CHECKLIST = [
    {
        "id": "scope-defined",
        "control_code": "PRE-AUD-01",
        "title": "Definir alcance y objetivos de auditoria",
        "status": "pending",
        "notes": "",
    },
    {
        "id": "evidence-collected",
        "control_code": "PRE-AUD-02",
        "title": "Recolectar evidencia clave por control",
        "status": "pending",
        "notes": "",
    },
    {
        "id": "owners-confirmed",
        "control_code": "PRE-AUD-03",
        "title": "Confirmar owners y responsables",
        "status": "pending",
        "notes": "",
    },
    {
        "id": "findings-reviewed",
        "control_code": "PRE-AUD-04",
        "title": "Revisar hallazgos abiertos y CAPAs",
        "status": "pending",
        "notes": "",
    },
    {
        "id": "dry-run-complete",
        "control_code": "PRE-AUD-05",
        "title": "Ejecutar simulacion de auditoria (dry run)",
        "status": "pending",
        "notes": "",
    },
]


class AuditEvidenceRequest(BaseModel):
    """Solicitud de validación de auditoría"""
    title: str
    description: str
    evidence_text: str
    audit_type: str  # "security", "compliance", "operational", "financial"
    priority: str = "medium"  # "low", "medium", "high", "critical"


class AuditFinding(BaseModel):
    """Hallazgo de auditoría"""
    issue: str
    severity: str
    recommendation: str
    impact: str


class AuditValidationResponse(BaseModel):
    """Respuesta de validación de auditoría"""
    audit_id: str
    status: str  # "compliant", "non_compliant", "needs_review"
    findings: list[AuditFinding]
    overall_compliance_score: int  # 0-100
    analyzed_at: str
    agent_notes: str


class AuditChecklistItem(BaseModel):
    id: str
    control_code: str
    title: str
    status: str
    notes: str = ""


class AuditChecklistUpsertRequest(BaseModel):
    items: list[AuditChecklistItem]


class AuditChecklistResponse(BaseModel):
    items: list[AuditChecklistItem]
    completion_percentage: float
    updated_at: str | None = None


class AssessmentProgressRequest(BaseModel):
    payload: dict


class AssessmentProgressResponse(BaseModel):
    payload: dict
    updated_at: str | None = None


class FileValidationResponse(BaseModel):
    """Respuesta de validación de archivo"""
    file_name: str
    compliance_score: int  # 0-100
    compliance_status: str  # "compliant", "non_compliant", "needs_review"
    findings: list[AuditFinding]
    summary: str


def _normalize_checklist_items(raw_items: list[dict] | None) -> list[dict]:
    default_map = {item["id"]: item for item in DEFAULT_AUDIT_CHECKLIST}
    incoming_map: dict[str, dict] = {}

    for item in raw_items or []:
        item_id = str(item.get("id", "")).strip()
        if not item_id:
            continue
        incoming_map[item_id] = item

    normalized: list[dict] = []
    for base in DEFAULT_AUDIT_CHECKLIST:
        incoming = incoming_map.get(base["id"], {})
        status_value = str(incoming.get("status", base["status"]))
        if status_value not in ALLOWED_CHECKLIST_STATUS:
            status_value = "pending"

        normalized.append(
            {
                "id": base["id"],
                "control_code": str(incoming.get("control_code", base["control_code"])),
                "title": str(incoming.get("title", base["title"])),
                "status": status_value,
                "notes": str(incoming.get("notes", "")),
            }
        )

    return normalized


def _completion_percentage(items: list[dict]) -> float:
    if not items:
        return 0.0
    done_count = sum(1 for item in items if item.get("status") == "done")
    return round((done_count / len(items)) * 100.0, 2)


def _build_checklist_response(items: list[dict], updated_at: datetime | None) -> AuditChecklistResponse:
    return AuditChecklistResponse(
        items=[AuditChecklistItem(**item) for item in items],
        completion_percentage=_completion_percentage(items),
        updated_at=updated_at.isoformat() if updated_at else None,
    )


def _build_assessment_response(record: AssessmentProgress | None) -> AssessmentProgressResponse:
    return AssessmentProgressResponse(
        payload=(record.progress_data if record else {}),
        updated_at=record.updated_at.isoformat() if record and record.updated_at else None,
    )


@router.get("/checklist", response_model=AuditChecklistResponse)
def get_audit_checklist(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    record = (
        db.query(AuditChecklist)
        .filter(AuditChecklist.organization_id == current_user.organization_id)
        .one_or_none()
    )

    if record is None:
        return _build_checklist_response(DEFAULT_AUDIT_CHECKLIST, None)

    normalized = _normalize_checklist_items(record.checklist_data)
    return _build_checklist_response(normalized, record.updated_at)


@router.put("/checklist", response_model=AuditChecklistResponse)
def upsert_audit_checklist(
    payload: AuditChecklistUpsertRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    normalized = _normalize_checklist_items([item.model_dump() for item in payload.items])

    record = (
        db.query(AuditChecklist)
        .filter(AuditChecklist.organization_id == current_user.organization_id)
        .one_or_none()
    )

    if record is None:
        record = AuditChecklist(
            organization_id=current_user.organization_id,
            updated_by_user_id=current_user.id,
            checklist_data=normalized,
        )
        db.add(record)
    else:
        record.checklist_data = normalized
        record.updated_by_user_id = current_user.id

    db.commit()
    db.refresh(record)

    return _build_checklist_response(normalized, record.updated_at)


@router.get("/assessment", response_model=AssessmentProgressResponse)
def get_assessment_progress(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    record = (
        db.query(AssessmentProgress)
        .filter(AssessmentProgress.organization_id == current_user.organization_id)
        .one_or_none()
    )
    return _build_assessment_response(record)


@router.put("/assessment", response_model=AssessmentProgressResponse)
def upsert_assessment_progress(
    payload: AssessmentProgressRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    record = (
        db.query(AssessmentProgress)
        .filter(AssessmentProgress.organization_id == current_user.organization_id)
        .one_or_none()
    )

    if record is None:
        record = AssessmentProgress(
            organization_id=current_user.organization_id,
            updated_by_user_id=current_user.id,
            progress_data=payload.payload,
        )
        db.add(record)
    else:
        record.progress_data = payload.payload
        record.updated_by_user_id = current_user.id

    db.commit()
    db.refresh(record)

    return _build_assessment_response(record)


@router.post("/validate", response_model=AuditValidationResponse)
async def validate_audit(
    data: AuditEvidenceRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Validar evidencia de auditoría
    
    El agente analizará:
    - Conformidad con estándares ISO 27001
    - Cumplimiento de políticas de seguridad
    - Riesgos identificados
    - Recomendaciones
    """
    
    # Validaciones básicas
    if not data.title or len(data.title) < 3:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El título debe tener al menos 3 caracteres"
        )
    
    if not data.evidence_text or len(data.evidence_text) < 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La evidencia debe tener al menos 10 caracteres"
        )
    
    if data.audit_type not in ["security", "compliance", "operational", "financial"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tipo de auditoría inválido"
        )
    
    audit_id = f"AUD-{current_user.organization_id}-{datetime.now(timezone.utc).timestamp()}"

    ai_payload = {
        "title": data.title,
        "description": data.description,
        "evidence_text": data.evidence_text,
        "audit_type": data.audit_type,
        "priority": data.priority,
    }
    ai_result = await analyze_audit_with_ai(ai_payload)

    if ai_result is not None:
        findings = [AuditFinding(**item) for item in ai_result["findings"]]
        compliance_score = int(ai_result["overall_compliance_score"])
        status_value = str(ai_result["status"])
        notes = str(ai_result["agent_notes"])
    else:
        findings = []
        compliance_score = 75

        evidence_lc = data.evidence_text.lower()

        if "servidor" in evidence_lc and "visible" in evidence_lc:
            findings.append(AuditFinding(
                issue="Servidores expuestos a visitantes",
                severity="high",
                recommendation="Restringir acceso fisico a servidores e implementar salas con acceso controlado",
                impact="Riesgo de manipulacion fisica de equipamiento critico"
            ))
            compliance_score = 45

        if "password" in evidence_lc or "contrasena" in evidence_lc or "contraseña" in evidence_lc:
            findings.append(AuditFinding(
                issue="Riesgo en gestion de credenciales",
                severity="medium",
                recommendation="Implementar MFA y politica de rotacion de contrasenas",
                impact="Acceso no autorizado potencial"
            ))

        if len(findings) == 0:
            findings.append(AuditFinding(
                issue="Sin hallazgos criticos detectados",
                severity="low",
                recommendation="Continuar con monitoreo regular",
                impact="Bajo"
            ))
            compliance_score = 85

        status_value = "compliant" if compliance_score >= 70 else "non_compliant"
        notes = (
            "Analisis ejecutado con motor heuristico local porque la IA no esta configurada "
            "o no estuvo disponible en esta solicitud."
        )
    
    return AuditValidationResponse(
        audit_id=audit_id,
        status=status_value,
        findings=findings,
        overall_compliance_score=compliance_score,
        analyzed_at=datetime.now(timezone.utc).isoformat(),
        agent_notes=notes,
    )


@router.post("/validate-file", response_model=FileValidationResponse)
async def validate_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Validar archivo de evidencia (PDF, Word, Excel, texto, imagen)
    Analiza el contenido y valida si cumple con estándares de evidencia
    """
    
    # Validar tipo de archivo
    allowed_extensions = {'.pdf', '.doc', '.docx', '.txt', '.jpg', '.png', '.xlsx', '.xls'}
    file_ext = f".{file.filename.split('.')[-1].lower()}" if file.filename else ''
    
    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Tipo de archivo no permitido. Use: {', '.join(allowed_extensions)}"
        )
    
    # Validar tamaño (máximo 10MB)
    max_size = 10 * 1024 * 1024  # 10MB
    file_size = 0
    content = b""
    
    chunk_size = 1024 * 1024  # 1MB chunks
    while True:
        chunk = await file.read(chunk_size)
        if not chunk:
            break
        file_size += len(chunk)
        content += chunk
        
        if file_size > max_size:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail="El archivo excede el tamaño máximo de 10MB"
            )
    
    # Intentar extraer texto del archivo usando el servicio especializado
    file_text = extract_text_from_file(content, file_ext, max_chars=None)
    normalized_text = normalize_text(file_text)
    extraction_failed = normalized_text.startswith("[") and (
        "Error" in normalized_text or "No se pudo extraer texto" in normalized_text or "no soportado" in normalized_text
    )
    extraction_insufficient = not extraction_failed and len(normalized_text) < 20
    
    # Analizar el contenido usando el agente IA especializado en archivos
    payload_for_ai = {
        "file_name": file.filename or "archivo",
        "file_size_bytes": file_size,
        "file_extension": file_ext,
        "content_preview": build_document_context(normalized_text, max_chars=12000),
        "analysis_context": "Evaluación de documento de evidencia para cumplimiento ISO 27001"
    }
    
    # Llamar al agente IA especializado en análisis de archivos
    ai_result = await analyze_file_with_ai(payload_for_ai)
    
    if ai_result:
        # Usar resultado del agente IA
        compliance_score = ai_result["overall_compliance_score"]
        compliance_status = ai_result["status"]
        summary = ai_result["agent_notes"]
        findings = [
            AuditFinding(
                issue=f["issue"],
                severity=f["severity"],
                recommendation=f["recommendation"],
                impact=f["impact"]
            )
            for f in ai_result.get("findings", [])
        ]
    else:
        # Fallback: heurística simple si el agente falla
        compliance_score = 70
        findings: list[AuditFinding] = []
        
        if extraction_failed or extraction_insufficient:
            compliance_score = 0
            findings.append(AuditFinding(
                issue="No se pudo leer contenido suficiente del documento",
                severity="high",
                recommendation="Verifica que el archivo sea un DOCX con texto editable y no una imagen escaneada; si es escaneado, conviértelo a PDF con OCR o agrega texto seleccionable.",
                impact="La evaluación automática no puede confirmar fecha, responsable, firma ni verificación"
            ))
            status_value = "needs_review"
            notes = (
                "El sistema no obtuvo texto suficiente del archivo para evaluar evidencia. "
                "Revisa que el documento tenga contenido editable y no solo imágenes."
            )
            return FileValidationResponse(
                file_name=file.filename or "archivo",
                compliance_score=compliance_score,
                compliance_status=status_value,
                findings=findings,
                summary=notes,
            )

        # Heurística simple de validación
        file_text_lower = normalized_text.lower()
        
        # Buscar indicadores de calidad de evidencia
        quality_indicators = {
            'fecha': 2,
            'dd/mm/yyyy': 2,
            'día': 1,
            'timestamp': 1,
            'responsable': 3,
            'elaborado por': 3,
            'autor': 1,
            'auditor': 2,
            'responsable': 2,
            'firmado por': 3,
            'firma': 3,
            'rúbrica': 3,
            'rubrica': 3,
            'sello': 1,
            'aprobado por': 2,
            'control': 2,
            'evidencia': 3,
            'cumplimiento': 3,
            'verificado': 3,
            'aprobado': 2,
            'validado': 2,
            'observación': 1,
            'observacion': 1,
        }
        
        indicator_score = 0
        for indicator, weight in quality_indicators.items():
            if indicator in file_text_lower:
                indicator_score += weight
        
        # Calcular score basado en indicadores encontrados
        max_score = sum(quality_indicators.values())
        if max_score > 0:
            compliance_score = min(100, int((indicator_score / max_score) * 100))
        else:
            compliance_score = 60
        
        # Generar hallazgos basados en el análisis
        if compliance_score < 50:
            findings.append(AuditFinding(
                issue="Documento con baja calidad de evidencia",
                severity="high",
                recommendation="Incluir fecha, responsable, firma y detalles de verificación",
                impact="Documento puede no ser aceptado en auditoría formal"
            ))
        elif compliance_score < 75:
            findings.append(AuditFinding(
                issue="Documento incompleto",
                severity="medium",
                recommendation="Incluir fecha, responsable, firma, detalle de verificación y una referencia clara al control evaluado",
                impact="Puede requerir validación adicional en auditoría"
            ))
        else:
            findings.append(AuditFinding(
                issue="Documento con buena calidad de evidencia",
                severity="low",
                recommendation="Agregar más detalles de cumplimiento, responsable de la evidencia y validación explícita",
                impact="Bajo - Documento cumple con estándares"
            ))
        
        # Determinar estado de conformidad
        if compliance_score >= 80:
            compliance_status = "compliant"
            summary = "✓ El documento contiene evidencia de buena calidad y cumple con estándares"
        elif compliance_score >= 60:
            compliance_status = "needs_review"
            summary = "⚠ El documento requiere revisión adicional y mejoras"
        else:
            compliance_status = "non_compliant"
            summary = "✗ El documento no cumple con estándares mínimos de evidencia"
    
    return FileValidationResponse(
        file_name=file.filename or "archivo",
        compliance_score=compliance_score,
        compliance_status=compliance_status,
        findings=findings,
        summary=summary
    )


@router.get("/history")
def get_audit_history(
    current_user: User = Depends(get_current_user),
    skip: int = 0,
    limit: int = 10
):
    """Obtener historial de auditorías del usuario"""
    return {
        "total": 0,
        "audits": [],
        "message": "Funcionalidad de historial será implementada en futuras versiones"
    }
>>>>>>> Chat-bot
