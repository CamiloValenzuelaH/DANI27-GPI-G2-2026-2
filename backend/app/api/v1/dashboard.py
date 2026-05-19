from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_org
from app.db.database import get_db
from app.models.organization import Organization
from app.schemas.dashboard import DashboardMetricsResponse
from app.services import dashboard_service

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/metrics", response_model=DashboardMetricsResponse)
def get_metrics(
    db: Session = Depends(get_db),
    org: Organization = Depends(get_current_org),
):
    return dashboard_service.get_metrics(org.id, db)
