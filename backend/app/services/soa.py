from __future__ import annotations
from typing import List, Dict
import re
import uuid

from sqlalchemy.orm import Session

from app.models import AssessmentPhase, AssessmentQuestion, SOAControlStatus, ImplementationStatus

PHASE_4_CODE = "phase-4"


def extract_category_from_clause_ref(clause_ref: str) -> str:
    """Extrae categoría (A.5, A.6, A.7, A.8) del clause_ref (A.5.1, A.8.34, etc)."""
    match = re.match(r"^(A\.\d+)", clause_ref or "")
    if match:
        return match.group(1)
    return clause_ref or ""


def list_soa_controls(organization_id: uuid.UUID, db: Session) -> List[Dict]:
    """
    Devuelve la lista completa de controles (Anexo A, fase 4) para la org,
    con el estado SOA si existe (objeto plano, sin Pydantic).
    """
    phase_4 = db.query(AssessmentPhase).filter(AssessmentPhase.code == PHASE_4_CODE).first()
    if not phase_4:
        return []

    questions = db.query(AssessmentQuestion).filter(
        AssessmentQuestion.phase_id == phase_4.id
    ).order_by(AssessmentQuestion.sort_order).all()

    soa_rows = db.query(SOAControlStatus).filter(
        SOAControlStatus.organization_id == organization_id
    ).all()
    soa_map = {s.question_id: s for s in soa_rows}

    controls: List[Dict] = []
    for q in questions:
        soa = soa_map.get(q.id)
        category = extract_category_from_clause_ref(q.clause_ref)
        control_dict = {
            "id": str(soa.id) if soa else None,
            "organization_id": str(soa.organization_id) if soa else str(organization_id),
            "question_id": str(q.id),
            "applicable": soa.applicable if soa else True,
            "implementation_status": soa.implementation_status.value if soa else ImplementationStatus.NO_IMPLEMENTADO.value,
            "exclusion_justification": soa.exclusion_justification if soa else None,
            "policy_reference": soa.policy_reference if soa else None,
            "created_at": soa.created_at.isoformat() if soa and soa.created_at else None,
            "updated_at": soa.updated_at.isoformat() if soa and soa.updated_at else None,
            "clause_ref": q.clause_ref,
            "text": q.text,
            "is_critical": q.is_critical,
            "category": category,
            "control": f"{q.clause_ref} — {q.text}" if q.clause_ref else q.text,
        }
        controls.append(control_dict)

    return controls


def compute_soa_summary(organization_id: uuid.UUID, db: Session) -> Dict:
    """
    Calcula y devuelve el summary + breakdown y la lista de controles (si se quiere).
    Retorna un dict puro que el exportador puede consumir directamente.
    """
    phase_4 = db.query(AssessmentPhase).filter(AssessmentPhase.code == PHASE_4_CODE).first()
    if not phase_4:
        return {
            "summary": "Phase 4 (Anexo A) no encontrada.",
            "total_controls": 0,
            "total_applicable": 0,
            "total_non_applicable": 0,
            "implemented": 0,
            "partial": 0,
            "not_implemented": 0,
            "coverage_percentage": 0.0,
            "breakdown_by_category": [],
            "controls": [],
            "implemented_controls": 0,
            "pending_controls": 0,
        }

    all_questions = db.query(AssessmentQuestion).filter(AssessmentQuestion.phase_id == phase_4.id).all()
    soa_rows = db.query(SOAControlStatus).filter(SOAControlStatus.organization_id == organization_id).all()
    soa_map = {s.question_id: s for s in soa_rows}

    total_controls = len(all_questions)
    total_applicable = 0
    total_non_applicable = 0
    implemented = 0
    partial = 0
    not_implemented = 0

    categories_data = {
        "A.5": {"total": 0, "applicable": 0, "non_applicable": 0, "implemented": 0, "partial": 0, "not_implemented": 0},
        "A.6": {"total": 0, "applicable": 0, "non_applicable": 0, "implemented": 0, "partial": 0, "not_implemented": 0},
        "A.7": {"total": 0, "applicable": 0, "non_applicable": 0, "implemented": 0, "partial": 0, "not_implemented": 0},
        "A.8": {"total": 0, "applicable": 0, "non_applicable": 0, "implemented": 0, "partial": 0, "not_implemented": 0},
    }

    for q in all_questions:
        category = extract_category_from_clause_ref(q.clause_ref)
        if category not in categories_data:
            categories_data.setdefault(category, {"total": 0, "applicable": 0, "non_applicable": 0, "implemented": 0, "partial": 0, "not_implemented": 0})

        soa = soa_map.get(q.id)
        applicable = soa.applicable if soa else True
        impl_status = soa.implementation_status.value if soa else ImplementationStatus.NO_IMPLEMENTADO.value

        categories_data[category]["total"] += 1

        if applicable:
            total_applicable += 1
            categories_data[category]["applicable"] += 1

            if impl_status == ImplementationStatus.IMPLEMENTADO.value:
                implemented += 1
                categories_data[category]["implemented"] += 1
            elif impl_status == ImplementationStatus.PARCIAL.value:
                partial += 1
                categories_data[category]["partial"] += 1
            else:
                not_implemented += 1
                categories_data[category]["not_implemented"] += 1
        else:
            total_non_applicable += 1
            categories_data[category]["non_applicable"] += 1

    coverage_percentage = 0.0
    if total_applicable > 0:
        coverage_percentage = round((implemented + partial) / total_applicable * 100, 2)

    breakdown = []
    for cat, data in categories_data.items():
        applicable_count = data["applicable"]
        cat_cov = 0.0
        if applicable_count > 0:
            cat_cov = round((data["implemented"] + data["partial"]) / applicable_count * 100, 2)
        breakdown.append({
            "category": cat,
            "total": data["total"],
            "applicable": data["applicable"],
            "non_applicable": data["non_applicable"],
            "implemented": data["implemented"],
            "partial": data["partial"],
            "not_implemented": data["not_implemented"],
            "coverage_percentage": cat_cov,
        })

    controls = list_soa_controls(organization_id, db)

    implemented_controls = implemented
    pending_controls = max(0, total_applicable - implemented - partial)

    summary_text = (
        "Evaluación del SOA con foco en la madurez de controles y la identificación de brechas. "
        f"Actualmente se identifican {implemented}/{total_applicable} controles aplicables implementados "
        f"({coverage_percentage}% de cobertura entre aplicables)."
    )

    return {
        "summary": summary_text,
        "total_controls": total_controls,
        "total_applicable": total_applicable,
        "total_non_applicable": total_non_applicable,
        "implemented": implemented,
        "partial": partial,
        "not_implemented": not_implemented,
        "coverage_percentage": coverage_percentage,
        "breakdown_by_category": breakdown,
        "controls": controls,
        "implemented_controls": implemented_controls,
        "pending_controls": pending_controls,
    }
