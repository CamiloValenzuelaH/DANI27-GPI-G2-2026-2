<<<<<<< HEAD
import json
from typing import Any

import httpx

from app.core.config import settings
from app.workers.gemini_service import _post_json_with_retry


_VALID_STATUS = {"compliant", "non_compliant", "needs_review"}
_VALID_SEVERITY = {"low", "medium", "high", "critical"}


def _build_prompt(payload: dict[str, Any]) -> str:
    return (
        "Eres un agente de auditoria ISO 27001. "
        "Analiza la evidencia y responde SOLO con JSON valido, sin markdown, sin comentarios.\n"
        "Schema estricto:\n"
        "{\n"
        '  "status": "compliant|non_compliant|needs_review",\n'
        '  "overall_compliance_score": 0-100,\n'
        '  "agent_notes": "texto breve",\n'
        '  "findings": [\n'
        "    {\n"
        '      "issue": "hallazgo",\n'
        '      "severity": "low|medium|high|critical",\n'
        '      "recommendation": "accion recomendada",\n'
        '      "impact": "impacto"\n'
        "    }\n"
        "  ]\n"
        "}\n"
        "Si no hay hallazgos, devuelve findings con un item de severidad low indicando control aceptable.\n"
        "Datos de auditoria:\n"
        f"{json.dumps(payload, ensure_ascii=True)}"
    )


def _build_file_analysis_prompt(payload: dict[str, Any]) -> str:
    """Crea un prompt especializado para análisis de archivos de evidencia."""
    return (
        "Eres un auditor experto en ISO 27001. Tu tarea es evaluar el documento/evidencia proporcionado "
        "contra los controles ISO 27001 y generar un informe detallado.\n\n"
        "INSTRUCCIONES:\n"
        "1. Analiza el contenido del archivo de evidencia\n"
        "2. Verifica la PRESENCIA de elementos críticos: fechas, responsables, firmas, verificaciones\n"
        "3. Evalúa si la evidencia es legible, completa y convincente\n"
        "4. Genera hallazgos específicos basados en qué falta o qué se encuentra\n"
        "5. Proporciona recomendaciones accionables\n\n"
        "Responde SOLO con JSON válido, sin markdown, sin comentarios:\n"
        "{\n"
        '  "status": "compliant|non_compliant|needs_review",\n'
        '  "overall_compliance_score": 0-100,\n'
        '  "agent_notes": "resumen ejecutivo del análisis",\n'
        '  "findings": [\n'
        "    {\n"
        '      "issue": "descripción específica del hallazgo",\n'
        '      "severity": "low|medium|high|critical",\n'
        '      "recommendation": "acción correctiva específica",\n'
        '      "impact": "impacto en cumplimiento ISO 27001"\n'
        "    }\n"
        "  ]\n"
        "}\n\n"
        "CRITERIOS DE EVALUACIÓN:\n"
        "- CRÍTICO (critical): Ausencia total de evidencia o documento ilegible\n"
        "- ALTO (high): Falta información esencial (fechas, responsables, firmas)\n"
        "- MEDIO (medium): Información incompleta pero recuperable\n"
        "- BAJO (low): Detalles menores o sugerencias de mejora\n\n"
        "SCORING:\n"
        "- 80-100: Evidencia completa, legible y verificable\n"
        "- 60-79: Evidencia presente pero incompleta\n"
        "- 40-59: Evidencia muy deficiente\n"
        "- 0-39: Ausencia de evidencia documental legible\n\n"
        "Documento a evaluar:\n"
        f"{json.dumps(payload, ensure_ascii=True)}"
    )


def _extract_text_from_gemini(response_data: dict[str, Any]) -> str:
    candidates = response_data.get("candidates") or []
    if not candidates:
        raise ValueError("Gemini response without candidates")

    content = candidates[0].get("content") or {}
    parts = content.get("parts") or []
    if not parts:
        raise ValueError("Gemini response without content parts")

    text = parts[0].get("text")
    if not text:
        raise ValueError("Gemini response without text")

    return text.strip()


