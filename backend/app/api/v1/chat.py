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

ISO_27001_CONTROL_DEFINITIONS: dict[str, tuple[str, str]] = {
    "A.5.1": ("Políticas de seguridad de la información", "establecimiento y revisión de políticas de seguridad de la información."),
    "A.5.2": ("Roles y responsabilidades de seguridad de la información", "definición de roles y responsabilidades de seguridad de la información."),
    "A.5.3": ("Segregación de funciones", "separación de tareas clave para reducir riesgos y conflictos de interés."),
    "A.5.4": ("Responsabilidades de la dirección", "asignación de responsabilidades de dirección para el SGSI."),
    "A.5.5": ("Contacto con autoridades", "gestión de comunicaciones con autoridades en temas de seguridad de la información."),
    "A.5.6": ("Contacto con grupos de interés especial", "gestión de comunicaciones con grupos de interés especializados."),
    "A.5.7": ("Inteligencia de amenazas", "obtención y uso de información sobre amenazas relevantes para la organización."),
    "A.5.8": ("Seguridad de la información en la gestión de proyectos", "incorporación de requisitos de seguridad durante el ciclo de vida de proyectos."),
    "A.5.9": ("Inventario de información y otros activos asociados", "catalogación de información y activos críticos para su protección."),
    "A.5.10": ("Uso aceptable de información y activos asociados", "definición de comportamientos permitidos para el uso de información y activos."),
    "A.5.11": ("Devolución de activos", "procedimientos para recuperar activos cuando finaliza la relación con el usuario."),
    "A.5.12": ("Clasificación de la información", "etiquetado y categorización de información según su valor y sensibilidad."),
    "A.5.13": ("Etiquetado de la información", "marcado de la información para indicar su manejo y protección."),
    "A.5.14": ("Transferencia de información", "protección de información durante su transferencia entre partes."),
    "A.5.15": ("Control de acceso", "gestión de accesos basada en necesidades y privilegios mínimos."),
    "A.5.16": ("Gestión de identidades", "administración de identidades digitales y su ciclo de vida."),
    "A.5.17": ("Información de autenticación", "gestión de credenciales y datos de autenticación para el acceso seguro."),
    "A.5.18": ("Derechos de acceso", "definición y revisión de derechos de acceso de usuarios y sistemas."),
    "A.5.19": ("Seguridad de la información en las relaciones con proveedores", "gestión de requisitos de seguridad con proveedores y terceros."),
    "A.5.20": ("Seguridad de la información en acuerdos con proveedores", "definición de seguridad en contratos y acuerdos con proveedores."),
    "A.5.21": ("Gestión de la seguridad de la información en la cadena de suministro TIC", "protección de servicios y suministros de TI a lo largo de la cadena."),
    "A.5.22": ("Supervisión, revisión y gestión de cambios de servicios de proveedores", "control y revisión de cambios en los servicios de proveedores."),
    "A.5.23": ("Seguridad de la información para el uso de servicios en la nube", "gestión de seguridad de datos y servicios alojados en la nube."),
    "A.5.24": ("Planificación y preparación para la gestión de incidentes de seguridad de la información", "preparación y coordinación de la respuesta a incidentes de seguridad de la información."),
    "A.5.25": ("Evaluación y decisión sobre eventos de seguridad de la información", "evaluación y toma de decisiones sobre eventos de seguridad."),
    "A.5.26": ("Respuesta a incidentes de seguridad de la información", "gestión de la respuesta a incidentes de seguridad de la información."),
    "A.5.27": ("Aprendizaje de incidentes de seguridad de la información", "lecciones aprendidas y mejoras tras incidentes de seguridad."),
    "A.5.28": ("Recolección de evidencia", "recopilación de pruebas relevantes durante incidentes o auditorías."),
    "A.5.29": ("Seguridad de la información durante una interrupción", "protección de información cuando hay interrupciones operativas."),
    "A.5.30": ("Preparación TIC para la continuidad del negocio", "aseguramiento de capacidad tecnológica para mantener el negocio."),
    "A.5.31": ("Requisitos legales, regulatorios, contractuales y estatutarios", "alineación con obligaciones legales y regulatorias aplicables."),
    "A.5.32": ("Derechos de propiedad intelectual", "protección de la propiedad intelectual de la organización."),
    "A.5.33": ("Protección de registros", "preservación y custodia de registros de seguridad."),
    "A.5.34": ("Privacidad y protección de datos personales", "protección de datos personales y privacidad de la información."),
    "A.5.35": ("Revisión independiente de la seguridad de la información", "evaluaciones externas o independientes de seguridad de la información."),
    "A.5.36": ("Cumplimiento con políticas, reglas y normas de seguridad de la información", "verificación del cumplimiento con políticas, normas y regulaciones."),
    "A.5.37": ("Procedimientos operativos documentados", "documentación de procedimientos operativos para asegurar consistencia y control."),
    "A.6.1": ("Verificación de antecedentes", "comprobación de antecedentes antes de asignar responsabilidades de seguridad."),
    "A.6.2": ("Términos y condiciones de empleo", "inclusión de requisitos de seguridad en contratos y condiciones de empleo."),
    "A.6.3": ("Concienciación, educación y formación en seguridad de la información", "formación continua en seguridad para el personal."),
    "A.6.4": ("Proceso disciplinario", "acciones disciplinarias por violaciones de seguridad de la información."),
    "A.6.5": ("Responsabilidades después de la terminación o cambio de empleo", "gestión de obligaciones de seguridad tras cambios de empleo."),
    "A.6.6": ("Acuerdos de confidencialidad o no divulgación", "protección de secretos y datos sensibles mediante acuerdos."),
    "A.6.7": ("Trabajo remoto", "seguridad de la información para actividades de trabajo remoto."),
    "A.6.8": ("Notificación de eventos de seguridad de la información", "notificación oportuna de incidentes y eventos de seguridad."),
    "A.7.1": ("Perímetros de seguridad física", "definición de perímetros físicos seguros para instalaciones."),
    "A.7.2": ("Controles de entrada física", "control y registro de accesos físicos a instalaciones seguras."),
    "A.7.3": ("Seguridad de oficinas, salas e instalaciones", "protección física de oficinas, salas e instalaciones."),
    "A.7.4": ("Monitoreo de seguridad física", "supervisión y detección en controles físicos de seguridad."),
    "A.7.5": ("Protección contra amenazas físicas y ambientales", "protección contra riesgos físicos y ambientales."),
    "A.7.6": ("Trabajo en áreas seguras", "restricción de acceso y condiciones de trabajo en áreas seguras."),
    "A.7.7": ("Escritorio limpio y pantalla limpia", "políticas de espacio de trabajo limpio y protección de pantallas."),
    "A.7.8": ("Ubicación y protección de equipos", "ubicación segura y protección de equipos de información."),
    "A.7.9": ("Seguridad de activos fuera de las instalaciones", "protección de activos cuando se usan fuera de instalaciones corporativas."),
    "A.7.10": ("Medios de almacenamiento", "gestión segura de medios físicos y electrónicos de almacenamiento."),
    "A.7.11": ("Servicios de soporte", "seguridad de los servicios de soporte físico y de infraestructura."),
    "A.7.12": ("Seguridad del cableado", "protección de cableado y conexiones físicas de redes."),
    "A.7.13": ("Mantenimiento de equipos", "mantenimiento seguro y controlado de equipos."),
    "A.7.14": ("Disposición segura o reutilización de equipos", "borrado seguro y disposición de equipos al final de su vida útil."),
    "A.8.1": ("Dispositivos de usuario final", "seguridad de dispositivos utilizados por el personal."),
    "A.8.2": ("Derechos de acceso privilegiado", "gestión de privilegios de administración y acceso elevado."),
    "A.8.3": ("Restricción de acceso a la información", "control de acceso a la información según necesidad de negocio."),
    "A.8.4": ("Acceso al código fuente", "protección del acceso a repositorios y código fuente."),
    "A.8.5": ("Autenticación segura", "mecanismos seguros de verificación de identidad para el acceso a sistemas."),
    "A.8.6": ("Gestión de capacidad", "garantía de capacidad adecuada para mantener servicios y seguridad."),
    "A.8.7": ("Protección contra malware", "defensa contra software malicioso en sistemas e infraestructuras."),
    "A.8.8": ("Gestión de vulnerabilidades técnicas", "detección y corrección de vulnerabilidades técnicas."),
    "A.8.9": ("Gestión de configuración", "control y protección de configuraciones de sistemas."),
    "A.8.10": ("Eliminación de información", "eliminación segura de información que ya no se necesita."),
    "A.8.11": ("Enmascaramiento de datos", "protección de datos mediante ocultación o anonimización."),
    "A.8.12": ("Prevención de fuga de datos", "medidas para evitar la divulgación no autorizada de datos."),
    "A.8.13": ("Respaldo de información", "copia y protección de información crítica para recuperación."),
    "A.8.14": ("Redundancia de las instalaciones de procesamiento de información", "duplicación y resiliencia en instalaciones de procesamiento."),
    "A.8.15": ("Registro de eventos", "captura y conservación de registros de eventos de seguridad."),
    "A.8.16": ("Actividades de monitoreo", "supervisión continua de sistemas y eventos de seguridad."),
    "A.8.17": ("Sincronización de relojes", "alineación de tiempos en sistemas para registros y auditoría."),
    "A.8.18": ("Uso de programas utilitarios privilegiados", "control del uso de utilidades que pueden cambiar configuraciones críticas."),
    "A.8.19": ("Instalación de software en sistemas operativos", "gestión segura de la instalación y actualización de software."),
    "A.8.20": ("Seguridad de redes", "protección de la infraestructura de red ante amenazas y accesos no autorizados."),
    "A.8.21": ("Seguridad de los servicios de red", "seguridad de servicios y aplicaciones en red."),
    "A.8.22": ("Segregación de redes", "separación de redes para limitar el impacto de accesos o incidentes."),
    "A.8.23": ("Filtrado web", "control del acceso web para bloquear contenidos peligrosos."),
    "A.8.24": ("Uso de criptografía", "protección de datos mediante cifrado y técnicas criptográficas."),
    "A.8.25": ("Ciclo de vida de desarrollo seguro", "integración de seguridad en todas las fases del desarrollo."),
    "A.8.26": ("Requisitos de seguridad de aplicaciones", "definición de requisitos de seguridad para aplicaciones."),
    "A.8.27": ("Principios de arquitectura e ingeniería segura de sistemas", "diseño y construcción de sistemas seguros desde la arquitectura."),
    "A.8.28": ("Codificación segura", "prácticas de desarrollo seguro para código y aplicaciones."),
    "A.8.29": ("Pruebas de seguridad en desarrollo y aceptación", "evaluación de seguridad durante pruebas y aceptación."),
    "A.8.30": ("Desarrollo subcontratado", "gestión de seguridad de servicios de desarrollo externalizados."),
    "A.8.31": ("Separación de entornos de desarrollo, prueba y producción", "mantener entornos separados para reducir riesgos operativos."),
    "A.8.32": ("Gestión de cambios", "control de cambios y revisión de sus impactos en seguridad."),
    "A.8.33": ("Información de prueba", "protección de datos y entornos utilizados en pruebas."),
    "A.8.34": ("Protección de los sistemas de información durante las pruebas de auditoría", "aseguramiento de sistemas durante actividades de auditoría y pruebas."),
}

