from __future__ import annotations

import json
import time
from typing import Any

from app.workers.gemini_service import _call_deepseek_json


class ControlReferenceAgent:
    def __init__(
        self,
        title: str,
        description: str | None = None,
        target_audience: str | None = None,
        control_refs: list[str] | None = None,
        language: str = "es",
        tone: str | None = None,
    ) -> None:
        self.title = title.strip()
        self.description = (description or "").strip()
        self.target_audience = (target_audience or "").strip()
        self.control_refs = [ref.strip() for ref in (control_refs or []) if ref and ref.strip()]
        self.language = language or "es"
        self.tone = tone or "formal"

    def _build_outline_prompt(self) -> str:
        control_block = (
            "Controles ISO a incorporar:\n" + json.dumps(self.control_refs, ensure_ascii=False)
            if self.control_refs
            else "No se entregaron controles específicos; crea un esquema conforme a ISO 27001."
        )

        return "\n".join([
            "Eres un agente experto en generación de documentos ISO 27001.",
            "Tu tarea es crear un esquema profesional de secciones para un documento de cumplimiento y gestión.",
            "Responde SOLO con JSON válido sin markdown ni explicaciones adicionales.",
            "El esquema debe contener una lista de secciones con título y breve resumen.",
            "JSON esperado:",
            "{",
            '  "sections": [',
            '    {"title": "...", "summary": "..."}',
            '  ]',
            "}",
            "\nDatos de entrada:",
            f"Título: {self.title}",
            f"Descripción: {self.description or 'Sin descripción adicional.'}",
            f"Audiencia: {self.target_audience or 'Audiencia general de seguridad'}",
            f"Idioma: {self.language}",
            f"Tono: {self.tone}",
            control_block,
        ])

    async def build_section_outline(self) -> list[dict[str, str]]:
        if self.control_refs and not self.title:
            return [
                {"title": ref, "summary": "Sección alineada al control ISO especificado."}
                for ref in self.control_refs
            ]

        payload = {
            "system_prompt": "Responde solo JSON válido sin markdown.",
            "user_prompt": self._build_outline_prompt(),
            "max_output_tokens": 900,
            "temperature": 0.3,
            "top_p": 0.85,
        }

        raw = await _call_deepseek_json(**payload)
        sections = raw.get("sections") or []
        if not isinstance(sections, list):
            sections = []

        normalized: list[dict[str, str]] = []
        for item in sections:
            if not isinstance(item, dict):
                continue
            title = str(item.get("title") or item.get("name") or "").strip()
            summary = str(item.get("summary") or item.get("description") or "").strip()
            if title:
                normalized.append({"title": title, "summary": summary})

        if normalized:
            return normalized

        # Fallback estático para evitar bloqueos
        return [
            {"title": "Introducción", "summary": "Contexto y alcance del documento."},
            {"title": "Alcance y objetivos", "summary": "Qué cubre el documento y su propósito."},
            {"title": "Controles clave ISO 27001", "summary": "Descripción de los controles aplicables."},
            {"title": "Plan de acciones y responsabilidades", "summary": "Recomendaciones y responsables."},
            {"title": "Conclusión y siguientes pasos", "summary": "Resumen ejecutivo y acciones pendientes."},
        ]


