from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class AuditRoomFolderResponse(BaseModel):
    id: str
    label: str
    control_ref_prefix: str
    item_count: int


class AuditRoomEvidenceItem(BaseModel):
    id: str
    name: str
    type: str
    control_id: str
    clause_ref: str
    organization_id: str
    question_id: Optional[str] = None
    answer_id: Optional[str] = None
    validity_days: Optional[int] = None
    freshness_status: str
    created_at: Optional[datetime] = None


class AuditRoomSearchRequest(BaseModel):
    query: str = Field(min_length=1)


class AuditRoomSearchResult(BaseModel):
    id: str
    clause_ref: Optional[str] = None
    title: Optional[str] = None
    content: Optional[str] = None
    relevance_score: float


class AuditRoomSearchResponse(BaseModel):
    query: str
    results: List[AuditRoomSearchResult]


class AuditRoomBinderRequest(BaseModel):
    title: str = Field(min_length=3)
    description: Optional[str] = None
    selected_evidence_ids: List[str] = Field(min_items=1)


class AuditRoomBinderResponse(BaseModel):
    job_id: str
    status_url: str


class AuditRoomBinderStatusResponse(BaseModel):
    job_id: str
    status: str
    progress: int
    message: Optional[str] = None
    download_url: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
