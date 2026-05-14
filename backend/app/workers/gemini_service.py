"""Servicio para integración con Gemini API."""

import asyncio
import json
import logging
import re
from typing import Any

import httpx
from app.core.config import settings

logger = logging.getLogger(__name__)


def _normalize_embedding_model(model: str) -> str:
    legacy_models = {
        "text-embedding-004",
        "models/embedding-004",
        "embedding-004",
    }
    if model in legacy_models:
        return "gemini-embedding-2"
    return model.removeprefix("models/")


def _normalize_generation_model(model: str) -> str:
    return model.removeprefix("models/")


def _dedupe_models(models: list[str]) -> list[str]:
    seen: set[str] = set()
    ordered: list[str] = []
    for model in models:
        normalized = model.removeprefix("models/")
        if normalized not in seen:
            seen.add(normalized)
            ordered.append(normalized)
    return ordered


def _extract_json_text(response_text: str) -> str:
    cleaned = response_text.strip()
    if cleaned.startswith("```json"):
        cleaned = cleaned[7:]
    if cleaned.startswith("```"):
        cleaned = cleaned[3:]
    if cleaned.endswith("```"):
        cleaned = cleaned[:-3]
    cleaned = cleaned.strip()

    first_brace = cleaned.find("{")
    last_brace = cleaned.rfind("}")
    if first_brace != -1 and last_brace != -1 and last_brace > first_brace:
        return cleaned[first_brace:last_brace + 1]
    return cleaned


def _attempt_fix_json(text: str) -> str | None:
    """Intentar reparar JSON truncado aplicando heurísticas simples.

    Devuelve el texto reparado si parece válido, o None si no se pudo reparar.
    """
    s = text.strip()
    # Eliminar code fences si existen
    if s.startswith("```json"):
        s = s[7:]
    if s.startswith("```"):
        s = s[3:]
    if s.endswith("```"):
        s = s[:-3]
    s = s.strip()

    # Extraer desde la primera llave '{' si existe
    first = s.find("{")
    if first != -1:
        s = s[first:]

    # Quitar comas finales antes de cierres
    s = re.sub(r",\s*([}\]])", r"\1", s)

    # Balancear llaves y corchetes añadiendo cierres faltantes
    open_braces = s.count("{")
    close_braces = s.count("}")
    if open_braces > close_braces:
        s += "}" * (open_braces - close_braces)

    open_brackets = s.count("[")
    close_brackets = s.count("]")
    if open_brackets > close_brackets:
        s += "]" * (open_brackets - close_brackets)

    # Intento final: si no hay ninguna llave, no es JSON
    if "{" not in s:
        return None

    # Validar intentando parsear
    try:
        json.loads(s)
        return s
    except Exception:
        return None


async def _post_json_with_retry(
    client: httpx.AsyncClient,
    url: str,
    payload: dict[str, Any],
    *,
    timeout_label: str,
    max_attempts: int = 4,
) -> dict[str, Any]:
    delay_seconds = 1.0
    last_error: Exception | None = None

    for attempt in range(1, max_attempts + 1):
        try:
            # Sanitizar generationConfig si existe para evitar 400 por tipos
            payload_to_send = payload
            try:
                gen = payload.get("generationConfig")
                if isinstance(gen, dict):
                    gen_copy = dict(gen)
                    # maxOutputTokens debe ser int
                    mot = gen_copy.get("maxOutputTokens")
                    if mot is not None and not isinstance(mot, int):
                        try:
                            gen_copy["maxOutputTokens"] = int(mot)
                        except Exception:
                            gen_copy["maxOutputTokens"] = 1024
                    # temperature y topP deben ser float
                    try:
                        if "temperature" in gen_copy:
                            gen_copy["temperature"] = float(gen_copy["temperature"])
                    except Exception:
                        gen_copy["temperature"] = 0.1
                    try:
                        if "topP" in gen_copy:
                            gen_copy["topP"] = float(gen_copy["topP"])
                    except Exception:
                        gen_copy["topP"] = 0.8

                    payload_to_send = dict(payload)
                    payload_to_send["generationConfig"] = gen_copy
            except Exception:
                payload_to_send = payload

            response = await client.post(url, json=payload_to_send)
            if response.status_code == 429 and attempt < max_attempts:
                await asyncio.sleep(delay_seconds)
                delay_seconds *= 2
                continue
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as exc:
            status_code = exc.response.status_code if exc.response else None
            resp_text = ""
            try:
                resp_text = exc.response.text if exc.response is not None else ""
            except Exception:
                resp_text = "<no response body>"

            # Log request/response for diagnostics
            try:
                logger.error("Gemini HTTP error %s for URL %s\nPayload (truncated): %s\nResponse (truncated): %s", status_code, url, str(payload)[:2000], resp_text[:4000])
            except Exception:
                logger.exception("Error al registrar request/response de Gemini")

            # If retriable status, backoff and retry
            if status_code in {429, 500, 502, 503, 504} and attempt < max_attempts:
                await asyncio.sleep(delay_seconds)
                delay_seconds *= 2
                last_error = Exception(f"HTTP {status_code}: {resp_text}")
                continue

            # Non-retriable: raise a detailed error
            raise httpx.HTTPStatusError(f"HTTP {status_code} error: {resp_text}", request=exc.request, response=exc.response)
        except httpx.RequestError as exc:
            if attempt < max_attempts:
                await asyncio.sleep(delay_seconds)
                delay_seconds *= 2
                last_error = exc
                continue
            raise

    if last_error is not None:
        raise last_error

    raise RuntimeError(f"{timeout_label}: no se pudo completar la petición")


