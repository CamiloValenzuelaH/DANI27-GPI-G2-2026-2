import json
from typing import Any

import httpx

from app.core.config import settings


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

    endpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent"

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
            response = await client.post(
                endpoint,
                params={"key": settings.gemini_api_key},
                json=request_payload,
            )
            response.raise_for_status()

        parsed = _safe_parse_json(_extract_text_from_gemini(response.json()))
        return _normalize_result(parsed)
    except Exception as e:
        
        print("\n" + "="*50)
        print("🚨 ERROR EN LA LLAMADA A GEMINI 🚨")
        print(f"Detalle técnico: {str(e)}")
        print("="*50 + "\n")
        
        return None