def _safe_parse_json(text: str) -> dict[str, Any]:
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.replace("```json", "").replace("```", "").strip()
    return json.loads(cleaned)


def _normalize_result(data: dict[str, Any]) -> dict[str, Any]:
    status = str(data.get("status", "needs_review")).strip().lower()
    if status not in _VALID_STATUS:
        status = "needs_review"

    raw_score = data.get("overall_compliance_score", 50)
    try:
        score = int(raw_score)
    except (TypeError, ValueError):
        score = 50
    score = max(0, min(100, score))

    notes = str(data.get("agent_notes", "Analisis completado por IA.")).strip()
    findings_in = data.get("findings") or []
    findings_out: list[dict[str, str]] = []

    if isinstance(findings_in, list):
        for item in findings_in:
            if not isinstance(item, dict):
                continue
            severity = str(item.get("severity", "low")).strip().lower()
            if severity not in _VALID_SEVERITY:
                severity = "low"

            findings_out.append(
                {
                    "issue": str(item.get("issue", "Hallazgo sin detalle")).strip()[:500],
                    "severity": severity,
                    "recommendation": str(item.get("recommendation", "Definir accion correctiva")).strip()[:800],
                    "impact": str(item.get("impact", "Impacto no especificado")).strip()[:800],
                }
            )

    if not findings_out:
        findings_out = [
            {
                "issue": "No se identificaron hallazgos criticos",
                "severity": "low",
                "recommendation": "Mantener monitoreo continuo y controles actuales",
                "impact": "Riesgo residual bajo",
            }
        ]

    return {
        "status": status,
        "overall_compliance_score": score,
        "agent_notes": notes,
        "findings": findings_out,
    }


async def analyze_audit_with_ai(payload: dict[str, Any]) -> dict[str, Any] | None:
    if not settings.gemini_api_key:
        return None

    endpoint = (
        "https://generativelanguage.googleapis.com/v1beta/models/"
        f"{settings.gemini_validation_model.removeprefix('models/')}:generateContent"
    )

    request_payload = {
        "contents": [{"parts": [{"text": _build_prompt(payload)}]}],
        "generationConfig": {
            "temperature": 0.2,
            "topP": 0.8,
            "maxOutputTokens": 1200,
        },
    }

    try:
        async with httpx.AsyncClient(timeout=25.0) as client:
            data = await _post_json_with_retry(client, endpoint, request_payload, timeout_label="Gemini generateContent")

        parsed = _safe_parse_json(_extract_text_from_gemini(data))
        return _normalize_result(parsed)
    except Exception as e:
        print("\n" + "="*50)
        print("🚨 ERROR EN LA LLAMADA A GEMINI 🚨")
        print(f"Detalle técnico: {str(e)}")
        print("="*50 + "\n")
        return None


