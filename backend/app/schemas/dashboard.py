from datetime import date, datetime

from pydantic import BaseModel


class DashboardTrendItem(BaseModel):
    month: str
    documentation_percentage: float
    implementation_percentage: float
    tested_percentage: float
    overall_percentage: float
    health_score: float


class DashboardMetricsResponse(BaseModel):
    documentation_percentage: float
    implementation_percentage: float
    tested_percentage: float
    overall_percentage: float
    health_score: float
    health_status: str
    total_assets: int
    total_users: int
    active_users: int
    last_audit_date: datetime | None = None
    next_audit_date: datetime | None = None
    trend: list[DashboardTrendItem]


class DashboardActivityItem(BaseModel):
    id: str
    title: str
    category: str
    time: datetime


class DashboardUpcomingTaskItem(BaseModel):
    id: str
    title: str
    category: str
    priority: str
    due: str
    due_date: date | None = None
