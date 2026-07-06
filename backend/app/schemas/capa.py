from __future__ import annotations

from datetime import date, datetime
from enum import Enum
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, field_validator


class CAPAStatus(str, Enum):
    open = "open"
    inProgress = "inProgress"
    resolved = "resolved"
    closed = "closed"


class CAPAPriority(str, Enum):
    critical = "critical"
    high = "high"
    medium = "medium"
    low = "low"


class CAPASource(str, Enum):
    internal_audit = "internal_audit"
    external_audit = "external_audit"
    incident = "incident"
    management_review = "management_review"


class CreateCAPARequest(BaseModel):
    title: str
    description: Optional[str] = None
    status: Optional[CAPAStatus] = CAPAStatus.open
    priority: CAPAPriority
    source: CAPASource
    due_date: Optional[date] = None
    progress: Optional[int] = 0
    assigned_to: Optional[UUID] = None
    control_id: Optional[str] = None

    @field_validator("progress")
    @classmethod
    def validate_progress(cls, value: Optional[int]) -> Optional[int]:
        if value is None:
            return value
        if not 0 <= value <= 100:
            raise ValueError("progress debe estar entre 0 y 100")
        return value


class UpdateCAPARequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[CAPAStatus] = None
    priority: Optional[CAPAPriority] = None
    source: Optional[CAPASource] = None
    due_date: Optional[date] = None
    progress: Optional[int] = None
    assigned_to: Optional[UUID] = None
    control_id: Optional[str] = None

    @field_validator("progress")
    @classmethod
    def validate_progress(cls, value: Optional[int]) -> Optional[int]:
        if value is None:
            return value
        if not 0 <= value <= 100:
            raise ValueError("progress debe estar entre 0 y 100")
        return value


class UpdateCAPAStatusRequest(BaseModel):
    status: CAPAStatus


class UpdateCAPAProgressRequest(BaseModel):
    progress: int

    @field_validator("progress")
    @classmethod
    def validate_progress(cls, value: int) -> int:
        if not 0 <= value <= 100:
            raise ValueError("progress debe estar entre 0 y 100")
        return value


class CAPAResponse(BaseModel):
    id: UUID
    organization_id: UUID
    title: str
    description: Optional[str]
    status: CAPAStatus
    priority: CAPAPriority
    source: CAPASource
    due_date: Optional[date]
    progress: int
    assigned_to: Optional[UUID]
    control_id: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class CAPASummaryResponse(BaseModel):
    total: int
    by_status: dict[CAPAStatus, int]
    by_priority: dict[CAPAPriority, int]
    overdue_count: int

    model_config = {"from_attributes": True}
