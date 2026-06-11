from __future__ import annotations

import asyncio
import json
import re
from datetime import datetime, timezone
from typing import Any

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.dependencies import get_current_user
from app.core.redis import get_redis_client
from app.db.database import get_db
from app.models.user import User
from app.schemas.chat import (
    ChatActionOption,
    ChatActionRequest,
    ChatHistoryItem,
    ChatRequest,
    ChatResponse,
)
from app.workers.document_tasks import JOB_KEY_PREFIX
from app.workers.gemini_service import _extract_text_from_deepseek

router = APIRouter(tags=["chat"])

CHAT_HISTORY_TTL = 60 * 60 * 24
CHAT_RATE_LIMIT = 20
CHAT_RATE_WINDOW_SECONDS = 60
CHAT_HISTORY_PREFIX = "chat_history:" 
CHAT_RATE_PREFIX = "chat_rate:"
DEFAULT_CONVERSATION_ID = "default"
ACTIONS_MARKER = "ACCIONES:"
SIMPLE_GREETINGS = {
    "hola",
    "hola que tal",
    "hola q tal",
    "como estas",
    "como estas",
    "buenos dias",
    "buen dia",
    "buenos días",
    "buen día",
    "buenas tardes",
    "buenas noches",
    "buenas",
    "saludos",
}


def _is_simple_greeting(message: str) -> bool:
    normalized = re.sub(r"[^\w\sáéíóúñü]", "", message.strip().lower())
    return normalized in SIMPLE_GREETINGS


def _build_chat_history_key(org_id: str, user_id: str, conversation_id: str) -> str:
    clean_conv = conversation_id.strip() if conversation_id else DEFAULT_CONVERSATION_ID
    return f"{CHAT_HISTORY_PREFIX}{org_id}:{user_id}:{clean_conv}"


def _build_chat_rate_key(org_id: str, user_id: str) -> str:
    return f"{CHAT_RATE_PREFIX}{org_id}:{user_id}"


USER_DOCUMENT_PREFIX = "document:doc:"


def _build_document_job_key(document_id: str) -> str:
    return f"{JOB_KEY_PREFIX}{document_id}"


def _build_user_document_key(document_id: str) -> str:
    return f"{USER_DOCUMENT_PREFIX}{document_id}"


def _build_document_storage_key(document_id: str) -> str:
    return _build_user_document_key(document_id)


async def _load_document_hash(document_id: str) -> tuple[str | None, dict[str, str] | None]:
    redis_client = get_redis_client()
    user_key = _build_user_document_key(document_id)
    raw = await redis_client.hgetall(user_key)
    if raw:
        return user_key, raw

    job_key = _build_document_job_key(document_id)
    raw = await redis_client.hgetall(job_key)
    if raw:
        return job_key, raw

    return None, None


async def _enforce_rate_limit(org_id: str, user_id: str) -> None:
    redis_client = get_redis_client()
    rate_key = _build_chat_rate_key(org_id, user_id)
    current = await redis_client.incr(rate_key)
    if current == 1:
        await redis_client.expire(rate_key, CHAT_RATE_WINDOW_SECONDS)

    if current > CHAT_RATE_LIMIT:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Límite de chat alcanzado. Máximo {CHAT_RATE_LIMIT} mensajes por minuto.",
        )


async def _append_chat_message(
    org_id: str,
    user_id: str,
    conversation_id: str,
    role: str,
    content: str,
) -> None:
    redis_client = get_redis_client()
    history_key = _build_chat_history_key(org_id, user_id, conversation_id)
    message = json.dumps({
        "role": role,
        "content": content,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }, ensure_ascii=False)
    await redis_client.rpush(history_key, message)
    await redis_client.ltrim(history_key, -10, -1)
    await redis_client.expire(history_key, CHAT_HISTORY_TTL)


async def _load_chat_history(org_id: str, user_id: str, conversation_id: str) -> list[ChatHistoryItem]:
    redis_client = get_redis_client()
    history_key = _build_chat_history_key(org_id, user_id, conversation_id)
    raw_items = await redis_client.lrange(history_key, 0, -1)
    items: list[ChatHistoryItem] = []
    for raw in raw_items:
        try:
            payload = json.loads(raw)
            items.append(
                ChatHistoryItem(
                    role=payload.get("role", "assistant"),
                    content=payload.get("content", ""),
                    timestamp=datetime.fromisoformat(payload.get("timestamp")) if payload.get("timestamp") else datetime.now(timezone.utc),
                )
            )
        except (ValueError, TypeError):
            continue
    return items


