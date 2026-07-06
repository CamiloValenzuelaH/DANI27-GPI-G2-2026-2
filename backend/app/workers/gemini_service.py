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
    headers: dict[str, str] | None = None,
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

            response = await client.post(url, json=payload_to_send, headers=headers)
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


def _extract_text_from_deepseek(response_data: dict[str, Any]) -> str:
    choices = response_data.get("choices") or []
    if not choices:
        raise ValueError("DeepSeek response without choices")

    first_choice = choices[0] if isinstance(choices, list) else {}
    message = first_choice.get("message") or {}
    content = message.get("content") or first_choice.get("text") or ""

    if isinstance(content, list):
        parts: list[str] = []
        for item in content:
            if isinstance(item, dict):
                text = item.get("text") or item.get("content") or ""
                if text:
                    parts.append(str(text))
            elif item:
                parts.append(str(item))
        content = "".join(parts)

    if not isinstance(content, str) or not content.strip():
        raise ValueError("DeepSeek response without text")

    return content.strip()


async def _call_deepseek_json(
    *,
    system_prompt: str,
    user_prompt: str,
    max_output_tokens: int = 1600,
    temperature: float = 0.1,
    top_p: float = 0.8,
) -> dict[str, Any]:
    if not settings.deepseek_api_key:
        raise ValueError("Falta DEEPSEEK_API_KEY")

    api_base = settings.deepseek_base_url.rstrip("/")
    models = _dedupe_models([settings.deepseek_model])
    payload = {
        "model": models[0],
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "temperature": float(temperature),
        "top_p": float(top_p),
        "max_tokens": int(max_output_tokens),
    }

    async with httpx.AsyncClient(timeout=60.0) as client:
        data = await _post_json_with_retry(
            client,
            f"{api_base}/chat/completions",
            payload,
            headers={"Authorization": f"Bearer {settings.deepseek_api_key}"},
            timeout_label="DeepSeek chat/completions",
        )

    response_text = _extract_json_text(_extract_text_from_deepseek(data))
    try:
        return json.loads(response_text)
    except json.JSONDecodeError:
        repaired = _attempt_fix_json(response_text)
        if repaired is None:
            raise ValueError(f"DeepSeek devolvió JSON inválido: {response_text[:1000]}")
        return json.loads(repaired)


def _build_cross_check_prompt(documents: list[dict[str, str]]) -> str:
    lines: list[str] = [
        "Eres un asistente experto en comparación de políticas, controles y consistencia documental de una misma organización.",
        "Analiza cada documento con la información entregada y detecta inconsistencias reales entre ellos.",
        "No uses el texto completo de los documentos; solo el resumen y los hallazgos proporcionados.",
        "Responde SOLO con JSON válido sin markdown ni explicaciones adicionales.",
        "JSON esperado:",
        "{",
        '  "inconsistencies": [',
        '    {"description": "...", "documents": ["job-id-1", "job-id-2"], "severity": "critical"}',
        "  ]",
        "}",
        "",
        "Busca específicamente:",
        "- responsables con nombres distintos que parezcan la misma función.",
        "- fechas de aprobación o versiones contradictorias entre políticas relacionadas.",
        "- referencias a procedimientos que aparecen en un documento pero no en los demás.",
        "- controles ISO marcados como implementados en un documento y como no implementados en otro.",
        "",
        "Documentos a comparar:",
    ]

    for document in documents:
        lines.append("---")
        lines.append(f"Job ID: {document.get('job_id', 'unknown')}")
        lines.append(f"Nombre de archivo: {document.get('file_name', 'Sin nombre')}")
        if document.get('summary'):
            lines.append("Resumen de validación:")
            lines.append(document['summary'])
        if document.get('findings_summary'):
            lines.append("Hallazgos y estado de controles:")
            lines.append(document['findings_summary'])

    lines.extend([
        "",
        "Devuelve inconsistencias solo si son relevantes y están respaldadas por diferencias claras entre documentos.",
        "Si no encuentras inconsistencias, responde {\"inconsistencies\": []}.",
    ])

    return "\n".join(lines)


