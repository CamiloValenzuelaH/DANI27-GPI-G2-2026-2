from __future__ import annotations

from datetime import date, datetime, timezone
from typing import Literal

from sqlalchemy import case, exists, func, select
from sqlalchemy.orm import Session

from app.models.asset import Asset
from app.models.assessment_answer import AssessmentAnswer
from app.models.capa import CAPA, CAPAStatus
from app.models.document import Document, DocumentReviewAction, DocumentStatus
from app.models.evidence_taxonomy import EvidenceTaxonomy
from app.models.risk import Risk, RiskEvaluation
from app.models.user import User
from app.models.audit_schedule import AuditSchedule
from app.schemas.dashboard import (
    DashboardActivityItem,
    DashboardMetricsResponse,
    DashboardTrendItem,
    DashboardUpcomingTaskItem,
)


def _percentage(part: int, total: int) -> float:
    if total <= 0:
        return 0.0
    return round((part / total) * 100.0, 2)


def _health_score(documentation_percentage: float, implementation_percentage: float, tested_percentage: float) -> float:
    return round(
        (documentation_percentage * 0.30)
        + (implementation_percentage * 0.40)
        + (tested_percentage * 0.30),
        2,
    )


def _health_status(score: float) -> str:
    if score >= 75:
        return "Ready"
    if score >= 60:
        return "In progress"
    if score >= 45:
        return "At risk"
    return "Critical"


def _month_starts(last_n_months: int = 5) -> list[datetime]:
    now = datetime.now(timezone.utc)
    current_index = now.year * 12 + (now.month - 1)
    starts: list[datetime] = []

    for offset in range(last_n_months - 1, -1, -1):
        index = current_index - offset
        year = index // 12
        month = (index % 12) + 1
        starts.append(datetime(year, month, 1, tzinfo=timezone.utc))

    return starts


def _activity_item(item_id: str, title: str, category: str, time: datetime) -> DashboardActivityItem:
    return DashboardActivityItem(
        id=item_id,
        title=title,
        category=category,
        time=time,
    )


def _due_bucket(due_date: date) -> str:
    today = date.today()
    delta_days = (due_date - today).days
    if delta_days <= 0:
        return "today"
    if delta_days == 1:
        return "tomorrow"
    if delta_days <= 7:
        return "thisWeek"
    return "nextWeek"


def _priority_weight(priority: str) -> int:
    return {"high": 0, "medium": 1, "low": 2}.get(priority, 3)


def _due_weight(due: str) -> int:
    return {"today": 0, "tomorrow": 1, "thisWeek": 2, "nextWeek": 3}.get(due, 4)


def _risk_task_priority(residual_risk_level: str) -> str:
    normalized = (residual_risk_level or "").lower()
    if normalized in {"alto", "high", "critical", "crítico", "critico"}:
        return "high"
    if normalized in {"medio", "medium"}:
        return "medium"
    return "low"


