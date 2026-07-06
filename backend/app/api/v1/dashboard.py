from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_org
from app.db.database import get_db
from app.models.organization import Organization
from app.schemas.dashboard import (
    DashboardActivityItem,
    DashboardMetricsResponse,
    DashboardUpcomingTaskItem,
)
from app.services import dashboard_service

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/metrics", response_model=DashboardMetricsResponse)
def get_metrics(
    db: Session = Depends(get_db),
    org: Organization = Depends(get_current_org),
):
    return dashboard_service.get_metrics(org.id, db)


@router.get("/recent-activity", response_model=list[DashboardActivityItem])
def get_recent_activity(
    db: Session = Depends(get_db),
    org: Organization = Depends(get_current_org),
):
    return dashboard_service.get_recent_activity(org.id, db)


@router.get("/upcoming-tasks", response_model=list[DashboardUpcomingTaskItem])
def get_upcoming_tasks(
    db: Session = Depends(get_db),
    org: Organization = Depends(get_current_org),
):
    return dashboard_service.get_upcoming_tasks(org.id, db)