async def _load_iso_contexts(db: Session, message: str) -> list[dict[str, str]]:
    if not message.strip():
        return []

    search_expr = f"%{message.strip()}%"
    rows = db.execute(
        text(
            """
            SELECT clause_ref, title, content
            FROM iso_27001_chunks
            WHERE content ILIKE :q OR clause_ref ILIKE :q OR title ILIKE :q
            LIMIT 5
            """
        ),
        {"q": search_expr},
    ).fetchall()

    if not rows:
        rows = db.execute(
            text(
                """
                SELECT clause_ref, title, content
                FROM iso_27001_chunks
                ORDER BY clause_ref
                LIMIT 5
                """
            )
        ).fetchall()

    return [
        {
            "clause_ref": str(row[0] or ""),
            "title": str(row[1] or ""),
            "content": str(row[2] or ""),
        }
        for row in rows
    ]


async def _load_document_text(document_id: str, current_user: User) -> str | None:
    storage_key, raw = await _load_document_hash(document_id)
    if not raw:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Documento no encontrado")

    org_id = raw.get("organization_id")
    if not org_id or str(org_id) != str(current_user.organization_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Documento fuera de alcance")

    return raw.get("document_text")


def _extract_citations(text: str) -> list[str]:
    found = re.findall(r"\[([A-Za-z0-9\.\-]+)\]", text)
    unique = []
    for citation in found:
        if citation not in unique:
            unique.append(citation)
    return unique


def _extract_action_options(answer: str) -> tuple[str, list[dict[str, str]]]:
    if ACTIONS_MARKER not in answer:
        return answer, []

    before, after = answer.split(ACTIONS_MARKER, 1)
    raw = after.strip()
    try:
        payload = json.loads(raw)
    except ValueError:
        return before.strip(), []

    actions: list[dict[str, str]] = []
    if isinstance(payload, list):
        for item in payload:
            if not isinstance(item, dict) or not item.get("label"):
                continue
            actions.append({
                "label": str(item.get("label", "")),
                "description": str(item.get("description", "")).strip() if item.get("description") else "",
                "command": str(item.get("command", "")).strip() if item.get("command") else "",
            })

    return before.strip(), actions


async def _call_deepseek_chat(system_prompt: str, user_prompt: str) -> str:
    if not settings.deepseek_api_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="DeepSeek no está configurado en el servidor",
        )

    url = f"{settings.deepseek_base_url.rstrip('/')}/chat/completions"
    payload = {
        "model": settings.deepseek_model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "temperature": 0.1,
        "top_p": 0.8,
        "max_tokens": 1200,
    }

    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            url,
            json=payload,
            headers={"Authorization": f"Bearer {settings.deepseek_api_key}"},
        )
        response.raise_for_status()
        data = response.json()

    return _extract_text_from_deepseek(data)


def _build_system_prompt() -> str:
    return (
        "Eres un asistente profesional y conciso especializado en ISO 27001 y en generación de documentos de cumplimiento. "
        "Responde en español con un tono formal, directo y fácil de leer. "
        "Si la pregunta es breve o general, responde en una o dos oraciones, sin entrar en explicaciones extensas. "
        "Siempre cita referencias ISO concretas entre corchetes, por ejemplo [A.5.1], cuando sean relevantes. "
        "No uses datos de otros tenants ni inventes información de fuentes externas. "
        "Solo sugiere acciones si son claramente útiles para la consulta. "
        "Si generas acciones, limítalas a un máximo de 3 y usa la etiqueta ACCIONES con un JSON válido. "
        "Cada opción puede incluir un campo `command` con un valor corto ejecutable además del `label` y `description`. "
        "Por ejemplo:\nACCIONES:\n[{\"label\": \"Validar controles\", \"description\": \"Revisar los controles mencionados según ISO 27001.\", \"command\": \"validar_documento\"}]"
    )