VALID_ISO_27001_CONTROLS = set(ISO_27001_CONTROL_DEFINITIONS.keys())

AUTHENTICATION_ACCESS_KEYWORDS = [
    "contraseña",
    "password",
    "credencial",
    "credenciales",
    "mfa",
    "multifactor",
    "2fa",
    "autenticación",
    "autenticacion",
    "acceso",
    "accesos",
    "control de acceso",
    "iniciar sesión",
    "login",
    "ingreso",
]

SPANISH_LANGUAGE_KEYWORDS = [
    "hola",
    "buenos",
    "gracias",
    "por favor",
    "contraseña",
    "autenticación",
    "autenticacion",
    "acceso",
    "pregunta",
    "respuesta",
    "documento",
    "español",
    "así",
    "cómo",
    "que",
    "qué",
]

ENGLISH_LANGUAGE_KEYWORDS = [
    "hello",
    "hi",
    "thanks",
    "please",
    "password",
    "authentication",
    "access",
    "credential",
    "credentials",
    "login",
    "system",
    "document",
    "english",
    "question",
    "answer",
    "how",
    "what",
    "why",
]

PORTUGUESE_LANGUAGE_KEYWORDS = [
    "olá",
    "ola",
    "obrigado",
    "por favor",
    "senha",
    "acesso",
    "controle",
    "segurança",
    "documento",
    "pergunta",
    "resposta",
    "português",
    "portugues",
]