async def compare_validation_summaries_with_deepseek(
    *,
    documents: list[dict[str, str]],
) -> dict[str, Any]:
    prompt = _build_cross_check_prompt(documents)
    payload = {
        "system_prompt": "Responde solo JSON válido sin markdown.",
        "user_prompt": prompt,
        "max_output_tokens": 900,
        "temperature": 0.0,
        "top_p": 0.7,
    }
    return await _call_deepseek_json(**payload)


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


def build_chunk_classification_prompt(document_text: str, chunk: dict) -> str:
    """Prompt 1: clasificar atingencia y control principal del documento para un chunk."""
    return "\n".join([
        "Clasifica la relación del documento con este control ISO.",
        "Responde SOLO JSON válido.",
        "Esquema:",
        "{",
        '  "primary_control_ref": "texto",',
        '  "is_primary_match": true,',
        '  "relevance_score": 0-100,',
        '  "justification": "detalle breve"',
        "}",
        "",
        f"Requisito ISO [{chunk.get('clause_ref')}] {chunk.get('title')}:",
        chunk.get('content', ''),
        "",
        "Documento:",
        document_text,
    ])


def build_chunk_quality_prompt(document_text: str, chunk: dict, classification: dict[str, Any]) -> str:
    """Prompt 2: evaluar calidad, faltantes y observaciones para el control."""
    return "\n".join([
        "Evalúa la calidad del documento para este control ISO.",
        "Responde SOLO JSON válido y aplica criterios ISO con precisión.",
        "Debes incluir estado sugerido y elementos faltantes.",
        "Esquema:",
        "{",
        '  "score": 0-100,',
        '  "document_status": "COMPLETO|INCOMPLETO|INEXISTENTE",',
        '  "is_pertinent": true,',
        '  "justification": "explicación detallada",',
        '  "observations": [{"severity":"critical|major|minor","text":"..."}],',
        '  "suggestions": ["..."],',
        '  "missing_elements": ["..."]',
        "}",
        "",
        "Resultado previo de clasificación:",
        json.dumps(classification, ensure_ascii=False),
        "",
        f"Control ISO objetivo [{chunk.get('clause_ref')}] {chunk.get('title')}:",
        chunk.get('content', ''),
        "",
        "Documento:",
        document_text,
    ])


def build_evidence_verification_prompt(document_text: str) -> str:
    """Prompt 3: verificar menciones de evidencia y detectar brechas sin respaldo documental real."""
    return "\n".join([
        "Evalúa si el documento menciona evidencia real y si esa evidencia está respaldada en el texto extraído.",
        "Responde SOLO JSON válido, sin markdown y sin explicaciones adicionales.",
        "Esquema:",
        "{",
        '  "evidence_verified": true|false,',
        '  "evidence_gaps": ["..."],',
        "}",
        "",
        "Revisa específicamente lo siguiente:",
        "1. Firma: si el documento menciona una firma o aprobación firmada, determina si el texto extraído describe un bloque de firma real o solo menciona el nombre de quien firma.",
        "2. Fecha de aprobación: si se menciona aprobación, verifica que haya una fecha concreta y específica (día, mes y año) y no una referencia genérica como 'a la fecha' o 'en breve'.",
        "3. Acta o registro de reunión: si se menciona un acta, minuta o registro de reunión, verifica si en el texto se indica claramente que está adjunto como anexo o si solo se hace una mención de pasada.",
        "4. Para este prompt, solo puedes usar el texto extraído del documento. No intentes deducir la existencia de imágenes o firmas que no estén descritas en el texto.",
        "5. Si encuentras menciones de evidencia sin respaldo completo en el texto, marca evidence_verified como false e incluye las brechas en evidence_gaps.",
        "",
        "Documento:",
        document_text,
    ])