def _build_user_prompt(message: str, document_text: str | None, iso_contexts: list[dict[str, str]]) -> str:
    document_block = ""
    if document_text:
        document_block = f"DOCUMENTO ACTUAL:\n{document_text[:15000]}\n\n"

    if iso_contexts:
        iso_block = "\n\n".join(
            f"[{ctx['clause_ref']}] {ctx['title']}: {ctx['content']}"
            for ctx in iso_contexts
        )
    else:
        iso_block = "Consulta la norma ISO 27001 y cita secciones específicas siempre que sea posible."

    return (
        f"{document_block}NORMA ISO 27001:\n{iso_block}\n\n"
        f"Pregunta del usuario:\n{message}\n\n"
        "Instrucciones:\n"
        "- Contesta en español.\n"
        "- Relaciona la respuesta con el documento actual cuando exista.\n"
        "- Cita las referencias ISO concretas como [A.5.1] o [A.8.2].\n"
        "- Si no hay documento disponible, responde como asistente ISO.\n"
        "- Evita cualquier contenido de otros tenants."
    )


async def _generate_chat_response(
    message: str,
    current_user: User,
    db: Session,
    document_id: str | None = None,
) -> tuple[str, list[str], str | None, list[dict[str, str]]]:
    if _is_simple_greeting(message):
        return (
            "Hola, soy Dani, tu asistente profesional de cumplimiento ISO 27001. ¿En qué puedo ayudarte?",
            [],
            document_id,
            [],
        )

    iso_contexts = await _load_iso_contexts(db, message)
    document_text = None
    if document_id:
        document_text = await _load_document_text(document_id, current_user)

    system_prompt = _build_system_prompt()
    user_prompt = _build_user_prompt(message, document_text, iso_contexts)
    raw_answer = await _call_deepseek_chat(system_prompt, user_prompt)
    answer, action_options = _extract_action_options(raw_answer)
    citations = _extract_citations(answer)
    return answer, citations, document_id, action_options


def _normalize_action_command(command: str | None) -> str:
    if not command:
        return ""
    normalized = re.sub(r"[^\w\sáéíóúñü]", "", command.lower()).strip()
    return normalized


