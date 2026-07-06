"""Router para Statement of Applicability (SOA).

Endpoints:
- GET    /soa/controls           — Listar 93 controles fase 4 con estado SOA
- GET    /soa/controls/:id       — Detalle de un control
- PATCH  /soa/controls/:id/applicability — Toggle aplicable/no aplicable
- PATCH  /soa/controls/:id/status — Actualizar implementation_status
- PATCH  /soa/controls/:id/exclusion — Guardar justificación + policy_reference
- GET    /soa/summary            — Resumen y estadísticas por categoría
"""

from __future__ import annotations

import re
import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import and_
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, require_roles
from app.db.database import get_db
from app.models import AssessmentPhase, AssessmentQuestion, SOAControlStatus, User, ImplementationStatus
from app.schemas.soa import (
    SOAApplicabilityRequest,
    SOAControlListOut,
    SOAControlStatusOut,
    SOAExclusionRequest,
    SOAImplementationStatusRequest,
    SOASummaryOut,
    CategoryBreakdown,
)
from app.services.soa import extract_category_from_clause_ref

router = APIRouter(prefix="/soa", tags=["soa"])

PHASE_4_CODE = "phase-4"


# ============================================================================
# HELPERS
# ============================================================================

def _build_soa_response(
    question: AssessmentQuestion,
    soa_row: SOAControlStatus | None,
    organization_id: uuid.UUID,
) -> SOAControlStatusOut:
    """Construye SOAControlStatusOut: si no existe soa_row, devuelve defaults.
    
    organization_id se pasa siempre (nunca es None).
    """
    if soa_row:
        return SOAControlStatusOut(
            id=soa_row.id,
            organization_id=soa_row.organization_id,
            question_id=soa_row.question_id,
            applicable=soa_row.applicable,
            implementation_status=soa_row.implementation_status.value,
            exclusion_justification=soa_row.exclusion_justification,
            policy_reference=soa_row.policy_reference,
            created_at=soa_row.created_at,
            updated_at=soa_row.updated_at,
            clause_ref=question.clause_ref,
            text=question.text,
            is_critical=question.is_critical,
            category=extract_category_from_clause_ref(question.clause_ref),
        )
    else:
        # Objeto sintético: control virgen con defaults
        # organization_id SIEMPRE viene pasado (nunca None)
        return SOAControlStatusOut(
            id=None,
            organization_id=organization_id,
            question_id=question.id,
            applicable=True,
            implementation_status="no_implementado",
            exclusion_justification=None,
            policy_reference=None,
            created_at=None,
            updated_at=None,
            clause_ref=question.clause_ref,
            text=question.text,
            is_critical=question.is_critical,
            category=extract_category_from_clause_ref(question.clause_ref),
        )


def _get_or_create_soa_control(
    db: Session,
    organization_id: uuid.UUID,
    question_id: uuid.UUID
) -> SOAControlStatus:
    """Busca o crea (upsert) un registro de SOAControlStatus.
    
    Si no existe, crea con defaults y lo inserta.
    """
    existing = db.query(SOAControlStatus).filter(
        and_(
            SOAControlStatus.organization_id == organization_id,
            SOAControlStatus.question_id == question_id,
        )
    ).first()

    if existing:
        return existing

    # Crear nuevo
    new_soa = SOAControlStatus(
        id=uuid.uuid4(),
        organization_id=organization_id,
        question_id=question_id,
        applicable=True,
        implementation_status=ImplementationStatus.NO_IMPLEMENTADO,
        exclusion_justification=None,
        policy_reference=None,
    )
    db.add(new_soa)
    db.flush()  # Para obtener los timestamps
    return new_soa


# ============================================================================
# ENDPOINTS
# ============================================================================

@router.get("/controls", response_model=SOAControlListOut)
async def list_soa_controls(
    current_user: User = Depends(require_roles("admin", "ciso", "auditor")),
    db: Session = Depends(get_db),
):
    """Listar los 93 controles de Anexo A con estado SOA.
    
    Hace LEFT JOIN conceptual entre AssessmentQuestion (fase 4) y SOAControlStatus (org actual).
    Para controles sin fila, devuelve objeto sintético con defaults.
    """
    # Buscar fase 4
    phase_4 = db.query(AssessmentPhase).filter(
        AssessmentPhase.code == PHASE_4_CODE
    ).first()

    if not phase_4:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Phase 4 (Anexo A) not found"
        )

    # Query: todas las preguntas de fase 4
    questions = db.query(AssessmentQuestion).filter(
        AssessmentQuestion.phase_id == phase_4.id
    ).order_by(AssessmentQuestion.sort_order).all()

    # Query: todos los SOAControlStatus de esta organización
    soa_statuses = db.query(SOAControlStatus).filter(
        SOAControlStatus.organization_id == current_user.organization_id
    ).all()

    # Map: question_id -> SOAControlStatus (para búsqueda O(1))
    soa_map = {s.question_id: s for s in soa_statuses}

    # Construir responses
    controls = [
        _build_soa_response(q, soa_map.get(q.id), current_user.organization_id)
        for q in questions
    ]

    return SOAControlListOut(total=len(controls), controls=controls)