async def verify_document_evidence_with_deepseek(
    document_text: str,
    *,
    max_output_tokens: int = 900,
) -> dict[str, Any]:
    """Verifica si el texto extraído respalda evidencia mencionada en el documento."""
    prompt = build_evidence_verification_prompt(document_text)
    parsed = await _call_deepseek_json(
        system_prompt="Responde solo JSON válido, sin markdown.",
        user_prompt=prompt,
        max_output_tokens=max_output_tokens,
        temperature=0.0,
        top_p=0.8,
    )

    if not isinstance(parsed, dict):
        raise ValueError(f"DeepSeek devolvió una estructura inválida: {parsed}")

    evidence_verified = parsed.get("evidence_verified")
    if not isinstance(evidence_verified, bool):
        evidence_verified = False

    evidence_gaps = parsed.get("evidence_gaps")
    if not isinstance(evidence_gaps, list):
        evidence_gaps = []
    else:
        evidence_gaps = [str(item).strip() for item in evidence_gaps if str(item).strip()]

    return {
        "evidence_verified": evidence_verified,
        "evidence_gaps": evidence_gaps,
    }


def _normalize_observations(raw_value: Any) -> list[dict[str, str]]:
    observations: list[dict[str, str]] = []
    if not isinstance(raw_value, list):
        return observations

    for item in raw_value:
        if not isinstance(item, dict):
            continue
        severity = str(item.get("severity", "minor")).lower().strip()
        if severity not in {"critical", "major", "minor"}:
            severity = "minor"
        text = str(item.get("text") or item.get("issue") or "").strip()
        if text:
            observations.append({"severity": severity, "text": text})
    return observations


def _normalize_string_list(raw_value: Any) -> list[str]:
    if not isinstance(raw_value, list):
        return []
    output: list[str] = []
    for item in raw_value:
        text = str(item).strip()
        if text:
            output.append(text)
    return output


def _derive_document_status(score: int, relevance_score: float, observations: list[dict[str, str]]) -> str:
    has_critical = any(obs.get("severity") == "critical" for obs in observations)
    has_major = any(obs.get("severity") == "major" for obs in observations)

    if score < 20 or relevance_score < 50:
        return "INEXISTENTE"
    if score >= 85 and not has_critical:
        return "COMPLETO"
    if 40 <= score <= 84 or has_critical or has_major:
        return "INCOMPLETO"
    return "INCOMPLETO"


async def analyze_chunk_with_deepseek(
    document_text: str,
    chunk: dict,
    *,
    max_output_tokens: int = 2048,
) -> dict:
    """Analiza un chunk con dos prompts secuenciales: clasificación y control de calidad."""
    classification = await _call_deepseek_json(
        system_prompt=(
            "You ONLY know ISO/IEC 27001:2022. NEVER reference controls A.9.x "
            "through A.18.x (obsolete 2013 version). The ONLY valid control prefixes "
            "are A.5, A.6, A.7, A.8 (93 controls total). The clause_ref and title "
            "you receive in the prompt come directly from our verified 2022 database "
            "— trust them as ground truth, never override or \"correct\" them with "
            "your own knowledge. Respond only valid JSON, no markdown."
        ),
        user_prompt=build_chunk_classification_prompt(document_text, chunk),
        max_output_tokens=min(max_output_tokens, 900),
        temperature=0.0,
        top_p=0.8,
    )

    quality = await _call_deepseek_json(
        system_prompt=(
            "You ONLY know ISO/IEC 27001:2022. NEVER reference controls A.9.x "
            "through A.18.x (obsolete 2013 version) or claim a control \"should be\" "
            "something else. The clause_ref and title provided in the prompt are "
            "ground truth from our verified database — do not contradict them, do not "
            "say they are \"mislabeled\". Evaluate ONLY whether the document content "
            "satisfies that specific control as named. Respond only valid JSON, no "
            "markdown. Apply ISO criteria rigorously based on the control as given."
        ),
        user_prompt=build_chunk_quality_prompt(document_text, chunk, classification),
        max_output_tokens=max_output_tokens,
        temperature=0.1,
        top_p=0.85,
    )

    score = min(100, max(0, int(float(quality.get("score", 0) or 0))))
    observations = _normalize_observations(quality.get("observations"))
    suggestions = _normalize_string_list(quality.get("suggestions"))
    missing_elements = _normalize_string_list(quality.get("missing_elements"))
    relevance_score = float(classification.get("relevance_score") or 0)

    if relevance_score <= 1 and chunk.get("relevance_score") is not None:
        relevance_score = float(chunk.get("relevance_score", 0)) * 100.0

    document_status = _derive_document_status(score, relevance_score, observations)
    if document_status != "INCOMPLETO":
        missing_elements = []

    justification = str(quality.get("justification") or classification.get("justification") or "").strip()
    if justification:
        suggestions = [f"Justificación: {justification}", *suggestions]

    return {
        "score": score,
        "document_status": document_status,
        "missing_elements": missing_elements,
        "observations": observations,
        "suggestions": suggestions,
        "relevance_score": relevance_score,
    }