GERMAN_LANGUAGE_KEYWORDS = [
    "hallo",
    "bitte",
    "danke",
    "passwort",
    "zugriff",
    "sicherheit",
    "dokument",
    "frage",
    "antwort",
    "iso",
    "kontrolle",
]

FRENCH_LANGUAGE_KEYWORDS = [
    "bonjour",
    "s'il",
    "svp",
    "merci",
    "mot de passe",
    "accès",
    "sécurité",
    "securité",
    "document",
    "question",
    "réponse",
    "reponse",
]

ITALIAN_LANGUAGE_KEYWORDS = [
    "ciao",
    "per favore",
    "grazie",
    "password",
    "accesso",
    "sicurezza",
    "documento",
    "domanda",
    "risposta",
]


def _get_control_definition(clause_ref: str) -> tuple[str, str] | None:
    return ISO_27001_CONTROL_DEFINITIONS.get(clause_ref)


def _normalize_message_text(message: str) -> str:
    return re.sub(r"[^\w\sáéíóúñüÁÉÍÓÚÑÜ]", " ", message.strip().lower())


def _detect_language(message: str) -> str:
    if not message.strip():
        return "en"

    raw_message = message.strip().lower()
    normalized = _normalize_message_text(message)

    unique_language_patterns = {
        "es": r"\b(hola|buenos|gracias|por favor|contraseña|autenticación|autenticacion|acceso|pregunta|respuesta|documento|español|qué|cómo|¿|¡)\b",
        "pt": r"\b(ol[áa]|obrigado|obrigada|por favor|senha|acesso|controle|segurança|documento|pergunta|resposta|portugu[eê]s)\b",
        "de": r"\b(hallo|bitte|danke|passwort|zugriff|sicherheit|dokument|frage|antwort|kontrolle)\b",
        "fr": r"\b(bonjour|svp|merci|mot de passe|acc[eè]s|s[eé]curit[eé]|document|question|r[eé]ponse|reponse)\b",
        "it": r"\b(ciao|per favore|grazie|password|accesso|sicurezza|documento|domanda|risposta)\b",
    }

    for lang, pattern in unique_language_patterns.items():
        if re.search(pattern, raw_message, flags=re.IGNORECASE):
            return lang

    scores = {
        "es": sum(1 for kw in SPANISH_LANGUAGE_KEYWORDS if kw in normalized),
        "en": sum(1 for kw in ENGLISH_LANGUAGE_KEYWORDS if kw in normalized),
        "pt": sum(1 for kw in PORTUGUESE_LANGUAGE_KEYWORDS if kw in normalized),
        "de": sum(1 for kw in GERMAN_LANGUAGE_KEYWORDS if kw in normalized),
        "fr": sum(1 for kw in FRENCH_LANGUAGE_KEYWORDS if kw in normalized),
        "it": sum(1 for kw in ITALIAN_LANGUAGE_KEYWORDS if kw in normalized),
    }

    max_score = max(scores.values())
    if max_score == 0:
        return "en"

    top_languages = [lang for lang, score in scores.items() if score == max_score]
    language_priority = ["es", "pt", "de", "fr", "it", "en"]
    for lang in language_priority:
        if lang in top_languages:
            return lang

    return top_languages[0]