@router.get("/controls/{question_id}", response_model=SOAControlStatusOut)
async def get_soa_control(
    question_id: str,
    current_user: User = Depends(require_roles("admin", "ciso", "auditor")),
    db: Session = Depends(get_db),
):
    """Obtener detalle de un control SOA específico."""
    q_uuid = uuid.UUID(question_id)

    # Validar que el question_id existe y es de fase 4
    question = db.query(AssessmentQuestion).filter(
        AssessmentQuestion.id == q_uuid
    ).first()

    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found"
        )

    phase_4 = db.query(AssessmentPhase).filter(
        AssessmentPhase.code == PHASE_4_CODE
    ).first()

    if not phase_4 or question.phase_id != phase_4.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Question is not in Phase 4 (Anexo A)"
        )

    # Buscar SOAControlStatus
    soa_row = db.query(SOAControlStatus).filter(
        and_(
            SOAControlStatus.organization_id == current_user.organization_id,
            SOAControlStatus.question_id == question.id,
        )
    ).first()

    return _build_soa_response(question, soa_row, current_user.organization_id)


@router.patch("/controls/{question_id}/applicability", response_model=SOAControlStatusOut)
async def update_applicability(
    question_id: str,
    payload: SOAApplicabilityRequest,
    current_user: User = Depends(require_roles("admin", "ciso")),
    db: Session = Depends(get_db),
):
    """Actualizar si el control es aplicable (toggle).
    
    Crea la fila si no existe (upsert).
    """
    q_uuid = uuid.UUID(question_id)

    # Validar que el control existe en fase 4
    question = db.query(AssessmentQuestion).filter(
        AssessmentQuestion.id == q_uuid
    ).first()

    if not question:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found")

    phase_4 = db.query(AssessmentPhase).filter(
        AssessmentPhase.code == PHASE_4_CODE
    ).first()

    if not phase_4 or question.phase_id != phase_4.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Question is not in Phase 4 (Anexo A)"
        )

    # Get or create
    soa_control = _get_or_create_soa_control(db, current_user.organization_id, q_uuid)
    soa_control.applicable = payload.applicable

    db.add(soa_control)
    db.commit()
    db.refresh(soa_control)

    return _build_soa_response(question, soa_control, current_user.organization_id)


@router.patch("/controls/{question_id}/status", response_model=SOAControlStatusOut)
async def update_status(
    question_id: str,
    payload: SOAImplementationStatusRequest,
    current_user: User = Depends(require_roles("admin", "ciso")),
    db: Session = Depends(get_db),
):
    """Actualizar el estado de implementación del control.
    
    Crea la fila si no existe (upsert).
    """
    q_uuid = uuid.UUID(question_id)

    # Validar que el control existe en fase 4
    question = db.query(AssessmentQuestion).filter(
        AssessmentQuestion.id == q_uuid
    ).first()

    if not question:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found")

    phase_4 = db.query(AssessmentPhase).filter(
        AssessmentPhase.code == PHASE_4_CODE
    ).first()

    if not phase_4 or question.phase_id != phase_4.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Question is not in Phase 4 (Anexo A)"
        )

    # Get or create
    soa_control = _get_or_create_soa_control(db, current_user.organization_id, q_uuid)
    # Convert incoming string to ImplementationStatus enum
    soa_control.implementation_status = ImplementationStatus(payload.implementation_status)

    db.add(soa_control)
    db.commit()
    db.refresh(soa_control)

    return _build_soa_response(question, soa_control, current_user.organization_id)