def build_missing_generation_prompt(
    *,
    document_text: str,
    chunk: dict[str, Any],
    missing_elements: list[str],
    feedback: str | None,
) -> str:
    """Prompt de generación de contenido faltante para un control específico."""
    feedback_block = feedback.strip() if feedback else ""
    return "\n".join([
        "Genera contenido faltante para completar este control ISO.",
        "Responde SOLO JSON válido con este esquema:",
        '{"generated_text":"..."}',
        "El texto debe ser profesional, auditable, y listo para edición del usuario.",
        "",
        f"Control ISO [{chunk.get('clause_ref')}] {chunk.get('title')}:",
        str(chunk.get("content") or ""),
        "",
        "Elementos faltantes detectados:",
        json.dumps(missing_elements, ensure_ascii=False),
        "",
        "Documento original (resumen para contexto):",
        document_text,
        "",
        "Feedback de validación anterior:",
        feedback_block or "Sin feedback previo.",
    ])


def build_missing_validation_prompt(
    *,
    generated_text: str,
    chunk: dict[str, Any],
    missing_elements: list[str],
) -> str:
    """Prompt de control de calidad del contenido generado."""
    return "\n".join([
        "Valida si el texto generado cumple el control ISO y cubre lo faltante.",
        "Responde SOLO JSON válido con el esquema:",
        "{",
        '  "is_valid": true,',
        '  "score": 0-100,',
        '  "issues": ["..."],',
        '  "feedback": "detalle de mejoras"',
        "}",
        "",
        f"Control ISO [{chunk.get('clause_ref')}] {chunk.get('title')}:",
        str(chunk.get("content") or ""),
        "",
        "Elementos que debía cubrir:",
        json.dumps(missing_elements, ensure_ascii=False),
        "",
        "Texto generado a validar:",
        generated_text,
    ])


async def generate_missing_content_with_deepseek(
    *,
    document_text: str,
    chunk: dict[str, Any],
    missing_elements: list[str],
    feedback: str | None = None,
) -> str:
    data = await _call_deepseek_json(
        system_prompt="Responde solo JSON válido, sin markdown.",
        user_prompt=build_missing_generation_prompt(
            document_text=document_text,
            chunk=chunk,
            missing_elements=missing_elements,
            feedback=feedback,
        ),
        max_output_tokens=1400,
        temperature=0.35,
        top_p=0.9,
    )
    generated_text = str(data.get("generated_text") or "").strip()
    if not generated_text:
        raise ValueError("DeepSeek no generó texto faltante")
    return generated_text


async def validate_generated_missing_content_with_deepseek(
    *,
    generated_text: str,
    chunk: dict[str, Any],
    missing_elements: list[str],
) -> dict[str, Any]:
    data = await _call_deepseek_json(
        system_prompt="Responde solo JSON válido, sin markdown.",
        user_prompt=build_missing_validation_prompt(
            generated_text=generated_text,
            chunk=chunk,
            missing_elements=missing_elements,
        ),
        max_output_tokens=900,
        temperature=0.0,
        top_p=0.8,
    )
    score = min(100, max(0, int(float(data.get("score", 0) or 0))))
    issues = _normalize_string_list(data.get("issues"))
    feedback = str(data.get("feedback") or "").strip()
    is_valid = bool(data.get("is_valid")) and score >= 85 and not issues
    return {
        "is_valid": is_valid,
        "score": score,
        "issues": issues,
        "feedback": feedback,
    }


async def analyze_chunk_with_gemini(
    document_text: str,
    chunk: dict,
    *,
    max_output_tokens: int = 2048,
) -> dict:
    """Alias de compatibilidad hacia DeepSeek; mantener hasta migrar imports."""
    return await analyze_chunk_with_deepseek(
        document_text,
        chunk,
        max_output_tokens=max_output_tokens,
    )
