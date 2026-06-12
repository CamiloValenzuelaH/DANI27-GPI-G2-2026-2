from __future__ import annotations

from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field
from pydantic import ConfigDict


class DocumentGenerationRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    title: str = Field(min_length=5)
    description: str | None = None
    target_audience: str | None = None
    language: str = Field(default="es")
    tone: str | None = Field(default="formal")
    sections: list[str] | None = None
    control_refs: list[str] | None = None
    control_ids: list[str] | None = Field(default=None, alias="controlIds")


class DocumentGenerationJobResponse(BaseModel):
    job_id: str
    status: str
    stream_url: str


class DocumentUploadResponse(BaseModel):
    document_id: str = Field(alias="documentId")
    title: str
    description: str | None = None
    message: str | None = None


class DocumentMetadata(BaseModel):
    document_id: str = Field(alias="documentId")
    title: str
    description: str | None = None
    created_at: datetime | None = None


class DocumentDetailResponse(DocumentMetadata):
    documentText: str | None = None


class DocumentSectionProgress(BaseModel):
    title: str
    index: int
    status: str
    attempts: int


class DocumentGenerationProgressResponse(BaseModel):
    job_id: str
    status: str
    progress: int = Field(ge=0, le=100)
    message: str | None = None
    organization_id: UUID | None = None
    user_id: UUID | None = None
    document_title: str | None = None
    total_sections: int = 0
    completed_sections: int = 0
    current_section_index: int = 0
    current_section_title: str | None = None
    current_attempt: int = 0
    last_event: str | None = None
    last_event_data: dict[str, Any] | None = None
    document_text: str | None = None
    sections: list[dict[str, Any]] = Field(default_factory=list)
    created_at: datetime | None = None
    updated_at: datetime | None = None
