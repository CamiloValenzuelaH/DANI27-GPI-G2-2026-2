from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field, ConfigDict, root_validator

ReportTemplate = Literal["soa", "risk_register", "audit_report", "gap_analysis"]
ReportFormat = Literal["pdf", "xlsx", "docx", "csv"]


class ReportBranding(BaseModel):
    logo_url: str | None = None
    primary_color: str | None = None
    accent_color: str | None = None


class ReportGenerateRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    title: str = Field(min_length=5)
    description: str | None = None
    template: ReportTemplate | None = None
    type: ReportTemplate | None = Field(default=None, alias="type")
    format: ReportFormat
    branding: ReportBranding | None = None

    @root_validator(pre=True)
    def normalize_type_alias(cls, values: dict[str, Any]) -> dict[str, Any]:
        if values.get("type") and not values.get("template"):
            values["template"] = values["type"]
        return values


class ReportJobResponse(BaseModel):
    job_id: str
    status: str
    status_url: str


class ReportStatusResponse(BaseModel):
    job_id: str
    status: str
    progress: int
    message: str | None = None
    report_title: str | None = None
    report_template: ReportTemplate | None = None
    report_format: ReportFormat | None = None
    download_url: str | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None
    created_date: str | None = None


class ReportTemplateResponse(BaseModel):
    id: ReportTemplate
    name: str
    description: str


class ReportTemplatesResponse(BaseModel):
    templates: list[ReportTemplateResponse]
