"""Seed idempotente para las preguntas del assessment ISO 27001.

Uso:

    python scripts/seed_assessment_questions.py

El script crea las tablas nuevas si no existen e inserta:
- 4 fases del assessment;
- 93 preguntas del Anexo A;
- actualizaciones por `code` para evitar duplicados.
"""

from __future__ import annotations

import sys
from pathlib import Path


def ensure_backend_on_path() -> None:
    script_path = Path(__file__).resolve()
    backend_dir = script_path.parent.parent
    if str(backend_dir) not in sys.path:
        sys.path.insert(0, str(backend_dir))


def build_question(text: str, clause_ref: str, is_critical: bool, evidence_hint: str) -> dict:
    return {
        "text": text,
        "clause_ref": clause_ref,
        "is_critical": is_critical,
        "evidence_hint": evidence_hint,
    }


PHASES = [
    {
        "code": "phase-1",
        "name": "Context & Leadership",
        "description": "Preguntas sobre alcance del SGSI, política, partes interesadas y responsabilidades.",
        "sort_order": 1,
        "questions": [
            build_question(
                "¿El alcance del SGSI está definido, documentado y aprobado por la dirección?",
                "4.3",
                True,
                "Adjunta el documento de alcance vigente y la evidencia de aprobación.",
            ),
            build_question(
                "¿Se han identificado las partes interesadas relevantes y sus requisitos de seguridad?",
                "4.2",
                False,
                "Adjunta el análisis de partes interesadas o el registro de requisitos.",
            ),
            build_question(
                "¿La organización mantiene definido el contexto interno y externo que afecta al SGSI?",
                "4.1",
                False,
                "Adjunta el análisis de contexto, riesgos del entorno o actas de revisión.",
            ),
            build_question(
                "¿Existe una política de seguridad de la información vigente y comunicada?",
                "5.2",
                True,
                "Adjunta la política aprobada y la evidencia de comunicación interna.",
            ),
            build_question(
                "¿La alta dirección revisa y respalda el SGSI de forma periódica?",
                "5.1",
                True,
                "Adjunta actas de revisión por la dirección, minutas o decisiones formales.",
            ),
            build_question(
                "¿Están definidas las responsabilidades y autoridades para operar el SGSI?",
                "5.3",
                True,
                "Adjunta el organigrama, matriz RACI o nombramientos de responsables.",
            ),
            build_question(
                "¿Se asignan responsables para aprobar excepciones y escalar incidencias de seguridad?",
                "5.3",
                False,
                "Adjunta el procedimiento de escalamiento o la matriz de responsabilidades.",
            ),
            build_question(
                "¿Se revisa que los objetivos del SGSI sigan alineados con el negocio?",
                "5.1",
                False,
                "Adjunta los objetivos de seguridad, KPIs o revisiones periódicas.",
            ),
        ],
    },
    {
        "code": "phase-2",
        "name": "Planning & Risk",
        "description": "Preguntas sobre metodología de riesgos, activos, tratamiento y objetivos de seguridad.",
        "sort_order": 2,
        "questions": [
            build_question(
                "¿La metodología de evaluación de riesgos está definida y se usa de forma consistente?",
                "6.1.2",
                True,
                "Adjunta la metodología de riesgos, criterios y ejemplos de evaluaciones.",
            ),
            build_question(
                "¿Los criterios para aceptar o rechazar riesgos están documentados?",
                "6.1.2",
                True,
                "Adjunta los criterios de aceptación de riesgos o el apetito de riesgo.",
            ),
            build_question(
                "¿Se identifican y valoran los activos relevantes antes de evaluar riesgos?",
                "6.1.2",
                False,
                "Adjunta el inventario de activos o el análisis de criticidad.",
            ),
            build_question(
                "¿Los riesgos de seguridad se analizan con una periodicidad definida?",
                "6.1.2",
                False,
                "Adjunta el registro de riesgos y las últimas revisiones realizadas.",
            ),
            build_question(
                "¿Se define un plan de tratamiento para cada riesgo relevante?",
                "6.1.3",
                False,
                "Adjunta el plan de tratamiento de riesgos con responsables y fechas.",
            ),
            build_question(
                "¿Los riesgos residuales quedan aprobados por el nivel de decisión correspondiente?",
                "6.1.3",
                False,
                "Adjunta la evidencia de aprobación del riesgo residual.",
            ),
            build_question(
                "¿Existen objetivos de seguridad medibles y alineados con el SGSI?",
                "6.2",
                False,
                "Adjunta los objetivos, metas, indicadores o cuadros de seguimiento.",
            ),
            build_question(
                "¿Los cambios relevantes del negocio se reflejan en el análisis de riesgos?",
                "6.3",
                False,
                "Adjunta el procedimiento de gestión de cambios o impactos en riesgos.",
            ),
        ],
    },
    {
        "code": "phase-3",
        "name": "Support & Operations",
        "description": "Preguntas sobre formación, procedimientos operativos, cambios y comunicación.",
        "sort_order": 3,
        "questions": [
            build_question(
                "¿El personal recibe formación y concienciación en seguridad de forma periódica?",
                "7.2",
                True,
                "Adjunta el plan de capacitación, listas de asistencia o evidencias de e-learning.",
            ),
            build_question(
                "¿Existen procedimientos operativos documentados para las actividades críticas?",
                "7.5",
                False,
                "Adjunta los procedimientos operativos vigentes y sus versiones.",
            ),
            build_question(
                "¿Los cambios operativos o técnicos pasan por un control antes de aplicarse?",
                "8.1",
                True,
                "Adjunta el flujo de cambios, tickets o aprobaciones previas.",
            ),
            build_question(
                "¿Hay un canal claro para comunicar incidentes y eventos de seguridad?",
                "8.1",
                True,
                "Adjunta el procedimiento de notificación o el canal oficial de reporte.",
            ),
            build_question(
                "¿Las comunicaciones de seguridad llegan a las personas correctas a tiempo?",
                "7.4",
                False,
                "Adjunta el plan de comunicación, correos o actas de difusión.",
            ),
            build_question(
                "¿Los respaldos, restauraciones o tareas operativas críticas tienen seguimiento?",
                "8.1",
                False,
                "Adjunta evidencias de respaldos, restauraciones o bitácoras operativas.",
            ),
            build_question(
                "¿El personal conoce cómo actuar ante interrupciones o fallas operativas?",
                "8.1",
                False,
                "Adjunta simulacros, runbooks o procedimientos de contingencia.",
            ),
            build_question(
                "¿Se revisa que los procedimientos sigan siendo útiles y estén actualizados?",
                "7.5",
                False,
                "Adjunta revisiones periódicas, control de versiones o aprobaciones.",
            ),
        ],
    },
    {
        "code": "phase-4",
        "name": "Annex A Controls",
        "description": "Una pregunta por cada control del Anexo A de ISO 27001:2022.",
        "sort_order": 4,
        "questions": [],
    },
]