def _build_obsolete_iso_2013_directive(message: str) -> str | None:
    if re.search(r"\bA\.(?:9|1[0-8])(?:\.[0-9]+)*\b", message.upper()):
        return (
            "[CRITICAL DIRECTIVE - STRICT LANGUAGE LOCALIZATION REQUIRED]\n"
            "1. DETECTION: The user is asking about an obsolete control or domain from the ISO 27001:2013 standard (prefixes A.9 to A.18).\n"
            "2. MANDATORY LANGUAGE RULE: You MUST identify the language utilized by the user in their prompt (e.g., Italian, Portuguese, German, English, Spanish). Your entire response MUST be written exclusively in that exact language.\n"
            "3. NO MIXED LANGUAGES: Do NOT use English if the user asked in Italian or German. Do NOT use the original Spanish names of the controls (like 'Separación de entornos'). You must translate everything, including the ISO 27001:2022 control titles and names, into the user's language.\n"
            "4. REQUIRED RESPONSE STRUCTURE (Fully translated into the user's language):\n"
            "   - Clearly state that the requested code or domain does not exist in the current ISO/IEC 27001:2022 standard and belongs to the obsolete 2013 version.\n"
            "   - Map the concept to its correct 2022 equivalents under the new domains (A.5 to A.8). For instance:\n"
            "     * Old A.9 (Access Control) maps to the 2022 equivalents for Identity Management (A.5.15), Access Rights (A.5.16), and Authentication Information (A.5.17).\n"
            "     * Old A.14 (Development) maps to Secure Development Lifecycle (A.8.25) and Separation of Development, Test, and Production Environments (A.8.31).\n"
            "   - Politely ask the user to reformulate their query using the valid ISO 27001:2022 framework."
        )
    return None