@router.patch("/controls/{question_id}/exclusion", response_model=SOAControlStatusOut)
async def update_exclusion(
    question_id: str,
    payload: SOAExclusionRequest,
    current_user: User = Depends(require_roles("admin", "ciso")),
    db: Session = Depends(get_db),
):
    """Actualizar justificación de exclusión y referencia de política.
    
    Crea la fila si no existe (upsert).
    """
    q_uuid = uuid.UUID(question_id)

    # Validar que el control existe en fase 4
    question = db.query(AssessmentQuestion).filter(
        AssessmentQuestion.id == q_uuid
    ).first()

    if not question:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found")

    phase_4 = db.query(AssessmentPhase).filter(
        AssessmentPhase.code == PHASE_4_CODE
    ).first()

    if not phase_4 or question.phase_id != phase_4.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Question is not in Phase 4 (Anexo A)"
        )

    # Get or create
    soa_control = _get_or_create_soa_control(db, current_user.organization_id, q_uuid)

    # Actualizar ambos campos
    if payload.exclusion_justification is not None:
        soa_control.exclusion_justification = payload.exclusion_justification
    if payload.policy_reference is not None:
        soa_control.policy_reference = payload.policy_reference

    db.add(soa_control)
    db.commit()
    db.refresh(soa_control)

    return _build_soa_response(question, soa_control, current_user.organization_id)


@router.get("/summary", response_model=SOASummaryOut)
async def get_soa_summary(
    current_user: User = Depends(require_roles("admin", "ciso", "auditor")),
    db: Session = Depends(get_db),
):
    """Obtener resumen y estadísticas SOA por categoría.
    
    Calcula totales, aplicables, no aplicables, y coverage por A.5/A.6/A.7/A.8.
    """
    # Obtener fase 4
    phase_4 = db.query(AssessmentPhase).filter(
        AssessmentPhase.code == PHASE_4_CODE
    ).first()

    if not phase_4:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Phase 4 (Anexo A) not found"
        )

    # Todas las preguntas de fase 4
    all_questions = db.query(AssessmentQuestion).filter(
        AssessmentQuestion.phase_id == phase_4.id
    ).all()

    # Todos los SOAControlStatus de esta org
    soa_rows = db.query(SOAControlStatus).filter(
        SOAControlStatus.organization_id == current_user.organization_id
    ).all()

    # Map: question_id -> SOAControlStatus
    soa_map = {s.question_id: s for s in soa_rows}

    # Totales globales
    total_controls = len(all_questions)
    total_applicable = 0
    total_non_applicable = 0
    implemented = 0
    partial = 0
    not_implemented = 0

    # Agrupar por categoría
    categories_data: dict[str, dict] = {
        "A.5": {"total": 0, "applicable": 0, "non_applicable": 0, "implemented": 0, "partial": 0, "not_implemented": 0},
        "A.6": {"total": 0, "applicable": 0, "non_applicable": 0, "implemented": 0, "partial": 0, "not_implemented": 0},
        "A.7": {"total": 0, "applicable": 0, "non_applicable": 0, "implemented": 0, "partial": 0, "not_implemented": 0},
        "A.8": {"total": 0, "applicable": 0, "non_applicable": 0, "implemented": 0, "partial": 0, "not_implemented": 0},
    }

    # Iterar preguntas
    for question in all_questions:
        category = extract_category_from_clause_ref(question.clause_ref)
        soa_row = soa_map.get(question.id)

        # Default: applicable=True, status=no_implementado
        applicable = soa_row.applicable if soa_row else True
        impl_status = soa_row.implementation_status.value if soa_row else "no_implementado"

        # Contabilizar
        categories_data[category]["total"] += 1

        if applicable:
            total_applicable += 1
            categories_data[category]["applicable"] += 1

            if impl_status == "implementado":
                implemented += 1
                categories_data[category]["implemented"] += 1
            elif impl_status == "parcial":
                partial += 1
                categories_data[category]["partial"] += 1
            else:  # no_implementado
                not_implemented += 1
                categories_data[category]["not_implemented"] += 1
        else:
            total_non_applicable += 1
            categories_data[category]["non_applicable"] += 1

    # Calcular coverage global
    coverage_percentage = 0.0
    if total_applicable > 0:
        coverage_percentage = round((implemented + partial) / total_applicable * 100, 2)

    # Construir breakdown por categoría
    breakdown_by_category = []
    for cat in ["A.5", "A.6", "A.7", "A.8"]:
        data = categories_data[cat]
        cat_coverage = 0.0
        if data["applicable"] > 0:
            cat_coverage = round((data["implemented"] + data["partial"]) / data["applicable"] * 100, 2)

        breakdown_by_category.append(
            CategoryBreakdown(
                category=cat,
                total=data["total"],
                applicable=data["applicable"],
                non_applicable=data["non_applicable"],
                implemented=data["implemented"],
                partial=data["partial"],
                not_implemented=data["not_implemented"],
                coverage_percentage=cat_coverage,
            )
        )

    return SOASummaryOut(
        total_controls=total_controls,
        total_applicable=total_applicable,
        total_non_applicable=total_non_applicable,
        implemented=implemented,
        partial=partial,
        not_implemented=not_implemented,
        coverage_percentage=coverage_percentage,
        breakdown_by_category=breakdown_by_category,
    )