class SectionGeneratorAgent:
    def __init__(self, language: str = "es", tone: str | None = None) -> None:
        self.language = language or "es"
        self.tone = tone or "formal"

    def _build_section_prompt(
        self,
        title: str,
        summary: str,
        document_title: str,
        document_description: str,
        target_audience: str,
        control_refs: list[str] | None = None,
        control_contexts: list[dict[str, str]] | None = None,
    ) -> str:
        reference_block = (
            "Controles objetivo:\n" + json.dumps(control_refs, ensure_ascii=False)
            if control_refs
            else "Controles objetivo: sin controles específicos proporcionados."
        )

        control_contexts_block = ""
        if control_contexts:
            lines = [
                "Contexto de los controles seleccionados:",
            ]
            for context in control_contexts:
                identifier = context.get("clause_ref") or context.get("id") or "Control"
                title_text = context.get("title") or ""
                content_text = context.get("content") or ""
                lines.append(f"- {identifier}: {title_text}")
                if content_text:
                    lines.append(content_text)
            control_contexts_block = "\n".join(lines)

        return "\n".join([
            "Eres un asistente de generación de documentos de seguridad ISO 27001.",
            "Crea el contenido completo de la sección solicitada.",
            "Respeta el idioma, sea profesional y utilizable para edición de usuario.",
            "Responde SOLO con JSON válido sin markdown.",
            "Esquema esperado:",
            "{",
            '  "section_title": "...",',
            '  "section_content": "..."',
            "}",
            "\nDatos de contexto:",
            f"Documento: {document_title}",
            f"Descripción: {document_description or 'Sin descripción adicional.'}",
            f"Audiencia: {target_audience or 'Audiencia general de seguridad'}",
            f"Sección: {title}",
            f"Resumen de sección: {summary or 'Describir y desarrollar esta sección.'}",
            reference_block,
            control_contexts_block,
            f"Idioma: {self.language}",
            f"Tono: {self.tone}",
        ])

    async def generate_section_content(
        self,
        title: str,
        summary: str,
        document_title: str,
        document_description: str,
        target_audience: str,
        control_refs: list[str] | None = None,
        control_contexts: list[dict[str, str]] | None = None,
    ) -> str:
        payload = {
            "system_prompt": "Responde solo JSON válido sin markdown.",
            "user_prompt": self._build_section_prompt(
                title=title,
                summary=summary,
                document_title=document_title,
                document_description=document_description,
                target_audience=target_audience,
                control_refs=control_refs,
                control_contexts=control_contexts,
            ),
            "max_output_tokens": 1200,
            "temperature": 0.35,
            "top_p": 0.9,
        }

        raw = await _call_deepseek_json(**payload)
        content = str(raw.get("section_content") or raw.get("content") or raw.get("generated_text") or "").strip()
        if not content:
            raise ValueError("No se pudo generar contenido para la sección")
        return content


class ComplianceValidatorAgent:
    def __init__(self, language: str = "es") -> None:
        self.language = language or "es"

    def _build_validation_prompt(
        self,
        title: str,
        section_content: str,
        document_title: str,
        target_audience: str,
        control_refs: list[str] | None = None,
    ) -> str:
        reference_block = (
            "Controles objetivo:\n" + json.dumps(control_refs, ensure_ascii=False)
            if control_refs
            else "Sin controles ISO explícitos; evalúa coherencia y calidad general."
        )

        return "\n".join([
            "Eres un validador de contenido especializado en documentos ISO 27001.",
            "Evalúa si esta sección cumple sus objetivos, cubre los controles solicitados y es auditable.",
            "Responde SOLO con JSON válido sin markdown.",
            "Esquema esperado:",
            "{",
            '  "is_valid": true,',
            '  "score": 0-100,',
            '  "issues": ["..."],',
            '  "feedback": "..."',
            "}",
            "\nDatos de validación:",
            f"Documento: {document_title}",
            f"Sección: {title}",
            f"Audiencia: {target_audience or 'Audiencia general de seguridad'}",
            reference_block,
            "Contenido de la sección:",
            section_content,
            f"Idioma: {self.language}",
        ])

    @staticmethod
    def _normalize_list(raw_value: Any) -> list[str]:
        if not isinstance(raw_value, list):
            return []
        output = []
        for item in raw_value:
            item_text = str(item).strip()
            if item_text:
                output.append(item_text)
        return output

    async def validate_section(
        self,
        title: str,
        section_content: str,
        document_title: str,
        target_audience: str,
        control_refs: list[str] | None = None,
    ) -> dict[str, Any]:
        payload = {
            "system_prompt": "Responde solo JSON válido sin markdown.",
            "user_prompt": self._build_validation_prompt(
                title=title,
                section_content=section_content,
                document_title=document_title,
                target_audience=target_audience,
                control_refs=control_refs,
            ),
            "max_output_tokens": 900,
            "temperature": 0.0,
            "top_p": 0.8,
        }

        raw = await _call_deepseek_json(**payload)
        score = int(min(100, max(0, int(float(raw.get("score", 0) or 0)))))
        issues = self._normalize_list(raw.get("issues"))
        feedback = str(raw.get("feedback") or "").strip()
        is_valid = bool(raw.get("is_valid")) and score >= 60
        return {
            "is_valid": is_valid,
            "score": score,
            "issues": issues,
            "feedback": feedback,
        }