ANNEX_A_CONTROLS = [
    ("A.5.1", "políticas de seguridad de la información", True),
    ("A.5.2", "roles y responsabilidades de seguridad de la información", False),
    ("A.5.3", "segregación de funciones", False),
    ("A.5.4", "responsabilidades de la dirección", False),
    ("A.5.5", "contacto con autoridades", False),
    ("A.5.6", "contacto con grupos de interés especial", False),
    ("A.5.7", "inteligencia de amenazas", False),
    ("A.5.8", "seguridad de la información en la gestión de proyectos", False),
    ("A.5.9", "inventario de información y otros activos asociados", False),
    ("A.5.10", "uso aceptable de información y activos asociados", False),
    ("A.5.11", "devolución de activos", False),
    ("A.5.12", "clasificación de la información", False),
    ("A.5.13", "etiquetado de la información", False),
    ("A.5.14", "transferencia de información", False),
    ("A.5.15", "control de acceso", True),
    ("A.5.16", "gestión de identidades", False),
    ("A.5.17", "información de autenticación", False),
    ("A.5.18", "derechos de acceso", False),
    ("A.5.19", "seguridad de la información en las relaciones con proveedores", False),
    ("A.5.20", "seguridad de la información en acuerdos con proveedores", False),
    ("A.5.21", "gestión de la seguridad de la información en la cadena de suministro TIC", False),
    ("A.5.22", "supervisión, revisión y gestión de cambios de servicios de proveedores", False),
    ("A.5.23", "seguridad de la información para el uso de servicios en la nube", False),
    ("A.5.24", "planificación y preparación para la gestión de incidentes de seguridad de la información", True),
    ("A.5.25", "evaluación y decisión sobre eventos de seguridad de la información", False),
    ("A.5.26", "respuesta a incidentes de seguridad de la información", False),
    ("A.5.27", "aprendizaje de incidentes de seguridad de la información", False),
    ("A.5.28", "recolección de evidencia", False),
    ("A.5.29", "seguridad de la información durante una interrupción", False),
    ("A.5.30", "preparación TIC para la continuidad del negocio", False),
    ("A.5.31", "requisitos legales, regulatorios, contractuales y estatutarios", True),
    ("A.5.32", "derechos de propiedad intelectual", False),
    ("A.5.33", "protección de registros", False),
    ("A.5.34", "privacidad y protección de datos personales", False),
    ("A.5.35", "revisión independiente de la seguridad de la información", False),
    ("A.5.36", "cumplimiento con políticas, reglas y normas de seguridad de la información", False),
    ("A.5.37", "procedimientos operativos documentados", True),
    ("A.6.1", "verificación de antecedentes", False),
    ("A.6.2", "términos y condiciones de empleo", False),
    ("A.6.3", "concienciación, educación y formación en seguridad de la información", True),
    ("A.6.4", "proceso disciplinario", False),
    ("A.6.5", "responsabilidades después de la terminación o cambio de empleo", False),
    ("A.6.6", "acuerdos de confidencialidad o no divulgación", False),
    ("A.6.7", "trabajo remoto", False),
    ("A.6.8", "notificación de eventos de seguridad de la información", True),
    ("A.7.1", "perímetros de seguridad física", False),
    ("A.7.2", "controles de entrada física", False),
    ("A.7.3", "seguridad de oficinas, salas e instalaciones", False),
    ("A.7.4", "monitoreo de seguridad física", False),
    ("A.7.5", "protección contra amenazas físicas y ambientales", False),
    ("A.7.6", "trabajo en áreas seguras", False),
    ("A.7.7", "escritorio limpio y pantalla limpia", False),
    ("A.7.8", "ubicación y protección de equipos", False),
    ("A.7.9", "seguridad de activos fuera de las instalaciones", False),
    ("A.7.10", "medios de almacenamiento", False),
    ("A.7.11", "servicios de soporte", False),
    ("A.7.12", "seguridad del cableado", False),
    ("A.7.13", "mantenimiento de equipos", False),
    ("A.7.14", "disposición segura o reutilización de equipos", False),
    ("A.8.1", "dispositivos de usuario final", False),
    ("A.8.2", "derechos de acceso privilegiado", False),
    ("A.8.3", "restricción de acceso a la información", False),
    ("A.8.4", "acceso al código fuente", False),
    ("A.8.5", "autenticación segura", False),
    ("A.8.6", "gestión de capacidad", False),
    ("A.8.7", "protección contra malware", True),
    ("A.8.8", "gestión de vulnerabilidades técnicas", True),
    ("A.8.9", "gestión de configuración", False),
    ("A.8.10", "eliminación de información", False),
    ("A.8.11", "enmascaramiento de datos", False),
    ("A.8.12", "prevención de fuga de datos", False),
    ("A.8.13", "respaldo de información", True),
    ("A.8.14", "redundancia de las instalaciones de procesamiento de información", False),
    ("A.8.15", "registro de eventos", True),
    ("A.8.16", "actividades de monitoreo", False),
    ("A.8.17", "sincronización de relojes", False),
    ("A.8.18", "uso de programas utilitarios privilegiados", False),
    ("A.8.19", "instalación de software en sistemas operativos", False),
    ("A.8.20", "seguridad de redes", False),
    ("A.8.21", "seguridad de los servicios de red", False),
    ("A.8.22", "segregación de redes", False),
    ("A.8.23", "filtrado web", False),
    ("A.8.24", "uso de criptografía", True),
    ("A.8.25", "ciclo de vida de desarrollo seguro", True),
    ("A.8.26", "requisitos de seguridad de aplicaciones", False),
    ("A.8.27", "principios de arquitectura e ingeniería segura de sistemas", False),
    ("A.8.28", "codificación segura", False),
    ("A.8.29", "pruebas de seguridad en desarrollo y aceptación", True),
    ("A.8.30", "desarrollo subcontratado", False),
    ("A.8.31", "separación de entornos de desarrollo, prueba y producción", False),
    ("A.8.32", "gestión de cambios", True),
    ("A.8.33", "información de prueba", False),
    ("A.8.34", "protección de los sistemas de información durante las pruebas de auditoría", True),
]


