from __future__ import annotations

from datetime import datetime, timedelta, timezone

from sqlalchemy import case, exists, func, select
from sqlalchemy.orm import Session

from app.models.asset import Asset
from app.models.user import User
from app.schemas.dashboard import DashboardMetricsResponse, DashboardTrendItem


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
        trend=trend,
    )
