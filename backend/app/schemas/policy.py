from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class PolicyBase(BaseModel):
    id: str
    title: str
    summary: str | None = None
    content: str
    status: Literal["draft", "published", "archived"]
    document_version: str
    mandatory: bool
    published_at: datetime | None = None


class PolicyOut(PolicyBase):
    acknowledged: bool | None = None


class PolicyAcknowledgeRequest(BaseModel):
    document_version: str = Field(..., min_length=1)


class PolicyAcknowledgmentOut(BaseModel):
    id: str
    policy_id: str
    user_id: str
    acknowledged_at: datetime
    ip_address: str | None = None
    document_version: str
    content_hash: str


class PolicyComplianceReportItem(BaseModel):
    policy_id: str
    title: str
    document_version: str
    mandatory: bool
    accepted_count: int
    total_users: int
    compliance_percent: float