def get_metrics(org_id, db: Session) -> DashboardMetricsResponse:
    documented_condition = func.coalesce(func.length(func.trim(Asset.description)), 0) > 0
    clause_condition = func.coalesce(func.length(func.trim(Asset.clause_ref)), 0) > 0
    active_owner_exists = exists(
        select(1)
        .select_from(User)
        .where(
            User.id == Asset.owner_id,
            User.organization_id == org_id,
            User.is_active.is_(True),
        )
    )

    implemented_condition = case(
        (Asset.owner_id.isnot(None), active_owner_exists),
        else_=False,
    )
    tested_condition = Asset.updated_at > Asset.created_at

    aggregate_row = (
        db.query(
            func.count(Asset.id).label("total_assets"),
            func.count(Asset.id).filter(documented_condition, clause_condition).label("documented_assets"),
            func.count(Asset.id).filter(implemented_condition).label("implemented_assets"),
            func.count(Asset.id).filter(tested_condition).label("tested_assets"),
        )
        .filter(Asset.organization_id == org_id)
        .one()
    )

    total_assets = int(aggregate_row.total_assets or 0)
    documented_assets = int(aggregate_row.documented_assets or 0)
    implemented_assets = int(aggregate_row.implemented_assets or 0)
    tested_assets = int(aggregate_row.tested_assets or 0)

    documentation_percentage = _percentage(documented_assets, total_assets)
    implementation_percentage = _percentage(implemented_assets, total_assets)
    tested_percentage = _percentage(tested_assets, total_assets)
    health_score = _health_score(
        documentation_percentage,
        implementation_percentage,
        tested_percentage,
    )
    overall_percentage = round(
        (documentation_percentage + implementation_percentage + tested_percentage) / 3.0,
        2,
    )

    month_starts = _month_starts(5)
    start_date = month_starts[0]
    month_key = func.to_char(func.date_trunc("month", Asset.created_at), "YYYY-MM")
    month_start_key = func.date_trunc("month", Asset.created_at)

    monthly_rows = (
        db.query(
            month_key.label("month"),
            func.count(Asset.id).label("total_assets"),
            func.count(Asset.id).filter(documented_condition, clause_condition).label("documented_assets"),
            func.count(Asset.id).filter(implemented_condition).label("implemented_assets"),
            func.count(Asset.id).filter(tested_condition).label("tested_assets"),
        )
        .filter(
            Asset.organization_id == org_id,
            Asset.created_at >= start_date,
        )
        .group_by(month_start_key, month_key)
        .order_by(month_start_key)
        .all()
    )

    monthly_map = {
        row.month: row
        for row in monthly_rows
    }

    trend: list[DashboardTrendItem] = []
    for month_start in month_starts:
        key = month_start.strftime("%Y-%m")
        row = monthly_map.get(key)
        monthly_total = int(getattr(row, "total_assets", 0) or 0) if row else 0
        monthly_documented = int(getattr(row, "documented_assets", 0) or 0) if row else 0
        monthly_implemented = int(getattr(row, "implemented_assets", 0) or 0) if row else 0
        monthly_tested = int(getattr(row, "tested_assets", 0) or 0) if row else 0

        month_documentation = _percentage(monthly_documented, monthly_total)
        month_implementation = _percentage(monthly_implemented, monthly_total)
        month_tested = _percentage(monthly_tested, monthly_total)
        month_health_score = _health_score(
            month_documentation,
            month_implementation,
            month_tested,
        )
        month_overall = round(
            (month_documentation + month_implementation + month_tested) / 3.0,
            2,
        )

        trend.append(
            DashboardTrendItem(
                month=month_start.strftime("%b %Y"),
                documentation_percentage=month_documentation,
                implementation_percentage=month_implementation,
                tested_percentage=month_tested,
                overall_percentage=month_overall,
                health_score=month_health_score,
            )
        )

    total_users = int(
        db.query(func.count(User.id))
        .filter(User.organization_id == org_id)
        .scalar()
        or 0
    )
    active_users = int(
        db.query(func.count(User.id))
        .filter(User.organization_id == org_id, User.is_active.is_(True))
        .scalar()
        or 0
    )

    # include audit schedule info if present
    audit_record = (
        db.query(AuditSchedule)
        .filter(AuditSchedule.organization_id == org_id)
        .one_or_none()
    )

    return DashboardMetricsResponse(
        documentation_percentage=documentation_percentage,
        implementation_percentage=implementation_percentage,
        tested_percentage=tested_percentage,
        overall_percentage=overall_percentage,
        health_score=health_score,
        health_status=_health_status(health_score),
        total_assets=total_assets,
        total_users=total_users,
        active_users=active_users,
        last_audit_date=(audit_record.last_audit_date if audit_record else None),
        next_audit_date=(audit_record.next_audit_date if audit_record else None),
        trend=trend,
    )