async def _store_document_action_state(
    document_id: str,
    current_user: User,
    key: str,
    value: str,
) -> None:
    redis_client = get_redis_client()
    storage_key, raw = await _load_document_hash(document_id)
    if not raw or not storage_key:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Documento no encontrado")

    org_id = raw.get("organization_id")
    if not org_id or str(org_id) != str(current_user.organization_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Documento fuera de alcance")

    await redis_client.hset(storage_key, {key: value})


def _build_validation_prompt(document_text: str, iso_contexts: list[dict[str, str]]) -> str:
    document_block = f"DOCUMENTO ACTUAL:\n{document_text[:15000]}\n\n"
    iso_block = "\n\n".join(
        f"[{ctx['clause_ref']}] {ctx['title']}: {ctx['content']}"
        for ctx in iso_contexts
    ) or "Consulta la norma ISO 27001 y cita secciones específicas siempre que sea posible."

    return (
        f"{document_block}NORMA ISO 27001:\n{iso_block}\n\n"
        "Valida este documento frente a los requisitos de ISO 27001. Describe las brechas, riesgos o controles incompletos, "
        "presenta un breve puntaje de confianza y sugiere los siguientes pasos. Responde en español con un tono profesional y conciso. "
        "Incluye referencias ISO concretas entre corchetes, y si es pertinente, termina con una sección ACCIONES con opciones JSON."
    )


async def _execute_document_validation(
    document_id: str,
    current_user: User,
    db: Session,
) -> tuple[str, list[str], str | None, list[dict[str, str]]]:
    document_text = await _load_document_text(document_id, current_user)
    iso_contexts = await _load_iso_contexts(db, "validar documento")
    system_prompt = _build_system_prompt()
    user_prompt = _build_validation_prompt(document_text, iso_contexts)
    raw_answer = await _call_deepseek_chat(system_prompt, user_prompt)
    answer, action_options = _extract_action_options(raw_answer)
    citations = _extract_citations(answer)
    await _store_document_action_state(document_id, current_user, "last_validation_action", "requested")
    return answer, citations, document_id, action_options


async def _execute_chat_action(
    document_id: str,
    action: ChatActionOption,
    current_user: User,
    db: Session,
) -> tuple[str, list[str], str | None, list[dict[str, str]]]:
    command = _normalize_action_command(action.command or action.label)

    if any(keyword in command for keyword in ["validar", "validacion", "validation"]):
        return await _execute_document_validation(document_id, current_user, db)

    if any(keyword in command for keyword in ["hallazgo", "revisar", "review", "analiz", "auditar"]):
        return await _generate_chat_response(
            "Revisa los hallazgos del documento actual y presenta un resumen claro de las brechas y acciones necesarias.",
            current_user,
            db,
            document_id=document_id,
        )

    if any(keyword in command for keyword in ["editar", "mejorar", "corregir", "ajustar", "proponer cambios"]):
        return await _generate_chat_response(
            "Propón mejoras concretas para el documento actual, indicando qué contenido cambiar o ampliar para alinearlo mejor con ISO 27001.",
            current_user,
            db,
            document_id=document_id,
        )

    return await _generate_chat_response(action.label, current_user, db, document_id=document_id)


@router.post("/chat", response_model=ChatResponse)
async def chat_general(
    payload: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conversation_id = payload.conversation_id or DEFAULT_CONVERSATION_ID
    await _enforce_rate_limit(str(current_user.organization_id), str(current_user.id))
    answer, citations, document_id, action_options = await _generate_chat_response(
        payload.message,
        current_user,
        db,
        document_id=None if payload.mode == "iso" else None,
    )

    await _append_chat_message(
        str(current_user.organization_id),
        str(current_user.id),
        conversation_id,
        "user",
        payload.message,
    )
    await _append_chat_message(
        str(current_user.organization_id),
        str(current_user.id),
        conversation_id,
        "assistant",
        answer,
    )

    return ChatResponse(
        message=answer,
        conversationId=conversation_id,
        citations=citations,
        documentId=document_id,
        actionOptions=action_options,
    )


@router.get("/chat/history", response_model=list[ChatHistoryItem])
async def chat_history(
    conversation_id: str | None = Query(None, alias="conversationId"),
    current_user: User = Depends(get_current_user),
):
    history = await _load_chat_history(
        str(current_user.organization_id),
        str(current_user.id),
        conversation_id or DEFAULT_CONVERSATION_ID,
    )
    return history


@router.post("/documents/{document_id}/chat")
async def chat_document_stream(
    document_id: str,
    payload: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conversation_id = payload.conversation_id or DEFAULT_CONVERSATION_ID
    await _enforce_rate_limit(str(current_user.organization_id), str(current_user.id))

    document_id_to_use = document_id if payload.mode != 'iso' else None
    answer, citations, _, action_options = await _generate_chat_response(
        payload.message,
        current_user,
        db,
        document_id=document_id_to_use,
    )

    await _append_chat_message(
        str(current_user.organization_id),
        str(current_user.id),
        conversation_id,
        "user",
        payload.message,
    )
    await _append_chat_message(
        str(current_user.organization_id),
        str(current_user.id),
        conversation_id,
        "assistant",
        answer,
    )

    async def event_generator():
        chunk_size = 80
        for index in range(0, len(answer), chunk_size):
            chunk = answer[index : index + chunk_size]
            event_data = json.dumps({"delta": chunk}, ensure_ascii=False)
            yield f"event: message\ndata: {event_data}\n\n"
            await asyncio.sleep(0.02)
        yield f"event: done\ndata: {json.dumps({'conversationId': conversation_id, 'citations': citations, 'actionOptions': action_options}, ensure_ascii=False)}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")


@router.post("/documents/{document_id}/chat/action", response_model=ChatResponse)
async def chat_document_action(
    document_id: str,
    payload: ChatActionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conversation_id = payload.conversation_id or DEFAULT_CONVERSATION_ID
    await _enforce_rate_limit(str(current_user.organization_id), str(current_user.id))

    answer, citations, document_id_used, action_options = await _execute_chat_action(
        document_id,
        payload.action,
        current_user,
        db,
    )

    await _append_chat_message(
        str(current_user.organization_id),
        str(current_user.id),
        conversation_id,
        "user",
        payload.action.label,
    )
    await _append_chat_message(
        str(current_user.organization_id),
        str(current_user.id),
        conversation_id,
        "assistant",
        answer,
    )

    return ChatResponse(
        message=answer,
        conversationId=conversation_id,
        citations=citations,
        documentId=document_id_used,
        actionOptions=action_options,
    )
