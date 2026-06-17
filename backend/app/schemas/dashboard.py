<<<<<<< HEAD
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
    trend: list[DashboardTrendItem]
=======
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
    trend: list[DashboardTrendItem]
>>>>>>> Chat-bot