def _format_iso_citations(answer: str) -> str:
    for clause_ref, (title, description) in ISO_27001_CONTROL_DEFINITIONS.items():
        raw_marker = f"[{clause_ref}]"
        if raw_marker in answer:
            formatted = f"[{clause_ref}] {title} — {description}"
            answer = answer.replace(raw_marker, formatted)
    return answer


def _has_authentication_access_query(message: str) -> bool:
    normalized = _normalize_message_text(message)
    return any(keyword in normalized for keyword in AUTHENTICATION_ACCESS_KEYWORDS)


def _find_iso_control_references(message: str) -> list[str]:
    return re.findall(r"\bA\.[0-9]+(?:\.[0-9]+)?\b", message.upper())


def _has_invalid_iso_control(message: str) -> bool:
    references = _find_iso_control_references(message)
    if not references:
        return False
    return any(ref not in VALID_ISO_27001_CONTROLS for ref in references)


def _append_authentication_references(answer: str) -> str:
    auth_refs = []
    for clause_ref in ["A.5.17", "A.8.5"]:
        if clause_ref not in answer:
            definition = _get_control_definition(clause_ref)
            if definition:
                auth_refs.append(f"[{clause_ref}] {definition[0]} — {definition[1]}")
    if not auth_refs:
        return answer
    if not answer.endswith("\n"):
        answer += "\n"
    answer += "\n".join(auth_refs)
    return answer


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