class DocumentAgentOrchestrator:
    def __init__(
        self,
        request_payload: dict[str, Any],
        progress_callback: callable,
    ) -> None:
        self.request_payload = request_payload
        self.progress_callback = progress_callback
        self.title = str(request_payload.get("title") or "Documento ISO 27001").strip()
        self.description = str(request_payload.get("description") or "").strip()
        self.target_audience = str(request_payload.get("target_audience") or "").strip()
        self.language = str(request_payload.get("language") or "es").strip()
        self.tone = str(request_payload.get("tone") or "formal").strip()
        self.sections = [
            str(item).strip()
            for item in request_payload.get("sections") or []
            if str(item).strip()
        ]
        self.control_refs = [
            str(item).strip()
            for item in request_payload.get("control_refs") or []
            if str(item).strip()
        ]
        self.control_contexts = [
            {
                "id": str(item.get("id") or "").strip(),
                "clause_ref": str(item.get("clause_ref") or "").strip(),
                "title": str(item.get("title") or "").strip(),
                "content": str(item.get("content") or "").strip(),
            }
            for item in request_payload.get("control_contexts") or []
            if isinstance(item, dict)
        ]

    async def _publish(
        self,
        event: str,
        payload: dict[str, Any],
        progress: int,
        message: str,
        status: str = "processing",
        section_index: int | None = None,
        total_sections: int | None = None,
        attempts: int | None = None,
    ) -> None:
        await self.progress_callback(
            event=event,
            payload=payload,
            status=status,
            progress=progress,
            message=message,
            section_index=section_index,
            total_sections=total_sections,
            attempts=attempts,
        )

    async def _build_outline(self) -> list[dict[str, str]]:
        if self.sections:
            return [{"title": title, "summary": ""} for title in self.sections]

        agent = ControlReferenceAgent(
            title=self.title,
            description=self.description,
            target_audience=self.target_audience,
            control_refs=self.control_refs,
            language=self.language,
            tone=self.tone,
        )
        sections = await agent.build_section_outline()
        if not sections:
            sections = [{"title": "Resumen ejecutivo", "summary": "Resumen de hallazgos y próximos pasos."}]
        return sections

    async def _render_document(self, section_results: list[dict[str, Any]]) -> str:
        parts = [f"# {self.title}", ""]
        if self.description:
            parts.append(f"{self.description}")
            parts.append("")

        for result in section_results:
            parts.append(f"## {result['title']}")
            if result.get("content"):
                parts.append(result["content"].strip())
                parts.append("")

        parts.append("---")
        parts.append("Documento generado automáticamente por el motor de IA.")
        return "\n".join(parts).strip()

    async def generate_full_document(self) -> dict[str, Any]:
        start_time = time.monotonic()
        sections = await self._build_outline()
        total_sections = len(sections)

        await self._publish(
            event="document_start",
            payload={
                "document_title": self.title,
                "total_sections": total_sections,
                "controls": self.control_refs,
            },
            progress=5,
            message="Iniciando generación de documento.",
            status="processing",
            section_index=0,
            total_sections=total_sections,
            attempts=0,
        )

        generator = SectionGeneratorAgent(language=self.language, tone=self.tone)
        validator = ComplianceValidatorAgent(language=self.language)
        section_results: list[dict[str, Any]] = []

        for index, section in enumerate(sections, start=1):
            if time.monotonic() - start_time > 600:
                raise TimeoutError("La generación del documento excedió el límite de 10 minutos")

            title = section.get("title", "Sección")
            summary = section.get("summary", "")
            await self._publish(
                event="section_start",
                payload={
                    "section_title": title,
                    "section_index": index,
                    "total_sections": total_sections,
                },
                progress=5 + int((index - 1) * 80 / max(total_sections, 1)),
                message=f"Generando sección {index}/{total_sections}: {title}",
                status="processing",
                section_index=index,
                total_sections=total_sections,
                attempts=0,
            )

            section_content = await generator.generate_section_content(
                title=title,
                summary=summary,
                document_title=self.title,
                document_description=self.description,
                target_audience=self.target_audience,
                control_refs=self.control_refs,
                control_contexts=self.control_contexts,
            )

            await self._publish(
                event="section_content",
                payload={
                    "section_title": title,
                    "section_index": index,
                    "total_sections": total_sections,
                    "content": section_content,
                },
                progress=5 + int((index - 1) * 80 / max(total_sections, 1)) + 1,
                message=f"Contenido generado para sección {index}/{total_sections}.",
                status="processing",
                section_index=index,
                total_sections=total_sections,
                attempts=0,
            )

            validation_result: dict[str, Any] | None = None
            attempts = 0
            for attempt in range(1, 4):
                attempts = attempt
                validation_result = await validator.validate_section(
                    title=title,
                    section_content=section_content,
                    document_title=self.title,
                    target_audience=self.target_audience,
                    control_refs=self.control_refs,
                )

                await self._publish(
                    event="validation_result",
                    payload={
                        "section_title": title,
                        "section_index": index,
                        "total_sections": total_sections,
                        "is_valid": validation_result["is_valid"],
                        "score": validation_result["score"],
                        "issues": validation_result["issues"],
                        "feedback": validation_result["feedback"],
                        "attempt": attempt,
                    },
                    progress=5 + int((index - 1) * 80 / max(total_sections, 1)) + 2,
                    message=(
                        f"Validando sección {index}/{total_sections} (intento {attempt})."
                    ),
                    status="processing",
                    section_index=index,
                    total_sections=total_sections,
                    attempts=attempt,
                )

                if validation_result["is_valid"]:
                    break

                if attempt < 3:
                    section_content = await generator.generate_section_content(
                        title=title,
                        summary=summary,
                        document_title=self.title,
                        document_description=self.description,
                        target_audience=self.target_audience,
                        control_refs=self.control_refs,
                        control_contexts=self.control_contexts,
                    )

            if not validation_result or not validation_result["is_valid"]:
                pass

            await self._publish(
                event="section_complete",
                payload={
                    "section_title": title,
                    "section_index": index,
                    "total_sections": total_sections,
                    "validation_passed": validation_result["is_valid"],
                    "validation_score": validation_result["score"],
                    "attempts": attempts,
                },
                progress=5 + int(index * 80 / max(total_sections, 1)),
                message=f"Sección {index}/{total_sections} completada.",
                status="processing",
                section_index=index,
                total_sections=total_sections,
                attempts=attempts,
            )

            section_results.append(
                {
                    "title": title,
                    "summary": summary,
                    "content": section_content,
                    "validation": validation_result,
                }
            )

        document_text = await self._render_document(section_results)
        await self._publish(
            event="document_complete",
            payload={
                "document_title": self.title,
                "total_sections": total_sections,
                "sections": [
                    {"title": result["title"], "validation": result["validation"]}
                    for result in section_results
                ],
                "document_text": document_text,
                "duration_seconds": int(time.monotonic() - start_time),
            },
            progress=100,
            message="Generación de documento completada.",
            status="completed",
            section_index=total_sections,
            total_sections=total_sections,
            attempts=attempts,
        )

        return {
            "document_title": self.title,
            "status": "completed",
            "progress": 100,
            "document_text": document_text,
            "sections": section_results,
        }