async def analyze_file_with_ai(payload: dict[str, Any]) -> dict[str, Any] | None:
    """
    Analiza un archivo de evidencia usando IA especializada en auditoría.
    Usa un prompt más detallado orientado a evaluación de documentos.
    """
    if not settings.gemini_api_key:
        return None

    endpoint = (
        "https://generativelanguage.googleapis.com/v1beta/models/"
        f"{settings.gemini_validation_model.removeprefix('models/')}:generateContent"
    )

    request_payload = {
        "contents": [{"parts": [{"text": _build_file_analysis_prompt(payload)}]}],
        "generationConfig": {
            "temperature": 0.3,
            "topP": 0.85,
            "maxOutputTokens": 1500,
        },
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            data = await _post_json_with_retry(client, endpoint, request_payload, timeout_label="Gemini generateContent")

        parsed = _safe_parse_json(_extract_text_from_gemini(data))
        return _normalize_result(parsed)
    except Exception as e:
        print("\n" + "="*50)
        print("🚨 ERROR EN ANÁLISIS DE ARCHIVO CON GEMINI 🚨")
        print(f"Detalle técnico: {str(e)}")
        print("="*50 + "\n")
        return None


=======
import json
from typing import Any

import httpx

from app.core.config import settings
from app.workers.gemini_service import _extract_text_from_deepseek, _post_json_with_retry


_VALID_STATUS = {"compliant", "non_compliant", "needs_review"}
_VALID_SEVERITY = {"low", "medium", "high", "critical"}


def _build_prompt(payload: dict[str, Any]) -> str:
    return (
        "Eres un agente de auditoria ISO 27001. "
        "Analiza la evidencia y responde SOLO con JSON valido, sin markdown, sin comentarios.\n"
        "Schema estricto:\n"
        "{\n"
        '  "status": "compliant|non_compliant|needs_review",\n'
        '  "overall_compliance_score": 0-100,\n'
        '  "agent_notes": "texto breve",\n'
        '  "findings": [\n'
        "    {\n"
        '      "issue": "hallazgo",\n'
        '      "severity": "low|medium|high|critical",\n'
        '      "recommendation": "accion recomendada",\n'
        '      "impact": "impacto"\n'
        "    }\n"
        "  ]\n"
        "}\n"
        "Si no hay hallazgos, devuelve findings con un item de severidad low indicando control aceptable.\n"
        "Datos de auditoria:\n"
        f"{json.dumps(payload, ensure_ascii=True)}"
    )


def _build_file_analysis_prompt(payload: dict[str, Any]) -> str:
    """Crea un prompt especializado para análisis de archivos de evidencia."""
    return (
        "Eres un auditor experto en ISO 27001. Tu tarea es evaluar el documento/evidencia proporcionado "
        "contra los controles ISO 27001 y generar un informe detallado.\n\n"
        "INSTRUCCIONES:\n"
        "1. Analiza el contenido del archivo de evidencia\n"
        "2. Verifica la PRESENCIA de elementos críticos: fechas, responsables, firmas, verificaciones\n"
        "3. Evalúa si la evidencia es legible, completa y convincente\n"
        "4. Genera hallazgos específicos basados en qué falta o qué se encuentra\n"
        "5. Proporciona recomendaciones accionables\n\n"
        "Responde SOLO con JSON válido, sin markdown, sin comentarios:\n"
        "{\n"
        '  "status": "compliant|non_compliant|needs_review",\n'
        '  "overall_compliance_score": 0-100,\n'
        '  "agent_notes": "resumen ejecutivo del análisis",\n'
        '  "findings": [\n'
        "    {\n"
        '      "issue": "descripción específica del hallazgo",\n'
        '      "severity": "low|medium|high|critical",\n'
        '      "recommendation": "acción correctiva específica",\n'
        '      "impact": "impacto en cumplimiento ISO 27001"\n'
        "    }\n"
        "  ]\n"
        "}\n\n"
        "CRITERIOS DE EVALUACIÓN:\n"
        "- CRÍTICO (critical): Ausencia total de evidencia o documento ilegible\n"
        "- ALTO (high): Falta información esencial (fechas, responsables, firmas)\n"
        "- MEDIO (medium): Información incompleta pero recuperable\n"
        "- BAJO (low): Detalles menores o sugerencias de mejora\n\n"
        "SCORING:\n"
        "- 80-100: Evidencia completa, legible y verificable\n"
        "- 60-79: Evidencia presente pero incompleta\n"
        "- 40-59: Evidencia muy deficiente\n"
        "- 0-39: Ausencia de evidencia documental legible\n\n"
        "Documento a evaluar:\n"
        f"{json.dumps(payload, ensure_ascii=True)}"
    )


def _safe_parse_json(text: str) -> dict[str, Any]:
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.replace("```json", "").replace("```", "").strip()
    return json.loads(cleaned)


def _normalize_result(data: dict[str, Any]) -> dict[str, Any]:
    status = str(data.get("status", "needs_review")).strip().lower()
    if status not in _VALID_STATUS:
        status = "needs_review"

    raw_score = data.get("overall_compliance_score", 50)
    try:
        score = int(raw_score)
    except (TypeError, ValueError):
        score = 50
    score = max(0, min(100, score))

    notes = str(data.get("agent_notes", "Analisis completado por IA.")).strip()
    findings_in = data.get("findings") or []
    findings_out: list[dict[str, str]] = []

    if isinstance(findings_in, list):
        for item in findings_in:
            if not isinstance(item, dict):
                continue
            severity = str(item.get("severity", "low")).strip().lower()
            if severity not in _VALID_SEVERITY:
                severity = "low"

            findings_out.append(
                {
                    "issue": str(item.get("issue", "Hallazgo sin detalle")).strip()[:500],
                    "severity": severity,
                    "recommendation": str(item.get("recommendation", "Definir accion correctiva")).strip()[:800],
                    "impact": str(item.get("impact", "Impacto no especificado")).strip()[:800],
                }
            )

    if not findings_out:
        findings_out = [
            {
                "issue": "No se identificaron hallazgos criticos",
                "severity": "low",
                "recommendation": "Mantener monitoreo continuo y controles actuales",
                "impact": "Riesgo residual bajo",
            }
        ]

    return {
        "status": status,
        "overall_compliance_score": score,
        "agent_notes": notes,
        "findings": findings_out,
    }


async def analyze_audit_with_ai(payload: dict[str, Any]) -> dict[str, Any] | None:
    if not settings.deepseek_api_key:
        return None

    endpoint = (
        f"{settings.deepseek_base_url.rstrip('/')}/chat/completions"
    )

    request_payload = {
        "model": settings.deepseek_model,
        "messages": [
            {"role": "system", "content": "Responde solo JSON valido, sin markdown ni texto extra."},
            {"role": "user", "content": _build_prompt(payload)},
        ],
        "temperature": 0.2,
        "top_p": 0.8,
        "max_tokens": 1200,
    }

    try:
        async with httpx.AsyncClient(timeout=25.0) as client:
            data = await _post_json_with_retry(
                client,
                endpoint,
                request_payload,
                headers={"Authorization": f"Bearer {settings.deepseek_api_key}"},
                timeout_label="DeepSeek chat/completions",
            )

        parsed = _safe_parse_json(_extract_text_from_deepseek(data))
        return _normalize_result(parsed)
    except Exception as e:
        print("\n" + "="*50)
        print("🚨 ERROR EN LA LLAMADA A DEEPSEEK 🚨")
        print(f"Detalle técnico: {str(e)}")
        print("="*50 + "\n")
        return None


async def analyze_file_with_ai(payload: dict[str, Any]) -> dict[str, Any] | None:
    """
    Analiza un archivo de evidencia usando IA especializada en auditoría.
    Usa un prompt más detallado orientado a evaluación de documentos.
    """
    if not settings.deepseek_api_key:
        return None

    endpoint = (
        f"{settings.deepseek_base_url.rstrip('/')}/chat/completions"
    )

    request_payload = {
        "model": settings.deepseek_model,
        "messages": [
            {"role": "system", "content": "Responde solo JSON valido, sin markdown ni texto extra."},
            {"role": "user", "content": _build_file_analysis_prompt(payload)},
        ],
        "temperature": 0.3,
        "top_p": 0.85,
        "max_tokens": 1500,
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            data = await _post_json_with_retry(
                client,
                endpoint,
                request_payload,
                headers={"Authorization": f"Bearer {settings.deepseek_api_key}"},
                timeout_label="DeepSeek chat/completions",
            )

        parsed = _safe_parse_json(_extract_text_from_deepseek(data))
        return _normalize_result(parsed)
    except Exception as e:
        print("\n" + "="*50)
        print("🚨 ERROR EN ANÁLISIS DE ARCHIVO CON DEEPSEEK 🚨")
        print(f"Detalle técnico: {str(e)}")
        print("="*50 + "\n")
        return None


>>>>>>> Chat-bot
