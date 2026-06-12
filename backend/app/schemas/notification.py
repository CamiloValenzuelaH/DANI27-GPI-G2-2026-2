from __future__ import annotations

from enum import Enum
from typing import Any
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel


class NotificationType(str, Enum):
    evidence_expired = "evidence_expired"
    capa_overdue = "capa_overdue"
    approval_required = "approval_required"
    document_published = "document_published"


class NotificationChannel(str, Enum):
    in_app = "in_app"
    email = "email"
    sms = "sms"


class NotificationResponse(BaseModel):
    id: UUID
    notification_type: NotificationType
    channel: NotificationChannel
    title: str
    body: str | None = None
    is_read: bool
    read_at: datetime | None = None
    created_at: datetime
    payload: Any | None = None

    model_config = {"from_attributes": True}


class NotificationPreferenceResponse(BaseModel):
    id: UUID
    notification_type: NotificationType
    channel: NotificationChannel
    enabled: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class NotificationPreferenceUpdateRequest(BaseModel):
    notification_type: NotificationType
    channel: NotificationChannel
    enabled: bool