def _build_system_prompt(language: str, obsolete_directive: str | None = None) -> str:
    if language == "es":
        base_prompt = (
            "Eres un asistente profesional y conciso especializado en ISO/IEC 27001:2022 (tercera edición). "
            "Responde en español con un tono formal, directo y fácil de leer. "
            "Responde siempre en el mismo idioma usado por el usuario y no mezcles idiomas. "
            "No menciones ni uses controles de versiones anteriores de ISO 27001. "
            "Si la pregunta es breve o general, responde en una o dos oraciones, sin entrar en explicaciones extensas. "
            "Siempre cita referencias ISO concretas entre corchetes y, cuando sea posible, añade el título del control tras el código. "
            "Por ejemplo: [A.5.17] Información de autenticación — gestión de credenciales y datos de autenticación para el acceso seguro. "
            "No uses datos de otros tenants ni inventes información de fuentes externas. "
            "Solo sugiere acciones si son claramente útiles para la consulta. "
            "Si generas acciones, limítalas a un máximo de 3 y usa la etiqueta ACCIONES con un JSON válido. "
            "Cada opción puede incluir un campo `command` con un valor corto ejecutable además del `label` y `description`. "
            "Por ejemplo:\nACCIONES:\n[{\"label\": \"Validar controles\", \"description\": \"Revisar los controles mencionados según ISO 27001.\", \"command\": \"validar_documento\"}]"
        )
    elif language == "pt":
        base_prompt = (
            "Você é um assistente profissional e conciso especializado em ISO/IEC 27001:2022 (terceira edição). "
            "Responda em português com um tom formal, direto e fácil de ler. "
            "Responda sempre no mesmo idioma usado pelo usuário e não misture idiomas. "
            "Não mencione nem use controles de versões anteriores da ISO 27001. "
            "Se a pergunta for breve ou geral, responda em uma ou duas frases, sem explicações longas. "
            "Sempre cite referências ISO específicas entre colchetes e, quando possível, inclua o título do controle após o código. "
            "Por exemplo: [A.5.17] Informações de autenticação — gerenciamento de credenciais e dados de autenticação para acesso seguro. "
            "Não use dados de outros tenants nem invente informações de fontes externas. "
            "Apenas sugira ações se elas forem claramente úteis para a consulta. "
            "Se gerar ações, limite-as a no máximo 3 e use o marcador ACCIONES com JSON válido. "
            "Cada opção pode incluir um campo `command` com um valor curto executável além de `label` e `description`."
        )
    elif language == "de":
        base_prompt = (
            "Du bist ein professioneller und prägnanter Assistent, spezialisiert auf ISO/IEC 27001:2022 (dritte Ausgabe). "
            "Antworte auf Deutsch in einem formellen, direkten und leicht lesbaren Stil. "
            "Antworte immer in derselben Sprache, die der Benutzer verwendet, und mische keine Sprachen. "
            "Erwähne keine Kontrollen früherer Versionen der ISO 27001 und verwende sie nicht. "
            "Wenn die Frage kurz oder allgemein ist, antworte in ein oder zwei Sätzen, ohne lange Erklärungen. "
            "Zitiere stets spezifische ISO-Referenzen in eckigen Klammern und füge, wenn möglich, den Titel der Kontrolle nach dem Code hinzu. "
            "Zum Beispiel: [A.5.17] Authentifizierungsinformationen — Verwaltung von Anmeldeinformationen und Authentifizierungsdaten für sicheren Zugriff. "
            "Verwende keine Daten anderer Mandanten und erfinde keine Informationen aus externen Quellen. "
            "Schlage nur Aktionen vor, wenn sie für die Anfrage eindeutig nützlich sind. "
            "Wenn du Aktionen generierst, beschränke sie auf maximal 3 und verwende das Label ACCIONES mit gültigem JSON. "
            "Jede Option kann zusätzlich zu `label` und `description` ein Feld `command` mit einem kurzen ausführbaren Wert enthalten."
        )
    elif language == "fr":
        base_prompt = (
            "Vous êtes un assistant professionnel et concis spécialisé dans ISO/IEC 27001:2022 (troisième édition). "
            "Répondez en français avec un ton formel, direct et facile à lire. "
            "Répondez toujours dans la même langue utilisée par l'utilisateur et ne mélangez pas les langues. "
            "Ne mentionnez pas et n'utilisez pas de contrôles des versions antérieures de l'ISO 27001. "
            "Si la question est brève ou générale, répondez en une ou deux phrases, sans explications longues. "
            "Citez toujours des références ISO spécifiques entre crochets et, si possible, incluez le titre du contrôle après le code. "
            "Par exemple : [A.5.17] Informations d'authentification — gestion des identifiants et des données d'authentification pour un accès sécurisé. "
            "N'utilisez pas de données provenant d'autres locataires et n'inventez pas d'informations provenant de sources externes. "
            "Ne suggérez des actions que si elles sont clairement utiles pour la requête. "
            "Si vous générez des actions, limitez-les à un maximum de 3 et utilisez le marqueur ACCIONES avec un JSON valide. "
            "Chaque option peut inclure un champ `command` avec une valeur exécutable courte en plus de `label` et `description`."
        )
    elif language == "it":
        base_prompt = (
            "Sei un assistente professionale e conciso specializzato in ISO/IEC 27001:2022 (terza edizione). "
            "Rispondi in italiano con un tono formale, diretto e facile da leggere. "
            "Rispondi sempre nella stessa lingua utilizzata dall'utente e non mescolare le lingue. "
            "Non menzionare né usare controlli di versioni precedenti di ISO 27001. "
            "Se la domanda è breve o generale, rispondi in una o due frasi, senza spiegazioni lunghe. "
            "Cita sempre riferimenti ISO specifici tra parentesi quadre e, se possibile, includi il titolo del controllo dopo il codice. "
            "Ad esempio: [A.5.17] Informazioni di autenticazione — gestione delle credenziali e dei dati di autenticazione per accesso sicuro. "
            "Non usare dati di altri tenant né inventare informazioni da fonti esterne. "
            "Suggerisci azioni solo se sono chiaramente utili per la richiesta. "
            "Se generi azioni, limitale a un massimo di 3 e usa l'etichetta ACCIONES con JSON valido. "
            "Ogni opzione può includere un campo `command` con un valore eseguibile breve oltre a `label` e `description`."
        )
    else:
        base_prompt = (
            "You are a professional and concise assistant specialized in ISO/IEC 27001:2022 (third edition). "
            "Respond in the exact same language used by the user in their message. "
            "Do not mix languages. "
            "Do not mention or use controls from earlier versions of ISO 27001. "
            "If the question is brief or general, answer in one or two sentences without lengthy explanations. "
            "Always cite specific ISO references in brackets and, when possible, include the control title after the code. "
            "For example: [A.5.17] Authentication information — management of credentials and authentication data for secure access. "
            "Do not use data from other tenants or invent information from external sources. "
            "Only suggest actions if they are clearly useful for the query. "
            "If you generate actions, limit them to a maximum of 3 and use the ACCIONES label with valid JSON. "
            "Each option may include a `command` field with a short executable value in addition to `label` and `description`. "
            "For example:\nACCIONES:\n[{\"label\": \"Validate controls\", \"description\": \"Review the mentioned controls according to ISO 27001.\", \"command\": \"validate_document\"}]"
        )
    if obsolete_directive:
        return f"{obsolete_directive}\n\n{base_prompt}"
    return base_prompt


