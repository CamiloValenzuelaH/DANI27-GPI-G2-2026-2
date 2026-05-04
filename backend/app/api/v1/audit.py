from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.db.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.services.audit_ai_service import analyze_audit_with_ai

router = APIRouter(prefix="/audit", tags=["audit"])


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
