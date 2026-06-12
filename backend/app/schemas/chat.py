from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class ChatRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    message: str
    conversation_id: str | None = Field(default=None, alias="conversationId")
    mode: Literal["document", "iso", "both"] = "iso"
    language: Literal["es", "en", "pt", "de", "fr", "it"] = Field(default="es", alias="language")


class ChatActionOption(BaseModel):
    label: str
    description: str | None = None
    command: str | None = None


class ChatResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    message: str
    conversation_id: str = Field(alias="conversationId")
    citations: list[str] = Field(default_factory=list)
    document_id: str | None = Field(default=None, alias="documentId")
    action_options: list[ChatActionOption] = Field(default_factory=list, alias="actionOptions")


class ChatActionRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    action: ChatActionOption
    conversation_id: str | None = Field(default=None, alias="conversationId")
    mode: Literal["document", "iso", "both"] = "document"


class ChatHistoryItem(BaseModel):
    role: Literal["user", "assistant"]
    content: str
    timestamp: datetime