def get_recent_activity(org_id, db: Session) -> list[DashboardActivityItem]:
    items: list[DashboardActivityItem] = []

    answer_rows = (
        db.query(AssessmentAnswer)
        .filter(AssessmentAnswer.organization_id == org_id)
        .order_by(AssessmentAnswer.updated_at.desc())
        .limit(4)
        .all()
    )
    for row in answer_rows:
        title = (
            f"Actualización de brecha {row.question.clause_ref or row.question.code}"
            if getattr(row, "question", None)
            else "Actualización de análisis de brechas"
        )
        items.append(_activity_item(str(row.id), title, "gap_analysis", row.updated_at))

    evidence_rows = (
        db.query(EvidenceTaxonomy)
        .filter(EvidenceTaxonomy.organization_id == org_id)
        .order_by(EvidenceTaxonomy.created_at.desc())
        .limit(4)
        .all()
    )
    for row in evidence_rows:
        title = f"Evidencia cargada para {row.control_id}"
        items.append(_activity_item(str(row.id), title, "evidence", row.created_at))

    capa_rows = (
        db.query(CAPA)
        .filter(CAPA.organization_id == org_id)
        .order_by(CAPA.updated_at.desc())
        .limit(4)
        .all()
    )
    for row in capa_rows:
        title = f"CAPA {row.title} actualizada"
        items.append(_activity_item(str(row.id), title, "capa", row.updated_at))

    review_rows = (
        db.query(DocumentReviewAction)
        .join(Document, DocumentReviewAction.document)
        .filter(Document.organization_id == org_id)
        .order_by(DocumentReviewAction.created_at.desc())
        .limit(4)
        .all()
    )
    for row in review_rows:
        title = f"Documento {row.document.title} {row.action.replace('_', ' ')}"
        items.append(_activity_item(str(row.id), title, "document", row.created_at))

    evaluation_rows = (
        db.query(RiskEvaluation)
        .filter(RiskEvaluation.organization_id == org_id)
        .order_by(RiskEvaluation.evaluated_at.desc())
        .limit(4)
        .all()
    )
    for row in evaluation_rows:
        title = f"Evaluación de riesgo {row.operation}"
        items.append(_activity_item(str(row.id), title, "risk", row.evaluated_at))

    items.sort(key=lambda item: item.time, reverse=True)
    return items[:6]


def get_upcoming_tasks(org_id, db: Session) -> list[DashboardUpcomingTaskItem]:
    tasks: list[DashboardUpcomingTaskItem] = []

    capa_rows = (
        db.query(CAPA)
        .filter(
            CAPA.organization_id == org_id,
            CAPA.status.in_([CAPAStatus.open, CAPAStatus.inProgress]),
            CAPA.due_date.isnot(None),
        )
        .order_by(CAPA.due_date.asc())
        .limit(4)
        .all()
    )
    for row in capa_rows:
        due = _due_bucket(row.due_date)
        tasks.append(
            DashboardUpcomingTaskItem(
                id=str(row.id),
                title=f"Revisar CAPA {row.title}",
                category="capa",
                priority=row.priority.value,
                due=due,
                due_date=row.due_date,
            )
        )

    evidence_rows = (
        db.query(EvidenceTaxonomy)
        .filter(
            EvidenceTaxonomy.organization_id == org_id,
            EvidenceTaxonomy.validity_days.isnot(None),
        )
        .order_by(EvidenceTaxonomy.created_at.desc())
        .limit(5)
        .all()
    )
    for row in evidence_rows:
        if row.freshness_status == "fresh":
            continue
        priority = "high" if row.freshness_status == "expired" else "medium"
        due = "today" if row.freshness_status == "expired" else "thisWeek"
        tasks.append(
            DashboardUpcomingTaskItem(
                id=str(row.id),
                title=f"Actualizar evidencia {row.control_id}",
                category="evidence",
                priority=priority,
                due=due,
                due_date=row.created_at.date(),
            )
        )

    document_rows = (
        db.query(Document)
        .filter(
            Document.organization_id == org_id,
            Document.status == DocumentStatus.pending_review,
        )
        .order_by(Document.updated_at.desc())
        .limit(4)
        .all()
    )
    for row in document_rows:
        tasks.append(
            DashboardUpcomingTaskItem(
                id=str(row.id),
                title=f"Revisar documento {row.title}",
                category="document",
                priority="medium",
                due="tomorrow",
                due_date=row.updated_at.date(),
            )
        )

    risk_rows = (
        db.query(Risk)
        .filter(Risk.organization_id == org_id)
        .order_by(Risk.updated_at.desc())
        .limit(4)
        .all()
    )
    for row in risk_rows:
        priority = _risk_task_priority(row.residual_risk_level)
        if priority == "low":
            continue
        tasks.append(
            DashboardUpcomingTaskItem(
                id=str(row.id),
                title=f"Actualizar tratamiento de riesgo {row.name}",
                category="risk",
                priority=priority,
                due="thisWeek",
                due_date=row.updated_at.date(),
            )
        )

    tasks.sort(
        key=lambda task: (_priority_weight(task.priority), _due_weight(task.due), task.due_date or date.max)
    )
    return tasks[:6]
