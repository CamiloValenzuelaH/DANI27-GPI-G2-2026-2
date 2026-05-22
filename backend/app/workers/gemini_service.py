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

    if "{" not in s:
        return None

    # Recortar hasta el último carácter potencialmente útil para JSON
    last_useful = max(s.rfind("}"), s.rfind("]"), s.rfind('"'), s.rfind("0"), s.rfind("1"), s.rfind("2"), s.rfind("3"), s.rfind("4"), s.rfind("5"), s.rfind("6"), s.rfind("7"), s.rfind("8"), s.rfind("9"), s.rfind("e"), s.rfind("E"), s.rfind("l"), s.rfind("f"), s.rfind("t"))
    if last_useful != -1 and last_useful + 1 < len(s):
        s = s[: last_useful + 1]

    # Cerrar comillas impares (texto truncado)
    if s.count('"') % 2 != 0:
        s += '"'

    # Construir cierres faltantes en orden LIFO para evitar órdenes inválidas
    stack: list[str] = []
    in_string = False
    escape = False
    for char in s:
        if in_string:
            if escape:
                escape = False
            elif char == "\\":
                escape = True
            elif char == '"':
                in_string = False
            continue

        if char == '"':
            in_string = True
        elif char == "{":
            stack.append("}")
        elif char == "[":
            stack.append("]")
        elif char in {"}", "]"} and stack and stack[-1] == char:
            stack.pop()

    candidate = s + "".join(reversed(stack))
    candidate = re.sub(r",\s*([}\]])", r"\1", candidate)

    # Pruebas progresivas de cierres típicos de truncamiento: }, ], })
    attempts = [candidate]
    attempts.extend([
        candidate + "}",
        candidate + "]",
        candidate + "}",
        candidate + "]}",
        candidate + "}]",
        candidate + "}]}",
        candidate + "}}",
    ])

    for item in attempts:
        fixed = re.sub(r",\s*([}\]])", r"\1", item)
        try:
            json.loads(fixed)
            return fixed
        except Exception:
            continue
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
    if settings.gemini_embedding_dimensions > 0:
        payload["outputDimensionality"] = int(settings.gemini_embedding_dimensions)

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


async def analyze_chunk_with_gemini(
    document_text: str,
    chunk: dict,
    *,
    max_output_tokens: int = 2048,
) -> dict:
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
            "maxOutputTokens": int(max_output_tokens),
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