def annex_question_text(control_label: str) -> str:
    return f"¿La organización tiene implementado el control de {control_label}?"


def annex_evidence_hint() -> str:
    return "Adjunta política, procedimiento, registro o captura que demuestre este control."


def upsert_by_code(db, model, rows: list[dict]) -> None:
    if not rows:
        return

    codes = [row["code"] for row in rows]
    existing_rows = {
        row.code: row
        for row in db.query(model).filter(model.code.in_(codes)).all()
    }

    for row in rows:
        current = existing_rows.get(row["code"])
        if current is None:
            db.add(model(**row))
        else:
            for key, value in row.items():
                setattr(current, key, value)


def seed() -> None:
    ensure_backend_on_path()

    from app.db.base import Base
    from app.db.database import SessionLocal, engine
    from app.models.assessment_phase import AssessmentPhase
    from app.models.assessment_question import AssessmentQuestion

    Base.metadata.create_all(
        bind=engine,
        tables=[AssessmentPhase.__table__, AssessmentQuestion.__table__],
    )

    db = SessionLocal()
    try:
        phase_rows = [
            {
                "code": phase["code"],
                "name": phase["name"],
                "description": phase["description"],
                "sort_order": phase["sort_order"],
            }
            for phase in PHASES
        ]

        upsert_by_code(db, AssessmentPhase, phase_rows)
        db.flush()

        phase_map = {
            row.code: row
            for row in db.query(AssessmentPhase).filter(
                AssessmentPhase.code.in_([phase["code"] for phase in PHASES])
            ).all()
        }

        question_rows: list[dict] = []

        for phase in PHASES[:3]:
            phase_db = phase_map[phase["code"]]
            for idx, question in enumerate(phase["questions"], start=1):
                question_rows.append(
                    {
                        "code": f"{phase['code']}-{idx:02d}",
                        "phase_id": phase_db.id,
                        "text": question["text"],
                        "clause_ref": question["clause_ref"],
                        "is_critical": question["is_critical"],
                        "evidence_hint": question["evidence_hint"],
                        "sort_order": idx,
                    }
                )

        annex_phase = phase_map["phase-4"]
        for idx, (clause_ref, control_label, is_critical) in enumerate(ANNEX_A_CONTROLS, start=1):
            question_rows.append(
                {
                    "code": clause_ref,
                    "phase_id": annex_phase.id,
                    "text": annex_question_text(control_label),
                    "clause_ref": clause_ref,
                    "is_critical": False if clause_ref.startswith("A.7.") else is_critical,
                    "evidence_hint": annex_evidence_hint(),
                    "sort_order": idx,
                }
            )

        upsert_by_code(db, AssessmentQuestion, question_rows)
        db.commit()

        total_phases = db.query(AssessmentPhase).count()
        total_questions = db.query(AssessmentQuestion).count()
        annex_count = db.query(AssessmentQuestion).filter(
            AssessmentQuestion.phase_id == annex_phase.id
        ).count()

        print(
            "Seed de assessment completado: "
            f"fases={total_phases}, preguntas_totales={total_questions}, annexo_a={annex_count}"
        )
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()