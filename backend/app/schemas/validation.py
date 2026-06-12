from __future__ import annotations

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field


SeverityLevel = Literal["critical", "major", "minor"]
JobState = Literal["queued", "processing", "completed", "failed"]
DocumentStatus = Literal["COMPLETO", "INCOMPLETO", "INEXISTENTE"]


class ValidationJobResponse(BaseModel):
    job_id: str
    status: JobState
    stream_url: str


class ValidationObservation(BaseModel):
    severity: SeverityLevel
    text: str


class ChunkValidationResult(BaseModel):
    clause_ref: str
    title: str
    relevance_score: float | None = None
    compliance_score: int = Field(ge=0, le=100)
    document_status: DocumentStatus = "INCOMPLETO"
    missing_elements: list[str] = Field(default_factory=list)
    observations: list[ValidationObservation] = Field(default_factory=list)
    suggestions: list[str] = Field(default_factory=list)


class ValidationReportResponse(BaseModel):
    job_id: str
    status: JobState
    progress: int = Field(ge=0, le=100)
    message: str | None = None
    organization_id: UUID | None = None
    user_id: UUID | None = None
    file_name: str | None = None
    file_path: str | None = None
    total_chunks: int = 0
    overall_score: int | None = None
    findings: list[ChunkValidationResult] = Field(default_factory=list)
    summary: str | None = None
    error: str | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None


class ValidationSSEEnvelope(BaseModel):
    event: str
    data: ValidationReportResponse


class GenerateMissingRequest(BaseModel):
    chunk_id: str = Field(min_length=1)


class GenerateMissingResponse(BaseModel):
    job_id: str
    chunk_id: str
    generated_text: str
    validation_passed: bool
    validation_score: int = Field(ge=0, le=100)
    iterations: int = Field(ge=1, le=3)
    validation_feedback: str | None = None