async def generate_embedding(text: str) -> list[float]:
    """Genera embedding de texto usando Gemini."""
    if not settings.gemini_api_key:
        raise ValueError("Falta GEMINI_API_KEY")

    api_base = "https://generativelanguage.googleapis.com/v1beta"
    model = _normalize_embedding_model(settings.gemini_embedding_model)
    url = f"{api_base}/models/{model}:embedContent?key={settings.gemini_api_key}"

    payload = {"content": {"parts": [{"text": text}]}}

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(url, json=payload)
        response.raise_for_status()
        data = response.json()

    embedding = data.get("embedding") or data.get("embeddings", [{}])[0].get("embedding", {})
    values = embedding.get("values") or embedding.get("value") or data.get("values")

    if not isinstance(values, list) or len(values) == 0:
        raise ValueError("La respuesta de embeddings no incluye valores válidos")

    return [float(v) for v in values]


def build_validation_prompt(document_text: str, chunk: dict) -> str:
    """Construye el prompt para validación de un chunk."""
    return "\n".join([
        "Compara este documento contra este requisito ISO específico.",
        "Retorna SOLO JSON válido, sin markdown ni texto extra.",
        "Usa como máximo 2 observaciones y textos breves.",
        "Esquema:",
        "{",
        '  "score": 0-100,',
        '  "observations": [{"severity":"critical|major|minor","text":"..."}],',
        '  "suggestions": ["..."]',
        "}",
        "",
        f"Requisito ISO [{chunk.get('clause_ref')}] {chunk.get('title')}:",
        chunk.get('content', ''),
        "",
        "Documento:",
        document_text,
    ])


async def analyze_chunk_with_gemini(document_text: str, chunk: dict) -> dict:
    """Analiza un chunk contra un documento usando Gemini."""
    if not settings.gemini_api_key:
        raise ValueError("Falta GEMINI_API_KEY")

    api_base = "https://generativelanguage.googleapis.com/v1"
    models = _dedupe_models([
        _normalize_generation_model(settings.gemini_validation_model),
        _normalize_generation_model(settings.gemini_model),
    ])

    prompt = build_validation_prompt(document_text, chunk)

    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.1,
            "topP": 0.8,
            "maxOutputTokens": 2048,
        },
    }

    async with httpx.AsyncClient(timeout=60.0) as client:
        last_error: Exception | None = None
        for model in models:
            url = f"{api_base}/models/{model}:generateContent?key={settings.gemini_api_key}"
            try:
                data = await _post_json_with_retry(
                    client,
                    url,
                    payload,
                    timeout_label="Gemini generateContent",
                )
                break
            except Exception as exc:
                last_error = exc
        else:
            if last_error is not None:
                raise last_error
            raise RuntimeError("Gemini generateContent falló sin error explícito")

    # Extraer respuesta
    content = data.get("candidates", [{}])[0].get("content", {})
    parts = content.get("parts", [{}])
    response_text = parts[0].get("text", "{}")

    # Limpiar markdown si existe
    response_text = _extract_json_text(response_text)

    # Intento estándar de parseo
    try:
        result = json.loads(response_text)
    except json.JSONDecodeError:
        # Registrar el cuerpo completo para diagnóstico
        logger.warning("JSON inválido de Gemini (primeros 2000 chars): %s", response_text[:2000])

        # Intentar reparar con heurísticas
        repaired = _attempt_fix_json(response_text)
        if repaired is not None:
            try:
                result = json.loads(repaired)
            except Exception:
                logger.warning("Reparación de JSON falló: contenido reparado inválido")
                raise ValueError(f"Gemini devolvió JSON inválido (reparación fallida): {response_text[:1000]}")
        else:
            raise ValueError(f"Gemini devolvió JSON inválido: {response_text[:1000]}")

    return {
        "score": min(100, max(0, int(result.get("score", 0)))),
        "observations": result.get("observations", []),
        "suggestions": result.get("suggestions", []),
    }