def _build_user_prompt(language: str, message: str, document_text: str | None, iso_contexts: list[dict[str, str]]) -> str:
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

    if language == "en":
        return (
            f"CURRENT DOCUMENT:\n{document_text[:15000] if document_text else ''}\n\n"
            f"ISO 27001 STANDARD:\n{iso_block}\n\n"
            f"User question:\n{message}\n\n"
            "Instructions:\n"
            "- Answer in English and do not mix languages.\n"
            "- Your entire response MUST be written exclusively in English.\n"
            "- Respond in the exact same language used by the user.\n"
            "- Relate your answer to the current document when available.\n"
            "- Cite specific ISO references like [A.5.1] or [A.8.2].\n"
            "- If there is no document available, answer as an ISO assistant in English.\n"
            "- Avoid any content from other tenants."
        )

    if language == "es":
        return (
            f"{document_block}NORMA ISO 27001:\n{iso_block}\n\n"
            f"Pregunta del usuario:\n{message}\n\n"
            "Instrucciones:\n"
            "- Contesta en español y no mezcles idiomas.\n"
            "- Tu respuesta debe estar completamente en español.\n"
            "- Responde en el mismo idioma usado por el usuario.\n"
            "- Relaciona la respuesta con el documento actual cuando exista.\n"
            "- Cita las referencias ISO concretas como [A.5.1] o [A.8.2].\n"
            "- Si no hay documento disponible, responde como asistente ISO en español.\n"
            "- Evita cualquier contenido de otros tenants."
        )

    if language == "pt":
        return (
            f"{document_block}DOCUMENTO ATUAL:\n{document_text[:15000] if document_text else ''}\n\n"
            f"ISO 27001 STANDARD:\n{iso_block}\n\n"
            f"Pergunta do usuário:\n{message}\n\n"
            "Instruções:\n"
            "- Responda em português e não misture idiomas.\n"
            "- Sua resposta deve estar completamente em português.\n"
            "- Responda no mesmo idioma usado pelo usuário.\n"
            "- Relacione sua resposta com o documento atual quando disponível.\n"
            "- Cite referências ISO específicas como [A.5.1] ou [A.8.2].\n"
            "- Se não houver documento disponível, responda como assistente ISO em português.\n"
            "- Evite qualquer conteúdo de outros tenants."
        )

    if language == "de":
        return (
            f"AKTUELLES DOKUMENT:\n{document_text[:15000] if document_text else ''}\n\n"
            f"ISO 27001 STANDARD:\n{iso_block}\n\n"
            f"Benutzerfrage:\n{message}\n\n"
            "Anweisungen:\n"
            "- Antworte auf Deutsch und mische keine Sprachen.\n"
            "- Deine Antwort muss vollständig auf Deutsch sein.\n"
            "- Antworte in derselben Sprache, die der Benutzer verwendet hat.\n"
            "- Beziehe deine Antwort auf das aktuelle Dokument, wenn vorhanden.\n"
            "- Zitiere spezifische ISO-Referenzen wie [A.5.1] oder [A.8.2].\n"
            "- Wenn kein Dokument verfügbar ist, antworte als ISO-Assistent auf Deutsch.\n"
            "- Vermeide Inhalte aus anderen Tenants."
        )

    if language == "fr":
        return (
            f"DOCUMENT ACTUEL:\n{document_text[:15000] if document_text else ''}\n\n"
            f"ISO 27001 STANDARD:\n{iso_block}\n\n"
            f"Question de l'utilisateur:\n{message}\n\n"
            "Instructions:\n"
            "- Répondez en français et ne mélangez pas les langues.\n"
            "- Votre réponse doit être entièrement en français.\n"
            "- Répondez dans la même langue utilisée par l'utilisateur.\n"
            "- Reliez votre réponse au document actuel lorsque cela est possible.\n"
            "- Citez des références ISO spécifiques comme [A.5.1] ou [A.8.2].\n"
            "- Si aucun document n'est disponible, répondez comme assistant ISO en français.\n"
            "- Évitez tout contenu provenant d'autres tenants."
        )

    if language == "it":
        return (
            f"DOCUMENTO CORRENTE:\n{document_text[:15000] if document_text else ''}\n\n"
            f"ISO 27001 STANDARD:\n{iso_block}\n\n"
            f"Domanda dell'utente:\n{message}\n\n"
            "Istruzioni:\n"
            "- Rispondi in italiano e non mescolare le lingue.\n"
            "- La tua risposta deve essere completamente in italiano.\n"
            "- Rispondi nella stessa lingua usata dall'utente.\n"
            "- Collega la tua risposta al documento attuale quando disponibile.\n"
            "- Cita riferimenti ISO specifici come [A.5.1] o [A.8.2].\n"
            "- Se non è disponibile alcun documento, rispondi come assistente ISO in italiano.\n"
            "- Evita qualsiasi contenuto da altri tenant."
        )

    return (
        f"{document_block}ISO 27001 STANDARD:\n{iso_block}\n\n"
        f"User question:\n{message}\n\n"
        "Instructions:\n"
        "- Respond in the exact same language used by the user and do not mix languages.\n"
        "- Your entire response must be written exclusively in the detected language.\n"
        "- Relate your answer to the current document when available.\n"
        "- Cite specific ISO references like [A.5.1] or [A.8.2].\n"
        "- If there is no document available, answer as an ISO assistant in the same language.\n"
        "- Avoid any content from other tenants."
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

    language = _detect_language(message)
    obsolete_directive = _build_obsolete_iso_2013_directive(message)
    iso_contexts = await _load_iso_contexts(db, message)
    document_text = None
    if document_id:
        document_text = await _load_document_text(document_id, current_user)

    system_prompt = _build_system_prompt(language, obsolete_directive)
    user_prompt = _build_user_prompt(language, message, document_text, iso_contexts)
    raw_answer = await _call_deepseek_chat(system_prompt, user_prompt)
    answer, action_options = _extract_action_options(raw_answer)

    answer = _format_iso_citations(answer)
    if _has_authentication_access_query(message):
        answer = _append_authentication_references(answer)
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
    system_prompt = _build_system_prompt(_detect_language("validar documento"))
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
